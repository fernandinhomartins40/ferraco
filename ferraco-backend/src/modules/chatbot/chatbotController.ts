import { Request, Response } from 'express';
import aiService from '../../services/aiService';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import axios from 'axios';

const prisma = new PrismaClient();

// Validação com Zod
const MessageSchema = z.object({
  message: z.string().min(1).max(1000),
  leadId: z.string().uuid(),
});

const ExtractDataSchema = z.object({
  text: z.string().min(10).max(50000),
});

export class ChatbotController {
  /**
   * POST /api/chatbot/message
   * Envia mensagem para o chatbot
   */
  async sendMessage(req: Request, res: Response) {
    try {
      const { message, leadId } = MessageSchema.parse(req.body);

      console.log(`📨 Mensagem recebida do lead ${leadId}: ${message}`);

      // Buscar lead
      const lead = await prisma.lead.findUnique({
        where: { id: leadId }
      });

      if (!lead) {
        return res.status(404).json({ error: 'Lead não encontrado' });
      }

      // Buscar histórico
      const messageHistory = await aiService.getMessageHistory(leadId, 10);

      // Conversar com IA
      const result = await aiService.chat(message, {
        leadId,
        messageHistory,
        leadData: {
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          interest: undefined // Pode adicionar notas aqui se quiser
        }
      });

      // Atualizar lead se extraiu dados novos
      if (Object.keys(result.extractedData).length > 0) {
        const updates: any = {};

        if (result.extractedData.name && result.extractedData.name !== lead.name) {
          updates.name = result.extractedData.name;
        }
        if (result.extractedData.phone && result.extractedData.phone !== lead.phone) {
          updates.phone = result.extractedData.phone;
        }
        if (result.extractedData.email && result.extractedData.email !== lead.email) {
          updates.email = result.extractedData.email;
        }

        if (Object.keys(updates).length > 0) {
          console.log(`✏️  Atualizando lead com novos dados:`, updates);
          await prisma.lead.update({
            where: { id: leadId },
            data: updates
          });
        }
      }

      // Se deve qualificar, atualizar status
      if (result.shouldQualify && lead.status === 'NOVO') {
        console.log(`⭐ Lead qualificado!`);
        await prisma.lead.update({
          where: { id: leadId },
          data: {
            status: 'EM_ANDAMENTO',
            leadScore: (lead.leadScore || 0) + 25 // Aumentar score
          }
        });
      }

      return res.json({
        message: result.message,
        extractedData: result.extractedData,
        qualified: result.shouldQualify
      });

    } catch (error: any) {
      console.error('❌ Erro em sendMessage:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }

      return res.status(500).json({
        error: 'Erro interno do servidor',
        details: error.message
      });
    }
  }

  /**
   * GET /api/chatbot/history/:leadId
   * Busca histórico de conversa
   */
  async getHistory(req: Request, res: Response) {
    try {
      const { leadId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const messages = await prisma.chatMessage.findMany({
        where: { leadId },
        orderBy: { createdAt: 'asc' },
        take: limit
      });

      return res.json({ messages });

    } catch (error: any) {
      console.error('❌ Erro em getHistory:', error);
      return res.status(500).json({ error: 'Erro ao buscar histórico' });
    }
  }

  /**
   * GET /api/chatbot/context
   * Retorna contexto da empresa para preview
   */
  async getContext(_req: Request, res: Response) {
    try {
      const context = await aiService.loadCompanyContext();
      return res.json({ context });
    } catch (error: any) {
      console.error('❌ Erro em getContext:', error);
      return res.status(500).json({ error: 'Erro ao carregar contexto' });
    }
  }

  /**
   * GET /api/chatbot/health
   * Verifica se Ollama está rodando
   */
  async checkHealth(req: Request, res: Response) {
    try {
      const isHealthy = await aiService.checkOllamaHealth();

      if (isHealthy) {
        return res.json({
          status: 'ok',
          message: 'Ollama está rodando',
          ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434'
        });
      } else {
        return res.status(503).json({
          status: 'error',
          message: 'Ollama não está acessível',
          ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
          help: 'Execute: ollama serve'
        });
      }
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  /**
   * POST /api/chatbot/extract-data
   * Extrai dados estruturados de um texto usando IA
   */
  async extractData(req: Request, res: Response) {
    try {
      const { text } = ExtractDataSchema.parse(req.body);

      console.log('🤖 Iniciando extração de dados com IA...');

      const extractedData = await aiService.extractCompanyDataFromText(text);

      console.log('✅ Dados extraídos com sucesso:', extractedData);

      return res.json(extractedData);

    } catch (error: any) {
      console.error('❌ Erro ao extrair dados:', error);

      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: error.errors
        });
      }

      return res.status(500).json({
        error: 'Erro ao processar texto com IA',
        details: error.message
      });
    }
  }

  /**
   * POST /api/chatbot/fusechat-proxy
   * Proxy para FuseChat API (evita CORS)
   */
  async fusechatProxy(req: Request, res: Response) {
    try {
      const { message, apiKey, session_id } = req.body;

      if (!message || !apiKey) {
        return res.status(400).json({ error: 'message e apiKey são obrigatórios' });
      }

      console.log('🔄 Proxy FuseChat: enviando requisição...');

      // Fazer requisição para FuseChat usando axios
      const requestBody: any = { message };
      if (session_id) {
        requestBody.session_id = session_id;
      }

      const response = await axios.post('https://digiurbis.com.br/api/chat', requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        timeout: 60000,
      });

      console.log('✅ Resposta FuseChat recebida');

      return res.json(response.data);

    } catch (error: any) {
      console.error('❌ Erro no proxy FuseChat:', error);

      if (error.response) {
        // FuseChat retornou erro
        return res.status(error.response.status).json({
          error: `FuseChat API error: ${error.response.statusText}`,
          details: error.response.data
        });
      }

      return res.status(500).json({
        error: 'Erro no proxy',
        details: error.message
      });
    }
  }
}

export default new ChatbotController();
