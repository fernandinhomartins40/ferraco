/**
 * Template Library Validators (Zod)
 */

import { z } from 'zod';
import { TemplateLibraryCategory } from './template-library.types';

export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
  description: z.string().optional(),
  category: z.nativeEnum(TemplateLibraryCategory),
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  mediaUrls: z.array(z.string().url()).optional(),
  mediaType: z.enum(['IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO']).optional(),
  triggerType: z.string().optional(),
  minCaptures: z.number().int().min(1).optional(),
  maxCaptures: z.number().int().min(1).optional(),
  daysSinceCapture: z.number().int().min(0).optional(),
  triggerConditions: z.record(z.any()).optional(),
  priority: z.number().int().min(0).max(100).optional(),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  category: z.nativeEnum(TemplateLibraryCategory).optional(),
  content: z.string().min(1).optional(),
  mediaUrls: z.array(z.string().url()).optional(),
  mediaType: z.enum(['IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO']).optional(),
  isActive: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  triggerType: z.string().optional(),
  minCaptures: z.number().int().min(1).optional(),
  maxCaptures: z.number().int().min(1).optional(),
  daysSinceCapture: z.number().int().min(0).optional(),
  triggerConditions: z.record(z.any()).optional(),
  priority: z.number().int().min(0).max(100).optional(),
});

export const templateFiltersSchema = z.object({
  category: z.nativeEnum(TemplateLibraryCategory).optional(),
  isActive: z.string().transform(val => val === 'true').optional(),
  isSystem: z.string().transform(val => val === 'true').optional(),
  isFavorite: z.string().transform(val => val === 'true').optional(),
  triggerType: z.string().optional(),
  search: z.string().optional(),
});

export const templatePreviewSchema = z.object({
  templateId: z.string().optional(),
  content: z.string().optional(),
  testData: z.record(z.any()).optional(),
}).refine(data => data.templateId || data.content, {
  message: 'templateId ou content é obrigatório',
});
