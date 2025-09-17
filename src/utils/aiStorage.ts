import {
  Lead,
  AIAnalysis,
  AIRecommendation,
  ConversionPrediction,
  ConversionFactor,
  DuplicateDetection,
  DuplicateMatch,
  ChatbotConfig,
  ChatbotQuestion,
  BusinessHours,
  TimeSlot
} from '@/types/lead';

export class AIStorage {
  private readonly STORAGE_KEYS = {
    AI_ANALYSES: 'ferraco_ai_analyses',
    CONVERSION_PREDICTIONS: 'ferraco_conversion_predictions',
    DUPLICATE_DETECTIONS: 'ferraco_duplicate_detections',
    CHATBOT_CONFIG: 'ferraco_chatbot_config',
    CHATBOT_CONVERSATIONS: 'ferraco_chatbot_conversations',
    AI_SETTINGS: 'ferraco_ai_settings'
  };

  // 🧠 AI Analysis and Sentiment
  analyzeLeadSentiment(lead: Lead, messages: string[] = []): AIAnalysis {
    try {
      // Simulated sentiment analysis using keywords and patterns
      const allText = [
        lead.name,
        ...lead.notes?.map(n => n.content) || [],
        ...messages
      ].join(' ').toLowerCase();

      const sentimentScore = this.calculateSentimentScore(allText);
      const sentiment = this.determineSentiment(sentimentScore);
      const keyTopics = this.extractKeyTopics(allText);
      const urgencyLevel = this.determineUrgencyLevel(lead, allText);
      const recommendations = this.generateRecommendations(lead, sentiment, urgencyLevel);

      const analysis: AIAnalysis = {
        sentimentScore,
        sentiment,
        keyTopics,
        urgencyLevel,
        recommendedActions: recommendations,
        confidenceScore: this.calculateConfidenceScore(allText.length, lead),
        lastAnalyzed: new Date().toISOString()
      };

      this.saveAIAnalysis(lead.id, analysis);
      return analysis;
    } catch (error) {
      console.error('Erro na análise de sentimento:', error);
      return this.getDefaultAnalysis();
    }
  }

  private calculateSentimentScore(text: string): number {
    const positiveWords = [
      'ótimo', 'excelente', 'perfeito', 'maravilhoso', 'fantástico', 'adorei',
      'interessado', 'quero', 'preciso', 'urgente', 'importante', 'prioridade',
      'aprovado', 'aceito', 'concordo', 'positivo', 'sim', 'certo', 'ideal'
    ];

    const negativeWords = [
      'ruim', 'péssimo', 'terrível', 'horrível', 'não', 'nunca', 'jamais',
      'impossível', 'difícil', 'problema', 'complicado', 'erro', 'falha',
      'reclamação', 'insatisfeito', 'cancelar', 'desistir', 'chato'
    ];

    const urgentWords = [
      'urgente', 'emergência', 'rápido', 'imediato', 'agora', 'hoje',
      'ontem', 'pressa', 'critical', 'importante'
    ];

    let score = 0;
    const words = text.split(/\s+/);

    words.forEach(word => {
      if (positiveWords.includes(word)) score += 0.1;
      if (negativeWords.includes(word)) score -= 0.1;
      if (urgentWords.includes(word)) score += 0.05;
    });

    // Normalize to -1 to 1 range
    return Math.max(-1, Math.min(1, score));
  }

  private determineSentiment(score: number): 'positive' | 'neutral' | 'negative' {
    if (score > 0.2) return 'positive';
    if (score < -0.2) return 'negative';
    return 'neutral';
  }

  private extractKeyTopics(text: string): string[] {
    const topicKeywords = {
      'Orçamento': ['orçamento', 'preço', 'valor', 'custo', 'investimento', 'dinheiro'],
      'Prazo': ['prazo', 'tempo', 'quando', 'entrega', 'cronograma', 'data'],
      'Qualidade': ['qualidade', 'material', 'acabamento', 'durabilidade', 'garantia'],
      'Urgência': ['urgente', 'emergência', 'rápido', 'imediato', 'pressa'],
      'Dúvidas': ['dúvida', 'pergunta', 'como', 'qual', 'onde', 'porque'],
      'Interesse': ['interessado', 'quero', 'preciso', 'gostaria', 'desejo'],
      'Reclamação': ['problema', 'reclamação', 'insatisfeito', 'erro', 'falha']
    };

    const topics: string[] = [];
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        topics.push(topic);
      }
    });

    return topics.slice(0, 5); // Limit to 5 topics
  }

  private determineUrgencyLevel(lead: Lead, text: string): 'low' | 'medium' | 'high' | 'critical' {
    const urgentKeywords = ['urgente', 'emergência', 'imediato', 'crítico'];
    const daysOld = this.getDaysOld(lead.createdAt);

    if (urgentKeywords.some(word => text.includes(word))) return 'critical';
    if (lead.priority === 'high' || daysOld > 7) return 'high';
    if (lead.priority === 'medium' || daysOld > 3) return 'medium';
    return 'low';
  }

  private generateRecommendations(
    lead: Lead,
    sentiment: 'positive' | 'neutral' | 'negative',
    urgency: 'low' | 'medium' | 'high' | 'critical'
  ): AIRecommendation[] {
    const recommendations: AIRecommendation[] = [];
    const now = new Date().toISOString();

    // Base recommendations based on sentiment
    if (sentiment === 'positive') {
      recommendations.push({
        id: `rec_${Date.now()}_1`,
        type: 'call',
        priority: 'high',
        title: 'Sentimento positivo detectado',
        description: 'O lead demonstra interesse positivo. É o momento ideal para uma ligação.',
        suggestedAction: 'Ligar imediatamente para aproveitar o interesse',
        expectedImpact: 'Alta probabilidade de conversão',
        confidence: 85,
        createdAt: now
      });
    }

    if (sentiment === 'negative') {
      recommendations.push({
        id: `rec_${Date.now()}_2`,
        type: 'whatsapp',
        priority: 'medium',
        title: 'Sentimento negativo identificado',
        description: 'O lead pode ter objeções ou dúvidas. Uma abordagem cuidadosa é recomendada.',
        suggestedAction: 'Enviar mensagem empática via WhatsApp',
        expectedImpact: 'Possível recuperação do interesse',
        confidence: 70,
        createdAt: now
      });
    }

    // Urgency-based recommendations
    if (urgency === 'critical') {
      recommendations.push({
        id: `rec_${Date.now()}_3`,
        type: 'call',
        priority: 'high',
        title: 'Urgência crítica detectada',
        description: 'O lead demonstra urgência extrema. Contato imediato necessário.',
        suggestedAction: 'Contato telefônico imediato',
        expectedImpact: 'Conversão rápida ou perda definitiva',
        confidence: 95,
        createdAt: now
      });
    }

    // Time-based recommendations
    const daysOld = this.getDaysOld(lead.createdAt);
    if (daysOld > 5 && lead.status === 'novo') {
      recommendations.push({
        id: `rec_${Date.now()}_4`,
        type: 'follow_up',
        priority: 'medium',
        title: 'Lead sem contato há muito tempo',
        description: `Lead criado há ${daysOld} dias sem progressão de status.`,
        suggestedAction: 'Fazer follow-up para reativar interesse',
        expectedImpact: 'Evitar perda por abandono',
        confidence: 75,
        createdAt: now
      });
    }

    // Status-based recommendations
    if (lead.status === 'em_andamento' && !lead.nextFollowUp) {
      recommendations.push({
        id: `rec_${Date.now()}_5`,
        type: 'follow_up',
        priority: 'medium',
        title: 'Lead em andamento sem follow-up agendado',
        description: 'Lead em progresso precisa de próxima ação definida.',
        suggestedAction: 'Agendar próximo contato',
        expectedImpact: 'Manter momentum de conversão',
        confidence: 80,
        createdAt: now
      });
    }

    return recommendations.slice(0, 3); // Limit to 3 recommendations
  }

  private calculateConfidenceScore(textLength: number, lead: Lead): number {
    let confidence = 50; // Base confidence

    // More text = more confidence
    confidence += Math.min(textLength / 50, 30);

    // More notes = more confidence
    confidence += (lead.notes?.length || 0) * 5;

    // Recent activity = more confidence
    const daysOld = this.getDaysOld(lead.updatedAt);
    confidence += Math.max(0, 20 - daysOld);

    return Math.min(100, Math.max(0, confidence));
  }

  // 📊 Conversion Prediction
  predictConversion(lead: Lead): ConversionPrediction {
    try {
      const factors = this.analyzeConversionFactors(lead);
      const probability = this.calculateConversionProbability(factors);
      const confidence = this.calculatePredictionConfidence(lead, factors);
      const estimatedTime = this.estimateConversionTime(lead, factors);
      const suggestions = this.generateConversionSuggestions(factors);

      const prediction: ConversionPrediction = {
        probability,
        confidence,
        factors,
        estimatedTimeToConversion: estimatedTime,
        suggestedActions: suggestions,
        lastUpdated: new Date().toISOString()
      };

      this.saveConversionPrediction(lead.id, prediction);
      return prediction;
    } catch (error) {
      console.error('Erro na previsão de conversão:', error);
      return this.getDefaultPrediction();
    }
  }

  private analyzeConversionFactors(lead: Lead): ConversionFactor[] {
    const factors: ConversionFactor[] = [];

    // Response time factor
    const responseTime = this.calculateAverageResponseTime(lead);
    factors.push({
      factor: 'Tempo de Resposta',
      impact: responseTime < 2 ? 'positive' : responseTime > 24 ? 'negative' : 'neutral',
      weight: 0.2,
      description: `Tempo médio de resposta: ${responseTime}h`
    });

    // Engagement factor
    const engagement = (lead.notes?.length || 0) + (lead.communications?.length || 0);
    factors.push({
      factor: 'Engajamento',
      impact: engagement > 5 ? 'positive' : engagement < 2 ? 'negative' : 'neutral',
      weight: 0.25,
      description: `${engagement} interações registradas`
    });

    // Time factor
    const daysOld = this.getDaysOld(lead.createdAt);
    factors.push({
      factor: 'Tempo no Pipeline',
      impact: daysOld < 7 ? 'positive' : daysOld > 30 ? 'negative' : 'neutral',
      weight: 0.15,
      description: `${daysOld} dias desde criação`
    });

    // Source factor
    const highValueSources = ['indicação', 'referência', 'site'];
    factors.push({
      factor: 'Fonte do Lead',
      impact: highValueSources.includes(lead.source || '') ? 'positive' : 'neutral',
      weight: 0.1,
      description: `Origem: ${lead.source || 'não informado'}`
    });

    // Priority factor
    factors.push({
      factor: 'Prioridade',
      impact: lead.priority === 'high' ? 'positive' : lead.priority === 'low' ? 'negative' : 'neutral',
      weight: 0.15,
      description: `Prioridade: ${lead.priority || 'média'}`
    });

    // Tags factor
    const tagCount = lead.tags?.length || 0;
    factors.push({
      factor: 'Categorização',
      impact: tagCount > 2 ? 'positive' : tagCount === 0 ? 'negative' : 'neutral',
      weight: 0.1,
      description: `${tagCount} tags aplicadas`
    });

    // Status progression factor
    factors.push({
      factor: 'Progressão de Status',
      impact: lead.status === 'em_andamento' ? 'positive' : lead.status === 'novo' ? 'neutral' : 'positive',
      weight: 0.05,
      description: `Status atual: ${lead.status}`
    });

    return factors;
  }

  private calculateConversionProbability(factors: ConversionFactor[]): number {
    let score = 50; // Base probability

    factors.forEach(factor => {
      const impact = factor.impact === 'positive' ? 1 : factor.impact === 'negative' ? -1 : 0;
      score += (impact * factor.weight * 100);
    });

    return Math.max(0, Math.min(100, score));
  }

  private calculatePredictionConfidence(lead: Lead, factors: ConversionFactor[]): number {
    let confidence = 60; // Base confidence

    // More data = more confidence
    const dataPoints = (lead.notes?.length || 0) + (lead.communications?.length || 0);
    confidence += Math.min(dataPoints * 3, 25);

    // Consistent factors = more confidence
    const positiveFactors = factors.filter(f => f.impact === 'positive').length;
    const negativeFactors = factors.filter(f => f.impact === 'negative').length;
    const consistency = Math.abs(positiveFactors - negativeFactors) / factors.length;
    confidence += consistency * 15;

    return Math.max(50, Math.min(95, confidence));
  }

  private estimateConversionTime(lead: Lead, factors: ConversionFactor[]): number {
    let baseDays = 14; // Default conversion time

    // Adjust based on priority
    if (lead.priority === 'high') baseDays *= 0.7;
    if (lead.priority === 'low') baseDays *= 1.5;

    // Adjust based on positive/negative factors
    const positiveFactors = factors.filter(f => f.impact === 'positive').length;
    const negativeFactors = factors.filter(f => f.impact === 'negative').length;

    baseDays *= (1 - (positiveFactors * 0.1)) + (negativeFactors * 0.15);

    return Math.max(1, Math.round(baseDays));
  }

  private generateConversionSuggestions(factors: ConversionFactor[]): string[] {
    const suggestions: string[] = [];

    const negativeFactors = factors.filter(f => f.impact === 'negative');

    negativeFactors.forEach(factor => {
      switch (factor.factor) {
        case 'Tempo de Resposta':
          suggestions.push('Melhorar tempo de resposta para menos de 2 horas');
          break;
        case 'Engajamento':
          suggestions.push('Aumentar frequência de contato e interações');
          break;
        case 'Tempo no Pipeline':
          suggestions.push('Acelerar processo com ações mais assertivas');
          break;
        case 'Categorização':
          suggestions.push('Adicionar tags relevantes para melhor segmentação');
          break;
        case 'Prioridade':
          suggestions.push('Reavaliar e possivelmente aumentar prioridade');
          break;
      }
    });

    if (suggestions.length === 0) {
      suggestions.push('Manter estratégia atual - fatores positivos predominam');
    }

    return suggestions.slice(0, 3);
  }

  // 🔍 Duplicate Detection
  detectDuplicates(newLead: Lead, allLeads: Lead[]): DuplicateDetection[] {
    try {
      const detections: DuplicateDetection[] = [];

      const potentialDuplicates = this.findPotentialDuplicates(newLead, allLeads);

      if (potentialDuplicates.length > 0) {
        const detection: DuplicateDetection = {
          id: `dup_${Date.now()}`,
          leadId: newLead.id,
          potentialDuplicates,
          confidence: this.calculateDuplicateConfidence(potentialDuplicates),
          status: 'pending'
        };

        detections.push(detection);
        this.saveDuplicateDetection(detection);
      }

      return detections;
    } catch (error) {
      console.error('Erro na detecção de duplicatas:', error);
      return [];
    }
  }

  private findPotentialDuplicates(lead: Lead, allLeads: Lead[]): DuplicateMatch[] {
    const matches: DuplicateMatch[] = [];

    allLeads.forEach(otherLead => {
      if (otherLead.id === lead.id) return;

      const similarity = this.calculateSimilarity(lead, otherLead);
      const matchingFields = this.getMatchingFields(lead, otherLead);

      if (similarity > 0.7) { // 70% similarity threshold
        matches.push({
          leadId: otherLead.id,
          similarity,
          matchingFields,
          suggestedAction: similarity > 0.9 ? 'merge' : similarity > 0.8 ? 'needs_review' : 'keep_separate'
        });
      }
    });

    return matches.sort((a, b) => b.similarity - a.similarity);
  }

  private calculateSimilarity(lead1: Lead, lead2: Lead): number {
    let matches = 0;
    let totalFields = 0;

    // Phone comparison (highest weight)
    if (lead1.phone && lead2.phone) {
      totalFields += 3;
      const phone1 = this.normalizePhone(lead1.phone);
      const phone2 = this.normalizePhone(lead2.phone);
      if (phone1 === phone2) matches += 3;
    }

    // Name comparison
    if (lead1.name && lead2.name) {
      totalFields += 2;
      const similarity = this.stringsSimilarity(lead1.name.toLowerCase(), lead2.name.toLowerCase());
      matches += similarity * 2;
    }

    // Email comparison (if available in future)
    // Source comparison
    if (lead1.source && lead2.source && lead1.source === lead2.source) {
      totalFields += 1;
      matches += 1;
    }

    return totalFields > 0 ? matches / totalFields : 0;
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, ''); // Remove all non-digit characters
  }

  private stringsSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  private getMatchingFields(lead1: Lead, lead2: Lead): string[] {
    const matching: string[] = [];

    if (this.normalizePhone(lead1.phone) === this.normalizePhone(lead2.phone)) {
      matching.push('phone');
    }

    if (this.stringsSimilarity(lead1.name.toLowerCase(), lead2.name.toLowerCase()) > 0.8) {
      matching.push('name');
    }

    if (lead1.source === lead2.source) {
      matching.push('source');
    }

    return matching;
  }

  private calculateDuplicateConfidence(matches: DuplicateMatch[]): number {
    if (matches.length === 0) return 0;

    const maxSimilarity = Math.max(...matches.map(m => m.similarity));
    const avgSimilarity = matches.reduce((sum, m) => sum + m.similarity, 0) / matches.length;

    return (maxSimilarity * 0.7 + avgSimilarity * 0.3) * 100;
  }

  // 🤖 Chatbot Configuration
  getChatbotConfig(): ChatbotConfig {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.CHATBOT_CONFIG);
      return stored ? JSON.parse(stored) : this.getDefaultChatbotConfig();
    } catch (error) {
      console.error('Erro ao carregar configuração do chatbot:', error);
      return this.getDefaultChatbotConfig();
    }
  }

  updateChatbotConfig(config: Partial<ChatbotConfig>): void {
    try {
      const current = this.getChatbotConfig();
      const updated = { ...current, ...config };
      localStorage.setItem(this.STORAGE_KEYS.CHATBOT_CONFIG, JSON.stringify(updated));
    } catch (error) {
      console.error('Erro ao salvar configuração do chatbot:', error);
    }
  }

  private getDefaultChatbotConfig(): ChatbotConfig {
    return {
      isEnabled: true,
      welcomeMessage: "Olá! 👋 Sou o assistente virtual da Ferraco. Como posso ajudá-lo hoje?",
      fallbackMessage: "Desculpe, não consegui entender. Um de nossos especialistas entrará em contato em breve.",
      qualificationQuestions: [
        {
          id: '1',
          question: "Qual é o seu nome?",
          type: 'text',
          isRequired: true,
          order: 1
        },
        {
          id: '2',
          question: "Qual é o seu WhatsApp?",
          type: 'phone',
          isRequired: true,
          order: 2
        },
        {
          id: '3',
          question: "Que tipo de serviço você precisa?",
          type: 'multiple_choice',
          options: [
            'Estruturas Metálicas',
            'Serralheria',
            'Soldas Especiais',
            'Manutenção Industrial',
            'Outros'
          ],
          isRequired: true,
          order: 3
        },
        {
          id: '4',
          question: "Qual a urgência do seu projeto?",
          type: 'multiple_choice',
          options: [
            'Muito urgente (1-3 dias)',
            'Urgente (1 semana)',
            'Normal (2-4 semanas)',
            'Não tenho pressa'
          ],
          isRequired: false,
          order: 4
        }
      ],
      handoffTriggers: [
        'falar com humano',
        'atendente',
        'não entendi',
        'complicado'
      ],
      businessHours: this.getDefaultBusinessHours()
    };
  }

  private getDefaultBusinessHours(): BusinessHours {
    const workingHours: TimeSlot = { isOpen: true, start: '08:00', end: '18:00' };
    const closedHours: TimeSlot = { isOpen: false, start: '00:00', end: '00:00' };

    return {
      monday: workingHours,
      tuesday: workingHours,
      wednesday: workingHours,
      thursday: workingHours,
      friday: workingHours,
      saturday: { isOpen: true, start: '08:00', end: '12:00' },
      sunday: closedHours,
      timezone: 'America/Sao_Paulo'
    };
  }

  // 📚 Storage Methods
  private saveAIAnalysis(leadId: string, analysis: AIAnalysis): void {
    try {
      const analyses = this.getAllAIAnalyses();
      analyses[leadId] = analysis;
      localStorage.setItem(this.STORAGE_KEYS.AI_ANALYSES, JSON.stringify(analyses));
    } catch (error) {
      console.error('Erro ao salvar análise de IA:', error);
    }
  }

  private saveConversionPrediction(leadId: string, prediction: ConversionPrediction): void {
    try {
      const predictions = this.getAllConversionPredictions();
      predictions[leadId] = prediction;
      localStorage.setItem(this.STORAGE_KEYS.CONVERSION_PREDICTIONS, JSON.stringify(predictions));
    } catch (error) {
      console.error('Erro ao salvar previsão de conversão:', error);
    }
  }

  private saveDuplicateDetection(detection: DuplicateDetection): void {
    try {
      const detections = this.getAllDuplicateDetections();
      detections.push(detection);
      localStorage.setItem(this.STORAGE_KEYS.DUPLICATE_DETECTIONS, JSON.stringify(detections));
    } catch (error) {
      console.error('Erro ao salvar detecção de duplicata:', error);
    }
  }

  // 📖 Getters
  getAIAnalysis(leadId: string): AIAnalysis | null {
    try {
      const analyses = this.getAllAIAnalyses();
      return analyses[leadId] || null;
    } catch (error) {
      console.error('Erro ao buscar análise de IA:', error);
      return null;
    }
  }

  getConversionPrediction(leadId: string): ConversionPrediction | null {
    try {
      const predictions = this.getAllConversionPredictions();
      return predictions[leadId] || null;
    } catch (error) {
      console.error('Erro ao buscar previsão de conversão:', error);
      return null;
    }
  }

  getAllDuplicateDetections(): DuplicateDetection[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.DUPLICATE_DETECTIONS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erro ao buscar detecções de duplicata:', error);
      return [];
    }
  }

  private getAllAIAnalyses(): Record<string, AIAnalysis> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.AI_ANALYSES);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Erro ao buscar análises de IA:', error);
      return {};
    }
  }

  private getAllConversionPredictions(): Record<string, ConversionPrediction> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.CONVERSION_PREDICTIONS);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Erro ao buscar previsões de conversão:', error);
      return {};
    }
  }

  // 🛠️ Utility Methods
  private getDaysOld(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private calculateAverageResponseTime(lead: Lead): number {
    // Simplified calculation - in a real scenario, this would analyze communication timestamps
    const daysOld = this.getDaysOld(lead.createdAt);
    const responses = lead.communications?.length || 1;
    return Math.round((daysOld * 24) / responses); // Average hours between responses
  }

  private getDefaultAnalysis(): AIAnalysis {
    return {
      sentimentScore: 0,
      sentiment: 'neutral',
      keyTopics: [],
      urgencyLevel: 'low',
      recommendedActions: [],
      confidenceScore: 50,
      lastAnalyzed: new Date().toISOString()
    };
  }

  private getDefaultPrediction(): ConversionPrediction {
    return {
      probability: 50,
      confidence: 50,
      factors: [],
      estimatedTimeToConversion: 14,
      suggestedActions: ['Realizar análise manual'],
      lastUpdated: new Date().toISOString()
    };
  }

  // 🔄 Initialize
  initializeAISystem(): void {
    try {
      // Create default configurations if they don't exist
      if (!localStorage.getItem(this.STORAGE_KEYS.CHATBOT_CONFIG)) {
        this.updateChatbotConfig(this.getDefaultChatbotConfig());
      }

      console.log('✅ Sistema de IA inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar sistema de IA:', error);
    }
  }
}

export const aiStorage = new AIStorage();