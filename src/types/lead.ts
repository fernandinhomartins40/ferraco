export interface Lead {
  id: string;
  name: string;
  phone: string;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
}

export type LeadStatus = 'novo' | 'em_andamento' | 'concluido';

export interface LeadStats {
  total: number;
  novo: number;
  em_andamento: number;
  concluido: number;
}

export interface LeadFilters {
  status: LeadStatus | 'todos';
  search: string;
  dateRange: 'hoje' | 'semana' | 'mes' | 'todos';
}