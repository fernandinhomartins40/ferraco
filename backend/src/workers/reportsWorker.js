const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs').promises;
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Worker para processar jobs de relatórios
 */
async function reportsWorker(job) {
  const { data } = job;
  const { type } = data;

  try {
    logger.info('Iniciando processamento de job de relatório', {
      jobId: job.id,
      type,
      format: data.format
    });

    await job.progress(10);

    let result;

    switch (type) {
      case 'generate_report':
        result = await generateReport(job, data);
        break;

      case 'generate_leads_report':
        result = await generateLeadsReport(job, data);
        break;

      case 'generate_analytics_report':
        result = await generateAnalyticsReport(job, data);
        break;

      default:
        throw new Error(`Tipo de job de relatório desconhecido: ${type}`);
    }

    await job.progress(100);

    logger.info('Job de relatório processado com sucesso', {
      jobId: job.id,
      type,
      success: result?.success || false
    });

    return result;

  } catch (error) {
    logger.error('Erro ao processar job de relatório', {
      jobId: job.id,
      type,
      error: error.message
    });
    throw error;
  }
}

async function generateReport(job, data) {
  const { reportType, format, filters, userId } = data;

  try {
    await job.progress(20);

    let reportData;

    switch (reportType) {
      case 'leads':
        reportData = await getLeadsReportData(filters);
        break;
      case 'analytics':
        reportData = await getAnalyticsReportData(filters);
        break;
      case 'automations':
        reportData = await getAutomationsReportData(filters);
        break;
      default:
        throw new Error(`Tipo de relatório desconhecido: ${reportType}`);
    }

    await job.progress(60);

    let filePath;

    switch (format.toLowerCase()) {
      case 'pdf':
        filePath = await generatePDFReport(reportData, reportType);
        break;
      case 'excel':
        filePath = await generateExcelReport(reportData, reportType);
        break;
      default:
        throw new Error(`Formato não suportado: ${format}`);
    }

    await job.progress(90);

    // Salvar registro do relatório
    const reportRecord = await prisma.reportGenerated.create({
      data: {
        type: reportType.toUpperCase(),
        format: format.toUpperCase(),
        filters: JSON.stringify(filters),
        filePath,
        generatedBy: userId,
        generatedAt: new Date()
      }
    });

    return {
      success: true,
      reportId: reportRecord.id,
      filePath,
      format,
      type: reportType
    };

  } catch (error) {
    logger.error('Erro ao gerar relatório', {
      reportType,
      format,
      error: error.message
    });
    throw error;
  }
}

async function getLeadsReportData(filters = {}) {
  const where = {};

  if (filters.status) where.status = filters.status;
  if (filters.dateFrom) where.createdAt = { gte: new Date(filters.dateFrom) };
  if (filters.dateTo) {
    where.createdAt = where.createdAt || {};
    where.createdAt.lte = new Date(filters.dateTo);
  }

  const leads = await prisma.lead.findMany({
    where,
    include: {
      tags: { include: { tag: true } },
      notes: true,
      communications: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return {
    title: 'Relatório de Leads',
    leads,
    summary: {
      total: leads.length,
      byStatus: leads.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      }, {}),
      generatedAt: new Date()
    }
  };
}

async function getAnalyticsReportData(filters = {}) {
  const startDate = filters.dateFrom ? new Date(filters.dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = filters.dateTo ? new Date(filters.dateTo) : new Date();

  const [
    totalLeads,
    leadsbyStatus,
    leadsBySource,
    conversions,
    communications
  ] = await Promise.all([
    prisma.lead.count({
      where: {
        createdAt: { gte: startDate, lte: endDate }
      }
    }),
    prisma.lead.groupBy({
      by: ['status'],
      _count: { id: true },
      where: {
        createdAt: { gte: startDate, lte: endDate }
      }
    }),
    prisma.lead.groupBy({
      by: ['source'],
      _count: { id: true },
      where: {
        createdAt: { gte: startDate, lte: endDate }
      }
    }),
    prisma.lead.count({
      where: {
        status: 'CONCLUIDO',
        createdAt: { gte: startDate, lte: endDate }
      }
    }),
    prisma.communication.count({
      where: {
        sentAt: { gte: startDate, lte: endDate }
      }
    })
  ]);

  return {
    title: 'Relatório de Analytics',
    period: { startDate, endDate },
    metrics: {
      totalLeads,
      conversions,
      conversionRate: totalLeads > 0 ? (conversions / totalLeads * 100).toFixed(2) : 0,
      communications
    },
    charts: {
      leadsbyStatus,
      leadsBySource
    },
    generatedAt: new Date()
  };
}

async function getAutomationsReportData(filters = {}) {
  const automations = await prisma.automation.findMany({
    include: {
      executions: {
        where: filters.dateFrom ? {
          executedAt: { gte: new Date(filters.dateFrom) }
        } : undefined
      },
      _count: { select: { executions: true } }
    }
  });

  return {
    title: 'Relatório de Automações',
    automations: automations.map(automation => ({
      ...automation,
      trigger: JSON.parse(automation.trigger),
      actions: JSON.parse(automation.actions)
    })),
    summary: {
      total: automations.length,
      active: automations.filter(a => a.isActive).length,
      totalExecutions: automations.reduce((sum, a) => sum + a._count.executions, 0)
    },
    generatedAt: new Date()
  };
}

async function generatePDFReport(data, reportType) {
  const doc = new PDFDocument();
  const fileName = `${reportType}-${Date.now()}.pdf`;
  const reportsDir = path.join(process.cwd(), 'reports');
  const filePath = path.join(reportsDir, fileName);

  // Criar diretório se não existir
  await fs.mkdir(reportsDir, { recursive: true });

  const stream = require('fs').createWriteStream(filePath);
  doc.pipe(stream);

  // Cabeçalho
  doc.fontSize(20).text(data.title, 50, 50);
  doc.fontSize(12).text(`Gerado em: ${data.generatedAt?.toLocaleString('pt-BR')}`, 50, 80);

  let yPosition = 120;

  if (data.leads) {
    doc.fontSize(16).text('Resumo', 50, yPosition);
    yPosition += 30;

    doc.fontSize(12).text(`Total de Leads: ${data.summary.total}`, 50, yPosition);
    yPosition += 20;

    // Status breakdown
    for (const [status, count] of Object.entries(data.summary.byStatus)) {
      doc.text(`${status}: ${count}`, 70, yPosition);
      yPosition += 15;
    }

    yPosition += 20;
    doc.fontSize(16).text('Leads', 50, yPosition);
    yPosition += 30;

    // Leads list
    data.leads.slice(0, 50).forEach((lead) => { // Limitar a 50 leads por questões de espaço
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      doc.fontSize(12)
         .text(`Nome: ${lead.name}`, 50, yPosition)
         .text(`Email: ${lead.email || 'N/A'}`, 50, yPosition + 15)
         .text(`Telefone: ${lead.phone || 'N/A'}`, 50, yPosition + 30)
         .text(`Status: ${lead.status}`, 50, yPosition + 45);

      yPosition += 80;
    });
  }

  if (data.metrics) {
    doc.fontSize(16).text('Métricas', 50, yPosition);
    yPosition += 30;

    doc.fontSize(12)
       .text(`Total de Leads: ${data.metrics.totalLeads}`, 50, yPosition)
       .text(`Conversões: ${data.metrics.conversions}`, 50, yPosition + 15)
       .text(`Taxa de Conversão: ${data.metrics.conversionRate}%`, 50, yPosition + 30)
       .text(`Comunicações: ${data.metrics.communications}`, 50, yPosition + 45);
  }

  doc.end();

  return new Promise((resolve) => {
    stream.on('finish', () => {
      resolve(filePath);
    });
  });
}

async function generateExcelReport(data, reportType) {
  const workbook = new ExcelJS.Workbook();
  const fileName = `${reportType}-${Date.now()}.xlsx`;
  const reportsDir = path.join(process.cwd(), 'reports');
  const filePath = path.join(reportsDir, fileName);

  // Criar diretório se não existir
  await fs.mkdir(reportsDir, { recursive: true });

  if (data.leads) {
    const worksheet = workbook.addWorksheet('Leads');

    // Cabeçalhos
    worksheet.columns = [
      { header: 'Nome', key: 'name', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Telefone', key: 'phone', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Criado em', key: 'createdAt', width: 20 },
      { header: 'Tags', key: 'tags', width: 30 }
    ];

    // Dados
    data.leads.forEach(lead => {
      worksheet.addRow({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
        createdAt: new Date(lead.createdAt).toLocaleString('pt-BR'),
        tags: lead.tags?.map(t => t.tag.name).join(', ') || ''
      });
    });

    // Formatação
    worksheet.getRow(1).font = { bold: true };
  }

  if (data.metrics) {
    const metricsSheet = workbook.addWorksheet('Métricas');

    metricsSheet.addRow(['Métrica', 'Valor']);
    metricsSheet.addRow(['Total de Leads', data.metrics.totalLeads]);
    metricsSheet.addRow(['Conversões', data.metrics.conversions]);
    metricsSheet.addRow(['Taxa de Conversão', `${data.metrics.conversionRate}%`]);
    metricsSheet.addRow(['Comunicações', data.metrics.communications]);

    metricsSheet.getRow(1).font = { bold: true };
  }

  await workbook.xlsx.writeFile(filePath);
  return filePath;
}

async function generateLeadsReport(job, data) {
  return generateReport(job, { ...data, reportType: 'leads' });
}

async function generateAnalyticsReport(job, data) {
  return generateReport(job, { ...data, reportType: 'analytics' });
}

module.exports = reportsWorker;