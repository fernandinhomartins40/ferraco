/**
 * Landing Page Settings Routes
 *
 * Rotas para gerenciar configurações de captação de leads da landing page
 */

import { Router } from 'express';
import { LandingPageSettingsController } from './landing-page-settings.controller';
import { authenticate, requireRole } from '../../middleware/auth';

// ============================================================================
// Initialize Controller
// ============================================================================

const router = Router();
const controller = new LandingPageSettingsController();

// ============================================================================
// Protected Routes - Require authentication and admin permission
// ============================================================================

// Todas as rotas requerem autenticação
router.use(authenticate);

/**
 * GET /api/admin/landing-page-settings
 * Buscar configuração atual
 */
router.get(
  '/',
  requireRole('ADMIN'),
  controller.get
);

/**
 * PUT /api/admin/landing-page-settings
 * Atualizar configuração
 */
router.put(
  '/',
  requireRole('ADMIN'),
  controller.update
);

/**
 * POST /api/admin/landing-page-settings/test
 * Testar conexão WhatsApp (enviar mensagem de teste)
 */
router.post(
  '/test',
  requireRole('ADMIN'),
  controller.test
);

// ============================================================================
// Export Router
// ============================================================================

export default router;
