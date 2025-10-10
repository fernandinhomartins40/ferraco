import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { config } from 'dotenv';
import { CORS_CONFIG, RATE_LIMIT_CONFIG, APP_CONFIG } from './config/constants';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import { logger } from './utils/logger';
import prisma from './config/database';

// Importar rotas
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import leadsRoutes from './modules/leads/leads.routes';
import notesRoutes from './modules/notes/notes.routes';
import tagsRoutes from './modules/tags/tags.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import automationsRoutes from './modules/automations/automations.routes';
import communicationsRoutes from './modules/communications/communications.routes';
import reportsRoutes from './modules/reports/reports.routes';
import pipelineRoutes from './modules/pipeline/pipeline.routes';
import scoringRoutes from './modules/scoring/scoring.routes';
import duplicatesRoutes from './modules/duplicates/duplicates.routes';
import integrationsRoutes from './modules/integrations/integrations.routes';
import chatbotRoutes from './modules/chatbot/chatbotRoutes';
import configRoutes from './modules/chatbot/configRoutes';

// Carregar variáveis de ambiente
config();

/**
 * Criar e configurar aplicação Express
 */
export function createApp(): Application {
  const app = express();

  // ==========================================
  // MIDDLEWARES GLOBAIS
  // ==========================================

  // Trust proxy - necessário quando atrás de Nginx/Load Balancer
  app.set('trust proxy', 1);

  // Segurança
  app.use(helmet());

  // CORS
  app.use(cors(CORS_CONFIG));

  // Body parser
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Cookie parser
  app.use(cookieParser());

  // Request logging
  if (APP_CONFIG.isDevelopment) {
    app.use(requestLogger);
  }

  // Rate limiting
  const limiter = rateLimit({
    windowMs: RATE_LIMIT_CONFIG.windowMs,
    max: RATE_LIMIT_CONFIG.max,
    message: RATE_LIMIT_CONFIG.message,
    standardHeaders: RATE_LIMIT_CONFIG.standardHeaders,
    legacyHeaders: RATE_LIMIT_CONFIG.legacyHeaders,
  });

  app.use('/api/', limiter);

  // ==========================================
  // HEALTH CHECK - COM VERIFICAÇÃO DO BANCO
  // ==========================================

  app.get('/api/health', async (_req, res) => {
    try {
      // Verificar conexão com banco de dados
      await prisma.$queryRaw`SELECT 1`;

      res.json({
        success: true,
        message: 'Ferraco CRM API is running',
        data: {
          service: APP_CONFIG.name,
          version: APP_CONFIG.version,
          environment: APP_CONFIG.env,
          timestamp: new Date().toISOString(),
          database: 'connected', // ✅ Banco OK
        },
      });
    } catch (error) {
      logger.error('Health check failed - database disconnected:', error);
      res.status(503).json({
        success: false,
        message: 'Service degraded - database unavailable',
        data: {
          service: APP_CONFIG.name,
          version: APP_CONFIG.version,
          environment: APP_CONFIG.env,
          timestamp: new Date().toISOString(),
          database: 'disconnected', // ❌ Banco offline
        },
      });
    }
  });

  app.get('/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;

      res.json({
        success: true,
        message: 'Ferraco CRM API is running',
        data: {
          service: APP_CONFIG.name,
          version: APP_CONFIG.version,
          environment: APP_CONFIG.env,
          timestamp: new Date().toISOString(),
          database: 'connected',
        },
      });
    } catch (error) {
      logger.error('Health check failed:', error);
      res.status(503).json({
        success: false,
        message: 'Service degraded',
        data: {
          service: APP_CONFIG.name,
          database: 'disconnected',
        },
      });
    }
  });

  // ==========================================
  // ROTAS
  // ==========================================

  app.get('/api', (_req, res) => {
    res.json({
      success: true,
      message: 'Ferraco CRM API',
      data: {
        version: APP_CONFIG.version,
        endpoints: {
          health: '/api/health',
          auth: '/api/auth',
          users: '/api/users',
          leads: '/api/leads',
          notes: '/api/notes',
          tags: '/api/tags',
          dashboard: '/api/dashboard',
          automations: '/api/automations',
          communications: '/api/communications',
          reports: '/api/reports',
          pipeline: '/api/pipeline',
          scoring: '/api/scoring',
          duplicates: '/api/duplicates',
          integrations: '/api/integrations',
          chatbot: '/api/chatbot',
        },
      },
    });
  });

  // Rotas de autenticação
  app.use('/api/auth', authRoutes);

  // Rotas de usuários
  app.use('/api/users', usersRoutes);

  // Rotas de leads
  app.use('/api/leads', leadsRoutes);

  // Rotas de notas
  app.use('/api/notes', notesRoutes);

  // Rotas de tags
  app.use('/api/tags', tagsRoutes);

  // Rotas de dashboard
  app.use('/api/dashboard', dashboardRoutes);

  // Rotas de automações
  app.use('/api/automations', automationsRoutes);

  // Rotas de comunicações
  app.use('/api/communications', communicationsRoutes);

  // Rotas de relatórios
  app.use('/api/reports', reportsRoutes);

  // Rotas de pipeline
  app.use('/api/pipeline', pipelineRoutes);

  // Rotas de scoring
  app.use('/api/scoring', scoringRoutes);

  // Rotas de duplicatas
  app.use('/api/duplicates', duplicatesRoutes);

  // Rotas de integrações
  app.use('/api/integrations', integrationsRoutes);

  // Rotas de chatbot
  app.use('/api/chatbot', chatbotRoutes);

  // Rotas de configuração do chatbot
  app.use('/api/config', configRoutes);

  // ==========================================
  // ERROR HANDLING
  // ==========================================

  // 404 - Rota não encontrada
  app.use(notFoundHandler);

  // Error handler global
  app.use(errorHandler);

  // ==========================================
  // LOGGING
  // ==========================================

  logger.info(`Application initialized in ${APP_CONFIG.env} mode`);

  return app;
}

export default createApp();
