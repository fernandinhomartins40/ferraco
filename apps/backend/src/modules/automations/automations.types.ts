import { Automation, AutomationExecution, AutomationTriggerType } from '@prisma/client';

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface AutomationTrigger {
  type: 'LEAD_CREATED' | 'LEAD_UPDATED' | 'STAGE_CHANGED' | 'TAG_ADDED' | 'SCHEDULED';
  config?: Record<string, unknown>;
}

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: string | number | string[] | number[];
}

export interface AutomationAction {
  type:
    | 'SEND_EMAIL'
    | 'SEND_WHATSAPP'
    | 'ADD_TAG'
    | 'ASSIGN_TO'
    | 'CREATE_TASK'
    | 'UPDATE_FIELD'
    | 'SEND_WEBHOOK'
    | 'MOVE_TO_STAGE';
  config: Record<string, unknown>;
}

export interface CreateAutomationDTO {
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  isActive?: boolean;
}

export interface UpdateAutomationDTO extends Partial<CreateAutomationDTO> {
  id: string;
}

export interface ExecuteAutomationDTO {
  automationId: string;
  context: Record<string, unknown>;
}

export interface TestAutomationDTO {
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  context: Record<string, unknown>;
}

// ============================================================================
// Response Types
// ============================================================================

export interface AutomationResponse {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  triggerType: AutomationTriggerType;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  executionCount: number;
  lastExecutedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AutomationExecutionResponse {
  id: string;
  automationId: string;
  leadId?: string;
  success: boolean;
  error?: string;
  context: Record<string, unknown>;
  results: unknown[];
  executionTime: number;
  executedAt: Date;
}

export interface AutomationStatsResponse {
  total: number;
  active: number;
  inactive: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  byTriggerType: {
    type: string;
    count: number;
    executions: number;
  }[];
}

export interface TestAutomationResult {
  conditionsMet: boolean;
  conditionResults: {
    field: string;
    operator: string;
    expectedValue: unknown;
    actualValue: unknown;
    passed: boolean;
  }[];
  actions: {
    type: string;
    result: unknown;
    success: boolean;
    error?: string;
  }[];
}

// ============================================================================
// Type Utilities
// ============================================================================

export type AutomationWithExecutions = Automation & {
  executions: AutomationExecution[];
};

export type ExecutionContext = Record<string, unknown> & {
  leadId?: string;
  userId?: string;
  triggeredBy?: string;
  timestamp?: string;
};
