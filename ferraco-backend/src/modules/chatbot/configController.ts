import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../../middleware/errorHandler';

const prisma = new PrismaClient();

export class ConfigController {
  // ============================================
  // COMPANY DATA
  // ============================================

  async getCompanyData(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const company = await prisma.companyData.findFirst();
      res.json({
        success: true,
        data: company
      });
    } catch (error) {
      next(new AppError(500, 'Erro ao buscar dados da empresa'));
    }
  }

  async saveCompanyData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body;

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
            targetAudience: data.targetAudience,
            location: data.location,
            workingHours: data.workingHours,
            phone: data.phone,
            website: data.website
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
            targetAudience: data.targetAudience,
            location: data.location,
            workingHours: data.workingHours,
            phone: data.phone,
            website: data.website
          }
        });
      }

      res.json({
        success: true,
        message: 'Dados da empresa salvos com sucesso',
        data: company
      });
    } catch (error) {
      console.error('Erro ao salvar dados da empresa:', error);
      next(new AppError(500, 'Erro ao salvar dados da empresa'));
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

      // Parse keywords JSON
      const parsedProducts = products.map(p => ({
        ...p,
        keywords: JSON.parse(p.keywords || '[]')
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
      const { name, description, category, price, keywords, isActive } = req.body;

      const product = await prisma.product.create({
        data: {
          name,
          description,
          category,
          price: price || null,
          keywords: JSON.stringify(keywords || []),
          isActive: isActive !== false
        }
      });

      res.json({
        success: true,
        message: 'Produto criado com sucesso',
        data: {
          ...product,
          keywords: JSON.parse(product.keywords)
        }
      });
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      next(new AppError(500, 'Erro ao criar produto'));
    }
  }

  async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, category, price, keywords, isActive } = req.body;

      const product = await prisma.product.update({
        where: { id },
        data: {
          name,
          description,
          category,
          price,
          keywords: JSON.stringify(keywords || []),
          isActive
        }
      });

      res.json({
        success: true,
        message: 'Produto atualizado com sucesso',
        data: {
          ...product,
          keywords: JSON.parse(product.keywords)
        }
      });
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
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
      console.error('Erro ao deletar produto:', error);
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
      console.error('Erro ao criar FAQ:', error);
      next(new AppError(500, 'Erro ao criar FAQ'));
    }
  }

  async updateFAQ(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { question, answer, category, keywords } = req.body;

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
      console.error('Erro ao atualizar FAQ:', error);
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
      console.error('Erro ao deletar FAQ:', error);
      next(new AppError(500, 'Erro ao deletar FAQ'));
    }
  }

  // ============================================
  // CHATBOT CONFIG
  // ============================================

  async getChatbotConfig(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = await prisma.chatbotConfig.findFirst();
      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      next(new AppError(500, 'Erro ao buscar configuração do chatbot'));
    }
  }

  async saveChatbotConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body;

      const existing = await prisma.chatbotConfig.findFirst();

      let config;
      if (existing) {
        config = await prisma.chatbotConfig.update({
          where: { id: existing.id },
          data: {
            welcomeMessage: data.welcomeMessage || data.greetingMessage,
            fallbackMessage: data.fallbackMessage,
            isEnabled: data.isEnabled !== false,
            handoffTriggers: data.handoffTriggers ? JSON.stringify(data.handoffTriggers) : '[]'
          }
        });
      } else {
        config = await prisma.chatbotConfig.create({
          data: {
            welcomeMessage: data.welcomeMessage || data.greetingMessage || 'Olá! 👋 Como posso ajudar você hoje?',
            fallbackMessage: data.fallbackMessage || 'Desculpe, não entendi. Pode reformular?',
            isEnabled: data.isEnabled !== false,
            handoffTriggers: data.handoffTriggers ? JSON.stringify(data.handoffTriggers) : '[]'
          }
        });
      }

      res.json({
        success: true,
        message: 'Configuração salva com sucesso',
        data: config
      });
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
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
      console.error('Erro ao criar link:', error);
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
      console.error('Erro ao deletar link:', error);
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

      const parsedProducts = products.map(p => ({
        ...p,
        keywords: JSON.parse(p.keywords || '[]')
      }));

      const parsedFAQs = faqs.map(f => ({
        ...f,
        keywords: JSON.parse(f.keywords || '[]')
      }));

      res.json({
        success: true,
        data: {
          config: config || {},
          company: parsedCompany || {},
          products: parsedProducts || [],
          faqs: parsedFAQs || []
        }
      });
    } catch (error) {
      console.error('Erro ao buscar dados do chatbot:', error);
      next(new AppError(500, 'Erro ao buscar dados do chatbot'));
    }
  }
}
