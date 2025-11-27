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
import whatsappDebugRoutes from './routes/whatsapp-debug.routes';
import automationKanbanRoutes from './routes/automationKanban.routes';
import whatsappMessageTemplateRoutes from './routes/whatsappMessageTemplate.routes';
import whatsappAutomationRoutes from './modules/whatsapp-automation/whatsapp-automation.routes';
import recurrenceRoutes from './modules/recurrence/recurrence.routes';
import templateLibraryRoutes from './modules/template-library/template-library.routes';
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
  app.use(`${API_PREFIX}/whatsapp/debug`, whatsappDebugRoutes);
  app.use(`${API_PREFIX}/automation-kanban`, automationKanbanRoutes);
  app.use(`${API_PREFIX}/whatsapp-templates`, whatsappMessageTemplateRoutes);
  app.use(`${API_PREFIX}/whatsapp-automations`, whatsappAutomationRoutes);
  app.use(`${API_PREFIX}/recurrence`, recurrenceRoutes);
  app.use(`${API_PREFIX}/template-library`, templateLibraryRoutes);

  // External API routes (v1)
  app.use(`${API_PREFIX}/api-keys`, apiKeyRoutes);
  app.use(`${API_PREFIX}/v1/external`, externalRoutes);

  // API Documentation (Swagger)
  const swaggerUiOptions = {
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui { max-width: 1400px; margin: 0 auto; }
      .swagger-ui .info { margin: 50px 0; }
      .swagger-ui .info .title {
        font-size: 42px;
        color: #1a202c;
        font-weight: 700;
      }
      .swagger-ui .info .description {
        font-size: 16px;
        line-height: 1.8;
        color: #4a5568;
      }
      .swagger-ui .scheme-container {
        background: #f7fafc;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      .swagger-ui .opblock-tag {
        border-bottom: 2px solid #e2e8f0;
        padding: 15px 0;
        margin: 20px 0;
      }
      .swagger-ui .opblock-tag-section { margin-top: 20px; }
      .swagger-ui .opblock {
        margin: 15px 0;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        border: 1px solid #e2e8f0;
      }
      .swagger-ui .opblock.opblock-post {
        background: rgba(73, 204, 144, 0.1);
        border-color: #49cc90;
      }
      .swagger-ui .opblock.opblock-get {
        background: rgba(97, 175, 254, 0.1);
        border-color: #61affe;
      }
      .swagger-ui .opblock.opblock-put {
        background: rgba(252, 161, 48, 0.1);
        border-color: #fca130;
      }
      .swagger-ui .opblock.opblock-delete {
        background: rgba(249, 62, 62, 0.1);
        border-color: #f93e3e;
      }
      .swagger-ui .opblock-summary { font-weight: 600; }
      .swagger-ui .btn.authorize {
        background: #4299e1;
        border-color: #4299e1;
        font-weight: 600;
      }
      .swagger-ui .btn.authorize svg { fill: white; }
      .swagger-ui .btn.execute {
        background: #48bb78;
        border-color: #48bb78;
        font-weight: 600;
      }
      .swagger-ui .parameters-col_description {
        font-size: 14px;
        line-height: 1.6;
      }
      .swagger-ui table thead tr td,
      .swagger-ui table thead tr th {
        background: #f7fafc;
        font-weight: 600;
        color: #2d3748;
      }
      .swagger-ui .response-col_status {
        font-weight: 600;
      }
      .swagger-ui .model-box {
        background: #f7fafc;
        border-radius: 8px;
        padding: 15px;
      }
      .swagger-ui .model-title {
        font-weight: 600;
        color: #2d3748;
      }
      .swagger-ui select {
        border: 2px solid #e2e8f0;
        border-radius: 6px;
        padding: 8px 12px;
      }
      .swagger-ui input[type=text],
      .swagger-ui textarea {
        border: 2px solid #e2e8f0;
        border-radius: 6px;
        padding: 8px 12px;
      }
      .swagger-ui input[type=text]:focus,
      .swagger-ui textarea:focus {
        border-color: #4299e1;
        outline: none;
      }
      .swagger-ui .authorization__btn {
        background: #48bb78;
        border-color: #48bb78;
      }
      .swagger-ui .markdown pre {
        background: #2d3748;
        color: #e2e8f0;
        padding: 15px;
        border-radius: 8px;
        font-family: 'Monaco', 'Menlo', monospace;
      }
      .swagger-ui .markdown code {
        background: #edf2f7;
        color: #e53e3e;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'Monaco', 'Menlo', monospace;
      }
      .swagger-ui .tab li {
        font-size: 14px;
        font-weight: 600;
      }
      .swagger-ui .response-col_links {
        display: none;
      }
    `,
    customSiteTitle: 'Ferraco CRM API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      docExpansion: 'list',
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  };

  app.use('/api-docs', swaggerUi.serve);
  app.get('/api-docs', swaggerUi.setup(swaggerSpec, swaggerUiOptions));
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
