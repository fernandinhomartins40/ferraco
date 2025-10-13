import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { CORS_OPTIONS, API_PREFIX } from './config/constants';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimit';
import { auditLogger } from './middleware/audit';
import { logger } from './utils/logger';

// Import routes
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import leadsRoutes from './modules/leads/leads.routes';
import partialLeadsRoutes from './modules/partial-leads/partial-leads.routes';
import notesRoutes from './modules/notes/notes.routes';
import tagsRoutes from './modules/tags/tags.routes';
import pipelineRoutes from './modules/pipeline/pipeline.routes';
import communicationsRoutes from './modules/communications/communications.routes';
import automationsRoutes from './modules/automations/automations.routes';
import reportsRoutes from './modules/reports/reports.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import integrationsRoutes from './modules/integrations/integrations.routes';
import aiRoutes from './modules/ai/ai.routes';
import chatbotRoutes from './modules/chatbot/chatbot.routes';
import kanbanColumnRoutes from './routes/kanbanColumn.routes';
import uploadRoutes from './routes/upload.routes';

export function createApp(): Application {
  const app = express();

  // Trust proxy (necessário quando atrás de Nginx)
  app.set('trust proxy', true);

  // Security middlewares
  app.use(helmet());
  app.use(cors(CORS_OPTIONS));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Servir arquivos estáticos (uploads)
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  // Rate limiting
  app.use(apiLimiter);

  // Audit logging
  app.use(auditLogger);

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // API routes
  app.use(`${API_PREFIX}/auth`, authRoutes);
  app.use(`${API_PREFIX}/users`, usersRoutes);
  app.use(`${API_PREFIX}/leads`, leadsRoutes);
  app.use(`${API_PREFIX}/partial-leads`, partialLeadsRoutes);
  app.use(`${API_PREFIX}/notes`, notesRoutes);
  app.use(`${API_PREFIX}/tags`, tagsRoutes);
  app.use(`${API_PREFIX}/pipelines`, pipelineRoutes);
  app.use(`${API_PREFIX}/communications`, communicationsRoutes);
  app.use(`${API_PREFIX}/automations`, automationsRoutes);
  app.use(`${API_PREFIX}/reports`, reportsRoutes);
  app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
  app.use(`${API_PREFIX}/integrations`, integrationsRoutes);
  app.use(`${API_PREFIX}/ai`, aiRoutes);
  app.use(`${API_PREFIX}/chatbot`, chatbotRoutes);
  app.use(`${API_PREFIX}/kanban-columns`, kanbanColumnRoutes);
  app.use(`${API_PREFIX}/upload`, uploadRoutes);

  logger.info('✅ All routes registered successfully');

  // 404 handler
  app.use(notFoundHandler);

  // Error handler (must be last)
  app.use(errorHandler);

  logger.info('✅ Application configured successfully');

  return app;
}
