/**
 * Landing Page Routes - Rotas públicas para configuração da landing page
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';

const router = Router();

/**
 * GET /api/landing-page/config
 * Buscar configuração da landing page (pública)
 */
router.get('/config', async (req: Request, res: Response) => {
  try {
    // Buscar a primeira (e única) configuração de landing page
    const config = await prisma.landingPageConfig.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuração da landing page não encontrada',
      });
    }

    // Parsear JSONs
    const parsedConfig = {
      id: config.id,
      header: JSON.parse(config.header),
      hero: JSON.parse(config.hero),
      marquee: JSON.parse(config.marquee),
      about: JSON.parse(config.about),
      products: JSON.parse(config.products),
      experience: JSON.parse(config.experience),
      contact: JSON.parse(config.contact),
      footer: JSON.parse(config.footer),
      updatedAt: config.updatedAt,
    };

    res.json({
      success: true,
      data: parsedConfig,
    });
  } catch (error: any) {
    console.error('Erro ao buscar configuração da landing page:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao buscar configuração',
    });
  }
});

export default router;
