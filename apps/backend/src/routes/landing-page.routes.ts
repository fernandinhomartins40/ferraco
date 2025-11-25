/**
 * Landing Page Routes - Rotas para configuração da landing page
 *
 * MELHORIAS (FASE 5):
 * - Endpoints de histórico de alterações
 * - Restauração de versões anteriores
 * - Logging detalhado
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();

// Helper: Log de alterações
const logChange = (action: string, details?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[LandingPage] ${timestamp} - ${action}`, details || '');
};

/**
 * GET /api/landing-page/config
 * Buscar configuração da landing page (pública - sem auth)
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

/**
 * PUT /api/landing-page/config
 * Atualizar configuração da landing page (requer autenticação)
 */
router.put('/config', authenticate, async (req: Request, res: Response) => {
  try {
    const { header, hero, marquee, about, products, experience, contact, footer } = req.body;

    // Validar que ao menos um campo foi enviado
    if (!header && !hero && !marquee && !about && !products && !experience && !contact && !footer) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum campo para atualizar foi fornecido',
      });
    }

    // Buscar config existente
    const existingConfig = await prisma.landingPageConfig.findFirst();

    let config;

    if (existingConfig) {
      // Atualizar config existente
      const updateData: any = {};
      if (header) updateData.header = JSON.stringify(header);
      if (hero) updateData.hero = JSON.stringify(hero);
      if (marquee) updateData.marquee = JSON.stringify(marquee);
      if (about) updateData.about = JSON.stringify(about);
      if (products) updateData.products = JSON.stringify(products);
      if (experience) updateData.experience = JSON.stringify(experience);
      if (contact) updateData.contact = JSON.stringify(contact);
      if (footer) updateData.footer = JSON.stringify(footer);

      config = await prisma.landingPageConfig.update({
        where: { id: existingConfig.id },
        data: updateData,
      });
    } else {
      // Criar nova config
      config = await prisma.landingPageConfig.create({
        data: {
          header: JSON.stringify(header || {}),
          hero: JSON.stringify(hero || {}),
          marquee: JSON.stringify(marquee || {}),
          about: JSON.stringify(about || {}),
          products: JSON.stringify(products || {}),
          experience: JSON.stringify(experience || {}),
          contact: JSON.stringify(contact || {}),
          footer: JSON.stringify(footer || {}),
        },
      });
    }

    // Parsear JSONs para resposta
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
      message: 'Configuração atualizada com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao atualizar configuração da landing page:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao atualizar configuração',
    });
  }
});

// ============================================================================
// FASE 5: ENDPOINTS DE HISTÓRICO
// ============================================================================

/**
 * POST /api/landing-page/config/history
 * Salvar versão no histórico (chamado pelo frontend após cada save)
 */
router.post('/config/history', authenticate, async (req: any, res: Response) => {
  try {
    const { config, changeType = 'manual_save' } = req.body;
    const userId = req.user?.id; // Do middleware authenticate

    if (!config) {
      return res.status(400).json({
        success: false,
        message: 'Configuração não fornecida',
      });
    }

    logChange('📜 Salvando no histórico', {
      changeType,
      userId,
      hasHeader: !!config.header,
      hasHero: !!config.hero,
    });

    // Buscar config principal para associar
    const mainConfig = await prisma.landingPageConfig.findFirst();

    const historyEntry = await prisma.landingPageConfigHistory.create({
      data: {
        configId: mainConfig?.id || null,
        header: JSON.stringify(config.header),
        hero: JSON.stringify(config.hero),
        marquee: JSON.stringify(config.marquee),
        about: JSON.stringify(config.about),
        products: JSON.stringify(config.products),
        experience: JSON.stringify(config.experience),
        contact: JSON.stringify(config.contact),
        footer: JSON.stringify(config.footer),
        changeType,
        changedByUserId: userId,
      },
    });

    logChange('✅ Histórico salvo', {
      historyId: historyEntry.id,
      changeType,
    });

    res.json({
      success: true,
      data: {
        id: historyEntry.id,
        createdAt: historyEntry.createdAt,
      },
      message: 'Versão salva no histórico',
    });
  } catch (error: any) {
    logChange('❌ Erro ao salvar histórico', {
      error: error.message,
    });

    console.error('Erro ao salvar histórico:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao salvar histórico',
    });
  }
});

/**
 * GET /api/landing-page/config/history
 * Listar histórico de alterações (paginado)
 */
router.get('/config/history', authenticate, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const changeType = req.query.changeType as string | undefined;

    const skip = (page - 1) * limit;

    const where: any = {};
    if (changeType) {
      where.changeType = changeType;
    }

    logChange('📖 Buscando histórico', {
      page,
      limit,
      changeType: changeType || 'all',
    });

    const [history, total] = await Promise.all([
      prisma.landingPageConfigHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          changeType: true,
          createdAt: true,
          changedByUserId: true,
          changedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.landingPageConfigHistory.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        history,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    logChange('❌ Erro ao buscar histórico', { error: error.message });

    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao buscar histórico',
    });
  }
});

/**
 * GET /api/landing-page/config/history/:id
 * Buscar versão específica do histórico
 */
router.get('/config/history/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    logChange('🔍 Buscando versão do histórico', { id });

    const historyEntry = await prisma.landingPageConfigHistory.findUnique({
      where: { id },
      include: {
        changedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!historyEntry) {
      return res.status(404).json({
        success: false,
        message: 'Versão não encontrada no histórico',
      });
    }

    // Parsear JSONs
    const parsedConfig = {
      id: historyEntry.id,
      header: JSON.parse(historyEntry.header),
      hero: JSON.parse(historyEntry.hero),
      marquee: JSON.parse(historyEntry.marquee),
      about: JSON.parse(historyEntry.about),
      products: JSON.parse(historyEntry.products),
      experience: JSON.parse(historyEntry.experience),
      contact: JSON.parse(historyEntry.contact),
      footer: JSON.parse(historyEntry.footer),
      changeType: historyEntry.changeType,
      createdAt: historyEntry.createdAt,
      changedBy: historyEntry.changedByUser,
    };

    res.json({
      success: true,
      data: parsedConfig,
    });
  } catch (error: any) {
    logChange('❌ Erro ao buscar versão', {
      id: req.params.id,
      error: error.message,
    });

    console.error('Erro ao buscar versão:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao buscar versão',
    });
  }
});

/**
 * POST /api/landing-page/config/restore/:id
 * Restaurar versão específica do histórico
 */
router.post('/config/restore/:id', authenticate, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    logChange('↩️ Restaurando versão do histórico', { id, userId });

    const historyEntry = await prisma.landingPageConfigHistory.findUnique({
      where: { id },
    });

    if (!historyEntry) {
      return res.status(404).json({
        success: false,
        message: 'Versão não encontrada no histórico',
      });
    }

    // Buscar config existente
    const existingConfig = await prisma.landingPageConfig.findFirst();

    let restoredConfig;

    if (existingConfig) {
      // Atualizar config existente
      restoredConfig = await prisma.landingPageConfig.update({
        where: { id: existingConfig.id },
        data: {
          header: historyEntry.header,
          hero: historyEntry.hero,
          marquee: historyEntry.marquee,
          about: historyEntry.about,
          products: historyEntry.products,
          experience: historyEntry.experience,
          contact: historyEntry.contact,
          footer: historyEntry.footer,
        },
      });
    } else {
      // Criar nova config
      restoredConfig = await prisma.landingPageConfig.create({
        data: {
          header: historyEntry.header,
          hero: historyEntry.hero,
          marquee: historyEntry.marquee,
          about: historyEntry.about,
          products: historyEntry.products,
          experience: historyEntry.experience,
          contact: historyEntry.contact,
          footer: historyEntry.footer,
        },
      });
    }

    // Salvar nova entrada no histórico (tipo 'restore')
    await prisma.landingPageConfigHistory.create({
      data: {
        configId: restoredConfig.id,
        header: historyEntry.header,
        hero: historyEntry.hero,
        marquee: historyEntry.marquee,
        about: historyEntry.about,
        products: historyEntry.products,
        experience: historyEntry.experience,
        contact: historyEntry.contact,
        footer: historyEntry.footer,
        changeType: 'restore',
        changedByUserId: userId,
      },
    });

    logChange('✅ Versão restaurada com sucesso', {
      historyId: id,
      configId: restoredConfig.id,
    });

    // Parsear JSONs para resposta
    const parsedConfig = {
      id: restoredConfig.id,
      header: JSON.parse(restoredConfig.header),
      hero: JSON.parse(restoredConfig.hero),
      marquee: JSON.parse(restoredConfig.marquee),
      about: JSON.parse(restoredConfig.about),
      products: JSON.parse(restoredConfig.products),
      experience: JSON.parse(restoredConfig.experience),
      contact: JSON.parse(restoredConfig.contact),
      footer: JSON.parse(restoredConfig.footer),
      updatedAt: restoredConfig.updatedAt,
    };

    res.json({
      success: true,
      data: parsedConfig,
      message: 'Configuração restaurada com sucesso',
    });
  } catch (error: any) {
    logChange('❌ Erro ao restaurar versão', {
      id: req.params.id,
      error: error.message,
    });

    console.error('Erro ao restaurar versão:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao restaurar versão',
    });
  }
});

/**
 * DELETE /api/landing-page/config/history/:id
 * Deletar entrada do histórico (soft delete ou hard delete)
 */
router.delete('/config/history/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    logChange('🗑️ Deletando entrada do histórico', { id });

    await prisma.landingPageConfigHistory.delete({
      where: { id },
    });

    logChange('✅ Entrada do histórico deletada', { id });

    res.json({
      success: true,
      message: 'Entrada do histórico deletada com sucesso',
    });
  } catch (error: any) {
    logChange('❌ Erro ao deletar entrada do histórico', {
      id: req.params.id,
      error: error.message,
    });

    console.error('Erro ao deletar entrada do histórico:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao deletar entrada do histórico',
    });
  }
});

export default router;
