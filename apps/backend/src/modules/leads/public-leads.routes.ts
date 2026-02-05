import { Router } from 'express';
import { PublicLeadsController } from './public-leads.controller';
import { LeadsService } from './leads.service';
import { prisma } from '../../config/database';
import rateLimit from 'express-rate-limit';

// ============================================================================
// Initialize Service and Controller
// ============================================================================

const router = Router();
const service = new LeadsService(prisma);
const controller = new PublicLeadsController(service);

// ============================================================================
// Rate Limiting for Public Endpoint
// ============================================================================

const publicLeadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: 'Muitas solicitações deste IP. Tente novamente em 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================================
// Public Routes - No authentication required
// ============================================================================

/**
 * POST /api/public/leads
 * Create a lead from the public landing page form
 * Rate limited to prevent spam/abuse
 */
router.post('/', publicLeadLimiter, controller.create);

/**
 * GET /api/public/leads/whatsapp-config
 * Get WhatsApp number for landing page (public - no auth required)
 */
router.get('/whatsapp-config', controller.getWhatsAppConfig);

// ============================================================================
// Export Router
// ============================================================================

export default router;
