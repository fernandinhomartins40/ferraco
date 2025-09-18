// Tipos simplificados para dados vindos da API do backend

export interface ApiLead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: 'NOVO' | 'EM_ANDAMENTO' | 'CONCLUIDO';
  source: string;
  createdAt: string;
  updatedAt: string;
  notes?: ApiLeadNote[];
  tags?: ApiLeadTag[];
}

export interface ApiLeadNote {
  id: string;
  content: string;
  important: boolean;
  leadId: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface ApiTag {
  id: string;
  name: string;
  color: string;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface ApiLeadTag {
  leadId: string;
  tagId: string;
  addedAt: string;
  tag: ApiTag;
}

// Tipos para criação/atualização
export interface CreateLeadRequest {
  name: string;
  phone: string;
  email?: string;
  status?: 'NOVO' | 'EM_ANDAMENTO' | 'CONCLUIDO';
  source?: string;
}

export interface UpdateLeadRequest extends Partial<CreateLeadRequest> {
  id: string;
}

export interface CreateNoteRequest {
  content: string;
  important?: boolean;
}

export interface CreateTagRequest {
  name: string;
  color: string;
  description?: string;
}

export interface UpdateTagRequest extends Partial<CreateTagRequest> {
  id: string;
}

// Tipos para filtros e paginação
export interface LeadFilters {
  status?: string;
  search?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Tipos simplificados para dashboard/métricas
export interface DashboardMetrics {
  leadsCount: {
    total: number;
    novo: number;
    emAndamento: number;
    concluido: number;
  };
  conversionRate: number;
  recentActivity: Array<{
    id: string;
    type: 'lead_created';
    description: string;
    timestamp: string;
    leadId?: string;
    leadName?: string;
  }>;
  trends: {
    leadsLastWeek: number;
    leadsThisWeek: number;
  };
}

// Tipos para usuários e autenticação
export interface ApiUser {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'user';
  email: string;
}

export interface LoginResponse {
  user: ApiUser;
  token: string;
  expiresIn: string;
}

// Export de tipos úteis para componentes
export type LeadStatus = ApiLead['status'];