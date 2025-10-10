import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';

export class ConfigController {
  // ============================================
  // COMPANY DATA
  // ============================================

  async getCompanyData(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const company = await prisma.companyData.findFirst();

      if (!company) {
        res.json({
          success: true,
          data: null
        });
        return;
      }

      // Parse differentials JSON
      const parsedCompany = {
        ...company,
        differentials: JSON.parse(company.differentials || '[]')
      };

      res.json({
        success: true,
        data: parsedCompany
      });
    } catch (error) {
      next(new AppError(500, 'Erro ao buscar dados da empresa'));
    }
  }

  async saveCompanyData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body;

      // Validações básicas
      if (!data.name || !data.industry || !data.description) {
        throw new AppError(400, 'Campos obrigatórios: name, industry, description');
      }

      // Validar differentials se fornecido
      if (data.differentials && !Array.isArray(data.differentials)) {
        throw new AppError(400, 'differentials deve ser um array');
      }

      // Verificar se já existe
      const existing = await prisma.companyData.findFirst();

      let company;
      if (existing) {
        // Update
        company = await prisma.companyData.update({
          where: { id: existing.id },
          data: {
            name: data.name,
            industry: data.industry,
            description: data.description,
            differentials: JSON.stringify(data.differentials || []),
            targetAudience: data.targetAudience || '',
            location: data.location || '',
            workingHours: data.workingHours || '',
            phone: data.phone || null,
            website: data.website || null
          }
        });
      } else {
        // Create
        company = await prisma.companyData.create({
          data: {
            name: data.name,
            industry: data.industry,
            description: data.description,
            differentials: JSON.stringify(data.differentials || []),
            targetAudience: data.targetAudience || '',
            location: data.location || '',
            workingHours: data.workingHours || '',
            phone: data.phone || null,
            website: data.website || null
          }
        });
      }

      // Parse differentials para retornar no formato correto
      const parsedCompany = {
        ...company,
        differentials: JSON.parse(company.differentials || '[]')
      };

      res.json({
        success: true,
        message: 'Dados da empresa salvos com sucesso',
        data: parsedCompany
      });
    } catch (error: any) {
      logger.error('Erro ao salvar dados da empresa:', error);
      // Retornar erro mais detalhado
      const errorMessage = error.message || 'Erro ao salvar dados da empresa';
      next(new AppError(500, errorMessage));
    }
  }

  // ============================================
  // PRODUCTS
  // ============================================

  async getProducts(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const products = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' }
      });

      // Parse keywords and benefits JSON
      const parsedProducts = products.map(p => ({
        ...p,
        keywords: JSON.parse(p.keywords || '[]'),
        benefits: p.benefits ? JSON.parse(p.benefits) : []
      }));

      res.json({
        success: true,
        data: parsedProducts
      });
    } catch (error) {
      next(new AppError(500, 'Erro ao buscar produtos'));
    }
  }

  async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, description, category, price, keywords, benefits, isActive } = req.body;

      // Validar keywords e benefits
      if (keywords && !Array.isArray(keywords)) {
        throw new AppError(400, 'keywords deve ser um array');
      }
      if (benefits && !Array.isArray(benefits)) {
        throw new AppError(400, 'benefits deve ser um array');
      }

      const product = await prisma.product.create({
        data: {
          name,
          description,
          category,
          price: price || null,
          keywords: JSON.stringify(keywords || []),
          benefits: benefits ? JSON.stringify(benefits) : null,
          isActive: isActive !== false
        }
      });

      res.json({
        success: true,
        message: 'Produto criado com sucesso',
        data: {
          ...product,
          keywords: JSON.parse(product.keywords),
          benefits: product.benefits ? JSON.parse(product.benefits) : []
        }
      });
    } catch (error) {
      logger.error('Erro ao criar produto:', error);
      next(new AppError(500, 'Erro ao criar produto'));
    }
  }

  async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, category, price, keywords, benefits, isActive } = req.body;

      // Validar keywords e benefits
      if (keywords && !Array.isArray(keywords)) {
        throw new AppError(400, 'keywords deve ser um array');
      }
      if (benefits && !Array.isArray(benefits)) {
        throw new AppError(400, 'benefits deve ser um array');
      }

      const product = await prisma.product.update({
        where: { id },
        data: {
          name,
          description,
          category,
          price,
          keywords: JSON.stringify(keywords || []),
          benefits: benefits ? JSON.stringify(benefits) : null,
          isActive
        }
      });

      res.json({
        success: true,
        message: 'Produto atualizado com sucesso',
        data: {
          ...product,
          keywords: JSON.parse(product.keywords),
          benefits: product.benefits ? JSON.parse(product.benefits) : []
        }
      });
    } catch (error) {
      logger.error('Erro ao atualizar produto:', error);
      next(new AppError(500, 'Erro ao atualizar produto'));
    }
  }

  async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      await prisma.product.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Produto deletado com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao deletar produto:', error);
      next(new AppError(500, 'Erro ao deletar produto'));
    }
  }

  // ============================================
  // FAQs
  // ============================================

  async getFAQs(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const faqs = await prisma.fAQItem.findMany({
        orderBy: { createdAt: 'desc' }
      });

      // Parse keywords JSON
      const parsedFAQs = faqs.map(f => ({
        ...f,
        keywords: JSON.parse(f.keywords || '[]')
      }));

      res.json({
        success: true,
        data: parsedFAQs
      });
    } catch (error) {
      next(new AppError(500, 'Erro ao buscar FAQs'));
    }
  }

  async createFAQ(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { question, answer, category, keywords } = req.body;

      // Validar keywords
      if (keywords && !Array.isArray(keywords)) {
        throw new AppError(400, 'keywords deve ser um array');
      }

      const faq = await prisma.fAQItem.create({
        data: {
          question,
          answer,
          category: category || 'Geral',
          keywords: JSON.stringify(keywords || [])
        }
      });

      res.json({
        success: true,
        message: 'FAQ criado com sucesso',
        data: {
          ...faq,
          keywords: JSON.parse(faq.keywords)
        }
      });
    } catch (error) {
      logger.error('Erro ao criar FAQ:', error);
      next(new AppError(500, 'Erro ao criar FAQ'));
    }
  }

  async updateFAQ(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { question, answer, category, keywords } = req.body;

      // Validar keywords
      if (keywords && !Array.isArray(keywords)) {
        throw new AppError(400, 'keywords deve ser um array');
      }

      const faq = await prisma.fAQItem.update({
        where: { id },
        data: {
          question,
          answer,
          category,
          keywords: JSON.stringify(keywords || [])
        }
      });

      res.json({
        success: true,
        message: 'FAQ atualizado com sucesso',
        data: {
          ...faq,
          keywords: JSON.parse(faq.keywords)
        }
      });
    } catch (error) {
      logger.error('Erro ao atualizar FAQ:', error);
      next(new AppError(500, 'Erro ao atualizar FAQ'));
    }
  }

  async deleteFAQ(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      await prisma.fAQItem.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'FAQ deletado com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao deletar FAQ:', error);
      next(new AppError(500, 'Erro ao deletar FAQ'));
    }
  }

  // ============================================
  // CHATBOT CONFIG
  // ============================================

  async getChatbotConfig(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = await prisma.chatbotConfig.findFirst();

      if (!config) {
        res.json({
          success: true,
          data: null
        });
        return;
      }

      // Parse handoffTriggers JSON
      const parsedConfig = {
        ...config,
        handoffTriggers: JSON.parse(config.handoffTriggers || '[]')
      };

      res.json({
        success: true,
        data: parsedConfig
      });
    } catch (error) {
      next(new AppError(500, 'Erro ao buscar configuração do chatbot'));
    }
  }

  async saveChatbotConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body;

      // Validar handoffTriggers se fornecido
      if (data.handoffTriggers && !Array.isArray(data.handoffTriggers)) {
        throw new AppError(400, 'handoffTriggers deve ser um array');
      }

      const existing = await prisma.chatbotConfig.findFirst();

      let config;
      if (existing) {
        config = await prisma.chatbotConfig.update({
          where: { id: existing.id },
          data: {
            welcomeMessage: data.welcomeMessage || 'Olá! 👋 Como posso ajudar você hoje?',
            fallbackMessage: data.fallbackMessage || 'Desculpe, não entendi. Pode reformular?',
            isEnabled: data.isEnabled !== false,
            handoffTriggers: data.handoffTriggers ? JSON.stringify(data.handoffTriggers) : '[]'
          }
        });
      } else {
        config = await prisma.chatbotConfig.create({
          data: {
            welcomeMessage: data.welcomeMessage || 'Olá! 👋 Como posso ajudar você hoje?',
            fallbackMessage: data.fallbackMessage || 'Desculpe, não entendi. Pode reformular?',
            isEnabled: data.isEnabled !== false,
            handoffTriggers: data.handoffTriggers ? JSON.stringify(data.handoffTriggers) : '[]'
          }
        });
      }

      // Parse handoffTriggers para retornar como array
      const parsedConfig = {
        ...config,
        handoffTriggers: JSON.parse(config.handoffTriggers || '[]')
      };

      res.json({
        success: true,
        message: 'Configuração salva com sucesso',
        data: parsedConfig
      });
    } catch (error) {
      logger.error('Erro ao salvar configuração:', error);
      next(new AppError(500, 'Erro ao salvar configuração do chatbot'));
    }
  }

  // ============================================
  // CHAT LINKS
  // ============================================

  async getChatLinks(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const links = await prisma.chatLink.findMany({
        orderBy: { createdAt: 'desc' }
      });

      res.json({
        success: true,
        data: links
      });
    } catch (error) {
      next(new AppError(500, 'Erro ao buscar links de chat'));
    }
  }

  async createChatLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, source, url, shortCode, isActive } = req.body;

      const link = await prisma.chatLink.create({
        data: {
          name,
          source,
          url,
          shortCode,
          isActive: isActive !== false,
          clicks: 0,
          leads: 0
        }
      });

      res.json({
        success: true,
        message: 'Link criado com sucesso',
        data: link
      });
    } catch (error) {
      logger.error('Erro ao criar link:', error);
      next(new AppError(500, 'Erro ao criar link de chat'));
    }
  }

  async deleteChatLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      await prisma.chatLink.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Link deletado com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao deletar link:', error);
      next(new AppError(500, 'Erro ao deletar link'));
    }
  }

  // ============================================
  // CHATBOT DATA (Endpoint único para o chat público)
  // ============================================

  async getChatbotData(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [config, company, products, faqs] = await Promise.all([
        prisma.chatbotConfig.findFirst(),
        prisma.companyData.findFirst(),
        prisma.product.findMany({ where: { isActive: true } }),
        prisma.fAQItem.findMany()
      ]);

      // Parse JSON fields
      const parsedCompany = company ? {
        ...company,
        differentials: JSON.parse(company.differentials || '[]')
      } : null;

      const parsedConfig = config ? {
        ...config,
        handoffTriggers: JSON.parse(config.handoffTriggers || '[]')
      } : null;

      const parsedProducts = products.map(p => ({
        ...p,
        keywords: JSON.parse(p.keywords || '[]'),
        benefits: p.benefits ? JSON.parse(p.benefits) : []
      }));

      const parsedFAQs = faqs.map(f => ({
        ...f,
        keywords: JSON.parse(f.keywords || '[]')
      }));

      res.json({
        success: true,
        data: {
          config: parsedConfig || {},
          company: parsedCompany || {},
          products: parsedProducts || [],
          faqs: parsedFAQs || []
        }
      });
    } catch (error) {
      logger.error('Erro ao buscar dados do chatbot:', error);
      next(new AppError(500, 'Erro ao buscar dados do chatbot'));
    }
  }
}
