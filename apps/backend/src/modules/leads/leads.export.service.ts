import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';
import { Readable } from 'stream';
import { parse } from 'csv-parse';
import { logger } from '../../utils/logger';
import { LeadsService } from './leads.service';

// ============================================================================
// LeadsExportService
// ============================================================================

export class LeadsExportService {
  constructor(
    private prisma: PrismaClient,
    private leadsService: LeadsService
  ) {}

  // ==========================================================================
  // Export Methods
  // ==========================================================================

  /**
   * Export leads to CSV format
   */
  async exportToCSV(filters: any = {}): Promise<Buffer> {
    const result = await this.leadsService.findAll({
      ...filters,
      limit: 10000, // Max export limit
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Leads');

    // Define columns
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 30 },
      { header: 'Nome', key: 'name', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Telefone', key: 'phone', width: 20 },
      { header: 'Empresa', key: 'company', width: 30 },
      { header: 'Cargo', key: 'position', width: 25 },
      { header: 'Status', key: 'status', width: 20 },
      { header: 'Prioridade', key: 'priority', width: 15 },
      { header: 'Origem', key: 'source', width: 20 },
      { header: 'Lead Score', key: 'leadScore', width: 15 },
      { header: 'Responsável', key: 'assignedTo', width: 30 },
      { header: 'Criado em', key: 'createdAt', width: 20 },
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' },
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    // Add data rows
    result.data.forEach((lead: any) => {
      worksheet.addRow({
        id: lead.id,
        name: lead.name,
        email: lead.email || '',
        phone: lead.phone,
        company: lead.company || '',
        position: lead.position || '',
        status: lead.status,
        priority: lead.priority,
        source: lead.source || 'WEBSITE',
        leadScore: lead.leadScore,
        assignedTo: lead.assignedTo?.name || '',
        createdAt: lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('pt-BR') : '',
      });
    });

    // Generate buffer
    const buffer = await workbook.csv.writeBuffer();
    return buffer as Buffer;
  }

  /**
   * Export leads to Excel format
   */
  async exportToExcel(filters: any = {}): Promise<Buffer> {
    const result = await this.leadsService.findAll({
      ...filters,
      limit: 10000, // Max export limit
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Leads');

    // Define columns
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 30 },
      { header: 'Nome', key: 'name', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Telefone', key: 'phone', width: 20 },
      { header: 'Empresa', key: 'company', width: 30 },
      { header: 'Cargo', key: 'position', width: 25 },
      { header: 'Status', key: 'status', width: 20 },
      { header: 'Prioridade', key: 'priority', width: 15 },
      { header: 'Origem', key: 'source', width: 20 },
      { header: 'Lead Score', key: 'leadScore', width: 15 },
      { header: 'Responsável', key: 'assignedTo', width: 30 },
      { header: 'Criado em', key: 'createdAt', width: 20 },
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' },
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    // Add data rows
    result.data.forEach((lead: any) => {
      worksheet.addRow({
        id: lead.id,
        name: lead.name,
        email: lead.email || '',
        phone: lead.phone,
        company: lead.company || '',
        position: lead.position || '',
        status: lead.status,
        priority: lead.priority,
        source: lead.source || 'WEBSITE',
        leadScore: lead.leadScore,
        assignedTo: lead.assignedTo?.name || '',
        createdAt: lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('pt-BR') : '',
      });
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as Buffer;
  }

  // ==========================================================================
  // Import Methods
  // ==========================================================================

  /**
   * Parse CSV/Excel file and return lead data
   */
  async parseFile(buffer: Buffer, filename: string): Promise<any[]> {
    const isExcel = filename.endsWith('.xlsx') || filename.endsWith('.xls');

    if (isExcel) {
      return this.parseExcel(buffer);
    } else {
      return this.parseCSV(buffer);
    }
  }

  /**
   * Parse Excel file
   */
  private async parseExcel(buffer: Buffer): Promise<any[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new Error('Planilha não encontrada');
    }

    const leads: any[] = [];
    const headerRow = worksheet.getRow(1);
    const headers: string[] = [];

    // Get headers
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber] = String(cell.value).toLowerCase().trim();
    });

    // Parse rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      const lead: any = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber];
        const value = cell.value;

        // Map headers to lead fields
        switch (header) {
          case 'nome':
          case 'name':
            lead.name = String(value).trim();
            break;
          case 'email':
          case 'e-mail':
            lead.email = value ? String(value).trim() : undefined;
            break;
          case 'telefone':
          case 'phone':
          case 'celular':
            lead.phone = String(value).replace(/\D/g, '').trim();
            break;
          case 'empresa':
          case 'company':
            lead.company = value ? String(value).trim() : undefined;
            break;
          case 'cargo':
          case 'position':
            lead.position = value ? String(value).trim() : undefined;
            break;
          case 'status':
            lead.status = value ? String(value).trim() : 'NOVO';
            break;
          case 'prioridade':
          case 'priority':
            lead.priority = value ? String(value).trim().toUpperCase() : 'MEDIUM';
            break;
          case 'origem':
          case 'source':
            lead.source = value ? String(value).trim().toUpperCase() : 'IMPORT';
            break;
        }
      });

      // Only add if has name and phone
      if (lead.name && lead.phone) {
        leads.push(lead);
      }
    });

    return leads;
  }

  /**
   * Parse CSV file
   */
  private async parseCSV(buffer: Buffer): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const leads: any[] = [];
      const stream = Readable.from(buffer);

      stream
        .pipe(
          parse({
            columns: true,
            skip_empty_lines: true,
            trim: true,
            bom: true,
          })
        )
        .on('data', (row: any) => {
          const lead: any = {};

          // Map CSV columns to lead fields
          Object.keys(row).forEach((key) => {
            const normalizedKey = key.toLowerCase().trim();
            const value = row[key];

            switch (normalizedKey) {
              case 'nome':
              case 'name':
                lead.name = String(value).trim();
                break;
              case 'email':
              case 'e-mail':
                lead.email = value ? String(value).trim() : undefined;
                break;
              case 'telefone':
              case 'phone':
              case 'celular':
                lead.phone = String(value).replace(/\D/g, '').trim();
                break;
              case 'empresa':
              case 'company':
                lead.company = value ? String(value).trim() : undefined;
                break;
              case 'cargo':
              case 'position':
                lead.position = value ? String(value).trim() : undefined;
                break;
              case 'status':
                lead.status = value ? String(value).trim() : 'NOVO';
                break;
              case 'prioridade':
              case 'priority':
                lead.priority = value ? String(value).trim().toUpperCase() : 'MEDIUM';
                break;
              case 'origem':
              case 'source':
                lead.source = value ? String(value).trim().toUpperCase() : 'IMPORT';
                break;
            }
          });

          // Only add if has name and phone
          if (lead.name && lead.phone) {
            leads.push(lead);
          }
        })
        .on('end', () => {
          resolve(leads);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  /**
   * Import leads from parsed data
   */
  async importLeads(leads: any[], userId: string): Promise<{
    success: number;
    failed: number;
    errors: any[];
  }> {
    let success = 0;
    let failed = 0;
    const errors: any[] = [];

    for (const leadData of leads) {
      try {
        // Check if lead already exists by phone
        const existingLead = await this.prisma.lead.findFirst({
          where: { phone: leadData.phone },
        });

        if (existingLead) {
          // Update existing lead
          await this.prisma.lead.update({
            where: { id: existingLead.id },
            data: {
              name: leadData.name,
              email: leadData.email,
              company: leadData.company,
              position: leadData.position,
              // Don't overwrite status or priority if already set
            },
          });
          success++;
        } else {
          // Create new lead with IMPORT source
          await this.prisma.lead.create({
            data: {
              name: leadData.name,
              email: leadData.email,
              phone: leadData.phone,
              company: leadData.company,
              position: leadData.position,
              status: leadData.status || 'NOVO',
              priority: leadData.priority || 'MEDIUM',
              source: 'IMPORT', // Mark as imported
              createdById: userId,
            },
          });
          success++;
        }
      } catch (error: any) {
        failed++;
        errors.push({
          lead: leadData,
          error: error.message,
        });
        logger.error('Failed to import lead', { leadData, error });
      }
    }

    return { success, failed, errors };
  }
}
