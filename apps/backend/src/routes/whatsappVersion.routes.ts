/**
 * WhatsApp Version Routes
 *
 * Gerenciamento automático de versões do WhatsApp Web
 * Endpoints para monitorar e forçar atualizações
 */

import { Router, Request, Response } from 'express';
import whatsappVersionManagerService from '../services/whatsappVersionManager.service';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/whatsapp/version/current
 * Obter versão atual do WhatsApp Web (via Baileys)
 */
router.get('/current', authenticate, async (req: Request, res: Response) => {
  try {
    const version = await whatsappVersionManagerService.fetchLatestWhatsAppVersion();

    res.json({
      success: true,
      version,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    logger.error('Erro ao buscar versão atual:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar versão atual do WhatsApp',
      message: error.message,
    });
  }
});

/**
 * GET /api/whatsapp/version/history
 * Obter histórico de versões detectadas
 *
 * Query params:
 * - limit: número de registros (default: 50)
 */
router.get('/history', authenticate, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const history = await whatsappVersionManagerService.getVersionHistory(limit);

    res.json({
      success: true,
      history,
      total: history.length,
    });

  } catch (error: any) {
    logger.error('Erro ao buscar histórico de versões:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar histórico de versões',
      message: error.message,
    });
  }
});

/**
 * POST /api/whatsapp/version/check
 * Forçar verificação e atualização manual (monitoramento inteligente)
 */
router.post('/check', authenticate, async (req: Request, res: Response) => {
  try {
    logger.info('🔄 Verificação manual solicitada (monitoramento inteligente)');

    const result = await whatsappVersionManagerService.forceUpdate();

    res.json({
      success: true,
      result: {
        currentVersion: result.currentVersion,
        previousVersion: result.previousVersion,
        versionChanged: result.versionChanged,
        needsUpdate: result.needsUpdate,
        updateApplied: result.updateApplied,
        error: result.error,
        timestamp: result.timestamp,
      },
      message: result.updateApplied
        ? `Atualização aplicada! ${result.previousVersion} → ${result.currentVersion}`
        : result.needsUpdate
        ? `Atualização necessária mas falhou: ${result.error}`
        : result.error
        ? `Nenhuma atualização: ${result.error}`
        : 'Sistema funcionando corretamente - nenhuma ação necessária',
    });

  } catch (error: any) {
    logger.error('Erro ao verificar/atualizar versão:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar/atualizar versão',
      message: error.message,
    });
  }
});

export default router;
