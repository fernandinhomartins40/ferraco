import { Lead, LeadPriority } from '@prisma/client';

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface CreateLeadDTO {
  name: string;
  email?: string;
  phone: string;
  company?: string;
  position?: string;
  source?: string;
  status?: string; // Status dinâmico baseado nas colunas Kanban
  priority?: LeadPriority;
  assignedToId?: string;
  customFields?: Record<string, unknown>;
  tags?: string[];
}

export interface UpdateLeadDTO extends Partial<CreateLeadDTO> {
  id: string;
}

export interface LeadFiltersDTO {
  search?: string;
  status?: string[]; // Status dinâmico baseado nas colunas Kanban
  priority?: LeadPriority[];
  source?: string[];
  assignedToId?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  hasEmail?: boolean;
  hasPhone?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'leadScore';
  sortOrder?: 'asc' | 'desc';
}

export interface MergeLeadsDTO {
  primaryLeadId: string;
  duplicateLeadIds: string[];
  fieldsToKeep: {
    name?: 'primary' | 'duplicate';
    email?: 'primary' | 'duplicate';
    phone?: 'primary' | 'duplicate';
    company?: 'primary' | 'duplicate';
    position?: 'primary' | 'duplicate';
  };
}

export interface BulkUpdateLeadsDTO {
  leadIds: string[];
  updates: Partial<CreateLeadDTO>;
}

// ============================================================================
// Response Types
// ============================================================================

export interface LeadResponse {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  company?: string | null;
  position?: string | null;
  source?: string | null;
  status: LeadStatus;
  priority: LeadPriority;
  score: number;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  } | null;
  tags: {
    id: string;
    name: string;
    color: string;
  }[];
  customFields: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  lastContactedAt?: Date | null;
  nextFollowUpAt?: Date | null;
}

export interface LeadStatsResponse {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  bySource: Record<string, number>;
  averageScore: number;
  conversionRate: number;
}

export interface DuplicateMatch {
  lead: LeadResponse;
  score: number;
  matches: {
    field: string;
    similarity: number;
  }[];
}

// ============================================================================
// Internal Types for Prisma Includes
// ============================================================================

export interface LeadWithRelations {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  status: LeadStatus;
  priority: LeadPriority;
  source: string | null;
  leadScore: number;
  metadata: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastContactedAt: Date | null;
  nextFollowUpAt: Date | null;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  } | null;
  tags: {
    id: string;
    tag: {
      id: string;
      name: string;
      color: string;
    };
  }[];
}
