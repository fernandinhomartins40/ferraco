import { WhatsAppAutomation, WhatsAppAutomationMessage } from '@prisma/client';

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface CreateWhatsAppAutomationDTO {
  leadId: string;
  productsToSend: string[];
  scheduledFor?: Date;
}

export interface RetryAutomationDTO {
  automationId: string;
  resetMessages?: boolean;
}

export interface WhatsAppAutomationStatsDTO {
  total: number;
  pending: number;
  processing: number;
  sent: number;
  failed: number;
  totalMessages: number;
  successRate: number;
  lastExecutionAt?: Date;
}

export interface WhatsAppAutomationFiltersDTO {
  status?: 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED';
  leadId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

// ============================================================================
// Response Types
// ============================================================================

export interface WhatsAppAutomationResponse extends WhatsAppAutomation {
  lead?: {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
  };
  messages?: WhatsAppAutomationMessage[];
  productsData?: Array<{
    name: string;
    description?: string;
    images?: string[];
    videos?: string[];
  }>;
}

export interface WhatsAppAutomationDetailResponse {
  automation: WhatsAppAutomationResponse;
  timeline: Array<{
    timestamp: Date;
    event: string;
    details: string;
  }>;
}

// ============================================================================
// Queue Types
// ============================================================================

export interface AutomationQueueItem {
  automationId: string;
  leadId: string;
  priority: number;
  retryCount: number;
  scheduledFor: Date;
}

// ============================================================================
// Product Validation Types
// ============================================================================

export interface ProductMatch {
  original: string;
  matched: string;
  confidence: number;
  productData?: any;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  matches: ProductMatch[];
}
