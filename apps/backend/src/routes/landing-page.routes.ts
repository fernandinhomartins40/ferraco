/**
 * Landing Page Routes - Rotas para configuração da landing page
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { getDefaultLandingPageConfig } from '../config/defaultLandingPageConfig';

const router = Router();

/**
 * GET /api/landing-page/config
 * Buscar configuração da landing page (pública - sem auth)
 */
router.get('/config', async (req: Request, res: Response) => {
  try {
    // Buscar a primeira (e única) configuração de landing page
    let config = await prisma.landingPageConfig.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    // Se não existe configuração, criar uma com valores padrão
    if (!config) {
      console.log('⚠️ Nenhuma configuração encontrada, criando configuração padrão...');

      // Importar configuração padrão do frontend
      const defaultConfig = getDefaultLandingPageConfig();

      config = await prisma.landingPageConfig.create({
        data: {
          header: JSON.stringify(defaultConfig.header),
          hero: JSON.stringify(defaultConfig.hero),
          marquee: JSON.stringify(defaultConfig.marquee),
          about: JSON.stringify(defaultConfig.about),
          products: JSON.stringify(defaultConfig.products),
          experience: JSON.stringify(defaultConfig.experience),
          contact: JSON.stringify(defaultConfig.contact),
          footer: JSON.stringify(defaultConfig.footer),
        },
      });

      console.log('✅ Configuração padrão criada com sucesso');
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

export default router;
