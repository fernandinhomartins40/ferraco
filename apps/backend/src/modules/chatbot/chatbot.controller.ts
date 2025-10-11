import { Request, Response } from 'express';
import { ChatbotService } from './chatbot.service';
import { successResponse, errorResponse } from '../../utils/response';
import { logger } from '../../utils/logger';

export class ChatbotController {
  private chatbotService: ChatbotService;

  constructor() {
    this.chatbotService = new ChatbotService();
  }

  /**
   * GET /api/chatbot/config
   * Busca a configuração do chatbot
   */
  getConfig = async (req: Request, res: Response): Promise<void> => {
    try {
      const config = await this.chatbotService.getConfig();
      successResponse(res, config, 'Configuração recuperada com sucesso');
    } catch (error) {
      logger.error('Error getting chatbot config:', error);
      errorResponse(res, 'Erro ao buscar configuração do chatbot', 500);
    }
  };

  /**
   * PUT /api/chatbot/config
   * Atualiza a configuração do chatbot
   */
  updateConfig = async (req: Request, res: Response): Promise<void> => {
    try {
      const configData = req.body;
      const config = await this.chatbotService.updateConfig(configData);
      successResponse(res, config, 'Configuração atualizada com sucesso');
    } catch (error) {
      logger.error('Error updating chatbot config:', error);
      errorResponse(res, 'Erro ao atualizar configuração do chatbot', 500);
    }
  };
}
