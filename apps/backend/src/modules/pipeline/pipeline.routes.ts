import { Router } from 'express';
import { PipelineController } from './pipeline.controller';
import { authenticate } from '../../middleware/auth';

// ============================================================================
// Pipeline Routes
// ============================================================================

const router = Router();
const controller = new PipelineController();

// All routes require authentication
router.use(authenticate);

// ========================================================================
// Pipeline Routes (5 endpoints)
// ========================================================================

// GET /api/pipelines - List all pipelines
router.get('/', controller.listPipelines);

// GET /api/pipelines/:id - Get pipeline by ID
router.get('/:id', controller.getPipeline);

// POST /api/pipelines - Create pipeline
router.post('/', controller.createPipeline);

// PUT /api/pipelines/:id - Update pipeline
router.put('/:id', controller.updatePipeline);

// DELETE /api/pipelines/:id - Delete pipeline
router.delete('/:id', controller.deletePipeline);

// ========================================================================
// Stage Routes (5 endpoints)
// ========================================================================

// GET /api/pipelines/:id/stages - List stages for pipeline
router.get('/:id/stages', controller.listStages);

// POST /api/pipelines/:id/stages - Create stage in pipeline
router.post('/:id/stages', controller.createStage);

// PUT /api/pipelines/:id/stages/reorder - Reorder stages
router.put('/:id/stages/reorder', controller.reorderStages);

// PUT /api/stages/:id - Update stage (Note: different base path in practice)
router.put('/stages/:id', controller.updateStage);

// DELETE /api/stages/:id - Delete stage
router.delete('/stages/:id', controller.deleteStage);

// ========================================================================
// Opportunity Routes (3 endpoints)
// ========================================================================

// POST /api/opportunities - Create opportunity
router.post('/opportunities', controller.createOpportunity);

// PUT /api/opportunities/:id/move - Move opportunity to different stage
router.put('/opportunities/:id/move', controller.moveOpportunity);

// GET /api/opportunities/:id/timeline - Get opportunity timeline
router.get('/opportunities/:id/timeline', controller.getOpportunityTimeline);

// ========================================================================
// Statistics Routes (2 endpoints)
// ========================================================================

// GET /api/pipelines/:id/stats - Get pipeline statistics
router.get('/:id/stats', controller.getPipelineStats);

// GET /api/pipelines/:id/funnel - Get conversion funnel
router.get('/:id/funnel', controller.getFunnel);

export default router;
