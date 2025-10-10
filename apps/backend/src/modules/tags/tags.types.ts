import { Tag } from '@prisma/client';

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface CreateTagDTO {
  name: string;
  color: string;
  description?: string;
  isSystem?: boolean;
}

export interface UpdateTagDTO extends Partial<CreateTagDTO> {
  id: string;
}

export interface CreateTagRuleDTO {
  tagId: string;
  condition: {
    field: string;
    operator: 'equals' | 'contains' | 'startsWith' | 'endsWith';
    value: string;
  };
  isActive: boolean;
}

export interface TagFiltersDTO {
  search?: string;
  isSystem?: boolean;
  isActive?: boolean;
}

// ============================================================================
// Response Types
// ============================================================================

export interface TagResponse {
  id: string;
  name: string;
  color: string;
  description?: string | null;
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    leads: number;
  };
}

export interface TagStats {
  totalTags: number;
  systemTags: number;
  customTags: number;
  activeTags: number;
  inactiveTags: number;
  mostUsedTags: Array<{
    id: string;
    name: string;
    color: string;
    count: number;
  }>;
  tagUsageByLead: Record<string, number>;
}

export interface TagRuleResponse {
  id: string;
  tagId: string;
  condition: {
    field: string;
    operator: string;
    value: string;
  };
  action: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  tag: {
    id: string;
    name: string;
    color: string;
  };
}

// ============================================================================
// Internal Types
// ============================================================================

export interface TagWithCount extends Tag {
  _count: {
    leads: number;
  };
}
