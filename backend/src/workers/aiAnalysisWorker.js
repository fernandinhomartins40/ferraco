const OpenAI = require('openai');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

// Cliente OpenAI
let openaiClient = null;

function createOpenAIClient() {
  if (openaiClient) return openaiClient;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Chave da API OpenAI não encontrada');
  }

  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

/**
 * Worker para processar jobs de análise IA
 */
async function aiAnalysisWorker(job) {
  const { data } = job;
  const { type } = data;

  try {
    logger.info('Iniciando processamento de job de IA', {
      jobId: job.id,
      type,
      leadId: data.leadId
    });

    await job.progress(10);

    let result;

    switch (type) {
      case 'sentiment_analysis':
        result = await performSentimentAnalysis(job, data);
        break;

      case 'lead_scoring':
        result = await performLeadScoring(job, data);
        break;

      case 'duplicate_detection':
        result = await performDuplicateDetection(job, data);
        break;

      case 'content_analysis':
        result = await performContentAnalysis(job, data);
        break;

      default:
        throw new Error(`Tipo de job de IA desconhecido: ${type}`);
    }

    await job.progress(100);

    logger.info('Job de IA processado com sucesso', {
      jobId: job.id,
      type,
      success: result?.success || false
    });

    return result;

  } catch (error) {
    logger.error('Erro ao processar job de IA', {
      jobId: job.id,
      type,
      error: error.message
    });
    throw error;
  }
}

async function performSentimentAnalysis(job, data) {
  const { leadId, content, type: contentType } = data;

  try {
    await job.progress(30);

    const openai = createOpenAIClient();

    const prompt = `Analise o sentimento do seguinte ${contentType || 'texto'} e forneça uma resposta em JSON:

Texto: "${content}"

Responda com:
{
  "sentiment": "positive|negative|neutral",
  "confidence": 0.0-1.0,
  "emotions": ["happy", "angry", "frustrated", "excited", etc],
  "keywords": ["palavra1", "palavra2"],
  "summary": "resumo em português"
}`;

    await job.progress(60);

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500
    });

    await job.progress(80);

    const analysis = JSON.parse(response.choices[0].message.content);

    // Salvar análise no banco
    const sentimentRecord = await prisma.sentimentAnalysis.create({
      data: {
        leadId: leadId || null,
        content: content.substring(0, 1000),
        contentType: contentType || 'text',
        sentiment: analysis.sentiment.toUpperCase(),
        confidence: analysis.confidence,
        emotions: analysis.emotions,
        keywords: analysis.keywords,
        summary: analysis.summary,
        analyzedAt: new Date()
      }
    });

    await job.progress(95);

    return {
      success: true,
      analysis,
      sentimentId: sentimentRecord.id
    };

  } catch (error) {
    logger.error('Erro na análise de sentimento', {
      leadId,
      error: error.message
    });
    throw error;
  }
}

async function performLeadScoring(job, data) {
  const { leadId } = data;

  try {
    await job.progress(20);

    // Buscar dados do lead
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        tags: { include: { tag: true } },
        notes: true,
        communications: true
      }
    });

    if (!lead) {
      throw new Error(`Lead não encontrado: ${leadId}`);
    }

    await job.progress(40);

    const openai = createOpenAIClient();

    const leadData = {
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      status: lead.status,
      source: lead.source,
      tags: lead.tags.map(t => t.tag.name),
      notesCount: lead.notes?.length || 0,
      communicationsCount: lead.communications?.length || 0,
      daysSinceCreated: Math.floor((new Date() - new Date(lead.createdAt)) / (1000 * 60 * 60 * 24))
    };

    const prompt = `Analise este lead e calcule um score de 0-100 baseado na probabilidade de conversão:

Dados do Lead:
${JSON.stringify(leadData, null, 2)}

Considere:
- Qualidade dos dados (email, telefone completos)
- Engajamento (comunicações, notas)
- Fonte do lead
- Tags relevantes
- Tempo desde criação

Responda com JSON:
{
  "score": 0-100,
  "factors": {
    "dataQuality": 0-25,
    "engagement": 0-25,
    "source": 0-25,
    "timing": 0-25
  },
  "reasoning": "explicação do score",
  "recommendations": ["ação1", "ação2"]
}`;

    await job.progress(70);

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 800
    });

    await job.progress(85);

    const scoring = JSON.parse(response.choices[0].message.content);

    // Atualizar score no lead
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        leadScore: scoring.score,
        scoreFactors: JSON.stringify(scoring.factors),
        scoreReasoning: scoring.reasoning,
        lastScoredAt: new Date()
      }
    });

    await job.progress(95);

    return {
      success: true,
      score: scoring.score,
      factors: scoring.factors,
      reasoning: scoring.reasoning,
      recommendations: scoring.recommendations
    };

  } catch (error) {
    logger.error('Erro no lead scoring', {
      leadId,
      error: error.message
    });
    throw error;
  }
}

async function performDuplicateDetection(job, data) {
  const { leadId, threshold = 0.8 } = data;

  try {
    await job.progress(20);

    const targetLead = await prisma.lead.findUnique({
      where: { id: leadId }
    });

    if (!targetLead) {
      throw new Error(`Lead não encontrado: ${leadId}`);
    }

    await job.progress(40);

    // Buscar leads similares
    const potentialDuplicates = await prisma.lead.findMany({
      where: {
        id: { not: leadId },
        OR: [
          { email: targetLead.email },
          { phone: targetLead.phone },
          { name: { contains: targetLead.name.split(' ')[0] } }
        ]
      }
    });

    await job.progress(60);

    const openai = createOpenAIClient();

    const duplicates = [];

    for (const candidate of potentialDuplicates) {
      const prompt = `Compare estes dois leads e determine se são duplicatas (0.0-1.0):

Lead 1: ${JSON.stringify({
        name: targetLead.name,
        email: targetLead.email,
        phone: targetLead.phone
      })}

Lead 2: ${JSON.stringify({
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone
      })}

Responda apenas com um número de 0.0 a 1.0 indicando similaridade.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 10
      });

      const similarity = parseFloat(response.choices[0].message.content.trim());

      if (similarity >= threshold) {
        duplicates.push({
          leadId: candidate.id,
          similarity,
          reasons: []
        });
      }
    }

    await job.progress(90);

    // Marcar duplicatas se encontradas
    if (duplicates.length > 0) {
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          isDuplicate: true,
          duplicateOf: duplicates[0].leadId // Primeiro duplicado encontrado
        }
      });
    }

    return {
      success: true,
      duplicatesFound: duplicates.length,
      duplicates
    };

  } catch (error) {
    logger.error('Erro na detecção de duplicatas', {
      leadId,
      error: error.message
    });
    throw error;
  }
}

async function performContentAnalysis(job, data) {
  const { content, analysisType, leadId } = data;

  try {
    await job.progress(30);

    const openai = createOpenAIClient();

    let prompt = '';

    switch (analysisType) {
      case 'extract_info':
        prompt = `Extraia informações estruturadas deste texto:

"${content}"

Responda com JSON:
{
  "entities": {
    "people": [],
    "companies": [],
    "locations": [],
    "dates": [],
    "emails": [],
    "phones": []
  },
  "intent": "intenção do texto",
  "urgency": "low|medium|high",
  "category": "categoria do conteúdo"
}`;
        break;

      case 'summarize':
        prompt = `Resuma este texto em português:

"${content}"

Faça um resumo conciso em até 100 palavras.`;
        break;

      default:
        throw new Error(`Tipo de análise desconhecido: ${analysisType}`);
    }

    await job.progress(70);

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 600
    });

    await job.progress(90);

    const result = analysisType === 'summarize'
      ? { summary: response.choices[0].message.content }
      : JSON.parse(response.choices[0].message.content);

    return {
      success: true,
      analysisType,
      result
    };

  } catch (error) {
    logger.error('Erro na análise de conteúdo', {
      analysisType,
      error: error.message
    });
    throw error;
  }
}

module.exports = aiAnalysisWorker;