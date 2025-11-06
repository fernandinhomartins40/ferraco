import { Router } from 'express';
import { recurrenceController } from './recurrence.controller';
import { authenticateJWT } from '../../middleware/auth';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateJWT);

// ============================================================================
// TEMPLATES DE RECORRÊNCIA
// ============================================================================

/**
 * GET /api/recurrence/templates
 * Lista todos os templates de recorrência
 * Query params: isActive (boolean), trigger (string)
 */
router.get('/templates', recurrenceController.listTemplates.bind(recurrenceController));

/**
 * GET /api/recurrence/templates/:id
 * Busca template por ID
 */
router.get('/templates/:id', recurrenceController.getTemplate.bind(recurrenceController));

/**
 * POST /api/recurrence/templates
 * Cria novo template de recorrência
 * Body: { name, description?, trigger, minCaptures, maxCaptures?, daysSinceLastCapture?, conditions?, content, mediaUrls?, mediaType?, priority? }
 */
router.post('/templates', recurrenceController.createTemplate.bind(recurrenceController));

/**
 * PUT /api/recurrence/templates/:id
 * Atualiza template de recorrência
 * Body: campos a atualizar
 */
router.put('/templates/:id', recurrenceController.updateTemplate.bind(recurrenceController));

/**
 * DELETE /api/recurrence/templates/:id
 * Deleta template de recorrência
 */
router.delete('/templates/:id', recurrenceController.deleteTemplate.bind(recurrenceController));

// ============================================================================
// ESTATÍSTICAS
// ============================================================================

/**
 * GET /api/recurrence/stats/templates
 * Estatísticas de uso dos templates
 */
router.get('/stats/templates', recurrenceController.getTemplateStats.bind(recurrenceController));

/**
 * GET /api/recurrence/stats/leads
 * Estatísticas de recorrência de leads
 */
router.get('/stats/leads', recurrenceController.getLeadStats.bind(recurrenceController));

// ============================================================================
// HISTÓRICO DE CAPTURAS
// ============================================================================

/**
 * GET /api/recurrence/leads/:leadId/captures
 * Histórico de capturas de um lead específico
 */
router.get('/leads/:leadId/captures', recurrenceController.getLeadCaptureHistory.bind(recurrenceController));

export default router;
