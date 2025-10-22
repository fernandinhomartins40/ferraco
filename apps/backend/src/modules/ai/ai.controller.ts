// ============================================================================
// AI Module - Controller
// ============================================================================

import { Request, Response } from 'express';
import { aiService } from './ai.service';
import { AuthRequest } from '../../middleware/auth';

export class AIController {
  // ============================================================================
  // Sentiment Analysis
  // ============================================================================

  async analyzeSentiment(req: Request, res: Response): Promise<void> {
    try {
      const result = await aiService.analyzeSentiment(req.body);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao analisar sentimento',
      });
    }
  }

  // ============================================================================
  // Conversion Prediction
  // ============================================================================

  async predictConversion(req: Request, res: Response): Promise<void> {
    try {
      const result = await aiService.predictConversion(req.body);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao prever conversão',
      });
    }
  }

  // ============================================================================
  // Lead Scoring
  // ============================================================================

  async scoreLeadAutomatically(req: Request, res: Response): Promise<void> {
    try {
      const result = await aiService.scoreLeadAutomatically(req.body);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao pontuar lead',
      });
    }
  }

  // ============================================================================
  // Chatbot
  // ============================================================================

  async processChatbotMessage(req: Request, res: Response): Promise<void> {
    try {
      const result = await aiService.processChatbotMessage(req.body);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao processar mensagem do chatbot',
      });
    }
  }

  // ============================================================================
  // Duplicate Detection
  // ============================================================================

  async detectDuplicates(req: Request, res: Response): Promise<void> {
    try {
      const result = await aiService.detectDuplicates(req.body);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao detectar duplicatas',
      });
    }
  }

  // ============================================================================
  // Insights
  // ============================================================================

  async generateInsights(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = {
        period: req.query.period as 'day' | 'week' | 'month' | undefined,
        userId: req.query.onlyMine === 'true' ? req.user!.userId : undefined,
      };

      const result = await aiService.generateInsights(data);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao gerar insights',
      });
    }
  }

  // ============================================================================
  // Get Analysis & Prediction
  // ============================================================================

  async getLeadAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { leadId } = req.params;
      const analysis = await aiService.getLeadAnalysis(leadId);

      if (!analysis) {
        res.status(404).json({
          success: false,
          error: 'Análise não encontrada',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar análise',
      });
    }
  }

  async getLeadPrediction(req: Request, res: Response): Promise<void> {
    try {
      const { leadId } = req.params;
      const prediction = await aiService.getLeadPrediction(leadId);

      if (!prediction) {
        res.status(404).json({
          success: false,
          error: 'Predição não encontrada',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: prediction,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar predição',
      });
    }
  }
}

export const aiController = new AIController();
