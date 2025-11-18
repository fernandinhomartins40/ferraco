export interface BatchOperation {
  id?: string; // ID opcional para rastreamento
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string; // Caminho relativo: "/leads", "/leads/:id", etc.
  body?: any;
  headers?: Record<string, string>;
}

export interface BatchOperationResult {
  id?: string; // ID da operação original
  success: boolean;
  statusCode: number;
  data?: any;
  error?: string;
  code?: string;
}

export interface BatchRequest {
  operations: BatchOperation[];
  atomic?: boolean; // Se true, reverte tudo em caso de erro
  continueOnError?: boolean; // Se true, continua mesmo com erros
}

export interface BatchResponse {
  success: boolean;
  results: BatchOperationResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    executionTime: number;
  };
  meta: {
    timestamp: string;
    atomic: boolean;
    continueOnError: boolean;
  };
}
