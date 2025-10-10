import { Note } from '@prisma/client';

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface CreateNoteDTO {
  leadId: string;
  content: string;
  category?: string;
  isImportant?: boolean;
  isPinned?: boolean;
  mentions?: string[];
  attachments?: NoteAttachment[];
}

export interface UpdateNoteDTO {
  content?: string;
  category?: string;
  isImportant?: boolean;
  isPinned?: boolean;
  mentions?: string[];
  attachments?: NoteAttachment[];
}

export interface NoteFiltersDTO {
  leadId?: string;
  category?: string[];
  isImportant?: boolean;
  isPinned?: boolean;
  createdById?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface NoteAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

// ============================================================================
// Response Types
// ============================================================================

export interface NoteResponse {
  id: string;
  content: string;
  important: boolean;
  category: string | null;
  leadId: string;
  lead?: {
    id: string;
    name: string;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  isPinned?: boolean;
  mentions?: string[];
  attachments?: NoteAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteWithRelations {
  id: string;
  content: string;
  important: boolean;
  category: string | null;
  leadId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  lead: {
    id: string;
    name: string;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

export interface NoteCategoryStats {
  category: string;
  count: number;
}

export interface NoteStatsResponse {
  total: number;
  important: number;
  pinned?: number;
  byCategory: NoteCategoryStats[];
  recentCount: number; // Last 7 days
}
