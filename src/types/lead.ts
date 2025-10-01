export interface Lead {
  id: string;
  name: string;
  phone: string;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
  notes?: LeadNote[];
  tags?: string[];
  communications?: Communication[];
  automationRules?: string[];
  source?: string;
  priority?: 'low' | 'medium' | 'high';
  assignedTo?: string;
  nextFollowUp?: string;
  // Phase 3 - AI and CRM features
  aiAnalysis?: AIAnalysis;
  conversionPrediction?: ConversionPrediction;
  leadScore?: number;
  pipelineStage?: string;
  opportunities?: Opportunity[];
  interactions?: Interaction[];
  duplicateOf?: string;
  isDuplicate?: boolean;
  digitalSignature?: DigitalSignature;
}

export interface LeadNote {
  id: string;
  content: string;
  createdAt: string;
  important?: boolean;
}

export type LeadStatus = 'novo' | 'em_andamento' | 'concluido';

export interface LeadStats {
  total: number;
  novo: number;
  em_andamento: number;
  concluido: number;
  conversionRate: number;
  averageConversionTime: number;
  todayLeads: number;
  weeklyGrowth: number;
  oldLeadsCount: number;
}

export interface LeadFilters {
  status: LeadStatus | 'todos';
  search: string;
  dateRange: 'hoje' | 'semana' | 'mes' | 'todos';
  sortBy: 'createdAt' | 'updatedAt' | 'name' | 'status';
  sortOrder: 'asc' | 'desc';
  tags: string[];
}

export interface DashboardMetrics {
  totalLeads: number;
  conversionRate: number;
  averageConversionTime: number;
  todayLeads: number;
  weeklyGrowth: number;
  monthlyGrowth: number;
  oldLeadsAlert: number;
  trendsData: TrendData[];
}

export interface TrendData {
  date: string;
  leads: number;
  conversions: number;
  conversionRate: number;
}

// Phase 2 - New interfaces
export interface TagDefinition {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdAt: string;
  isSystem?: boolean;
  rules?: TagRule[];
}

export interface TagRule {
  id: string;
  condition: 'status_change' | 'time_based' | 'source' | 'keyword';
  value: string;
  action: 'add_tag' | 'remove_tag';
}

export interface Communication {
  id: string;
  type: 'whatsapp' | 'email' | 'call' | 'sms';
  content: string;
  direction: 'inbound' | 'outbound';
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  timestamp: string;
  templateId?: string;
  metadata?: Record<string, unknown>;
}

export interface MessageTemplate {
  id: string;
  name: string;
  type: 'whatsapp' | 'email' | 'sms';
  content: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  category: 'welcome' | 'follow_up' | 'reminder' | 'promotional' | 'custom';
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  createdAt: string;
  lastExecuted?: string;
  executionCount: number;
}

export interface AutomationTrigger {
  type: 'lead_created' | 'status_changed' | 'time_based' | 'tag_added' | 'note_added';
  value?: string | number | boolean;
}

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'days_since';
  value: string | number | boolean | string[];
}

export interface AutomationAction {
  type: 'send_message' | 'change_status' | 'add_tag' | 'remove_tag' | 'add_note' | 'set_follow_up' | 'assign_user';
  value: string | number | string[];
  templateId?: string;
}

export interface Report {
  id: string;
  name: string;
  type: 'leads_overview' | 'conversion_funnel' | 'tag_performance' | 'automation_stats' | 'custom';
  filters: ReportFilters;
  widgets: ReportWidget[];
  isScheduled: boolean;
  scheduleConfig?: ScheduleConfig;
  createdAt: string;
  lastGenerated?: string;
}

export interface ReportFilters {
  dateRange: {
    start: string;
    end: string;
  };
  status?: LeadStatus[];
  tags?: string[];
  source?: string[];
  priority?: ('low' | 'medium' | 'high')[];
}

export interface ReportWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'list';
  title: string;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  config: Record<string, unknown>;
}

export interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  recipients: string[];
  format: 'pdf' | 'excel' | 'json';
}

export interface DashboardConfig {
  id: string;
  userId?: string;
  name: string;
  widgets: DashboardWidget[];
  layout: 'grid' | 'list';
  isDefault: boolean;
  createdAt: string;
}

export interface DashboardWidget {
  id: string;
  type: 'stats' | 'chart' | 'recent_leads' | 'alerts' | 'quick_actions' | 'tags_overview';
  title: string;
  size: 'sm' | 'md' | 'lg' | 'xl';
  position: { x: number; y: number; w: number; h: number };
  config: Record<string, unknown>;
  isVisible: boolean;
}

export interface WhatsAppConfig {
  isEnabled: boolean;
  businessPhoneId?: string;
  accessToken?: string;
  webhookToken?: string;
  isConnected: boolean;
}

export interface TagStats {
  tagId: string;
  tagName: string;
  count: number;
  conversionRate: number;
  averageTime: number;
  trend: 'up' | 'down' | 'stable';
}

// ========================================
// PHASE 3 - ADVANCED FEATURES
// ========================================

// 🧠 AI and Predictive Analytics
export interface AIAnalysis {
  sentimentScore: number; // -1 to 1 (negative to positive)
  sentiment: 'positive' | 'neutral' | 'negative';
  keyTopics: string[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendedActions: AIRecommendation[];
  confidenceScore: number; // 0 to 100
  lastAnalyzed: string;
}

export interface AIRecommendation {
  id: string;
  type: 'call' | 'email' | 'whatsapp' | 'meeting' | 'follow_up' | 'tag' | 'priority_change';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  suggestedAction: string;
  expectedImpact: string;
  confidence: number;
  createdAt: string;
  isImplemented?: boolean;
}

export interface ConversionPrediction {
  probability: number; // 0 to 100
  confidence: number; // 0 to 100
  factors: ConversionFactor[];
  estimatedTimeToConversion: number; // days
  suggestedActions: string[];
  lastUpdated: string;
}

export interface ConversionFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

export interface DuplicateDetection {
  id: string;
  leadId: string;
  potentialDuplicates: DuplicateMatch[];
  confidence: number;
  status: 'pending' | 'confirmed' | 'dismissed';
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface DuplicateMatch {
  leadId: string;
  similarity: number;
  matchingFields: string[];
  suggestedAction: 'merge' | 'keep_separate' | 'needs_review';
}

export interface ChatbotConfig {
  isEnabled: boolean;
  welcomeMessage: string;
  fallbackMessage: string;
  qualificationQuestions: ChatbotQuestion[];
  handoffTriggers: string[];
  businessHours: BusinessHours;
}

export interface ChatbotQuestion {
  id: string;
  question: string;
  type: 'text' | 'multiple_choice' | 'number' | 'email' | 'phone';
  options?: string[];
  isRequired: boolean;
  order: number;
  followUpRules?: ChatbotRule[];
}

export interface ChatbotRule {
  condition: string;
  action: 'ask_question' | 'add_tag' | 'set_priority' | 'handoff' | 'end_conversation';
  value: string | number;
}

export interface BusinessHours {
  monday: TimeSlot;
  tuesday: TimeSlot;
  wednesday: TimeSlot;
  thursday: TimeSlot;
  friday: TimeSlot;
  saturday: TimeSlot;
  sunday: TimeSlot;
  timezone: string;
}

export interface TimeSlot {
  isOpen: boolean;
  start: string; // HH:mm format
  end: string; // HH:mm format
}

// 🔄 CRM and Pipeline Management
export interface Pipeline {
  id: string;
  name: string;
  description: string;
  stages: PipelineStage[];
  isDefault: boolean;
  createdAt: string;
  createdBy: string;
  businessType: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  description: string;
  color: string;
  order: number;
  automations: string[];
  expectedDuration: number; // days
  conversionRate: number;
  isClosedWon: boolean;
  isClosedLost: boolean;
}

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  value: number;
  currency: string;
  probability: number; // 0 to 100
  expectedCloseDate: string;
  actualCloseDate?: string;
  stage: string;
  source: string;
  competitors?: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  assignedTo: string;
}

export interface Interaction {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'whatsapp' | 'sms' | 'note' | 'task';
  title: string;
  description: string;
  duration?: number; // minutes
  outcome: 'successful' | 'no_answer' | 'busy' | 'callback_requested' | 'not_interested' | 'interested';
  nextAction?: string;
  nextActionDate?: string;
  files?: InteractionFile[];
  participants: string[];
  createdAt: string;
  createdBy: string;
}

export interface InteractionFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}

export interface LeadScoring {
  id: string;
  leadId: string;
  score: number;
  factors: ScoringFactor[];
  lastCalculated: string;
  history: ScoreHistory[];
}

export interface ScoringFactor {
  factor: string;
  value: string | number | boolean;
  points: number;
  weight: number;
  description: string;
}

export interface ScoreHistory {
  date: string;
  score: number;
  change: number;
  reason: string;
}

// 🔌 External Integrations
export interface Integration {
  id: string;
  name: string;
  type: 'zapier' | 'make' | 'google_analytics' | 'facebook_ads' | 'instagram_ads' | 'hubspot' | 'pipedrive' | 'mailchimp' | 'custom';
  isEnabled: boolean;
  config: IntegrationConfig;
  credentials: IntegrationCredentials;
  lastSync?: string;
  syncStatus: 'success' | 'error' | 'pending' | 'disabled';
  errorMessage?: string;
  createdAt: string;
  createdBy: string;
}

export interface IntegrationConfig {
  webhookUrl?: string;
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  dataMapping: DataMapping[];
  filters: IntegrationFilter[];
  actions: IntegrationAction[];
}

export interface IntegrationCredentials {
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  webhookSecret?: string;
  customFields?: Record<string, string>;
}

export interface DataMapping {
  localField: string;
  externalField: string;
  transformation?: string;
  isRequired: boolean;
}

export interface IntegrationFilter {
  field: string;
  operator: string;
  value: string | number | boolean | string[];
}

export interface IntegrationAction {
  trigger: string;
  action: string;
  config: Record<string, unknown>;
}

export interface GoogleAnalyticsConfig {
  trackingId: string;
  viewId: string;
  events: GAEvent[];
  goals: GAGoal[];
}

export interface GAEvent {
  name: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
}

export interface GAGoal {
  id: string;
  name: string;
  type: 'destination' | 'duration' | 'pages' | 'event';
  value: number;
  isActive: boolean;
}

export interface FacebookAdsConfig {
  accountId: string;
  adAccounts: string[];
  campaigns: FBCampaign[];
  leadGenForms: FBLeadForm[];
}

export interface FBCampaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'archived';
  budget: number;
  isTracked: boolean;
}

export interface FBLeadForm {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'archived';
  isConnected: boolean;
  fieldMapping: DataMapping[];
}

// 👥 User Management and Permissions
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  permissions: Permission[];
  teams: string[];
  createdAt: string;
  lastLogin?: string;
  preferences: UserPreferences;
  signature?: DigitalSignature;
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  level: number; // 1-5 (1=lowest access, 5=highest access)
  permissions: string[];
  canCreateUsers: boolean;
  canManageRoles: boolean;
  canViewAuditLogs: boolean;
}

export interface Permission {
  resource: string; // 'leads', 'reports', 'automations', etc.
  actions: string[]; // 'create', 'read', 'update', 'delete', 'export'
  conditions?: PermissionCondition[];
}

export interface PermissionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in';
  value: string | number | string[];
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: NotificationSettings;
  dashboard: string; // dashboard config ID
}

export interface NotificationSettings {
  email: EmailNotifications;
  push: PushNotifications;
  inApp: InAppNotifications;
}

export interface EmailNotifications {
  newLeads: boolean;
  leadUpdates: boolean;
  automationResults: boolean;
  weeklyReports: boolean;
  systemAlerts: boolean;
}

export interface PushNotifications {
  enabled: boolean;
  urgentLeads: boolean;
  assignedTasks: boolean;
  deadlines: boolean;
}

export interface InAppNotifications {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  success: boolean;
  errorMessage?: string;
}

export interface DigitalSignature {
  id: string;
  userId: string;
  leadId: string;
  documentType: 'contract' | 'proposal' | 'agreement' | 'nda' | 'custom';
  signatureData: string; // base64 encoded signature
  timestamp: string;
  ipAddress: string;
  isValid: boolean;
  certificateId?: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  members: string[]; // user IDs
  lead: string; // user ID
  permissions: Permission[];
  createdAt: string;
  isActive: boolean;
}

// Advanced Analytics and Reporting
export interface AdvancedAnalytics {
  conversionFunnel: FunnelData;
  cohortAnalysis: CohortData;
  leadSources: SourceAnalytics[];
  teamPerformance: TeamPerformance[];
  predictiveInsights: PredictiveInsight[];
  benchmarks: Benchmark[];
}

export interface FunnelData {
  stages: FunnelStage[];
  conversionRates: number[];
  dropOffReasons: DropOffReason[];
  averageTimeByStage: number[];
}

export interface FunnelStage {
  name: string;
  count: number;
  percentage: number;
  dropOffRate: number;
}

export interface DropOffReason {
  reason: string;
  count: number;
  percentage: number;
  suggestions: string[];
}

export interface CohortData {
  periods: string[];
  cohorts: CohortGroup[];
  retentionRates: number[][];
}

export interface CohortGroup {
  period: string;
  initialSize: number;
  retentionByPeriod: number[];
}

export interface SourceAnalytics {
  source: string;
  count: number;
  conversionRate: number;
  averageValue: number;
  cost: number;
  roi: number;
  trend: 'up' | 'down' | 'stable';
}

export interface TeamPerformance {
  userId: string;
  userName: string;
  leadsAssigned: number;
  leadsConverted: number;
  conversionRate: number;
  averageResponseTime: number;
  satisfaction: number;
  activities: number;
}

export interface PredictiveInsight {
  type: 'revenue_forecast' | 'churn_prediction' | 'lead_quality' | 'seasonal_trends';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  timeframe: string;
  recommendations: string[];
  data: Record<string, unknown>;
}

export interface Benchmark {
  metric: string;
  value: number;
  industry: string;
  percentile: number;
  trend: 'above' | 'below' | 'at' | 'unknown';
  source: string;
}