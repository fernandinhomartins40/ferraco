import { Request, Response } from 'express';
import { ChatbotSessionService } from './chatbot-session.service';
import { successResponse, errorResponse } from '../../utils/response';
import { logger } from '../../utils/logger';

export class ChatbotSessionController {
  private sessionService: ChatbotSessionService;

  constructor() {
    this.sessionService = new ChatbotSessionService();
  }

  /**
   * POST /api/chatbot/session/start
   * Inicia uma nova sessão de chatbot
   */
  startSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userAgent, ipAddress, source, campaign } = req.body;

      const result = await this.sessionService.startSession({
        userAgent: userAgent || req.headers['user-agent'],
        ipAddress: ipAddress || req.ip,
        source,
        campaign,
      });

      successResponse(res, result, 'Sessão iniciada com sucesso');
    } catch (error) {
      logger.error('Error starting chatbot session:', error);
      errorResponse(res, 'Erro ao iniciar sessão do chatbot', 500);
    }
  };

  /**
   * POST /api/chatbot/session/:sessionId/message
   * Envia uma mensagem na sessão
   */
  sendMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const { message, optionId } = req.body;

      if (!message || message.trim() === '') {
        errorResponse(res, 'Mensagem é obrigatória', 400);
        return;
      }

      const result = await this.sessionService.processMessage(
        sessionId,
        message,
        optionId
      );

      if ('isError' in result && result.isError) {
        successResponse(res, result, 'Erro de validação', 400);
        return;
      }

      successResponse(res, result, 'Mensagem processada com sucesso');
    } catch (error: any) {
      logger.error('Error processing chatbot message:', error);

      if (error.message === 'Session not found') {
        errorResponse(res, 'Sessão não encontrada', 404);
        return;
      }

      if (error.message === 'Session is not active') {
        errorResponse(res, 'Sessão não está ativa', 400);
        return;
      }

      errorResponse(res, 'Erro ao processar mensagem', 500);
    }
  };

  /**
   * GET /api/chatbot/session/:sessionId/history
   * Busca histórico da sessão
   */
  getSessionHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;

      const session = await this.sessionService.getSessionHistory(sessionId);

      if (!session) {
        errorResponse(res, 'Sessão não encontrada', 404);
        return;
      }

      successResponse(res, session, 'Histórico recuperado com sucesso');
    } catch (error) {
      logger.error('Error getting session history:', error);
      errorResponse(res, 'Erro ao buscar histórico da sessão', 500);
    }
  };

  /**
   * POST /api/chatbot/session/:sessionId/end
   * Encerra uma sessão
   */
  endSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;

      await this.sessionService.endSession(sessionId);

      successResponse(res, null, 'Sessão encerrada com sucesso');
    } catch (error) {
      logger.error('Error ending chatbot session:', error);
      errorResponse(res, 'Erro ao encerrar sessão', 500);
    }
  };
}
