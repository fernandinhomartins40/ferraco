import { Router } from 'express';
import { authenticateDual, requireApiKeyScope, logApiUsage } from '../../middleware/apiKeyAuth';
import { responseHelpers } from '../../utils/apiResponse';

// Import controllers
import { LeadsController } from '../leads/leads.controller';
import { LeadsService } from '../leads/leads.service';
import { LeadsExportService } from '../leads/leads.export.service';
import { webhookRoutes } from '../webhooks';
import { batchRoutes } from '../batch';
import { prisma } from '../../config/database';

const router = Router();

// Middleware global
router.use(responseHelpers);
router.use((req, res, next) => {
  const startTime = Date.now();
  logApiUsage(startTime)(req, res, next);
});
router.use(authenticateDual);

// Initialize Leads controller
const leadsService = new LeadsService(prisma);
const leadsExportService = new LeadsExportService(prisma, leadsService);
const leadsController = new LeadsController(leadsService, leadsExportService);

// ============================================================================
// LEADS ENDPOINTS
// ============================================================================

router.get('/leads', requireApiKeyScope('leads:read'), leadsController.findAll.bind(leadsController));
router.get('/leads/:id', requireApiKeyScope('leads:read'), leadsController.findById.bind(leadsController));
router.post('/leads', requireApiKeyScope('leads:write'), leadsController.create.bind(leadsController));
router.put('/leads/:id', requireApiKeyScope('leads:write'), leadsController.update.bind(leadsController));
router.delete('/leads/:id', requireApiKeyScope('leads:delete'), leadsController.delete.bind(leadsController));

// ============================================================================
// WEBHOOKS & BATCH
// ============================================================================

router.use('/webhooks', webhookRoutes);
router.use('/batch', batchRoutes);

export default router;
