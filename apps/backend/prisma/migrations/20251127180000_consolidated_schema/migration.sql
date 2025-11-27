-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SALES', 'CONSULTANT', 'MANAGER', 'SUPPORT');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NOVO', 'QUALIFICADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'PERDIDO', 'ARQUIVADO');

-- CreateEnum
CREATE TYPE "LeadPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "CommunicationType" AS ENUM ('WHATSAPP', 'EMAIL', 'SMS', 'CALL');

-- CreateEnum
CREATE TYPE "CommunicationDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "CommunicationStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('CALL', 'EMAIL', 'MEETING', 'WHATSAPP', 'SMS', 'NOTE', 'TASK');

-- CreateEnum
CREATE TYPE "InteractionOutcome" AS ENUM ('SUCCESSFUL', 'NO_ANSWER', 'BUSY', 'CALLBACK_REQUESTED', 'NOT_INTERESTED', 'INTERESTED');

-- CreateEnum
CREATE TYPE "AutomationTriggerType" AS ENUM ('LEAD_CREATED', 'STATUS_CHANGED', 'TIME_BASED', 'TAG_ADDED', 'NOTE_ADDED', 'INTERACTION_CREATED');

-- CreateEnum
CREATE TYPE "AutomationActionType" AS ENUM ('SEND_MESSAGE', 'CHANGE_STATUS', 'ADD_TAG', 'REMOVE_TAG', 'ADD_NOTE', 'SET_FOLLOW_UP', 'ASSIGN_USER', 'CREATE_TASK');

-- CreateEnum
CREATE TYPE "AutomationSendStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'FAILED', 'WHATSAPP_DISCONNECTED', 'RATE_LIMITED', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "IntegrationType" AS ENUM ('ZAPIER', 'MAKE', 'GOOGLE_ANALYTICS', 'FACEBOOK_ADS', 'INSTAGRAM_ADS', 'HUBSPOT', 'PIPEDRIVE', 'MAILCHIMP', 'CUSTOM');

-- CreateEnum
CREATE TYPE "IntegrationSyncStatus" AS ENUM ('SUCCESS', 'ERROR', 'PENDING', 'DISABLED');

-- CreateEnum
CREATE TYPE "IntegrationSyncFrequency" AS ENUM ('REALTIME', 'HOURLY', 'DAILY', 'WEEKLY');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('LEADS_OVERVIEW', 'CONVERSION_FUNNEL', 'TAG_PERFORMANCE', 'AUTOMATION_STATS', 'TEAM_PERFORMANCE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ReportScheduleFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "ReportExportFormat" AS ENUM ('PDF', 'EXCEL', 'JSON', 'CSV');

-- CreateEnum
CREATE TYPE "MessageTemplateCategory" AS ENUM ('WELCOME', 'FOLLOW_UP', 'REMINDER', 'PROMOTIONAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "TemplateLibraryCategory" AS ENUM ('AUTOMATION', 'RECURRENCE', 'GENERIC', 'CUSTOM', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AISentiment" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE');

-- CreateEnum
CREATE TYPE "AIUrgencyLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "DuplicateDetectionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "DuplicateSuggestedAction" AS ENUM ('MERGE', 'KEEP_SEPARATE', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CONTRACT', 'PROPOSAL', 'AGREEMENT', 'NDA', 'CUSTOM');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'PUSH', 'IN_APP', 'SMS');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('WEBSITE', 'WHATSAPP', 'FACEBOOK', 'INSTAGRAM', 'MANUAL', 'IMPORT', 'API', 'REFERRAL');

-- CreateEnum
CREATE TYPE "RecurrenceType" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM_DATES', 'DAYS_FROM_NOW');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'STICKER', 'LOCATION', 'CONTACT', 'LINK');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'READ', 'PLAYED', 'FAILED');

-- CreateEnum
CREATE TYPE "WhatsAppAutomationStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApiKeyType" AS ENUM ('READONLY', 'WRITE', 'ADMIN');

-- CreateEnum
CREATE TYPE "ApiKeyStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "WebhookStatus" AS ENUM ('ACTIVE', 'PAUSED', 'FAILED');

-- CreateEnum
CREATE TYPE "WebhookDeliveryStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'RETRYING');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('LEAD_CREATED', 'LEAD_UPDATED', 'LEAD_STATUS_CHANGED', 'LEAD_DELETED', 'COMMUNICATION_SENT', 'COMMUNICATION_FAILED', 'WHATSAPP_MESSAGE_RECEIVED', 'WHATSAPP_MESSAGE_SENT', 'AUTOMATION_EXECUTED', 'AUTOMATION_FAILED', 'WEBHOOK_TRIGGERED', 'API_KEY_CREATED', 'API_KEY_REVOKED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CONSULTANT',
    "avatar" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFirstLogin" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_permissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "actions" TEXT NOT NULL,
    "conditions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "language" TEXT NOT NULL DEFAULT 'pt-BR',
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "emailNewLeads" BOOLEAN NOT NULL DEFAULT true,
    "emailLeadUpdates" BOOLEAN NOT NULL DEFAULT true,
    "emailAutomations" BOOLEAN NOT NULL DEFAULT true,
    "emailWeeklyReports" BOOLEAN NOT NULL DEFAULT true,
    "emailSystemAlerts" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushUrgentLeads" BOOLEAN NOT NULL DEFAULT true,
    "pushAssignedTasks" BOOLEAN NOT NULL DEFAULT true,
    "pushDeadlines" BOOLEAN NOT NULL DEFAULT true,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "inAppSound" BOOLEAN NOT NULL DEFAULT true,
    "inAppDesktop" BOOLEAN NOT NULL DEFAULT true,
    "defaultDashboardId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isLead" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "company" TEXT,
    "position" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NOVO',
    "priority" "LeadPriority" NOT NULL DEFAULT 'MEDIUM',
    "source" TEXT,
    "assignedToId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "teamId" TEXT,
    "pipelineStageId" TEXT,
    "leadScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isDuplicate" BOOLEAN NOT NULL DEFAULT false,
    "duplicateOfId" TEXT,
    "nextFollowUpAt" TIMESTAMP(3),
    "lastContactedAt" TIMESTAMP(3),
    "metadata" TEXT,
    "captureCount" INTEGER NOT NULL DEFAULT 1,
    "firstCapturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastCapturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_captures" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "interest" TEXT,
    "metadata" TEXT,
    "captureNumber" INTEGER NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "campaign" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_captures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurrence_message_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger" TEXT NOT NULL,
    "minCaptures" INTEGER NOT NULL,
    "maxCaptures" INTEGER,
    "daysSinceLastCapture" INTEGER,
    "conditions" TEXT NOT NULL DEFAULT '{}',
    "content" TEXT NOT NULL,
    "mediaUrls" TEXT,
    "mediaType" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurrence_message_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kanban_columns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kanban_columns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_kanban_columns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "sendIntervalSeconds" INTEGER NOT NULL DEFAULT 60,
    "scheduledDate" TIMESTAMP(3),
    "recurrenceType" "RecurrenceType" NOT NULL DEFAULT 'NONE',
    "weekDays" TEXT,
    "monthDay" INTEGER,
    "customDates" TEXT,
    "daysFromNow" INTEGER,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringDay" INTEGER,
    "templateLibraryId" TEXT,
    "messageTemplateId" TEXT,
    "productIds" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automation_kanban_columns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_lead_positions" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "columnId" TEXT NOT NULL,
    "status" "AutomationSendStatus" NOT NULL DEFAULT 'PENDING',
    "lastSentAt" TIMESTAMP(3),
    "nextScheduledAt" TIMESTAMP(3),
    "messagesSentCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "lastAttemptAt" TIMESTAMP(3),
    "bypassBusinessHours" BOOLEAN NOT NULL DEFAULT false,
    "isManualRetry" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automation_lead_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_message_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrls" TEXT,
    "mediaType" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_message_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_settings" (
    "id" TEXT NOT NULL,
    "columnIntervalSeconds" INTEGER NOT NULL DEFAULT 300,
    "maxMessagesPerHour" INTEGER NOT NULL DEFAULT 30,
    "maxMessagesPerDay" INTEGER NOT NULL DEFAULT 200,
    "sendOnlyBusinessHours" BOOLEAN NOT NULL DEFAULT true,
    "businessHourStart" INTEGER NOT NULL DEFAULT 8,
    "businessHourEnd" INTEGER NOT NULL DEFAULT 20,
    "blockWeekends" BOOLEAN NOT NULL DEFAULT true,
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automation_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landing_page_config" (
    "id" TEXT NOT NULL,
    "header" TEXT NOT NULL,
    "hero" TEXT NOT NULL,
    "marquee" TEXT NOT NULL,
    "about" TEXT NOT NULL,
    "products" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "footer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_page_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landing_page_config_history" (
    "id" TEXT NOT NULL,
    "config_id" TEXT,
    "header" TEXT NOT NULL,
    "hero" TEXT NOT NULL,
    "marquee" TEXT NOT NULL,
    "about" TEXT NOT NULL,
    "products" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "footer" TEXT NOT NULL,
    "change_type" TEXT NOT NULL DEFAULT 'manual_save',
    "changed_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "landing_page_config_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partial_leads" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "source" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "ipAddress" TEXT,
    "firstInteraction" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdate" TIMESTAMP(3) NOT NULL,
    "interactions" INTEGER NOT NULL DEFAULT 1,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "abandoned" BOOLEAN NOT NULL DEFAULT false,
    "convertedToLeadId" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partial_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "important" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT,
    "leadId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_tags" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "addedById" TEXT,

    CONSTRAINT "lead_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag_rules" (
    "id" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tag_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communications" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" "CommunicationType" NOT NULL,
    "direction" "CommunicationDirection" NOT NULL,
    "status" "CommunicationStatus" NOT NULL DEFAULT 'PENDING',
    "content" TEXT NOT NULL,
    "templateId" TEXT,
    "metadata" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),

    CONSTRAINT "communications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CommunicationType" NOT NULL,
    "category" "MessageTemplateCategory" NOT NULL,
    "content" TEXT NOT NULL,
    "variables" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interactions" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" "InteractionType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "duration" INTEGER,
    "outcome" "InteractionOutcome",
    "nextAction" TEXT,
    "nextActionDate" TIMESTAMP(3),
    "participants" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interaction_files" (
    "id" TEXT NOT NULL,
    "interactionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interaction_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipelines" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "businessType" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "pipelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_stages" (
    "id" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "expectedDuration" INTEGER NOT NULL,
    "conversionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isClosedWon" BOOLEAN NOT NULL DEFAULT false,
    "isClosedLost" BOOLEAN NOT NULL DEFAULT false,
    "automations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pipeline_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "value" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "probability" INTEGER NOT NULL,
    "stage" TEXT,
    "source" TEXT,
    "competitors" TEXT,
    "notes" TEXT,
    "pipelineId" TEXT,
    "stageId" TEXT,
    "status" TEXT,
    "expectedCloseDate" TIMESTAMP(3) NOT NULL,
    "actualCloseDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT NOT NULL,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "triggerType" "AutomationTriggerType" NOT NULL,
    "triggerValue" TEXT,
    "conditions" TEXT NOT NULL,
    "actions" TEXT NOT NULL,
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "lastExecutedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "automations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_executions" (
    "id" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "leadId" TEXT,
    "status" TEXT NOT NULL,
    "result" TEXT,
    "error" TEXT,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "IntegrationType" NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "config" TEXT NOT NULL,
    "credentials" TEXT NOT NULL,
    "syncFrequency" "IntegrationSyncFrequency" NOT NULL,
    "syncStatus" "IntegrationSyncStatus" NOT NULL DEFAULT 'PENDING',
    "lastSync" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_sync_logs" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "recordsSynced" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "details" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "filters" TEXT NOT NULL,
    "widgets" TEXT NOT NULL,
    "isScheduled" BOOLEAN NOT NULL DEFAULT false,
    "scheduleFrequency" "ReportScheduleFrequency",
    "scheduleTime" TEXT,
    "scheduleRecipients" TEXT,
    "scheduleFormat" "ReportExportFormat",
    "lastGenerated" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_generations" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "fileUrl" TEXT,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_generations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_configs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "layout" TEXT NOT NULL DEFAULT 'grid',
    "widgets" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboard_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_analyses" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "sentimentScore" DOUBLE PRECISION NOT NULL,
    "sentiment" "AISentiment" NOT NULL,
    "keyTopics" TEXT NOT NULL,
    "urgencyLevel" "AIUrgencyLevel" NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "lastAnalyzed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_recommendations" (
    "id" TEXT NOT NULL,
    "aiAnalysisId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "suggestedAction" TEXT NOT NULL,
    "expectedImpact" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "isImplemented" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversion_predictions" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "probability" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "estimatedTimeToConversion" INTEGER NOT NULL,
    "suggestedActions" TEXT NOT NULL,
    "factors" TEXT NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversion_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_scoring" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "factors" TEXT NOT NULL,
    "history" TEXT NOT NULL,
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_scoring_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duplicate_detections" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "status" "DuplicateDetectionStatus" NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "duplicate_detections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duplicate_matches" (
    "id" TEXT NOT NULL,
    "duplicateDetectionId" TEXT NOT NULL,
    "potentialDuplicateId" TEXT NOT NULL,
    "similarity" DOUBLE PRECISION NOT NULL,
    "matchingFields" TEXT NOT NULL,
    "suggestedAction" "DuplicateSuggestedAction" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "duplicate_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatbot_sessions" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "sessionId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isQualified" BOOLEAN NOT NULL DEFAULT false,
    "conversationData" TEXT NOT NULL,
    "currentStage" INTEGER NOT NULL DEFAULT 1,
    "currentStepId" TEXT,
    "capturedName" TEXT,
    "capturedEmail" TEXT,
    "capturedPhone" TEXT,
    "interest" TEXT,
    "segment" TEXT,
    "userResponses" TEXT NOT NULL DEFAULT '{}',
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
    "qualificationScore" INTEGER NOT NULL DEFAULT 0,
    "readyForHuman" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chatbot_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatbot_messages" (
    "id" TEXT NOT NULL,
    "chatbotSessionId" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "intent" TEXT,
    "confidence" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chatbot_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatbot_config" (
    "id" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "botName" TEXT NOT NULL DEFAULT 'Ferraco Bot',
    "welcomeMessage" TEXT NOT NULL,
    "tone" TEXT NOT NULL DEFAULT 'friendly',
    "captureLeads" BOOLEAN NOT NULL DEFAULT true,
    "requireEmail" BOOLEAN NOT NULL DEFAULT true,
    "requirePhone" BOOLEAN NOT NULL DEFAULT true,
    "autoResponse" BOOLEAN NOT NULL DEFAULT true,
    "companyName" TEXT NOT NULL,
    "companyDescription" TEXT NOT NULL,
    "companyAddress" TEXT,
    "companyPhone" TEXT,
    "companyEmail" TEXT,
    "companyWebsite" TEXT,
    "workingHours" TEXT,
    "products" TEXT NOT NULL DEFAULT '[]',
    "faqs" TEXT NOT NULL DEFAULT '[]',
    "shareLinks" TEXT NOT NULL DEFAULT '[]',
    "conversationFlow" TEXT NOT NULL DEFAULT '[]',
    "whatsappTemplates" TEXT NOT NULL DEFAULT '{}',
    "fallbackMessage" TEXT NOT NULL DEFAULT 'Desculpe, não entendi. Pode reformular sua pergunta?',
    "qualificationQuestions" TEXT NOT NULL DEFAULT '[]',
    "handoffTriggers" TEXT NOT NULL DEFAULT '[]',
    "businessHours" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chatbot_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digital_signatures" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "signatureData" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "certificateId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "digital_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "data" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_uploads" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_contacts" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "profilePicUrl" TEXT,
    "leadId" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_notes" (
    "id" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_conversations" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessagePreview" TEXT,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "fullySynced" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" TIMESTAMP(3),
    "syncedMessageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "type" "MessageType" NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "mediaType" TEXT,
    "fromMe" BOOLEAN NOT NULL DEFAULT false,
    "status" "MessageStatus" NOT NULL DEFAULT 'PENDING',
    "whatsappMessageId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_automations" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "status" "WhatsAppAutomationStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledFor" TIMESTAMP(3),
    "productsToSend" TEXT NOT NULL,
    "messagesSent" INTEGER NOT NULL DEFAULT 0,
    "messagesTotal" INTEGER NOT NULL DEFAULT 0,
    "executionLog" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "whatsapp_automations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_automation_messages" (
    "id" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "messageType" TEXT NOT NULL,
    "content" TEXT,
    "mediaUrl" TEXT,
    "fileName" TEXT,
    "status" "MessageStatus" NOT NULL DEFAULT 'PENDING',
    "whatsappMessageId" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "whatsapp_automation_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_bot_sessions" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "currentStepId" TEXT NOT NULL,
    "contextData" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "handedOffToHuman" BOOLEAN NOT NULL DEFAULT false,
    "handoffAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_bot_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_bot_messages" (
    "id" TEXT NOT NULL,
    "botSessionId" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_bot_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "type" "ApiKeyType" NOT NULL DEFAULT 'WRITE',
    "status" "ApiKeyStatus" NOT NULL DEFAULT 'ACTIVE',
    "scopes" TEXT NOT NULL,
    "rateLimitPerHour" INTEGER NOT NULL DEFAULT 1000,
    "rateLimitPerDay" INTEGER NOT NULL DEFAULT 10000,
    "ipWhitelist" TEXT,
    "allowedOrigins" TEXT,
    "userId" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_usage_logs" (
    "id" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "requestBody" TEXT,
    "responseBody" TEXT,
    "errorMessage" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhooks" (
    "id" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "status" "WebhookStatus" NOT NULL DEFAULT 'ACTIVE',
    "name" TEXT,
    "description" TEXT,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "retryDelay" INTEGER NOT NULL DEFAULT 60000,
    "lastTriggeredAt" TIMESTAMP(3),
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_deliveries" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" "WebhookDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "statusCode" INTEGER,
    "responseBody" TEXT,
    "errorMessage" TEXT,
    "responseTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAttemptAt" TIMESTAMP(3),
    "nextAttemptAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_logs" (
    "id" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "eventName" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "userId" TEXT,
    "apiKeyId" TEXT,
    "payload" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_template_library" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "TemplateLibraryCategory" NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrls" TEXT,
    "mediaType" TEXT,
    "availableVariables" TEXT NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "triggerType" TEXT,
    "minCaptures" INTEGER,
    "maxCaptures" INTEGER,
    "daysSinceCapture" INTEGER,
    "triggerConditions" TEXT DEFAULT '{}',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_template_library_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "users"("isActive");

-- CreateIndex
CREATE INDEX "user_permissions_userId_idx" ON "user_permissions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_permissions_userId_resource_key" ON "user_permissions"("userId", "resource");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "team_members_teamId_idx" ON "team_members"("teamId");

-- CreateIndex
CREATE INDEX "team_members_userId_idx" ON "team_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_teamId_userId_key" ON "team_members"("teamId", "userId");

-- CreateIndex
CREATE INDEX "leads_email_idx" ON "leads"("email");

-- CreateIndex
CREATE INDEX "leads_phone_idx" ON "leads"("phone");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE INDEX "leads_assignedToId_idx" ON "leads"("assignedToId");

-- CreateIndex
CREATE INDEX "leads_createdById_idx" ON "leads"("createdById");

-- CreateIndex
CREATE INDEX "leads_createdAt_idx" ON "leads"("createdAt");

-- CreateIndex
CREATE INDEX "leads_priority_idx" ON "leads"("priority");

-- CreateIndex
CREATE INDEX "leads_leadScore_idx" ON "leads"("leadScore");

-- CreateIndex
CREATE INDEX "leads_captureCount_idx" ON "leads"("captureCount");

-- CreateIndex
CREATE INDEX "leads_lastCapturedAt_idx" ON "leads"("lastCapturedAt");

-- CreateIndex
CREATE INDEX "lead_captures_leadId_idx" ON "lead_captures"("leadId");

-- CreateIndex
CREATE INDEX "lead_captures_createdAt_idx" ON "lead_captures"("createdAt");

-- CreateIndex
CREATE INDEX "lead_captures_captureNumber_idx" ON "lead_captures"("captureNumber");

-- CreateIndex
CREATE INDEX "lead_captures_source_idx" ON "lead_captures"("source");

-- CreateIndex
CREATE INDEX "recurrence_message_templates_trigger_idx" ON "recurrence_message_templates"("trigger");

-- CreateIndex
CREATE INDEX "recurrence_message_templates_isActive_idx" ON "recurrence_message_templates"("isActive");

-- CreateIndex
CREATE INDEX "recurrence_message_templates_priority_idx" ON "recurrence_message_templates"("priority");

-- CreateIndex
CREATE INDEX "kanban_columns_isActive_idx" ON "kanban_columns"("isActive");

-- CreateIndex
CREATE INDEX "kanban_columns_order_idx" ON "kanban_columns"("order");

-- CreateIndex
CREATE UNIQUE INDEX "kanban_columns_order_key" ON "kanban_columns"("order");

-- CreateIndex
CREATE INDEX "automation_kanban_columns_isActive_idx" ON "automation_kanban_columns"("isActive");

-- CreateIndex
CREATE INDEX "automation_kanban_columns_order_idx" ON "automation_kanban_columns"("order");

-- CreateIndex
CREATE INDEX "automation_kanban_columns_recurrenceType_idx" ON "automation_kanban_columns"("recurrenceType");

-- CreateIndex
CREATE UNIQUE INDEX "automation_kanban_columns_order_key" ON "automation_kanban_columns"("order");

-- CreateIndex
CREATE INDEX "automation_lead_positions_columnId_idx" ON "automation_lead_positions"("columnId");

-- CreateIndex
CREATE INDEX "automation_lead_positions_nextScheduledAt_idx" ON "automation_lead_positions"("nextScheduledAt");

-- CreateIndex
CREATE INDEX "automation_lead_positions_status_idx" ON "automation_lead_positions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "automation_lead_positions_leadId_key" ON "automation_lead_positions"("leadId");

-- CreateIndex
CREATE INDEX "landing_page_config_history_config_id_idx" ON "landing_page_config_history"("config_id");

-- CreateIndex
CREATE INDEX "landing_page_config_history_created_at_idx" ON "landing_page_config_history"("created_at" DESC);

-- CreateIndex
CREATE INDEX "landing_page_config_history_change_type_idx" ON "landing_page_config_history"("change_type");

-- CreateIndex
CREATE UNIQUE INDEX "partial_leads_sessionId_key" ON "partial_leads"("sessionId");

-- CreateIndex
CREATE INDEX "partial_leads_sessionId_idx" ON "partial_leads"("sessionId");

-- CreateIndex
CREATE INDEX "partial_leads_completed_idx" ON "partial_leads"("completed");

-- CreateIndex
CREATE INDEX "partial_leads_abandoned_idx" ON "partial_leads"("abandoned");

-- CreateIndex
CREATE INDEX "partial_leads_createdAt_idx" ON "partial_leads"("createdAt");

-- CreateIndex
CREATE INDEX "notes_leadId_idx" ON "notes"("leadId");

-- CreateIndex
CREATE INDEX "notes_createdById_idx" ON "notes"("createdById");

-- CreateIndex
CREATE INDEX "notes_important_idx" ON "notes"("important");

-- CreateIndex
CREATE INDEX "notes_createdAt_idx" ON "notes"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE INDEX "tags_name_idx" ON "tags"("name");

-- CreateIndex
CREATE INDEX "tags_isActive_idx" ON "tags"("isActive");

-- CreateIndex
CREATE INDEX "lead_tags_leadId_idx" ON "lead_tags"("leadId");

-- CreateIndex
CREATE INDEX "lead_tags_tagId_idx" ON "lead_tags"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "lead_tags_leadId_tagId_key" ON "lead_tags"("leadId", "tagId");

-- CreateIndex
CREATE INDEX "tag_rules_tagId_idx" ON "tag_rules"("tagId");

-- CreateIndex
CREATE INDEX "tag_rules_isActive_idx" ON "tag_rules"("isActive");

-- CreateIndex
CREATE INDEX "communications_leadId_idx" ON "communications"("leadId");

-- CreateIndex
CREATE INDEX "communications_type_idx" ON "communications"("type");

-- CreateIndex
CREATE INDEX "communications_status_idx" ON "communications"("status");

-- CreateIndex
CREATE INDEX "communications_timestamp_idx" ON "communications"("timestamp");

-- CreateIndex
CREATE INDEX "message_templates_type_idx" ON "message_templates"("type");

-- CreateIndex
CREATE INDEX "message_templates_category_idx" ON "message_templates"("category");

-- CreateIndex
CREATE INDEX "message_templates_isActive_idx" ON "message_templates"("isActive");

-- CreateIndex
CREATE INDEX "interactions_leadId_idx" ON "interactions"("leadId");

-- CreateIndex
CREATE INDEX "interactions_type_idx" ON "interactions"("type");

-- CreateIndex
CREATE INDEX "interactions_createdAt_idx" ON "interactions"("createdAt");

-- CreateIndex
CREATE INDEX "interactions_createdById_idx" ON "interactions"("createdById");

-- CreateIndex
CREATE INDEX "interaction_files_interactionId_idx" ON "interaction_files"("interactionId");

-- CreateIndex
CREATE INDEX "pipelines_isDefault_idx" ON "pipelines"("isDefault");

-- CreateIndex
CREATE INDEX "pipeline_stages_pipelineId_idx" ON "pipeline_stages"("pipelineId");

-- CreateIndex
CREATE UNIQUE INDEX "pipeline_stages_pipelineId_order_key" ON "pipeline_stages"("pipelineId", "order");

-- CreateIndex
CREATE INDEX "opportunities_leadId_idx" ON "opportunities"("leadId");

-- CreateIndex
CREATE INDEX "opportunities_assignedToId_idx" ON "opportunities"("assignedToId");

-- CreateIndex
CREATE INDEX "opportunities_createdAt_idx" ON "opportunities"("createdAt");

-- CreateIndex
CREATE INDEX "automations_isActive_idx" ON "automations"("isActive");

-- CreateIndex
CREATE INDEX "automations_triggerType_idx" ON "automations"("triggerType");

-- CreateIndex
CREATE INDEX "automation_executions_automationId_idx" ON "automation_executions"("automationId");

-- CreateIndex
CREATE INDEX "automation_executions_executedAt_idx" ON "automation_executions"("executedAt");

-- CreateIndex
CREATE INDEX "integrations_type_idx" ON "integrations"("type");

-- CreateIndex
CREATE INDEX "integrations_isEnabled_idx" ON "integrations"("isEnabled");

-- CreateIndex
CREATE INDEX "integrations_syncStatus_idx" ON "integrations"("syncStatus");

-- CreateIndex
CREATE INDEX "integration_sync_logs_integrationId_idx" ON "integration_sync_logs"("integrationId");

-- CreateIndex
CREATE INDEX "integration_sync_logs_syncedAt_idx" ON "integration_sync_logs"("syncedAt");

-- CreateIndex
CREATE INDEX "reports_type_idx" ON "reports"("type");

-- CreateIndex
CREATE INDEX "reports_isScheduled_idx" ON "reports"("isScheduled");

-- CreateIndex
CREATE INDEX "report_generations_reportId_idx" ON "report_generations"("reportId");

-- CreateIndex
CREATE INDEX "report_generations_generatedAt_idx" ON "report_generations"("generatedAt");

-- CreateIndex
CREATE INDEX "dashboard_configs_userId_idx" ON "dashboard_configs"("userId");

-- CreateIndex
CREATE INDEX "dashboard_configs_isDefault_idx" ON "dashboard_configs"("isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "ai_analyses_leadId_key" ON "ai_analyses"("leadId");

-- CreateIndex
CREATE INDEX "ai_analyses_leadId_idx" ON "ai_analyses"("leadId");

-- CreateIndex
CREATE INDEX "ai_analyses_sentiment_idx" ON "ai_analyses"("sentiment");

-- CreateIndex
CREATE INDEX "ai_analyses_urgencyLevel_idx" ON "ai_analyses"("urgencyLevel");

-- CreateIndex
CREATE INDEX "ai_recommendations_aiAnalysisId_idx" ON "ai_recommendations"("aiAnalysisId");

-- CreateIndex
CREATE INDEX "ai_recommendations_isImplemented_idx" ON "ai_recommendations"("isImplemented");

-- CreateIndex
CREATE UNIQUE INDEX "conversion_predictions_leadId_key" ON "conversion_predictions"("leadId");

-- CreateIndex
CREATE INDEX "conversion_predictions_leadId_idx" ON "conversion_predictions"("leadId");

-- CreateIndex
CREATE INDEX "conversion_predictions_probability_idx" ON "conversion_predictions"("probability");

-- CreateIndex
CREATE UNIQUE INDEX "lead_scoring_leadId_key" ON "lead_scoring"("leadId");

-- CreateIndex
CREATE INDEX "lead_scoring_leadId_idx" ON "lead_scoring"("leadId");

-- CreateIndex
CREATE INDEX "lead_scoring_score_idx" ON "lead_scoring"("score");

-- CreateIndex
CREATE INDEX "duplicate_detections_leadId_idx" ON "duplicate_detections"("leadId");

-- CreateIndex
CREATE INDEX "duplicate_detections_status_idx" ON "duplicate_detections"("status");

-- CreateIndex
CREATE INDEX "duplicate_matches_duplicateDetectionId_idx" ON "duplicate_matches"("duplicateDetectionId");

-- CreateIndex
CREATE INDEX "duplicate_matches_potentialDuplicateId_idx" ON "duplicate_matches"("potentialDuplicateId");

-- CreateIndex
CREATE UNIQUE INDEX "chatbot_sessions_sessionId_key" ON "chatbot_sessions"("sessionId");

-- CreateIndex
CREATE INDEX "chatbot_sessions_leadId_idx" ON "chatbot_sessions"("leadId");

-- CreateIndex
CREATE INDEX "chatbot_sessions_sessionId_idx" ON "chatbot_sessions"("sessionId");

-- CreateIndex
CREATE INDEX "chatbot_sessions_currentStage_idx" ON "chatbot_sessions"("currentStage");

-- CreateIndex
CREATE INDEX "chatbot_sessions_isQualified_idx" ON "chatbot_sessions"("isQualified");

-- CreateIndex
CREATE INDEX "chatbot_messages_chatbotSessionId_idx" ON "chatbot_messages"("chatbotSessionId");

-- CreateIndex
CREATE INDEX "chatbot_messages_timestamp_idx" ON "chatbot_messages"("timestamp");

-- CreateIndex
CREATE INDEX "digital_signatures_userId_idx" ON "digital_signatures"("userId");

-- CreateIndex
CREATE INDEX "digital_signatures_leadId_idx" ON "digital_signatures"("leadId");

-- CreateIndex
CREATE INDEX "digital_signatures_timestamp_idx" ON "digital_signatures"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs"("resource");

-- CreateIndex
CREATE INDEX "audit_logs_resourceId_idx" ON "audit_logs"("resourceId");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "system_config_key_key" ON "system_config"("key");

-- CreateIndex
CREATE INDEX "system_config_key_idx" ON "system_config"("key");

-- CreateIndex
CREATE INDEX "file_uploads_uploadedById_idx" ON "file_uploads"("uploadedById");

-- CreateIndex
CREATE INDEX "file_uploads_createdAt_idx" ON "file_uploads"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_contacts_phone_key" ON "whatsapp_contacts"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_contacts_leadId_key" ON "whatsapp_contacts"("leadId");

-- CreateIndex
CREATE INDEX "whatsapp_contacts_phone_idx" ON "whatsapp_contacts"("phone");

-- CreateIndex
CREATE INDEX "whatsapp_contacts_leadId_idx" ON "whatsapp_contacts"("leadId");

-- CreateIndex
CREATE INDEX "whatsapp_notes_contactPhone_idx" ON "whatsapp_notes"("contactPhone");

-- CreateIndex
CREATE INDEX "whatsapp_notes_userId_idx" ON "whatsapp_notes"("userId");

-- CreateIndex
CREATE INDEX "whatsapp_notes_createdAt_idx" ON "whatsapp_notes"("createdAt");

-- CreateIndex
CREATE INDEX "whatsapp_conversations_contactId_idx" ON "whatsapp_conversations"("contactId");

-- CreateIndex
CREATE INDEX "whatsapp_conversations_lastMessageAt_idx" ON "whatsapp_conversations"("lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_messages_whatsappMessageId_key" ON "whatsapp_messages"("whatsappMessageId");

-- CreateIndex
CREATE INDEX "whatsapp_messages_conversationId_idx" ON "whatsapp_messages"("conversationId");

-- CreateIndex
CREATE INDEX "whatsapp_messages_contactId_idx" ON "whatsapp_messages"("contactId");

-- CreateIndex
CREATE INDEX "whatsapp_messages_whatsappMessageId_idx" ON "whatsapp_messages"("whatsappMessageId");

-- CreateIndex
CREATE INDEX "whatsapp_messages_timestamp_idx" ON "whatsapp_messages"("timestamp");

-- CreateIndex
CREATE INDEX "whatsapp_automations_leadId_idx" ON "whatsapp_automations"("leadId");

-- CreateIndex
CREATE INDEX "whatsapp_automations_status_idx" ON "whatsapp_automations"("status");

-- CreateIndex
CREATE INDEX "whatsapp_automations_scheduledFor_idx" ON "whatsapp_automations"("scheduledFor");

-- CreateIndex
CREATE INDEX "whatsapp_automation_messages_automationId_idx" ON "whatsapp_automation_messages"("automationId");

-- CreateIndex
CREATE INDEX "whatsapp_automation_messages_status_idx" ON "whatsapp_automation_messages"("status");

-- CreateIndex
CREATE INDEX "whatsapp_bot_sessions_leadId_idx" ON "whatsapp_bot_sessions"("leadId");

-- CreateIndex
CREATE INDEX "whatsapp_bot_sessions_phone_idx" ON "whatsapp_bot_sessions"("phone");

-- CreateIndex
CREATE INDEX "whatsapp_bot_sessions_isActive_idx" ON "whatsapp_bot_sessions"("isActive");

-- CreateIndex
CREATE INDEX "whatsapp_bot_sessions_handedOffToHuman_idx" ON "whatsapp_bot_sessions"("handedOffToHuman");

-- CreateIndex
CREATE INDEX "whatsapp_bot_messages_botSessionId_idx" ON "whatsapp_bot_messages"("botSessionId");

-- CreateIndex
CREATE INDEX "whatsapp_bot_messages_timestamp_idx" ON "whatsapp_bot_messages"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_key" ON "api_keys"("key");

-- CreateIndex
CREATE INDEX "api_keys_key_idx" ON "api_keys"("key");

-- CreateIndex
CREATE INDEX "api_keys_userId_idx" ON "api_keys"("userId");

-- CreateIndex
CREATE INDEX "api_keys_status_idx" ON "api_keys"("status");

-- CreateIndex
CREATE INDEX "api_keys_expiresAt_idx" ON "api_keys"("expiresAt");

-- CreateIndex
CREATE INDEX "api_usage_logs_apiKeyId_idx" ON "api_usage_logs"("apiKeyId");

-- CreateIndex
CREATE INDEX "api_usage_logs_timestamp_idx" ON "api_usage_logs"("timestamp");

-- CreateIndex
CREATE INDEX "api_usage_logs_endpoint_idx" ON "api_usage_logs"("endpoint");

-- CreateIndex
CREATE INDEX "webhooks_apiKeyId_idx" ON "webhooks"("apiKeyId");

-- CreateIndex
CREATE INDEX "webhooks_status_idx" ON "webhooks"("status");

-- CreateIndex
CREATE INDEX "webhook_deliveries_webhookId_idx" ON "webhook_deliveries"("webhookId");

-- CreateIndex
CREATE INDEX "webhook_deliveries_status_idx" ON "webhook_deliveries"("status");

-- CreateIndex
CREATE INDEX "webhook_deliveries_event_idx" ON "webhook_deliveries"("event");

-- CreateIndex
CREATE INDEX "webhook_deliveries_createdAt_idx" ON "webhook_deliveries"("createdAt");

-- CreateIndex
CREATE INDEX "webhook_deliveries_nextAttemptAt_idx" ON "webhook_deliveries"("nextAttemptAt");

-- CreateIndex
CREATE INDEX "event_logs_eventType_idx" ON "event_logs"("eventType");

-- CreateIndex
CREATE INDEX "event_logs_resourceType_idx" ON "event_logs"("resourceType");

-- CreateIndex
CREATE INDEX "event_logs_resourceId_idx" ON "event_logs"("resourceId");

-- CreateIndex
CREATE INDEX "event_logs_timestamp_idx" ON "event_logs"("timestamp");

-- CreateIndex
CREATE INDEX "event_logs_userId_idx" ON "event_logs"("userId");

-- CreateIndex
CREATE INDEX "event_logs_apiKeyId_idx" ON "event_logs"("apiKeyId");

-- CreateIndex
CREATE INDEX "message_template_library_category_idx" ON "message_template_library"("category");

-- CreateIndex
CREATE INDEX "message_template_library_isActive_idx" ON "message_template_library"("isActive");

-- CreateIndex
CREATE INDEX "message_template_library_isSystem_idx" ON "message_template_library"("isSystem");

-- CreateIndex
CREATE INDEX "message_template_library_triggerType_idx" ON "message_template_library"("triggerType");

-- CreateIndex
CREATE INDEX "message_template_library_priority_idx" ON "message_template_library"("priority");

-- CreateIndex
CREATE INDEX "message_template_library_usageCount_idx" ON "message_template_library"("usageCount");

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_defaultDashboardId_fkey" FOREIGN KEY ("defaultDashboardId") REFERENCES "dashboard_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_pipelineStageId_fkey" FOREIGN KEY ("pipelineStageId") REFERENCES "pipeline_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_duplicateOfId_fkey" FOREIGN KEY ("duplicateOfId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_captures" ADD CONSTRAINT "lead_captures_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_kanban_columns" ADD CONSTRAINT "automation_kanban_columns_templateLibraryId_fkey" FOREIGN KEY ("templateLibraryId") REFERENCES "message_template_library"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_kanban_columns" ADD CONSTRAINT "automation_kanban_columns_messageTemplateId_fkey" FOREIGN KEY ("messageTemplateId") REFERENCES "whatsapp_message_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_lead_positions" ADD CONSTRAINT "automation_lead_positions_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_lead_positions" ADD CONSTRAINT "automation_lead_positions_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "automation_kanban_columns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landing_page_config_history" ADD CONSTRAINT "landing_page_config_history_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "landing_page_config"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landing_page_config_history" ADD CONSTRAINT "landing_page_config_history_changed_by_user_id_fkey" FOREIGN KEY ("changed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partial_leads" ADD CONSTRAINT "partial_leads_convertedToLeadId_fkey" FOREIGN KEY ("convertedToLeadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_tags" ADD CONSTRAINT "lead_tags_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_tags" ADD CONSTRAINT "lead_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_rules" ADD CONSTRAINT "tag_rules_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communications" ADD CONSTRAINT "communications_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communications" ADD CONSTRAINT "communications_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "message_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interaction_files" ADD CONSTRAINT "interaction_files_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "interactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipelines" ADD CONSTRAINT "pipelines_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_stages" ADD CONSTRAINT "pipeline_stages_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "pipelines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "pipeline_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automations" ADD CONSTRAINT "automations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_executions" ADD CONSTRAINT "automation_executions_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "automations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_sync_logs" ADD CONSTRAINT "integration_sync_logs_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_generations" ADD CONSTRAINT "report_generations_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_configs" ADD CONSTRAINT "dashboard_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_recommendations" ADD CONSTRAINT "ai_recommendations_aiAnalysisId_fkey" FOREIGN KEY ("aiAnalysisId") REFERENCES "ai_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversion_predictions" ADD CONSTRAINT "conversion_predictions_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_scoring" ADD CONSTRAINT "lead_scoring_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duplicate_detections" ADD CONSTRAINT "duplicate_detections_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duplicate_matches" ADD CONSTRAINT "duplicate_matches_duplicateDetectionId_fkey" FOREIGN KEY ("duplicateDetectionId") REFERENCES "duplicate_detections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duplicate_matches" ADD CONSTRAINT "duplicate_matches_potentialDuplicateId_fkey" FOREIGN KEY ("potentialDuplicateId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_sessions" ADD CONSTRAINT "chatbot_sessions_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_messages" ADD CONSTRAINT "chatbot_messages_chatbotSessionId_fkey" FOREIGN KEY ("chatbotSessionId") REFERENCES "chatbot_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_signatures" ADD CONSTRAINT "digital_signatures_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_signatures" ADD CONSTRAINT "digital_signatures_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_contacts" ADD CONSTRAINT "whatsapp_contacts_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_notes" ADD CONSTRAINT "whatsapp_notes_contactPhone_fkey" FOREIGN KEY ("contactPhone") REFERENCES "whatsapp_contacts"("phone") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "whatsapp_contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "whatsapp_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "whatsapp_contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_automations" ADD CONSTRAINT "whatsapp_automations_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_automation_messages" ADD CONSTRAINT "whatsapp_automation_messages_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "whatsapp_automations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_bot_sessions" ADD CONSTRAINT "whatsapp_bot_sessions_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_bot_messages" ADD CONSTRAINT "whatsapp_bot_messages_botSessionId_fkey" FOREIGN KEY ("botSessionId") REFERENCES "whatsapp_bot_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_usage_logs" ADD CONSTRAINT "api_usage_logs_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "api_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "api_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "webhooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ============================================================================
-- SEED DATA: MessageTemplateLibrary (Templates Padrão)
-- ============================================================================

-- Inserir templates padrão
INSERT INTO "message_template_library" (
    "id",
    "name",
    "description",
    "category",
    "content",
    "availableVariables",
    "isActive",
    "isSystem",
    "isFavorite",
    "usageCount",
    "priority",
    "createdAt",
    "updatedAt"
) VALUES
-- 1. Boas-vindas Inicial
(
    'mtl_' || gen_random_uuid()::text,
    'Boas-vindas Inicial',
    'Mensagem de boas-vindas para novos leads',
    'GENERIC',
    E'Olá {{lead.name}}! 👋\n\nSeja bem-vindo(a) à Metalúrgica Ferraco!\n\nSomos especialistas em equipamentos agropecuários de alta qualidade.\n\nComo podemos ajudá-lo(a) hoje?',
    '["lead.name", "lead.phone", "lead.email", "company.name"]',
    true,
    true,
    true,
    0,
    100,
    NOW(),
    NOW()
),
-- 2. Apresentação da Empresa
(
    'mtl_' || gen_random_uuid()::text,
    'Apresentação da Empresa',
    'Template para apresentar a empresa',
    'GENERIC',
    E'A *{{company.name}}* é líder em soluções agropecuárias há mais de 30 anos.\n\n✅ Produtos de alta qualidade\n✅ Entrega em todo o Brasil\n✅ Garantia e suporte especializado\n\nConheça nossos principais produtos:\n- Bebedouros\n- Comedouros\n- Sistemas de contenção\n- Free stall',
    '["lead.name", "company.name"]',
    true,
    true,
    false,
    0,
    90,
    NOW(),
    NOW()
),
-- 3. Solicitação de Orçamento
(
    'mtl_' || gen_random_uuid()::text,
    'Solicitação de Orçamento',
    'Template para leads que solicitam orçamento',
    'AUTOMATION',
    E'Olá {{lead.name}}!\n\nObrigado pelo interesse em nossos produtos! 📋\n\nPara elaborar um orçamento personalizado, preciso de algumas informações:\n\n1️⃣ Qual produto você tem interesse?\n2️⃣ Quantidade desejada\n3️⃣ Cidade/Estado para cálculo do frete\n\nAguardo seu retorno!',
    '["lead.name"]',
    true,
    false,
    false,
    0,
    95,
    NOW(),
    NOW()
),
-- 4. Atendimento Humano Solicitado
(
    'mtl_' || gen_random_uuid()::text,
    'Atendimento Humano Solicitado',
    'Template quando o cliente solicita falar com atendente',
    'AUTOMATION',
    E'{{lead.name}}, entendo! 👨‍💼\n\nVou transferir você para um de nossos consultores especializados.\n\nEm breve alguém da nossa equipe entrará em contato.\n\nObrigado pela preferência!',
    '["lead.name"]',
    true,
    false,
    false,
    0,
    98,
    NOW(),
    NOW()
),
-- 5. Follow-up 1 Captura
(
    'mtl_' || gen_random_uuid()::text,
    'Follow-up 1 Captura',
    'Primeira mensagem de recorrência após captura',
    'RECURRENCE',
    E'Oi {{lead.name}}! 😊\n\nNotei que você demonstrou interesse em nossos produtos.\n\nGostaria de saber mais sobre:\n\n🐄 Bebedouros para gado\n🌾 Comedouros automáticos\n🔒 Sistemas de contenção\n\nQual te interessa mais?',
    '["lead.name"]',
    true,
    false,
    false,
    0,
    80,
    NOW(),
    NOW()
),
-- 6. Follow-up 2-3 Capturas
(
    'mtl_' || gen_random_uuid()::text,
    'Follow-up 2-3 Capturas',
    'Mensagem para leads com 2-3 capturas',
    'RECURRENCE',
    E'Olá {{lead.name}}!\n\nVejo que você já nos visitou algumas vezes. 🌟\n\n*Oferta Especial:*\nPeça um orçamento hoje e ganhe *10% de desconto* em sua primeira compra!\n\nQuer aproveitar?',
    '["lead.name"]',
    true,
    false,
    false,
    0,
    75,
    NOW(),
    NOW()
),
-- 7. Follow-up 4+ Capturas
(
    'mtl_' || gen_random_uuid()::text,
    'Follow-up 4+ Capturas',
    'Mensagem para leads engajados (4+ capturas)',
    'RECURRENCE',
    E'Oi {{lead.name}}! 🎯\n\nPercebo que você é um lead super engajado com a Ferraco!\n\nQue tal agendar uma *consulta gratuita* com nosso especialista?\n\nPodemos encontrar a solução perfeita para sua necessidade.\n\nInteresse?',
    '["lead.name"]',
    true,
    false,
    false,
    0,
    85,
    NOW(),
    NOW()
),
-- 8. Reativação Lead Frio
(
    'mtl_' || gen_random_uuid()::text,
    'Reativação Lead Frio',
    'Mensagem para reativar leads inativos',
    'RECURRENCE',
    E'{{lead.name}}, sentimos sua falta! 💙\n\nHá um tempo você demonstrou interesse em nossos produtos.\n\n*Novidades:*\n✨ Novos modelos de bebedouros\n✨ Linha premium de comedouros\n✨ Condições especiais de pagamento\n\nVamos conversar?',
    '["lead.name"]',
    true,
    false,
    false,
    0,
    60,
    NOW(),
    NOW()
),
-- 9. Agradecimento Pós-Contato
(
    'mtl_' || gen_random_uuid()::text,
    'Agradecimento Pós-Contato',
    'Template de agradecimento após interação',
    'GENERIC',
    E'Obrigado pelo contato, {{lead.name}}! 🙏\n\nFoi um prazer atendê-lo(a).\n\nEstamos sempre à disposição para ajudar.\n\nAté breve!\n\n*{{company.name}}*\n📞 WhatsApp: {{company.phone}}',
    '["lead.name", "company.name", "company.phone"]',
    true,
    false,
    false,
    0,
    70,
    NOW(),
    NOW()
),
-- 10. Informações de Entrega
(
    'mtl_' || gen_random_uuid()::text,
    'Informações de Entrega',
    'Template com informações sobre entrega',
    'GENERIC',
    E'Informações sobre Entrega - {{company.name}}\n\n📦 *Frete:*\nRealizamos entregas para todo o Brasil via transportadora\n\n⏱️ *Prazo:*\n- Sul/Sudeste: 5-7 dias úteis\n- Norte/Nordeste: 10-15 dias úteis\n\n💰 *Pagamento:*\nAceitamos PIX, cartão e boleto\n\nPrecisa de um orçamento, {{lead.name}}?',
    '["lead.name", "company.name"]',
    true,
    false,
    false,
    0,
    65,
    NOW(),
    NOW()
)
ON CONFLICT DO NOTHING;

-- Atualizar triggers em templates de automação
UPDATE "message_template_library"
SET "triggerType" = 'modal_orcamento'
WHERE "name" = 'Solicitação de Orçamento'
AND "triggerType" IS NULL;

UPDATE "message_template_library"
SET "triggerType" = 'human_contact_request'
WHERE "name" = 'Atendimento Humano Solicitado'
AND "triggerType" IS NULL;

-- Atualizar configurações de recorrência
UPDATE "message_template_library"
SET
    "minCaptures" = 1,
    "maxCaptures" = 1,
    "daysSinceCapture" = 1
WHERE "name" = 'Follow-up 1 Captura'
AND "minCaptures" IS NULL;

UPDATE "message_template_library"
SET
    "minCaptures" = 2,
    "maxCaptures" = 3,
    "daysSinceCapture" = 3
WHERE "name" = 'Follow-up 2-3 Capturas'
AND "minCaptures" IS NULL;

UPDATE "message_template_library"
SET
    "minCaptures" = 4,
    "daysSinceCapture" = 5
WHERE "name" = 'Follow-up 4+ Capturas'
AND "minCaptures" IS NULL;

UPDATE "message_template_library"
SET "daysSinceCapture" = 15
WHERE "name" = 'Reativação Lead Frio'
AND "daysSinceCapture" IS NULL;
