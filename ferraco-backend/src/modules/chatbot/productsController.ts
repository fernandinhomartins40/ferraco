import { Request, Response } from 'express';
import prisma from '../../config/database';
import { z } from 'zod';
import { logger } from '../../utils/logger';

// Schemas de validação
const ProductSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  category: z.string().min(2, 'Categoria é obrigatória'),
  price: z.string().optional().nullable(),
  keywords: z.array(z.string()).min(1, 'Adicione pelo menos uma palavra-chave'),
});

const FAQSchema = z.object({
  question: z.string().min(5, 'Pergunta deve ter pelo menos 5 caracteres'),
  answer: z.string().min(10, 'Resposta deve ter pelo menos 10 caracteres'),
  category: z.string().min(2, 'Categoria é obrigatória'),
  keywords: z.array(z.string()).min(1, 'Adicione pelo menos uma palavra-chave'),
});

const CompanyDataSchema = z.object({
  name: z.string().min(3),
  industry: z.string().min(3),
  description: z.string().min(20),
  differentials: z.array(z.string()),
  targetAudience: z.string().min(5),
  location: z.string().min(5),
  workingHours: z.string().min(5),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
});

export class ProductsController {
  /**
   * GET /api/chatbot/products
   * Lista todos os produtos
   */
  async listProducts(_req: Request, res: Response) {
    try {
      const products = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' }
      });

      const formattedProducts = products.map(p => ({
        ...p,
        keywords: JSON.parse(p.keywords)
      }));

      return res.json({ products: formattedProducts });
    } catch (error: any) {
      logger.error('Erro ao listar produtos:', error);
      return res.status(500).json({ error: 'Erro ao listar produtos' });
    }
  }

  /**
   * POST /api/chatbot/products
   * Cria novo produto
   */
  async createProduct(req: Request, res: Response) {
    try {
      const data = ProductSchema.parse(req.body);

      const product = await prisma.product.create({
        data: {
          name: data.name,
          description: data.description,
          category: data.category,
          price: data.price || null,
          keywords: JSON.stringify(data.keywords),
          isActive: true
        }
      });

      logger.info(`✅ Produto criado: ${product.name}`);

      return res.json({
        product: {
          ...product,
          keywords: JSON.parse(product.keywords)
        }
      });
    } catch (error: any) {
      logger.error('Erro ao criar produto:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: error.errors
        });
      }

      return res.status(500).json({ error: 'Erro ao criar produto' });
    }
  }

  /**
   * PUT /api/chatbot/products/:id
   * Atualiza produto
   */
  async updateProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = ProductSchema.parse(req.body);

      const product = await prisma.product.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          category: data.category,
          price: data.price || null,
          keywords: JSON.stringify(data.keywords),
        }
      });

      logger.info(`✏️  Produto atualizado: ${product.name}`);

      return res.json({
        product: {
          ...product,
          keywords: JSON.parse(product.keywords)
        }
      });
    } catch (error: any) {
      logger.error('Erro ao atualizar produto:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: error.errors
        });
      }

      return res.status(500).json({ error: 'Erro ao atualizar produto' });
    }
  }

  /**
   * DELETE /api/chatbot/products/:id
   * Remove produto
   */
  async deleteProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.product.delete({
        where: { id }
      });

      logger.info(`🗑️  Produto removido: ${id}`);

      return res.json({ success: true });
    } catch (error: any) {
      logger.error('Erro ao remover produto:', error);
      return res.status(500).json({ error: 'Erro ao remover produto' });
    }
  }

  /**
   * PATCH /api/chatbot/products/:id/toggle
   * Ativa/desativa produto
   */
  async toggleProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      const updated = await prisma.product.update({
        where: { id },
        data: { isActive: !product.isActive }
      });

      logger.info(`🔄 Produto ${updated.isActive ? 'ativado' : 'desativado'}: ${updated.name}`);

      return res.json({
        product: {
          ...updated,
          keywords: JSON.parse(updated.keywords)
        }
      });
    } catch (error: any) {
      logger.error('Erro ao alternar produto:', error);
      return res.status(500).json({ error: 'Erro ao alternar produto' });
    }
  }

  // ==========================================
  // FAQs
  // ==========================================

  /**
   * GET /api/chatbot/faqs
   * Lista todas as FAQs
   */
  async listFAQs(_req: Request, res: Response) {
    try {
      const faqs = await prisma.fAQItem.findMany({
        orderBy: { createdAt: 'desc' }
      });

      const formattedFAQs = faqs.map(f => ({
        ...f,
        keywords: JSON.parse(f.keywords)
      }));

      return res.json({ faqs: formattedFAQs });
    } catch (error: any) {
      logger.error('Erro ao listar FAQs:', error);
      return res.status(500).json({ error: 'Erro ao listar FAQs' });
    }
  }

  /**
   * POST /api/chatbot/faqs
   * Cria nova FAQ
   */
  async createFAQ(req: Request, res: Response) {
    try {
      const data = FAQSchema.parse(req.body);

      const faq = await prisma.fAQItem.create({
        data: {
          question: data.question,
          answer: data.answer,
          category: data.category,
          keywords: JSON.stringify(data.keywords),
        }
      });

      logger.info(`✅ FAQ criada: ${faq.question}`);

      return res.json({
        faq: {
          ...faq,
          keywords: JSON.parse(faq.keywords)
        }
      });
    } catch (error: any) {
      logger.error('Erro ao criar FAQ:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: error.errors
        });
      }

      return res.status(500).json({ error: 'Erro ao criar FAQ' });
    }
  }

  /**
   * PUT /api/chatbot/faqs/:id
   * Atualiza FAQ
   */
  async updateFAQ(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = FAQSchema.parse(req.body);

      const faq = await prisma.fAQItem.update({
        where: { id },
        data: {
          question: data.question,
          answer: data.answer,
          category: data.category,
          keywords: JSON.stringify(data.keywords),
        }
      });

      logger.info(`✏️  FAQ atualizada: ${faq.question}`);

      return res.json({
        faq: {
          ...faq,
          keywords: JSON.parse(faq.keywords)
        }
      });
    } catch (error: any) {
      logger.error('Erro ao atualizar FAQ:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: error.errors
        });
      }

      return res.status(500).json({ error: 'Erro ao atualizar FAQ' });
    }
  }

  /**
   * DELETE /api/chatbot/faqs/:id
   * Remove FAQ
   */
  async deleteFAQ(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.fAQItem.delete({
        where: { id }
      });

      logger.info(`🗑️  FAQ removida: ${id}`);

      return res.json({ success: true });
    } catch (error: any) {
      logger.error('Erro ao remover FAQ:', error);
      return res.status(500).json({ error: 'Erro ao remover FAQ' });
    }
  }

  // ==========================================
  // Company Data
  // ==========================================

  /**
   * GET /api/chatbot/company
   * Busca dados da empresa
   */
  async getCompany(_req: Request, res: Response) {
    try {
      const company = await prisma.companyData.findFirst();

      if (!company) {
        return res.json({ company: null });
      }

      return res.json({
        company: {
          ...company,
          differentials: JSON.parse(company.differentials)
        }
      });
    } catch (error: any) {
      logger.error('Erro ao buscar empresa:', error);
      return res.status(500).json({ error: 'Erro ao buscar dados da empresa' });
    }
  }

  /**
   * POST /api/chatbot/company
   * Cria/atualiza dados da empresa
   */
  async saveCompany(req: Request, res: Response) {
    try {
      const data = CompanyDataSchema.parse(req.body);

      // Verificar se já existe
      const existing = await prisma.companyData.findFirst();

      let company;
      if (existing) {
        company = await prisma.companyData.update({
          where: { id: existing.id },
          data: {
            name: data.name,
            industry: data.industry,
            description: data.description,
            differentials: JSON.stringify(data.differentials),
            targetAudience: data.targetAudience,
            location: data.location,
            workingHours: data.workingHours,
            phone: data.phone,
            website: data.website,
          }
        });
        logger.info(`✏️  Dados da empresa atualizados`);
      } else {
        company = await prisma.companyData.create({
          data: {
            name: data.name,
            industry: data.industry,
            description: data.description,
            differentials: JSON.stringify(data.differentials),
            targetAudience: data.targetAudience,
            location: data.location,
            workingHours: data.workingHours,
            phone: data.phone,
            website: data.website,
          }
        });
        logger.info(`✅ Dados da empresa criados`);
      }

      return res.json({
        company: {
          ...company,
          differentials: JSON.parse(company.differentials)
        }
      });
    } catch (error: any) {
      logger.error('Erro ao salvar empresa:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: error.errors
        });
      }

      return res.status(500).json({ error: 'Erro ao salvar dados da empresa' });
    }
  }
}

export default new ProductsController();
