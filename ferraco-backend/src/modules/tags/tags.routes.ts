import { Router } from 'express';
import { TagsController } from './tags.controller';
import { validate } from '../../middleware/validation';
import { authMiddleware, requirePermission } from '../../middleware/auth';
import { createTagSchema, updateTagSchema, createTagRuleSchema, tagFiltersSchema, tagIdSchema, leadIdSchema } from './tags.validators';

const router = Router();
const tagsController = new TagsController();

router.use(authMiddleware);

router.get('/stats', requirePermission('tags:read'), tagsController.getTagStats.bind(tagsController));
router.get('/popular', requirePermission('tags:read'), tagsController.getPopularTags.bind(tagsController));
router.get('/predefined-colors', requirePermission('tags:read'), tagsController.getPredefinedColors.bind(tagsController));
router.get('/rules', requirePermission('tags:read'), tagsController.getTagRules.bind(tagsController));
router.get('/', requirePermission('tags:read'), validate(tagFiltersSchema), tagsController.getTags.bind(tagsController));
router.get('/:id', requirePermission('tags:read'), validate(tagIdSchema), tagsController.getTagById.bind(tagsController));
router.post('/', requirePermission('tags:write'), validate(createTagSchema), tagsController.createTag.bind(tagsController));
router.put('/:id', requirePermission('tags:write'), validate(tagIdSchema), validate(updateTagSchema), tagsController.updateTag.bind(tagsController));
router.delete('/:id', requirePermission('tags:delete'), validate(tagIdSchema), tagsController.deleteTag.bind(tagsController));
router.patch('/:id/status', requirePermission('tags:write'), validate(tagIdSchema), tagsController.toggleTagStatus.bind(tagsController));
router.post('/:id/rules', requirePermission('tags:write'), validate(tagIdSchema), validate(createTagRuleSchema), tagsController.createTagRule.bind(tagsController));
router.post('/apply-automatic/:leadId', requirePermission('tags:write'), validate(leadIdSchema), tagsController.applyAutomaticTags.bind(tagsController));

export default router;
