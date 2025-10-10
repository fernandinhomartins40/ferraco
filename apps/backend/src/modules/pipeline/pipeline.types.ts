import { Pipeline, PipelineStage, Opportunity, OpportunityStatus } from '@prisma/client';

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface CreateStageDTO {
  name: string;
  order: number;
  color: string;
  rottenDays?: number;
}

export interface CreatePipelineDTO {
  name: string;
  description?: string;
  isDefault?: boolean;
  stages: CreateStageDTO[];
}

export interface UpdatePipelineDTO extends Partial<CreatePipelineDTO> {
  id: string;
}

export interface UpdateStageDTO {
  name?: string;
  order?: number;
  color?: string;
  rottenDays?: number;
}

export interface CreateOpportunityDTO {
  leadId: string;
  pipelineId: string;
  stageId: string;
  value?: number;
  probability?: number;
  expectedCloseDate?: Date;
  assignedToId?: string;
}

export interface MoveOpportunityDTO {
  opportunityId: string;
  targetStageId: string;
  reason?: string;
}

export interface ReorderStageDTO {
  stageId: string;
  newOrder: number;
}

// ============================================================================
// Response Types
// ============================================================================

export interface PipelineStatsResponse {
  totalOpportunities: number;
  totalValue: number;
  averageValue: number;
  conversionRate: number;
  averageTimeInPipeline: number;
  byStage: StageStatsData[];
}

export interface StageStatsData {
  stageId: string;
  stageName: string;
  count: number;
  value: number;
  averageTime: number;
}

export interface FunnelData {
  stage: string;
  count: number;
  value: number;
  conversionRate: number;
}

export interface OpportunityTimelineEntry {
  id: string;
  stageId: string;
  stageName: string;
  enteredAt: Date;
  leftAt?: Date;
  timeInStage?: number;
  reason?: string;
}

// ============================================================================
// Type Utilities
// ============================================================================

export type PipelineWithStages = Pipeline & {
  stages: PipelineStage[];
};

export type OpportunityWithRelations = Opportunity & {
  lead: {
    id: string;
    name: string;
    email: string | null;
    phone: string;
  };
  stage?: {
    id: string;
    name: string;
    color: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
};
