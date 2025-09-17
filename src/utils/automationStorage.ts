import { AutomationRule, AutomationTrigger, AutomationCondition, AutomationAction, Lead } from '@/types/lead';

const AUTOMATIONS_STORAGE_KEY = 'ferraco_automations';

export const automationStorage = {
  // Get all automation rules
  getAutomations(): AutomationRule[] {
    try {
      const automations = localStorage.getItem(AUTOMATIONS_STORAGE_KEY);
      return automations ? JSON.parse(automations) : this.getDefaultAutomations();
    } catch (error) {
      console.error('Error reading automations from localStorage:', error);
      return this.getDefaultAutomations();
    }
  },

  // Save automations to localStorage
  saveAutomations(automations: AutomationRule[]): void {
    try {
      localStorage.setItem(AUTOMATIONS_STORAGE_KEY, JSON.stringify(automations));
    } catch (error) {
      console.error('Error saving automations to localStorage:', error);
    }
  },

  // Get default automation rules
  getDefaultAutomations(): AutomationRule[] {
    return [
      {
        id: 'auto-welcome-message',
        name: 'Mensagem de Boas-vindas',
        description: 'Envia mensagem automática quando um novo lead é criado',
        isActive: true,
        trigger: {
          type: 'lead_created',
        },
        conditions: [],
        actions: [
          {
            type: 'send_message',
            value: 'whatsapp',
            templateId: 'template-welcome-whatsapp',
          },
          {
            type: 'add_tag',
            value: 'novo-lead',
          },
        ],
        createdAt: new Date().toISOString(),
        executionCount: 0,
      },
      {
        id: 'auto-follow-up-reminder',
        name: 'Follow-up Automático',
        description: 'Envia lembrete após 3 dias sem interação',
        isActive: true,
        trigger: {
          type: 'time_based',
          value: { days: 3, status: 'novo' },
        },
        conditions: [
          {
            field: 'status',
            operator: 'equals',
            value: 'novo',
          },
        ],
        actions: [
          {
            type: 'send_message',
            value: 'whatsapp',
            templateId: 'template-follow-up-whatsapp',
          },
          {
            type: 'add_note',
            value: 'Follow-up automático enviado - aguardando resposta',
          },
        ],
        createdAt: new Date().toISOString(),
        executionCount: 0,
      },
      {
        id: 'auto-status-progression',
        name: 'Progressão de Status',
        description: 'Move lead para "em andamento" quando há interação',
        isActive: true,
        trigger: {
          type: 'note_added',
        },
        conditions: [
          {
            field: 'status',
            operator: 'equals',
            value: 'novo',
          },
        ],
        actions: [
          {
            type: 'change_status',
            value: 'em_andamento',
          },
          {
            type: 'add_tag',
            value: 'interagindo',
          },
        ],
        createdAt: new Date().toISOString(),
        executionCount: 0,
      },
      {
        id: 'auto-old-lead-alert',
        name: 'Alerta Lead Antigo',
        description: 'Adiciona tag de urgência para leads antigos sem follow-up',
        isActive: true,
        trigger: {
          type: 'time_based',
          value: { days: 7, status: 'novo' },
        },
        conditions: [
          {
            field: 'status',
            operator: 'equals',
            value: 'novo',
          },
          {
            field: 'lastContact',
            operator: 'days_since',
            value: 7,
          },
        ],
        actions: [
          {
            type: 'add_tag',
            value: 'urgente',
          },
          {
            type: 'add_note',
            value: '⚠️ Lead sem contato há mais de 7 dias - necessita atenção urgente',
          },
        ],
        createdAt: new Date().toISOString(),
        executionCount: 0,
      },
      {
        id: 'auto-vip-tagging',
        name: 'Marcação VIP Automática',
        description: 'Adiciona tag VIP baseado em palavras-chave',
        isActive: true,
        trigger: {
          type: 'note_added',
        },
        conditions: [
          {
            field: 'note_content',
            operator: 'contains',
            value: 'grande|fazenda|muitos|centenas|milhares|volume|atacado',
          },
        ],
        actions: [
          {
            type: 'add_tag',
            value: 'vip',
          },
          {
            type: 'add_note',
            value: '⭐ Lead marcado como VIP automaticamente - potencial alto volume',
          },
        ],
        createdAt: new Date().toISOString(),
        executionCount: 0,
      },
    ];
  },

  // Create a new automation rule
  createAutomation(automation: Omit<AutomationRule, 'id' | 'createdAt' | 'executionCount'>): AutomationRule {
    const newAutomation: AutomationRule = {
      ...automation,
      id: `auto-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      executionCount: 0,
    };

    const automations = this.getAutomations();
    automations.push(newAutomation);
    this.saveAutomations(automations);
    return newAutomation;
  },

  // Update an automation rule
  updateAutomation(automationId: string, updates: Partial<AutomationRule>): boolean {
    const automations = this.getAutomations();
    const automationIndex = automations.findIndex(auto => auto.id === automationId);

    if (automationIndex === -1) return false;

    automations[automationIndex] = { ...automations[automationIndex], ...updates };
    this.saveAutomations(automations);
    return true;
  },

  // Delete an automation rule
  deleteAutomation(automationId: string): boolean {
    const automations = this.getAutomations();
    const filteredAutomations = automations.filter(auto => auto.id !== automationId);

    if (filteredAutomations.length === automations.length) return false;

    this.saveAutomations(filteredAutomations);
    return true;
  },

  // Toggle automation active state
  toggleAutomation(automationId: string): boolean {
    const automations = this.getAutomations();
    const automation = automations.find(auto => auto.id === automationId);

    if (!automation) return false;

    return this.updateAutomation(automationId, { isActive: !automation.isActive });
  },

  // Execute automation rules for a specific trigger
  async executeAutomations(
    trigger: AutomationTrigger,
    lead: Lead,
    context?: Record<string, any>
  ): Promise<{ executed: string[]; errors: string[] }> {
    const automations = this.getAutomations().filter(auto =>
      auto.isActive && auto.trigger.type === trigger.type
    );

    const executed: string[] = [];
    const errors: string[] = [];

    for (const automation of automations) {
      try {
        const shouldExecute = await this.evaluateConditions(automation.conditions, lead, context);

        if (shouldExecute) {
          await this.executeActions(automation.actions, lead, context);
          executed.push(automation.name);

          // Update execution count and last executed
          this.updateAutomation(automation.id, {
            executionCount: automation.executionCount + 1,
            lastExecuted: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error(`Error executing automation ${automation.name}:`, error);
        errors.push(`${automation.name}: ${error}`);
      }
    }

    return { executed, errors };
  },

  // Evaluate automation conditions
  async evaluateConditions(
    conditions: AutomationCondition[],
    lead: Lead,
    context?: Record<string, any>
  ): Promise<boolean> {
    if (conditions.length === 0) return true;

    for (const condition of conditions) {
      const fieldValue = this.getFieldValue(lead, condition.field, context);
      const conditionMet = this.evaluateCondition(fieldValue, condition.operator, condition.value);

      if (!conditionMet) return false;
    }

    return true;
  },

  // Get field value from lead or context
  getFieldValue(lead: Lead, field: string, context?: Record<string, any>): any {
    // Check context first
    if (context && context[field] !== undefined) {
      return context[field];
    }

    // Check lead properties
    switch (field) {
      case 'status':
        return lead.status;
      case 'name':
        return lead.name;
      case 'phone':
        return lead.phone;
      case 'tags':
        return lead.tags || [];
      case 'priority':
        return lead.priority || 'medium';
      case 'source':
        return lead.source;
      case 'assignedTo':
        return lead.assignedTo;
      case 'note_content':
        return context?.noteContent || '';
      case 'lastContact':
        return this.calculateDaysSinceLastContact(lead);
      case 'daysSinceCreated':
        return Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      default:
        return null;
    }
  },

  // Calculate days since last contact
  calculateDaysSinceLastContact(lead: Lead): number {
    if (!lead.communications || lead.communications.length === 0) {
      return Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    }

    const lastComm = lead.communications
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    return Math.floor((Date.now() - new Date(lastComm.timestamp).getTime()) / (1000 * 60 * 60 * 24));
  },

  // Evaluate a single condition
  evaluateCondition(fieldValue: any, operator: string, conditionValue: any): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === conditionValue;
      case 'not_equals':
        return fieldValue !== conditionValue;
      case 'contains':
        if (Array.isArray(fieldValue)) {
          return fieldValue.includes(conditionValue);
        }
        if (typeof fieldValue === 'string') {
          // Support regex patterns separated by |
          const patterns = conditionValue.split('|');
          return patterns.some((pattern: string) =>
            fieldValue.toLowerCase().includes(pattern.toLowerCase())
          );
        }
        return false;
      case 'greater_than':
        return Number(fieldValue) > Number(conditionValue);
      case 'less_than':
        return Number(fieldValue) < Number(conditionValue);
      case 'days_since':
        return fieldValue >= Number(conditionValue);
      default:
        return false;
    }
  },

  // Execute automation actions
  async executeActions(
    actions: AutomationAction[],
    lead: Lead,
    context?: Record<string, any>
  ): Promise<void> {
    const leadStorage = (window as any).leadStorage;
    const communicationStorage = (window as any).communicationStorage;

    for (const action of actions) {
      try {
        switch (action.type) {
          case 'send_message':
            if (communicationStorage && action.templateId) {
              await communicationStorage.sendWhatsAppMessage(
                lead.phone,
                '',
                action.templateId
              );
            }
            break;

          case 'change_status':
            if (leadStorage) {
              leadStorage.updateLeadStatus(lead.id, action.value);
            }
            break;

          case 'add_tag':
            if (leadStorage) {
              leadStorage.addTag(lead.id, action.value);
            }
            break;

          case 'remove_tag':
            if (leadStorage) {
              leadStorage.removeTag(lead.id, action.value);
            }
            break;

          case 'add_note':
            if (leadStorage) {
              leadStorage.addNote(lead.id, action.value, false);
            }
            break;

          case 'set_follow_up':
            // This would update the nextFollowUp field
            if (leadStorage) {
              const followUpDate = new Date();
              followUpDate.setDate(followUpDate.getDate() + Number(action.value));
              // leadStorage.updateLead(lead.id, { nextFollowUp: followUpDate.toISOString() });
            }
            break;

          case 'assign_user':
            // This would assign the lead to a specific user
            if (leadStorage) {
              // leadStorage.updateLead(lead.id, { assignedTo: action.value });
            }
            break;
        }
      } catch (error) {
        console.error(`Error executing action ${action.type}:`, error);
        throw error;
      }
    }
  },

  // Run scheduled automations (for time-based triggers)
  async runScheduledAutomations(): Promise<{ processed: number; executed: number; errors: string[] }> {
    const leadStorage = (window as any).leadStorage;
    if (!leadStorage) return { processed: 0, executed: 0, errors: [] };

    const leads = leadStorage.getLeads();
    const timeBasedAutomations = this.getAutomations().filter(auto =>
      auto.isActive && auto.trigger.type === 'time_based'
    );

    let processed = 0;
    let executed = 0;
    const errors: string[] = [];

    for (const lead of leads) {
      processed++;

      for (const automation of timeBasedAutomations) {
        try {
          const triggerValue = automation.trigger.value;
          const daysSinceCreated = Math.floor(
            (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24)
          );

          // Check if conditions are met for time-based trigger
          if (triggerValue.days && daysSinceCreated >= triggerValue.days) {
            if (triggerValue.status && lead.status === triggerValue.status) {
              const shouldExecute = await this.evaluateConditions(automation.conditions, lead);

              if (shouldExecute) {
                await this.executeActions(automation.actions, lead);
                executed++;

                // Update execution count
                this.updateAutomation(automation.id, {
                  executionCount: automation.executionCount + 1,
                  lastExecuted: new Date().toISOString(),
                });
              }
            }
          }
        } catch (error) {
          console.error(`Error processing automation for lead ${lead.id}:`, error);
          errors.push(`Lead ${lead.name}: ${error}`);
        }
      }
    }

    return { processed, executed, errors };
  },

  // Get automation statistics
  getAutomationStats(): {
    total: number;
    active: number;
    totalExecutions: number;
    recentExecutions: Array<{ name: string; lastExecuted: string; count: number }>;
  } {
    const automations = this.getAutomations();

    const total = automations.length;
    const active = automations.filter(auto => auto.isActive).length;
    const totalExecutions = automations.reduce((sum, auto) => sum + auto.executionCount, 0);

    const recentExecutions = automations
      .filter(auto => auto.lastExecuted)
      .sort((a, b) => new Date(b.lastExecuted!).getTime() - new Date(a.lastExecuted!).getTime())
      .slice(0, 5)
      .map(auto => ({
        name: auto.name,
        lastExecuted: auto.lastExecuted!,
        count: auto.executionCount,
      }));

    return {
      total,
      active,
      totalExecutions,
      recentExecutions,
    };
  },

  // Initialize default automations
  initializeDefaultAutomations(): void {
    const existingAutomations = this.getAutomations();
    if (existingAutomations.length === 0) {
      this.saveAutomations(this.getDefaultAutomations());
    }
  },

  // Validate automation rule
  validateAutomation(automation: Partial<AutomationRule>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!automation.name?.trim()) {
      errors.push('Nome é obrigatório');
    }

    if (!automation.trigger?.type) {
      errors.push('Tipo de trigger é obrigatório');
    }

    if (!automation.actions || automation.actions.length === 0) {
      errors.push('Pelo menos uma ação é obrigatória');
    }

    automation.actions?.forEach((action, index) => {
      if (!action.type) {
        errors.push(`Ação ${index + 1}: Tipo é obrigatório`);
      }
      if (!action.value && action.type !== 'add_note') {
        errors.push(`Ação ${index + 1}: Valor é obrigatório`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};