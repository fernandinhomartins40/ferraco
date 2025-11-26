/**
 * Rotas de Debug do WhatsApp (remover em produção final)
 */

import { Router, Request, Response } from 'express';
import { whatsappWebJSService } from '../services/whatsappWebJS.service';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/whatsapp/debug/status
 * Status detalhado do WhatsApp (para diagnóstico)
 */
router.get('/status', authenticate, async (req: Request, res: Response) => {
  try {
    const status = whatsappWebJSService.getStatus();
    const qr = whatsappWebJSService.getQRCode();

    const diagnostics = {
      timestamp: new Date().toISOString(),
      status: {
        connected: status.connected,
        hasQR: status.hasQR,
        isInitializing: status.isInitializing,
        message: status.message,
      },
      qrCode: {
        exists: qr !== null,
        length: qr?.length || 0,
        preview: qr ? qr.substring(0, 50) + '...' : null,
      },
      service: {
        isConnected: whatsappWebJSService.isWhatsAppConnected(),
      },
      socketIO: {
        configured: 'Socket.IO status not available',
      },
    };

    logger.info('📊 Debug status solicitado:', diagnostics);

    res.json({
      success: true,
      diagnostics,
    });

  } catch (error: any) {
    logger.error('❌ Erro ao obter debug status:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter status',
      message: error.message,
    });
  }
});

/**
 * POST /api/whatsapp/debug/reinit
 * Forçar reinicialização (gerar novo QR)
 */
router.post('/reinit', authenticate, async (req: Request, res: Response) => {
  try {
    logger.info('🔄 Reinicialização forçada solicitada');
    await whatsappWebJSService.reinitialize();

    res.json({
      success: true,
      message: 'Reinicialização iniciada. Novo QR será gerado em breve.',
    });

  } catch (error: any) {
    logger.error('❌ Erro ao reinicializar:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao reinicializar',
      message: error.message,
    });
  }
});

export default router;
