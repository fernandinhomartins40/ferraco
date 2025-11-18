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
import publicLeadsRoutes from './modules/leads/public-leads.routes';
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
import landingPageRoutes from './routes/landing-page.routes';
import whatsappRoutes from './routes/whatsapp.routes';
import whatsappExtendedRoutes from './routes/whatsappExtended.routes';
import automationKanbanRoutes from './routes/automationKanban.routes';
import whatsappMessageTemplateRoutes from './routes/whatsappMessageTemplate.routes';
import whatsappAutomationRoutes from './modules/whatsapp-automation/whatsapp-automation.routes';
import recurrenceRoutes from './modules/recurrence/recurrence.routes';
import { tokenCleanupService } from './services/token-cleanup.service';

// Import External API routes
import { apiKeyRoutes } from './modules/api-keys';
import { externalRoutes } from './modules/external';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

export function createApp(): Application {
  const app = express();

  // Trust proxy (necessário quando atrás de Nginx)
  app.set('trust proxy', true);

  // Security middlewares
  app.use(helmet());
  app.use(cors(CORS_OPTIONS));

  // Body parsing (aumentado para 50MB para suportar uploads de imagens)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Servir arquivos estáticos (uploads)
  const uploadsPath = process.env.NODE_ENV === 'production'
    ? '/app/uploads'
    : path.join(__dirname, '../uploads');
  app.use('/uploads', express.static(uploadsPath));

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
  app.use(`${API_PREFIX}/public/leads`, publicLeadsRoutes); // Public endpoint for landing page
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
  app.use(`${API_PREFIX}/landing-page`, landingPageRoutes);
  app.use(`${API_PREFIX}/whatsapp`, whatsappRoutes);
  app.use(`${API_PREFIX}/whatsapp/extended`, whatsappExtendedRoutes);
  app.use(`${API_PREFIX}/automation-kanban`, automationKanbanRoutes);
  app.use(`${API_PREFIX}/whatsapp-templates`, whatsappMessageTemplateRoutes);
  app.use(`${API_PREFIX}/whatsapp-automations`, whatsappAutomationRoutes);
  app.use(`${API_PREFIX}/recurrence`, recurrenceRoutes);

  // External API routes (v1)
  app.use(`${API_PREFIX}/api-keys`, apiKeyRoutes);
  app.use(`${API_PREFIX}/v1/external`, externalRoutes);

  // API Documentation (Swagger)
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Ferraco CRM API Documentation',
  }));
  app.get('/api/openapi.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  logger.info('✅ All routes registered successfully');
  logger.info('📚 API Documentation available at /api-docs');

  // Iniciar limpeza automática de tokens
  tokenCleanupService.start();
  logger.info('✅ Token cleanup service started');

  // 404 handler
  app.use(notFoundHandler);

  // Error handler (must be last)
  app.use(errorHandler);

  logger.info('✅ Application configured successfully');

  return app;
}
