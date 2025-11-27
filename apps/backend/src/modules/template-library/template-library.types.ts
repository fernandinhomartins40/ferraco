/**
 * Template Library Types
 */

export enum TemplateLibraryCategory {
  AUTOMATION = 'AUTOMATION',
  RECURRENCE = 'RECURRENCE',
  GENERIC = 'GENERIC',
  CUSTOM = 'CUSTOM',
  SYSTEM = 'SYSTEM',
}

export interface MessageTemplateLibrary {
  id: string;
  name: string;
  description?: string;
  category: TemplateLibraryCategory;
  content: string;
  mediaUrls?: string;
  mediaType?: string;
  availableVariables: string;
  isActive: boolean;
  isSystem: boolean;
  isFavorite: boolean;
  usageCount: number;
  triggerType?: string;
  minCaptures?: number;
  maxCaptures?: number;
  daysSinceCapture?: number;
  triggerConditions?: string;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTemplateDto {
  name: string;
  description?: string;
  category: TemplateLibraryCategory;
  content: string;
  mediaUrls?: string[];
  mediaType?: string;
  triggerType?: string;
  minCaptures?: number;
  maxCaptures?: number;
  daysSinceCapture?: number;
  triggerConditions?: Record<string, any>;
  priority?: number;
}

export interface UpdateTemplateDto {
  name?: string;
  description?: string;
  category?: TemplateLibraryCategory;
  content?: string;
  mediaUrls?: string[];
  mediaType?: string;
  isActive?: boolean;
  isFavorite?: boolean;
  triggerType?: string;
  minCaptures?: number;
  maxCaptures?: number;
  daysSinceCapture?: number;
  triggerConditions?: Record<string, any>;
  priority?: number;
}

export interface TemplateFilters {
  category?: TemplateLibraryCategory;
  isActive?: boolean;
  isSystem?: boolean;
  isFavorite?: boolean;
  triggerType?: string;
  search?: string;
}

export interface TemplatePreviewRequest {
  templateId?: string;
  content?: string;
  testData?: Record<string, any>;
}

export interface TemplatePreviewResponse {
  original: string;
  processed: string;
  variables: string[];
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}

export interface TemplateStats {
  total: number;
  byCategory: Record<TemplateLibraryCategory, number>;
  active: number;
  inactive: number;
  system: number;
  custom: number;
  favorites: number;
  mostUsed: Array<{
    id: string;
    name: string;
    usageCount: number;
  }>;
}
