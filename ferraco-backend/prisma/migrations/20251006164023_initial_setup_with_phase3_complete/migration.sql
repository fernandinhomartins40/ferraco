-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLogin" DATETIME
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "user_permissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    CONSTRAINT "user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "leadUserId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NOVO',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "source" TEXT NOT NULL DEFAULT 'website',
    "leadScore" INTEGER,
    "pipelineStage" TEXT,
    "isDuplicate" BOOLEAN NOT NULL DEFAULT false,
    "duplicateOfId" TEXT,
    "assignedToId" TEXT,
    "createdById" TEXT,
    "nextFollowUp" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "leads_duplicateOfId_fkey" FOREIGN KEY ("duplicateOfId") REFERENCES "leads" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "leads_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "leads_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lead_notes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "important" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "leadId" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "lead_notes_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lead_notes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "lead_tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lead_tags_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lead_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tag_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tagId" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tag_rules_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "communications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "leadId" TEXT NOT NULL,
    "templateId" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "communications_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "communications_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "message_templates" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "message_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'CUSTOM',
    "variables" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "automations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "triggerType" TEXT NOT NULL,
    "triggerValue" TEXT,
    "conditions" TEXT NOT NULL,
    "actions" TEXT NOT NULL,
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "lastExecuted" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "automation_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "automationId" TEXT NOT NULL,
    "leadId" TEXT,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "executedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "automation_logs_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "automations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "automation_logs_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pipelines" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "businessType" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "pipeline_stages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pipelineId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "expectedDuration" INTEGER,
    "conversionRate" REAL,
    "isClosedWon" BOOLEAN NOT NULL DEFAULT false,
    "isClosedLost" BOOLEAN NOT NULL DEFAULT false,
    "automations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "pipeline_stages_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "pipelines" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "value" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "probability" INTEGER NOT NULL,
    "expectedCloseDate" DATETIME,
    "actualCloseDate" DATETIME,
    "stage" TEXT NOT NULL,
    "source" TEXT,
    "leadId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "competitors" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "opportunities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "interactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER,
    "outcome" TEXT,
    "nextAction" TEXT,
    "nextActionDate" DATETIME,
    "leadId" TEXT NOT NULL,
    "participants" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "interactions_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "integrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "config" TEXT NOT NULL,
    "credentials" TEXT NOT NULL,
    "lastSync" DATETIME,
    "syncStatus" TEXT NOT NULL DEFAULT 'DISABLED',
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "filters" TEXT NOT NULL,
    "widgets" TEXT NOT NULL,
    "isScheduled" BOOLEAN NOT NULL DEFAULT false,
    "scheduleConfig" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastGenerated" DATETIME
);

-- CreateTable
CREATE TABLE "ai_analyses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "sentimentScore" REAL NOT NULL,
    "sentiment" TEXT NOT NULL,
    "keyTopics" TEXT NOT NULL,
    "urgencyLevel" TEXT NOT NULL,
    "confidenceScore" INTEGER NOT NULL,
    "lastAnalyzed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_analyses_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_recommendations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "aiAnalysisId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "suggestedAction" TEXT NOT NULL,
    "expectedImpact" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "isImplemented" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_recommendations_aiAnalysisId_fkey" FOREIGN KEY ("aiAnalysisId") REFERENCES "ai_analyses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "conversion_predictions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "probability" INTEGER NOT NULL,
    "confidence" INTEGER NOT NULL,
    "estimatedTimeToConversion" INTEGER NOT NULL,
    "suggestedActions" TEXT NOT NULL,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "conversion_predictions_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "conversion_factors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversionPredictionId" TEXT NOT NULL,
    "factor" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "weight" REAL NOT NULL,
    "description" TEXT NOT NULL,
    CONSTRAINT "conversion_factors_conversionPredictionId_fkey" FOREIGN KEY ("conversionPredictionId") REFERENCES "conversion_predictions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lead_scorings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "lastCalculated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lead_scorings_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "scoring_factors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadScoringId" TEXT NOT NULL,
    "factor" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "weight" REAL NOT NULL,
    "description" TEXT NOT NULL,
    CONSTRAINT "scoring_factors_leadScoringId_fkey" FOREIGN KEY ("leadScoringId") REFERENCES "lead_scorings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "score_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadScoringId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" INTEGER NOT NULL,
    "change" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    CONSTRAINT "score_history_leadScoringId_fkey" FOREIGN KEY ("leadScoringId") REFERENCES "lead_scorings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "duplicate_detections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "resolvedAt" DATETIME,
    "resolvedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "duplicate_detections_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "duplicate_matches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "duplicateDetectionId" TEXT NOT NULL,
    "duplicateLeadId" TEXT NOT NULL,
    "similarity" REAL NOT NULL,
    "matchingFields" TEXT NOT NULL,
    "suggestedAction" TEXT NOT NULL,
    CONSTRAINT "duplicate_matches_duplicateDetectionId_fkey" FOREIGN KEY ("duplicateDetectionId") REFERENCES "duplicate_detections" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chatbot_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "welcomeMessage" TEXT NOT NULL,
    "fallbackMessage" TEXT NOT NULL,
    "handoffTriggers" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "chatbot_questions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chatbotConfigId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "options" TEXT,
    "isRequired" BOOLEAN NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "chatbot_questions_chatbotConfigId_fkey" FOREIGN KEY ("chatbotConfigId") REFERENCES "chatbot_configs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chatbot_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chatbotQuestionId" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "chatbot_rules_chatbotQuestionId_fkey" FOREIGN KEY ("chatbotQuestionId") REFERENCES "chatbot_questions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "business_hours" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chatbotConfigId" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "monday" TEXT NOT NULL,
    "tuesday" TEXT NOT NULL,
    "wednesday" TEXT NOT NULL,
    "thursday" TEXT NOT NULL,
    "friday" TEXT NOT NULL,
    "saturday" TEXT NOT NULL,
    "sunday" TEXT NOT NULL,
    CONSTRAINT "business_hours_chatbotConfigId_fkey" FOREIGN KEY ("chatbotConfigId") REFERENCES "chatbot_configs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "advanced_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conversionFunnelData" TEXT NOT NULL,
    "cohortAnalysisData" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "source_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "advancedAnalyticsId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "conversionRate" REAL NOT NULL,
    "averageValue" REAL NOT NULL,
    "cost" REAL NOT NULL,
    "roi" REAL NOT NULL,
    "trend" TEXT NOT NULL,
    CONSTRAINT "source_analytics_advancedAnalyticsId_fkey" FOREIGN KEY ("advancedAnalyticsId") REFERENCES "advanced_analytics" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "team_performance_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "advancedAnalyticsId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "leadsAssigned" INTEGER NOT NULL,
    "leadsConverted" INTEGER NOT NULL,
    "conversionRate" REAL NOT NULL,
    "averageResponseTime" INTEGER NOT NULL,
    "satisfaction" REAL NOT NULL,
    "activities" INTEGER NOT NULL,
    CONSTRAINT "team_performance_records_advancedAnalyticsId_fkey" FOREIGN KEY ("advancedAnalyticsId") REFERENCES "advanced_analytics" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "predictive_insights" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "advancedAnalyticsId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "impact" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    CONSTRAINT "predictive_insights_advancedAnalyticsId_fkey" FOREIGN KEY ("advancedAnalyticsId") REFERENCES "advanced_analytics" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "benchmarks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "advancedAnalyticsId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "industry" TEXT NOT NULL,
    "percentile" INTEGER NOT NULL,
    "trend" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    CONSTRAINT "benchmarks_advancedAnalyticsId_fkey" FOREIGN KEY ("advancedAnalyticsId") REFERENCES "advanced_analytics" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "digital_signatures" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "signatureData" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT NOT NULL,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "certificateId" TEXT,
    CONSTRAINT "digital_signatures_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "digital_signatures_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "interaction_files" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "interactionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "interaction_files_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "interactions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "google_analytics_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "integrationId" TEXT NOT NULL,
    "trackingId" TEXT NOT NULL,
    "viewId" TEXT NOT NULL,
    CONSTRAINT "google_analytics_configs_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "integrations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ga_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "googleAnalyticsConfigId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "label" TEXT,
    "value" INTEGER,
    CONSTRAINT "ga_events_googleAnalyticsConfigId_fkey" FOREIGN KEY ("googleAnalyticsConfigId") REFERENCES "google_analytics_configs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ga_goals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "googleAnalyticsConfigId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "ga_goals_googleAnalyticsConfigId_fkey" FOREIGN KEY ("googleAnalyticsConfigId") REFERENCES "google_analytics_configs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "facebook_ads_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "integrationId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "adAccounts" TEXT NOT NULL,
    CONSTRAINT "facebook_ads_configs_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "integrations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fb_campaigns" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "facebookAdsConfigId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "budget" REAL NOT NULL,
    "isTracked" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "fb_campaigns_facebookAdsConfigId_fkey" FOREIGN KEY ("facebookAdsConfigId") REFERENCES "facebook_ads_configs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fb_lead_forms" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "facebookAdsConfigId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "isConnected" BOOLEAN NOT NULL DEFAULT false,
    "fieldMapping" TEXT NOT NULL,
    CONSTRAINT "fb_lead_forms_facebookAdsConfigId_fkey" FOREIGN KEY ("facebookAdsConfigId") REFERENCES "facebook_ads_configs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'AUTO',
    "language" TEXT NOT NULL DEFAULT 'pt-BR',
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "dashboardId" TEXT,
    CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notification_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userPreferencesId" TEXT NOT NULL,
    "emailNewLeads" BOOLEAN NOT NULL DEFAULT true,
    "emailLeadUpdates" BOOLEAN NOT NULL DEFAULT true,
    "emailAutomationResults" BOOLEAN NOT NULL DEFAULT true,
    "emailWeeklyReports" BOOLEAN NOT NULL DEFAULT true,
    "emailSystemAlerts" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pushUrgentLeads" BOOLEAN NOT NULL DEFAULT true,
    "pushAssignedTasks" BOOLEAN NOT NULL DEFAULT true,
    "pushDeadlines" BOOLEAN NOT NULL DEFAULT true,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "inAppSound" BOOLEAN NOT NULL DEFAULT true,
    "inAppDesktop" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "notification_settings_userPreferencesId_fkey" FOREIGN KEY ("userPreferencesId") REFERENCES "user_preferences" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_resource_action_key" ON "permissions"("resource", "action");

-- CreateIndex
CREATE UNIQUE INDEX "user_permissions_userId_permissionId_key" ON "user_permissions"("userId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_teamId_userId_key" ON "team_members"("teamId", "userId");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE INDEX "leads_assignedToId_idx" ON "leads"("assignedToId");

-- CreateIndex
CREATE INDEX "leads_createdAt_idx" ON "leads"("createdAt");

-- CreateIndex
CREATE INDEX "lead_notes_leadId_idx" ON "lead_notes"("leadId");

-- CreateIndex
CREATE INDEX "lead_notes_important_idx" ON "lead_notes"("important");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "lead_tags_leadId_tagId_key" ON "lead_tags"("leadId", "tagId");

-- CreateIndex
CREATE INDEX "communications_leadId_idx" ON "communications"("leadId");

-- CreateIndex
CREATE INDEX "communications_status_idx" ON "communications"("status");

-- CreateIndex
CREATE INDEX "automation_logs_automationId_idx" ON "automation_logs"("automationId");

-- CreateIndex
CREATE INDEX "automation_logs_leadId_idx" ON "automation_logs"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "pipeline_stages_pipelineId_order_key" ON "pipeline_stages"("pipelineId", "order");

-- CreateIndex
CREATE INDEX "opportunities_leadId_idx" ON "opportunities"("leadId");

-- CreateIndex
CREATE INDEX "interactions_leadId_idx" ON "interactions"("leadId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs"("resource");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "ai_analyses_leadId_key" ON "ai_analyses"("leadId");

-- CreateIndex
CREATE INDEX "ai_analyses_leadId_idx" ON "ai_analyses"("leadId");

-- CreateIndex
CREATE INDEX "ai_analyses_urgencyLevel_idx" ON "ai_analyses"("urgencyLevel");

-- CreateIndex
CREATE INDEX "ai_analyses_lastAnalyzed_idx" ON "ai_analyses"("lastAnalyzed");

-- CreateIndex
CREATE INDEX "ai_recommendations_aiAnalysisId_idx" ON "ai_recommendations"("aiAnalysisId");

-- CreateIndex
CREATE INDEX "ai_recommendations_priority_idx" ON "ai_recommendations"("priority");

-- CreateIndex
CREATE INDEX "ai_recommendations_isImplemented_idx" ON "ai_recommendations"("isImplemented");

-- CreateIndex
CREATE UNIQUE INDEX "conversion_predictions_leadId_key" ON "conversion_predictions"("leadId");

-- CreateIndex
CREATE INDEX "conversion_predictions_leadId_idx" ON "conversion_predictions"("leadId");

-- CreateIndex
CREATE INDEX "conversion_predictions_probability_idx" ON "conversion_predictions"("probability");

-- CreateIndex
CREATE INDEX "conversion_factors_conversionPredictionId_idx" ON "conversion_factors"("conversionPredictionId");

-- CreateIndex
CREATE UNIQUE INDEX "lead_scorings_leadId_key" ON "lead_scorings"("leadId");

-- CreateIndex
CREATE INDEX "lead_scorings_leadId_idx" ON "lead_scorings"("leadId");

-- CreateIndex
CREATE INDEX "lead_scorings_score_idx" ON "lead_scorings"("score");

-- CreateIndex
CREATE INDEX "scoring_factors_leadScoringId_idx" ON "scoring_factors"("leadScoringId");

-- CreateIndex
CREATE INDEX "score_history_leadScoringId_idx" ON "score_history"("leadScoringId");

-- CreateIndex
CREATE INDEX "score_history_date_idx" ON "score_history"("date");

-- CreateIndex
CREATE INDEX "duplicate_detections_leadId_idx" ON "duplicate_detections"("leadId");

-- CreateIndex
CREATE INDEX "duplicate_detections_status_idx" ON "duplicate_detections"("status");

-- CreateIndex
CREATE INDEX "duplicate_detections_createdAt_idx" ON "duplicate_detections"("createdAt");

-- CreateIndex
CREATE INDEX "duplicate_matches_duplicateDetectionId_idx" ON "duplicate_matches"("duplicateDetectionId");

-- CreateIndex
CREATE INDEX "duplicate_matches_duplicateLeadId_idx" ON "duplicate_matches"("duplicateLeadId");

-- CreateIndex
CREATE INDEX "chatbot_questions_chatbotConfigId_idx" ON "chatbot_questions"("chatbotConfigId");

-- CreateIndex
CREATE INDEX "chatbot_questions_order_idx" ON "chatbot_questions"("order");

-- CreateIndex
CREATE INDEX "chatbot_rules_chatbotQuestionId_idx" ON "chatbot_rules"("chatbotQuestionId");

-- CreateIndex
CREATE UNIQUE INDEX "business_hours_chatbotConfigId_key" ON "business_hours"("chatbotConfigId");

-- CreateIndex
CREATE INDEX "advanced_analytics_periodStart_idx" ON "advanced_analytics"("periodStart");

-- CreateIndex
CREATE INDEX "advanced_analytics_periodEnd_idx" ON "advanced_analytics"("periodEnd");

-- CreateIndex
CREATE INDEX "source_analytics_advancedAnalyticsId_idx" ON "source_analytics"("advancedAnalyticsId");

-- CreateIndex
CREATE INDEX "source_analytics_source_idx" ON "source_analytics"("source");

-- CreateIndex
CREATE INDEX "team_performance_records_advancedAnalyticsId_idx" ON "team_performance_records"("advancedAnalyticsId");

-- CreateIndex
CREATE INDEX "team_performance_records_userId_idx" ON "team_performance_records"("userId");

-- CreateIndex
CREATE INDEX "predictive_insights_advancedAnalyticsId_idx" ON "predictive_insights"("advancedAnalyticsId");

-- CreateIndex
CREATE INDEX "predictive_insights_type_idx" ON "predictive_insights"("type");

-- CreateIndex
CREATE INDEX "benchmarks_advancedAnalyticsId_idx" ON "benchmarks"("advancedAnalyticsId");

-- CreateIndex
CREATE INDEX "benchmarks_metric_idx" ON "benchmarks"("metric");

-- CreateIndex
CREATE INDEX "digital_signatures_userId_idx" ON "digital_signatures"("userId");

-- CreateIndex
CREATE INDEX "digital_signatures_leadId_idx" ON "digital_signatures"("leadId");

-- CreateIndex
CREATE INDEX "digital_signatures_timestamp_idx" ON "digital_signatures"("timestamp");

-- CreateIndex
CREATE INDEX "interaction_files_interactionId_idx" ON "interaction_files"("interactionId");

-- CreateIndex
CREATE UNIQUE INDEX "google_analytics_configs_integrationId_key" ON "google_analytics_configs"("integrationId");

-- CreateIndex
CREATE INDEX "ga_events_googleAnalyticsConfigId_idx" ON "ga_events"("googleAnalyticsConfigId");

-- CreateIndex
CREATE INDEX "ga_goals_googleAnalyticsConfigId_idx" ON "ga_goals"("googleAnalyticsConfigId");

-- CreateIndex
CREATE UNIQUE INDEX "facebook_ads_configs_integrationId_key" ON "facebook_ads_configs"("integrationId");

-- CreateIndex
CREATE INDEX "fb_campaigns_facebookAdsConfigId_idx" ON "fb_campaigns"("facebookAdsConfigId");

-- CreateIndex
CREATE INDEX "fb_lead_forms_facebookAdsConfigId_idx" ON "fb_lead_forms"("facebookAdsConfigId");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_settings_userPreferencesId_key" ON "notification_settings"("userPreferencesId");
