/**
 * TemplateProcessorService - Serviço Centralizado de Processamento de Templates
 *
 * Processa templates substituindo variáveis dinâmicas por valores reais.
 * Suporta validação e documentação de variáveis disponíveis.
 */

import { logger } from '../utils/logger';

export interface TemplateVariable {
  key: string;
  description: string;
  category: 'lead' | 'company' | 'system' | 'capture';
  example: string;
}

export interface TemplateContext {
  lead?: {
    name?: string;
    phone?: string;
    email?: string;
    company?: string;
  };
  company?: {
    name?: string;
    phone?: string;
    email?: string;
    website?: string;
    workingHours?: string;
  };
  system?: {
    currentDate?: string;
  };
  capture?: {
    captureNumber?: number;
    daysSinceLastCapture?: number;
    previousInterests?: string[];
    currentInterest?: string[];
  };
  custom?: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  variables: string[];
}

export class TemplateProcessorService {
  /**
   * Catálogo completo de variáveis disponíveis
   */
  static readonly AVAILABLE_VARIABLES: TemplateVariable[] = [
    // Lead Variables
    { key: 'lead.name', description: 'Nome do lead', category: 'lead', example: 'João Silva' },
    { key: 'lead.phone', description: 'Telefone do lead', category: 'lead', example: '11999999999' },
    { key: 'lead.email', description: 'Email do lead', category: 'lead', example: 'joao@empresa.com' },
    { key: 'lead.company', description: 'Empresa do lead', category: 'lead', example: 'Fazenda São José' },

    // Legacy Lead Variables (compatibilidade)
    { key: 'nome', description: 'Nome do lead (legacy)', category: 'lead', example: 'João Silva' },
    { key: 'produto', description: 'Produto de interesse (legacy)', category: 'lead', example: 'Bebedouro' },
    { key: 'interest', description: 'Produto de interesse (landing page)', category: 'capture', example: 'Bebedouros' },

    // Company Variables
    { key: 'company.name', description: 'Nome da empresa', category: 'company', example: 'Ferraco Equipamentos' },
    { key: 'company.phone', description: 'Telefone da empresa', category: 'company', example: '1133334444' },
    { key: 'company.email', description: 'Email da empresa', category: 'company', example: 'contato@ferraco.com' },
    { key: 'company.website', description: 'Website da empresa', category: 'company', example: 'www.ferraco.com' },
    { key: 'company.workingHours', description: 'Horário de funcionamento', category: 'company', example: 'Seg-Sex: 8h-18h' },

    // System Variables
    { key: 'system.currentDate', description: 'Data atual', category: 'system', example: '26/11/2025' },

    // Capture/Recurrence Variables
    { key: 'captureNumber', description: 'Número da captura', category: 'capture', example: '2' },
    { key: 'capture.number', description: 'Número da captura', category: 'capture', example: '2' },
    { key: 'daysSinceLastCapture', description: 'Dias desde última captura', category: 'capture', example: '15' },
    { key: 'capture.daysSince', description: 'Dias desde última captura', category: 'capture', example: '15' },
    { key: 'previousInterests', description: 'Interesses anteriores', category: 'capture', example: 'Bebedouro, Freestall' },
    { key: 'currentInterest', description: 'Interesse atual', category: 'capture', example: 'Tanque de Expansão' },
  ];

  /**
   * Processa template substituindo todas as variáveis
   */
  processTemplate(template: string, context: TemplateContext): string {
    let processed = template;

    try {
      // 1. Processar variáveis do lead
      if (context.lead) {
        processed = processed.replace(/\{\{lead\.name\}\}/g, context.lead.name || '');
        processed = processed.replace(/\{\{lead\.phone\}\}/g, context.lead.phone || '');
        processed = processed.replace(/\{\{lead\.email\}\}/g, context.lead.email || '');
        processed = processed.replace(/\{\{lead\.company\}\}/g, context.lead.company || '');

        // Legacy variables (compatibilidade)
        processed = processed.replace(/\{\{nome\}\}/g, context.lead.name || '');
      }

      // 2. Processar variáveis da empresa
      if (context.company) {
        processed = processed.replace(/\{\{company\.name\}\}/g, context.company.name || '');
        processed = processed.replace(/\{\{company\.phone\}\}/g, context.company.phone || '');
        processed = processed.replace(/\{\{company\.email\}\}/g, context.company.email || '');
        processed = processed.replace(/\{\{company\.website\}\}/g, context.company.website || '');
        processed = processed.replace(/\{\{company\.workingHours\}\}/g, context.company.workingHours || '');
      }

      // 3. Processar variáveis do sistema
      if (context.system) {
        processed = processed.replace(/\{\{system\.currentDate\}\}/g, context.system.currentDate || new Date().toLocaleDateString('pt-BR'));
      }

      // 4. Processar variáveis de captura/recorrência
      if (context.capture) {
        if (context.capture.captureNumber !== undefined) {
          processed = processed.replace(/\{\{captureNumber\}\}/g, context.capture.captureNumber.toString());
          processed = processed.replace(/\{\{capture\.number\}\}/g, context.capture.captureNumber.toString());
        }

        if (context.capture.daysSinceLastCapture !== undefined) {
          processed = processed.replace(/\{\{daysSinceLastCapture\}\}/g, context.capture.daysSinceLastCapture.toString());
          processed = processed.replace(/\{\{capture\.daysSince\}\}/g, context.capture.daysSinceLastCapture.toString());
        }

        if (context.capture.previousInterests) {
          const previousStr = context.capture.previousInterests.join(', ') || 'nossos produtos';
          processed = processed.replace(/\{\{previousInterests\}\}/g, previousStr);
        }

        if (context.capture.currentInterest) {
          const currentStr = context.capture.currentInterest.join(', ') || 'nossos produtos';
          processed = processed.replace(/\{\{currentInterest\}\}/g, currentStr);
          // Legacy variables
          processed = processed.replace(/\{\{produto\}\}/g, currentStr);
          processed = processed.replace(/\{\{interest\}\}/g, currentStr); // ✅ NOVO: Variável de produto da landing page
        }
      }

      // 5. Processar variáveis customizadas
      if (context.custom) {
        Object.entries(context.custom).forEach(([key, value]) => {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
          processed = processed.replace(regex, String(value));
        });
      }

      return processed;
    } catch (error) {
      logger.error('❌ Erro ao processar template:', error);
      return template; // Retorna template original em caso de erro
    }
  }

  /**
   * Valida template verificando sintaxe e variáveis
   */
  validateTemplate(template: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      variables: [],
    };

    try {
      // 1. Extrair todas as variáveis do template
      const variables = this.extractVariables(template);
      result.variables = variables;

      // 2. Verificar variáveis inválidas
      const validVariableKeys = TemplateProcessorService.AVAILABLE_VARIABLES.map(v => v.key);
      const invalidVars = variables.filter(v => !validVariableKeys.includes(v));

      if (invalidVars.length > 0) {
        result.isValid = false;
        result.errors.push(`Variáveis inválidas encontradas: ${invalidVars.join(', ')}`);
      }

      // 3. Verificar sintaxe de chaves
      const openBraces = (template.match(/\{\{/g) || []).length;
      const closeBraces = (template.match(/\}\}/g) || []).length;

      if (openBraces !== closeBraces) {
        result.isValid = false;
        result.errors.push('Sintaxe inválida: número de {{ não corresponde a }}');
      }

      // 4. Warnings para boas práticas
      if (variables.length === 0) {
        result.warnings.push('Template não contém variáveis dinâmicas');
      }

      // Verificar se usa variáveis legacy
      const legacyVars = variables.filter(v => ['nome', 'produto'].includes(v));
      if (legacyVars.length > 0) {
        result.warnings.push(`Variáveis legacy detectadas (${legacyVars.join(', ')}). Considere migrar para lead.name, currentInterest`);
      }

    } catch (error) {
      result.isValid = false;
      result.errors.push(`Erro ao validar template: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }

    return result;
  }

  /**
   * Extrai todas as variáveis de um template
   */
  extractVariables(template: string): string[] {
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = template.matchAll(regex);
    const variables = new Set<string>();

    for (const match of matches) {
      const variable = match[1].trim();
      variables.add(variable);
    }

    return Array.from(variables);
  }

  /**
   * Obtém lista de variáveis disponíveis por categoria
   */
  getAvailableVariablesByCategory(): Record<string, TemplateVariable[]> {
    const grouped: Record<string, TemplateVariable[]> = {
      lead: [],
      company: [],
      system: [],
      capture: [],
    };

    TemplateProcessorService.AVAILABLE_VARIABLES.forEach(variable => {
      grouped[variable.category].push(variable);
    });

    return grouped;
  }

  /**
   * Gera preview do template com dados de exemplo
   */
  generatePreview(template: string): string {
    const exampleContext: TemplateContext = {
      lead: {
        name: 'João Silva',
        phone: '11999999999',
        email: 'joao@fazenda.com',
        company: 'Fazenda São José',
      },
      company: {
        name: 'Ferraco Equipamentos',
        phone: '1133334444',
        email: 'contato@ferraco.com',
        website: 'www.ferraco.com',
        workingHours: 'Segunda a Sexta: 8h às 18h',
      },
      system: {
        currentDate: new Date().toLocaleDateString('pt-BR'),
      },
      capture: {
        captureNumber: 2,
        daysSinceLastCapture: 15,
        previousInterests: ['Bebedouro', 'Freestall'],
        currentInterest: ['Tanque de Expansão'],
      },
    };

    return this.processTemplate(template, exampleContext);
  }

  /**
   * Formata lista de variáveis disponíveis como JSON
   */
  getAvailableVariablesAsJSON(): string {
    return JSON.stringify(
      TemplateProcessorService.AVAILABLE_VARIABLES.map(v => v.key)
    );
  }
}

export const templateProcessorService = new TemplateProcessorService();
