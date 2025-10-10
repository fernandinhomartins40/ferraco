import {
  Lead,
  Pipeline,
  PipelineStage,
  Opportunity,
  Interaction,
  InteractionFile,
  LeadScoring,
  ScoringFactor,
  ScoreHistory,
  AdvancedAnalytics,
  FunnelData,
  FunnelStage,
  DropOffReason,
  CohortData,
  CohortGroup,
  SourceAnalytics,
  TeamPerformance
} from '@/types/lead';
import { logger } from '@/lib/logger';

export class CRMStorage {
  private readonly STORAGE_KEYS = {
    PIPELINES: 'ferraco_pipelines',
    OPPORTUNITIES: 'ferraco_opportunities',
    INTERACTIONS: 'ferraco_interactions',
    LEAD_SCORING: 'ferraco_lead_scoring',
    SCORING_RULES: 'ferraco_scoring_rules',
    CRM_CONFIG: 'ferraco_crm_config',
    ANALYTICS_CACHE: 'ferraco_analytics_cache'
  };

  // 🔄 Pipeline Management
  getPipelines(): Pipeline[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.PIPELINES);
      const pipelines = stored ? JSON.parse(stored) : [];

      if (pipelines.length === 0) {
        return this.initializeDefaultPipelines();
      }

      return pipelines;
    } catch (error) {
      logger.error('Erro ao carregar pipelines:', error);
      return this.initializeDefaultPipelines();
    }
  }

  createPipeline(
    name: string,
    description: string,
    businessType: string,
    stages: Omit<PipelineStage, 'id'>[]
  ): Pipeline {
    try {
      const pipeline: Pipeline = {
        id: `pipeline_${Date.now()}`,
        name,
        description,
        businessType,
        stages: stages.map((stage, index) => ({
          ...stage,
          id: `stage_${Date.now()}_${index}`,
          order: index
        })),
        isDefault: false,
        createdAt: new Date().toISOString(),
        createdBy: 'current_user' // In real app, get from auth context
      };

      const pipelines = this.getPipelines();
      pipelines.push(pipeline);
      this.savePipelines(pipelines);

      return pipeline;
    } catch (error) {
      logger.error('Erro ao criar pipeline:', error);
      throw error;
    }
  }

  updatePipeline(pipelineId: string, updates: Partial<Pipeline>): boolean {
    try {
      const pipelines = this.getPipelines();
      const index = pipelines.findIndex(p => p.id === pipelineId);

      if (index === -1) return false;

      pipelines[index] = { ...pipelines[index], ...updates };
      this.savePipelines(pipelines);
      return true;
    } catch (error) {
      logger.error('Erro ao atualizar pipeline:', error);
      return false;
    }
  }

  deletePipeline(pipelineId: string): boolean {
    try {
      const pipelines = this.getPipelines();
      const pipeline = pipelines.find(p => p.id === pipelineId);

      if (!pipeline || pipeline.isDefault) return false;

      const filtered = pipelines.filter(p => p.id !== pipelineId);
      this.savePipelines(filtered);
      return true;
    } catch (error) {
      logger.error('Erro ao deletar pipeline:', error);
      return false;
    }
  }

  moveLeadBetweenStages(leadId: string, fromStage: string, toStage: string): boolean {
    try {
      // This would integrate with leadStorage to update lead pipeline stage
      // For now, we'll just track the interaction
      this.addInteraction(leadId, {
        type: 'note',
        title: 'Movimentação no Pipeline',
        description: `Lead movido de "${fromStage}" para "${toStage}"`,
        outcome: 'successful',
        participants: ['system'],
        createdBy: 'current_user'
      });

      return true;
    } catch (error) {
      logger.error('Erro ao mover lead entre estágios:', error);
      return false;
    }
  }

  private initializeDefaultPipelines(): Pipeline[] {
    const defaultPipelines: Pipeline[] = [
      {
        id: 'pipeline_default_sales',
        name: 'Vendas Padrão',
        description: 'Pipeline padrão para vendas de estruturas metálicas',
        businessType: 'estruturas_metalicas',
        stages: [
          {
            id: 'stage_lead',
            name: 'Lead Qualificado',
            description: 'Lead inicial com interesse demonstrado',
            color: '#3b82f6',
            order: 0,
            automations: [],
            expectedDuration: 2,
            conversionRate: 0.8,
            isClosedWon: false,
            isClosedLost: false
          },
          {
            id: 'stage_contact',
            name: 'Primeiro Contato',
            description: 'Primeiro contato realizado com sucesso',
            color: '#8b5cf6',
            order: 1,
            automations: [],
            expectedDuration: 3,
            conversionRate: 0.7,
            isClosedWon: false,
            isClosedLost: false
          },
          {
            id: 'stage_proposal',
            name: 'Proposta Enviada',
            description: 'Proposta comercial enviada ao cliente',
            color: '#f59e0b',
            order: 2,
            automations: [],
            expectedDuration: 7,
            conversionRate: 0.6,
            isClosedWon: false,
            isClosedLost: false
          },
          {
            id: 'stage_negotiation',
            name: 'Negociação',
            description: 'Em processo de negociação de termos',
            color: '#ef4444',
            order: 3,
            automations: [],
            expectedDuration: 5,
            conversionRate: 0.5,
            isClosedWon: false,
            isClosedLost: false
          },
          {
            id: 'stage_won',
            name: 'Fechado - Ganho',
            description: 'Negócio fechado com sucesso',
            color: '#10b981',
            order: 4,
            automations: [],
            expectedDuration: 0,
            conversionRate: 1.0,
            isClosedWon: true,
            isClosedLost: false
          },
          {
            id: 'stage_lost',
            name: 'Fechado - Perdido',
            description: 'Negócio perdido',
            color: '#6b7280',
            order: 5,
            automations: [],
            expectedDuration: 0,
            conversionRate: 0,
            isClosedWon: false,
            isClosedLost: true
          }
        ],
        isDefault: true,
        createdAt: new Date().toISOString(),
        createdBy: 'system'
      },
      {
        id: 'pipeline_maintenance',
        name: 'Manutenção Industrial',
        description: 'Pipeline específico para serviços de manutenção',
        businessType: 'manutencao',
        stages: [
          {
            id: 'stage_urgency',
            name: 'Avaliação de Urgência',
            description: 'Classificação da urgência do serviço',
            color: '#dc2626',
            order: 0,
            automations: [],
            expectedDuration: 1,
            conversionRate: 0.9,
            isClosedWon: false,
            isClosedLost: false
          },
          {
            id: 'stage_diagnosis',
            name: 'Diagnóstico',
            description: 'Análise técnica do problema',
            color: '#f59e0b',
            order: 1,
            automations: [],
            expectedDuration: 2,
            conversionRate: 0.8,
            isClosedWon: false,
            isClosedLost: false
          },
          {
            id: 'stage_quotation',
            name: 'Orçamento',
            description: 'Elaboração e envio de orçamento',
            color: '#3b82f6',
            order: 2,
            automations: [],
            expectedDuration: 1,
            conversionRate: 0.7,
            isClosedWon: false,
            isClosedLost: false
          },
          {
            id: 'stage_execution',
            name: 'Execução',
            description: 'Execução do serviço de manutenção',
            color: '#8b5cf6',
            order: 3,
            automations: [],
            expectedDuration: 3,
            conversionRate: 0.9,
            isClosedWon: false,
            isClosedLost: false
          },
          {
            id: 'stage_completed',
            name: 'Concluído',
            description: 'Serviço concluído com sucesso',
            color: '#10b981',
            order: 4,
            automations: [],
            expectedDuration: 0,
            conversionRate: 1.0,
            isClosedWon: true,
            isClosedLost: false
          }
        ],
        isDefault: false,
        createdAt: new Date().toISOString(),
        createdBy: 'system'
      }
    ];

    this.savePipelines(defaultPipelines);
    return defaultPipelines;
  }

  // 💰 Opportunity Management
  getOpportunities(): Opportunity[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.OPPORTUNITIES);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      logger.error('Erro ao carregar oportunidades:', error);
      return [];
    }
  }

  createOpportunity(
    leadId: string,
    title: string,
    description: string,
    value: number,
    expectedCloseDate: string,
    stage: string
  ): Opportunity {
    try {
      const opportunity: Opportunity = {
        id: `opp_${Date.now()}`,
        title,
        description,
        value,
        currency: 'BRL',
        probability: this.calculateInitialProbability(stage, value),
        expectedCloseDate,
        stage,
        source: 'lead_conversion',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'current_user',
        assignedTo: 'current_user'
      };

      const opportunities = this.getOpportunities();
      opportunities.push(opportunity);
      this.saveOpportunities(opportunities);

      return opportunity;
    } catch (error) {
      logger.error('Erro ao criar oportunidade:', error);
      throw error;
    }
  }

  updateOpportunity(opportunityId: string, updates: Partial<Opportunity>): boolean {
    try {
      const opportunities = this.getOpportunities();
      const index = opportunities.findIndex(o => o.id === opportunityId);

      if (index === -1) return false;

      opportunities[index] = {
        ...opportunities[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      this.saveOpportunities(opportunities);
      return true;
    } catch (error) {
      logger.error('Erro ao atualizar oportunidade:', error);
      return false;
    }
  }

  deleteOpportunity(opportunityId: string): boolean {
    try {
      const opportunities = this.getOpportunities();
      const filtered = opportunities.filter(o => o.id !== opportunityId);
      this.saveOpportunities(filtered);
      return true;
    } catch (error) {
      logger.error('Erro ao deletar oportunidade:', error);
      return false;
    }
  }

  getOpportunitiesByStage(stage: string): Opportunity[] {
    return this.getOpportunities().filter(opp => opp.stage === stage);
  }

  getTotalPipelineValue(): number {
    return this.getOpportunities().reduce((total, opp) => total + opp.value, 0);
  }

  getWeightedPipelineValue(): number {
    return this.getOpportunities().reduce((total, opp) => {
      return total + (opp.value * (opp.probability / 100));
    }, 0);
  }

  private calculateInitialProbability(stage: string, value: number): number {
    // Base probability based on stage
    const stageProbabilities: Record<string, number> = {
      'stage_lead': 20,
      'stage_contact': 30,
      'stage_proposal': 50,
      'stage_negotiation': 70,
      'stage_won': 100,
      'stage_lost': 0
    };

    let probability = stageProbabilities[stage] || 30;

    // Adjust based on value (higher value = slightly lower probability)
    if (value > 50000) probability *= 0.9;
    if (value > 100000) probability *= 0.85;

    return Math.max(0, Math.min(100, probability));
  }

  // 📞 Interaction Management
  getInteractions(leadId?: string): Interaction[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.INTERACTIONS);
      const allInteractions = stored ? JSON.parse(stored) : [];

      if (leadId) {
        return allInteractions.filter((interaction: Interaction) =>
          interaction.participants.includes(leadId)
        );
      }

      return allInteractions;
    } catch (error) {
      logger.error('Erro ao carregar interações:', error);
      return [];
    }
  }

  addInteraction(
    leadId: string,
    interaction: Omit<Interaction, 'id' | 'createdAt'>
  ): Interaction {
    try {
      const newInteraction: Interaction = {
        ...interaction,
        id: `int_${Date.now()}`,
        createdAt: new Date().toISOString(),
        participants: [...(interaction.participants || []), leadId]
      };

      const interactions = this.getInteractions();
      interactions.push(newInteraction);
      this.saveInteractions(interactions);

      return newInteraction;
    } catch (error) {
      logger.error('Erro ao adicionar interação:', error);
      throw error;
    }
  }

  updateInteraction(interactionId: string, updates: Partial<Interaction>): boolean {
    try {
      const interactions = this.getInteractions();
      const index = interactions.findIndex(i => i.id === interactionId);

      if (index === -1) return false;

      interactions[index] = { ...interactions[index], ...updates };
      this.saveInteractions(interactions);
      return true;
    } catch (error) {
      logger.error('Erro ao atualizar interação:', error);
      return false;
    }
  }

  deleteInteraction(interactionId: string): boolean {
    try {
      const interactions = this.getInteractions();
      const filtered = interactions.filter(i => i.id !== interactionId);
      this.saveInteractions(filtered);
      return true;
    } catch (error) {
      logger.error('Erro ao deletar interação:', error);
      return false;
    }
  }

  getInteractionsByType(type: Interaction['type']): Interaction[] {
    return this.getInteractions().filter(interaction => interaction.type === type);
  }

  getInteractionsByDateRange(startDate: string, endDate: string): Interaction[] {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return this.getInteractions().filter(interaction => {
      const interactionDate = new Date(interaction.createdAt);
      return interactionDate >= start && interactionDate <= end;
    });
  }

  // 📊 Lead Scoring System
  calculateLeadScore(lead: Lead): LeadScoring {
    try {
      const factors = this.getScoringFactors(lead);
      const score = this.computeScore(factors);

      const scoring: LeadScoring = {
        id: `score_${lead.id}`,
        leadId: lead.id,
        score,
        factors,
        lastCalculated: new Date().toISOString(),
        history: this.getScoreHistory(lead.id)
      };

      this.saveLeadScoring(scoring);
      return scoring;
    } catch (error) {
      logger.error('Erro ao calcular pontuação do lead:', error);
      throw error;
    }
  }

  private getScoringFactors(lead: Lead): ScoringFactor[] {
    const factors: ScoringFactor[] = [];

    // Demographic factors
    factors.push({
      factor: 'Fonte do Lead',
      value: lead.source || 'unknown',
      points: this.getSourcePoints(lead.source),
      weight: 0.15,
      description: `Origem: ${lead.source || 'não informado'}`
    });

    // Behavioral factors
    const engagementLevel = (lead.notes?.length || 0) + (lead.communications?.length || 0);
    factors.push({
      factor: 'Nível de Engajamento',
      value: engagementLevel,
      points: Math.min(engagementLevel * 5, 25),
      weight: 0.25,
      description: `${engagementLevel} interações registradas`
    });

    // Timing factors
    const daysOld = this.getDaysOld(lead.createdAt);
    factors.push({
      factor: 'Tempo no Sistema',
      value: daysOld,
      points: this.getTimingPoints(daysOld),
      weight: 0.1,
      description: `${daysOld} dias desde criação`
    });

    // Priority factor
    factors.push({
      factor: 'Prioridade',
      value: lead.priority || 'medium',
      points: this.getPriorityPoints(lead.priority),
      weight: 0.2,
      description: `Prioridade: ${lead.priority || 'média'}`
    });

    // Status factor
    factors.push({
      factor: 'Status Atual',
      value: lead.status,
      points: this.getStatusPoints(lead.status),
      weight: 0.15,
      description: `Status: ${lead.status}`
    });

    // Tags factor
    const tagCount = lead.tags?.length || 0;
    factors.push({
      factor: 'Categorização',
      value: tagCount,
      points: Math.min(tagCount * 3, 15),
      weight: 0.1,
      description: `${tagCount} tags aplicadas`
    });

    // Assignment factor
    factors.push({
      factor: 'Responsável Atribuído',
      value: lead.assignedTo ? 'assigned' : 'unassigned',
      points: lead.assignedTo ? 10 : 0,
      weight: 0.05,
      description: lead.assignedTo ? 'Responsável definido' : 'Sem responsável'
    });

    return factors;
  }

  private getSourcePoints(source?: string): number {
    const sourceScores: Record<string, number> = {
      'indicação': 25,
      'referência': 20,
      'site': 15,
      'google': 12,
      'facebook': 10,
      'instagram': 8,
      'whatsapp': 15,
      'telefone': 18,
      'email': 12,
      'outros': 5
    };

    return sourceScores[source || 'outros'] || 5;
  }

  private getTimingPoints(daysOld: number): number {
    if (daysOld <= 1) return 20; // Very recent
    if (daysOld <= 3) return 15; // Recent
    if (daysOld <= 7) return 10; // Week old
    if (daysOld <= 30) return 5; // Month old
    return 0; // Very old
  }

  private getPriorityPoints(priority?: string): number {
    const priorityScores = {
      'high': 20,
      'medium': 10,
      'low': 5
    };

    return priorityScores[priority as keyof typeof priorityScores] || 10;
  }

  private getStatusPoints(status: string): number {
    const statusScores = {
      'novo': 10,
      'em_andamento': 20,
      'concluido': 0 // Already converted
    };

    return statusScores[status as keyof typeof statusScores] || 10;
  }

  private computeScore(factors: ScoringFactor[]): number {
    const totalScore = factors.reduce((sum, factor) => {
      return sum + (factor.points * factor.weight);
    }, 0);

    return Math.max(0, Math.min(100, Math.round(totalScore)));
  }

  private getScoreHistory(leadId: string): ScoreHistory[] {
    try {
      const allScoring = this.getAllLeadScoring();
      const previousScoring = allScoring.find(s => s.leadId === leadId);

      if (!previousScoring) return [];

      return previousScoring.history || [];
    } catch (error) {
      logger.error('Erro ao buscar histórico de pontuação:', error);
      return [];
    }
  }

  getLeadScoring(leadId: string): LeadScoring | null {
    try {
      const allScoring = this.getAllLeadScoring();
      return allScoring.find(s => s.leadId === leadId) || null;
    } catch (error) {
      logger.error('Erro ao buscar pontuação do lead:', error);
      return null;
    }
  }

  getAllLeadScoring(): LeadScoring[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.LEAD_SCORING);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      logger.error('Erro ao carregar pontuações:', error);
      return [];
    }
  }

  getTopScoredLeads(limit: number = 10): LeadScoring[] {
    return this.getAllLeadScoring()
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // 📈 Advanced Analytics
  generateAdvancedAnalytics(leads: Lead[]): AdvancedAnalytics {
    try {
      return {
        conversionFunnel: this.generateFunnelData(leads),
        cohortAnalysis: this.generateCohortData(leads),
        leadSources: this.generateSourceAnalytics(leads),
        teamPerformance: this.generateTeamPerformance(leads),
        predictiveInsights: [],
        benchmarks: []
      };
    } catch (error) {
      logger.error('Erro ao gerar analytics avançados:', error);
      throw error;
    }
  }

  private generateFunnelData(leads: Lead[]): FunnelData {
    const pipeline = this.getPipelines()[0]; // Use default pipeline
    const stages: FunnelStage[] = [];
    const dropOffReasons: DropOffReason[] = [];

    pipeline.stages.forEach((stage, index) => {
      const count = leads.filter(lead => lead.pipelineStage === stage.id).length;
      const percentage = leads.length > 0 ? (count / leads.length) * 100 : 0;

      const prevStageCount = index > 0 ? stages[index - 1].count : leads.length;
      const dropOffRate = prevStageCount > 0 ? ((prevStageCount - count) / prevStageCount) * 100 : 0;

      stages.push({
        name: stage.name,
        count,
        percentage,
        dropOffRate
      });
    });

    // Generate drop-off reasons (simplified)
    dropOffReasons.push(
      {
        reason: 'Falta de orçamento',
        count: Math.floor(leads.length * 0.3),
        percentage: 30,
        suggestions: ['Oferecer opções de financiamento', 'Criar propostas modulares']
      },
      {
        reason: 'Timing inadequado',
        count: Math.floor(leads.length * 0.25),
        percentage: 25,
        suggestions: ['Programa de nurturing', 'Follow-up programado']
      }
    );

    return {
      stages,
      conversionRates: stages.map(s => s.percentage),
      dropOffReasons,
      averageTimeByStage: pipeline.stages.map(s => s.expectedDuration)
    };
  }

  private generateCohortData(leads: Lead[]): CohortData {
    // Simplified cohort analysis - group by month
    const cohorts: CohortGroup[] = [];
    const periods = ['Mês 1', 'Mês 2', 'Mês 3', 'Mês 4', 'Mês 5', 'Mês 6'];

    // This would normally analyze actual retention data
    cohorts.push({
      period: '2024-09',
      initialSize: leads.filter(l => l.createdAt.startsWith('2024-09')).length,
      retentionByPeriod: [100, 80, 65, 50, 40, 35]
    });

    return {
      periods,
      cohorts,
      retentionRates: cohorts.map(c => c.retentionByPeriod)
    };
  }

  private generateSourceAnalytics(leads: Lead[]): SourceAnalytics[] {
    const sourceMap = new Map<string, Lead[]>();

    leads.forEach(lead => {
      const source = lead.source || 'outros';
      if (!sourceMap.has(source)) {
        sourceMap.set(source, []);
      }
      sourceMap.get(source)!.push(lead);
    });

    return Array.from(sourceMap.entries()).map(([source, sourceLeads]) => {
      const converted = sourceLeads.filter(l => l.status === 'concluido').length;
      const conversionRate = sourceLeads.length > 0 ? (converted / sourceLeads.length) * 100 : 0;

      return {
        source,
        count: sourceLeads.length,
        conversionRate,
        averageValue: 15000, // Simplified - would calculate from opportunities
        cost: 1000, // Simplified - would come from marketing data
        roi: (15000 * converted - 1000) / 1000 * 100,
        trend: 'stable' as const
      };
    });
  }

  private generateTeamPerformance(leads: Lead[]): TeamPerformance[] {
    const userMap = new Map<string, Lead[]>();

    leads.forEach(lead => {
      const user = lead.assignedTo || 'Não atribuído';
      if (!userMap.has(user)) {
        userMap.set(user, []);
      }
      userMap.get(user)!.push(lead);
    });

    return Array.from(userMap.entries()).map(([userId, userLeads]) => {
      const converted = userLeads.filter(l => l.status === 'concluido').length;
      const conversionRate = userLeads.length > 0 ? (converted / userLeads.length) * 100 : 0;

      return {
        userId,
        userName: userId === 'Não atribuído' ? 'Não atribuído' : `Usuário ${userId}`,
        leadsAssigned: userLeads.length,
        leadsConverted: converted,
        conversionRate,
        averageResponseTime: 4, // Simplified - would calculate from interactions
        satisfaction: 85, // Simplified - would come from feedback
        activities: userLeads.reduce((sum, lead) => sum + (lead.notes?.length || 0), 0)
      };
    });
  }

  // 💾 Storage Methods
  private savePipelines(pipelines: Pipeline[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.PIPELINES, JSON.stringify(pipelines));
    } catch (error) {
      logger.error('Erro ao salvar pipelines:', error);
    }
  }

  private saveOpportunities(opportunities: Opportunity[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.OPPORTUNITIES, JSON.stringify(opportunities));
    } catch (error) {
      logger.error('Erro ao salvar oportunidades:', error);
    }
  }

  private saveInteractions(interactions: Interaction[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.INTERACTIONS, JSON.stringify(interactions));
    } catch (error) {
      logger.error('Erro ao salvar interações:', error);
    }
  }

  private saveLeadScoring(scoring: LeadScoring): void {
    try {
      const allScoring = this.getAllLeadScoring();
      const index = allScoring.findIndex(s => s.leadId === scoring.leadId);

      if (index >= 0) {
        allScoring[index] = scoring;
      } else {
        allScoring.push(scoring);
      }

      localStorage.setItem(this.STORAGE_KEYS.LEAD_SCORING, JSON.stringify(allScoring));
    } catch (error) {
      logger.error('Erro ao salvar pontuação do lead:', error);
    }
  }

  // 🛠️ Utility Methods
  private getDaysOld(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // 🔄 Initialize
  initializeCRMSystem(): void {
    try {
      // Initialize default pipelines if they don't exist
      this.getPipelines();

      logger.debug('✅ Sistema CRM inicializado com sucesso');
    } catch (error) {
      logger.error('❌ Erro ao inicializar sistema CRM:', error);
    }
  }
}

export const crmStorage = new CRMStorage();