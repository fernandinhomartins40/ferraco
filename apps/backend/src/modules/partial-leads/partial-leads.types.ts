import { PartialLead } from '@prisma/client';

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface CreatePartialLeadDTO {
  sessionId: string;
  name?: string;
  email?: string;
  phone?: string;
  source: string;
  url: string;
  userAgent: string;
  ipAddress?: string;
}

export interface UpdatePartialLeadDTO {
  name?: string;
  email?: string;
  phone?: string;
}

export interface ConvertToLeadDTO {
  assignedToId?: string;
  priority?: string;
  tags?: string[];
}

// ============================================================================
// Response Types
// ============================================================================

export interface PartialLeadResponse {
  id: string;
  sessionId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  source: string;
  url: string;
  userAgent: string;
  ipAddress: string | null;
  firstInteraction: Date;
  lastUpdate: Date;
  interactions: number;
  completed: boolean;
  abandoned: boolean;
  convertedToLeadId: string | null;
  completedAt: Date | null;
  createdAt: Date;
}

export interface PartialLeadStatsResponse {
  total: number;
  completed: number;
  abandoned: number;
  active: number;
  conversionRate: number;
}

// ============================================================================
// Internal Types for Prisma
// ============================================================================

export type PartialLeadWithRelations = PartialLead;
