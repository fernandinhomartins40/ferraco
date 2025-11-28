/**
 * WhatsApp Automation Service (Enhanced)
 *
 * Serviço responsável por automatizar o envio de informações de produtos
 * via WhatsApp após a captação de leads pelo chatbot.
 *
 * Features:
 * - Validação robusta com fuzzy matching
 * - Fila de processamento com retry automático
 * - Rate limiting inteligente
 * - Logs detalhados e monitoramento
 */

import { prisma } from '../config/database';
import { whatsappWebJSService } from './whatsappWebJS.service';
import { logger } from '../utils/logger';
import { whatsappAntiSpamService } from './whatsappAntiSpam.service';
import type { ProductMatch, ValidationResult } from '../modules/whatsapp-automation/whatsapp-automation.types';
import type { RecurrenceResult } from './leadRecurrence.service';
import { recurrenceMessageTemplateService } from './recurrenceMessageTemplate.service';
import { isValidWhatsAppNumber, hasWhatsAppOptIn } from '../utils/whatsappValidation';

export class WhatsAppAutomationService {
  private queue: Map<string, { priority: number; retryCount: number }> = new Map();
  private isProcessingQueue = false;
  private readonly MAX_RETRY_COUNT = 3;
  private readonly RETRY_DELAY_MS = 60000; // 1 minuto

  /**
   * Cria automação WhatsApp a partir de um lead capturado
   * Extrai produtos de interesse do metadata do lead
   * @returns ID da automação criada ou null se falhar
   */
  async createAutomationFromLead(leadId: string): Promise<string | null> {
    try {
      // Buscar lead
      const lead = await prisma.lead.findUnique({
        where: { id: leadId }
      });

      if (!lead) {
        logger.warn(`⚠️  Lead ${leadId} não encontrado`);
        return null;
      }

      // ✅ VALIDAÇÃO CRÍTICA: Verificar se telefone é WhatsApp válido
      if (!isValidWhatsAppNumber(lead.phone)) {
        logger.warn(
          `⚠️  Lead ${leadId} (${lead.name}) possui telefone inválido para WhatsApp: ${lead.phone}\n` +
          `   Automação não será criada. Telefone fixo ou formato inválido detectado.`
        );
        return null;
      }

      // ✅ VALIDAÇÃO: Verificar opt-in (opcional - pode ser comentado se muito restritivo)
      // Descomente as linhas abaixo para exigir opt-in explícito
      // if (!lead.whatsappOptIn) {
      //   logger.warn(
      //     `⚠️  Lead ${leadId} (${lead.name}) não autorizou contato via WhatsApp\n` +
      //     `   Automação não será criada. Necessário opt-in explícito.`
      //   );
      //   return null;
      // }

      // Extrair interesse do metadata
      const metadata = JSON.parse(lead.metadata || '{}');
      const leadSource = lead.source || metadata.source;

      // ⭐ PRIORIZAR selectedProducts (IDs) sobre interest (nomes com emoji)
      let interest = metadata.selectedProducts || metadata.interest;

      if (!interest || (Array.isArray(interest) && interest.length === 0)) {
        logger.info(`ℹ️  Lead ${leadId} (${lead.name}) não manifestou interesse em produtos`);

        // ✅ CORREÇÃO: Detectar cenário e criar automação apropriada
        let templateTrigger = null;

        // 1. Modal de orçamento
        if (leadSource === 'modal-orcamento') {
          templateTrigger = 'modal_orcamento';
          logger.info(`   📝 Detectado lead do modal de orçamento - enviando mensagem de boas-vindas`);
        }
        // 2. Chat: "Falar com a equipe" (vários formatos possíveis)
        else if (metadata.wantsHumanContact || metadata.requiresHumanAttendance || metadata.wants_human) {
          templateTrigger = 'human_contact_request';
          logger.info(`   👨‍💼 Lead solicitou atendimento humano no chat`);
        }
        // 3. Chat: "Só quero conhecer produtos" ou abandono
        else if (leadSource === 'chatbot-web' || leadSource === 'whatsapp-bot') {
          templateTrigger = 'chat_no_interest';
          logger.info(`   💬 Lead do chat sem interesse em produtos - enviando reengajamento`);
        }
        // 4. Landing page ou outros
        else {
          templateTrigger = 'generic_inquiry';
          logger.info(`   ℹ️  Lead sem interesse específico (${leadSource}) - enviando mensagem genérica`);
        }

        return await this.createGenericAutomation(leadId, lead, templateTrigger);
      }

      // Buscar configuração do chatbot para validar produtos
      const config = await prisma.chatbotConfig.findFirst();
      if (!config) {
        logger.error('❌ Chatbot config não encontrado');
        return null;
      }

      const allProducts = JSON.parse(config.products || '[]');

      // Interest pode ser string ou array (IDs ou nomes)
      let productIdentifiers: string[] = [];
      if (Array.isArray(interest)) {
        productIdentifiers = interest.map((p: string) => p.trim());
      } else if (typeof interest === 'string') {
        productIdentifiers = interest.split(',').map((p: string) => p.trim());
      }

      // 🔍 DETECÇÃO INTELIGENTE: ID vs Nome
      const isUsingIds = productIdentifiers.length > 0 &&
                         (productIdentifiers[0].startsWith('prod_') ||
                          productIdentifiers[0].includes('_'));

      logger.info(`🔍 Validando ${productIdentifiers.length} produtos para lead ${leadId}`);
      logger.info(`   Formato detectado: ${isUsingIds ? '🆔 IDs' : '📝 Nomes'}`);
      logger.info(`   Identificadores: ${JSON.stringify(productIdentifiers)}`);
      logger.info(`📦 Catálogo possui ${allProducts.length} produtos disponíveis`);

      if (allProducts.length > 0) {
        logger.info(`   Detalhes: ${allProducts.map((p: any) => {
          const id = p.id || p._id || `prod_${p.name.toLowerCase().replace(/\s+/g, '_')}`;
          return `${p.name} (ID: ${id})`;
        }).join(', ')}`);
      }

      // ✅ VALIDAÇÃO COM DETECÇÃO AUTOMÁTICA
      const validation = isUsingIds
        ? this.validateProductsByIds(productIdentifiers, allProducts)
        : this.validateProducts(productIdentifiers, allProducts);

      if (validation.matches.length === 0) {
        logger.error(`❌ Lead ${leadId}: nenhum produto válido encontrado`);
        logger.error(`   Identificadores recebidos: ${JSON.stringify(productIdentifiers)}`);
        logger.error(`   Erros: ${validation.errors.join(', ')}`);
        return null;
      }

      // ✅ Produtos encontrados
      logger.info(`✅ ${validation.matches.length} produto(s) válido(s) encontrado(s)`);
      logger.info(`   Produtos: ${validation.matches.map(m => `${m.original} → ${m.matched}`).join(', ')}`);

      if (validation.warnings.length > 0) {
        logger.warn(`⚠️  Avisos na validação: ${validation.warnings.join(', ')}`);
      }

      const validProducts = validation.matches.map(m => m.matched);

      // Calcular total de mensagens que serão enviadas
      let totalMessages = 2; // Mensagem inicial + mensagem final

      for (const productName of validProducts) {
        const product = allProducts.find((p: any) =>
          p.name === productName || p.id === productName.toLowerCase()
        );

        if (product) {
          totalMessages += 1; // Texto descritivo do produto
          totalMessages += (product.images?.length || 0);
          totalMessages += (product.videos?.length || 0);
          if (product.specifications && Object.keys(product.specifications).length > 0) {
            totalMessages += 1; // Especificações técnicas
          }
        }
      }

      // Criar automação no banco
      const automation = await prisma.whatsAppAutomation.create({
        data: {
          leadId,
          status: 'PENDING',
          productsToSend: JSON.stringify(validProducts),
          messagesTotal: totalMessages,
          scheduledFor: null // Envio imediato
        }
      });

      logger.info(`✅ Automação ${automation.id} criada para lead ${leadId} (${lead.name})`);
      logger.info(`   Produtos: ${validProducts.join(', ')} (${totalMessages} mensagens)`);

      // Adicionar à fila de processamento
      this.addToQueue(automation.id, 1);

      return automation.id;

    } catch (error) {
      logger.error('❌ Erro ao criar automação WhatsApp:', error);
      return null;
    }
  }

  /**
   * Cria automação genérica para leads sem produtos específicos
   */
  private async createGenericAutomation(
    leadId: string,
    lead: any,
    templateTrigger: string
  ): Promise<string | null> {
    try {
      // ✅ NOVO: Buscar template apropriado
      const template = await prisma.recurrenceMessageTemplate.findFirst({
        where: {
          trigger: templateTrigger,
          isActive: true
        },
        orderBy: { priority: 'desc' }
      });

      if (!template) {
        logger.warn(`⚠️  Template não encontrado para trigger: ${templateTrigger}`);
        // Fallback para template padrão hardcoded
        return await this.createGenericAutomationFallback(leadId, lead, templateTrigger);
      }

      // Calcular total de mensagens (texto + mídias se houver)
      const mediaUrls = template.mediaUrls ? JSON.parse(template.mediaUrls) : [];
      const totalMessages = 1 + mediaUrls.length;

      // ✅ UX: Usar nome amigável ao invés de ID técnico
      const friendlyProductName = this.getTemplateFriendlyName(template.name, templateTrigger);

      const automation = await prisma.whatsAppAutomation.create({
        data: {
          leadId,
          status: 'PENDING',
          productsToSend: JSON.stringify([`TEMPLATE:${template.id}:${friendlyProductName}`]), // ID técnico + nome amigável
          messagesTotal: totalMessages,
          scheduledFor: null
        }
      });

      logger.info(`✅ Automação genérica ${automation.id} criada para lead ${leadId} (${lead.name})`);
      logger.info(`   Template: ${template.name} (${totalMessages} mensagens)`);

      this.addToQueue(automation.id, 2); // Prioridade 2 (alta)

      return automation.id;
    } catch (error) {
      logger.error('❌ Erro ao criar automação genérica:', error);
      return null;
    }
  }

  /**
   * Fallback para quando não há template no banco (usa mensagens hardcoded)
   */
  private async createGenericAutomationFallback(
    leadId: string,
    lead: any,
    templateTrigger: string
  ): Promise<string | null> {
    try {
      logger.info(`⚙️  Usando fallback hardcoded para trigger: ${templateTrigger}`);

      const automation = await prisma.whatsAppAutomation.create({
        data: {
          leadId,
          status: 'PENDING',
          productsToSend: JSON.stringify([`FALLBACK:${templateTrigger}`]),
          messagesTotal: 1,
          scheduledFor: null
        }
      });

      logger.info(`✅ Automação genérica fallback ${automation.id} criada`);
      this.addToQueue(automation.id, 2);

      return automation.id;
    } catch (error) {
      logger.error('❌ Erro ao criar automação genérica fallback:', error);
      return null;
    }
  }

  /**
   * Valida produtos usando IDs (método principal para novos leads)
   * @param productIds - Array de IDs de produtos
   * @param availableProducts - Produtos disponíveis no config
   */
  private validateProductsByIds(productIds: string[], availableProducts: any[]): ValidationResult {
    const errors: string[] = [];
    const matches: ProductMatch[] = [];

    for (const productId of productIds) {
      if (!productId || productId.trim() === '') continue;

      // Busca direta por ID (prioridade máxima)
      const match = availableProducts.find(p => {
        const configId = p.id || p._id || `prod_${p.name.toLowerCase().replace(/\s+/g, '_')}`;
        return configId === productId || configId === productId.toLowerCase();
      });

      if (match) {
        matches.push({
          original: productId,
          matched: match.name, // Retorna NOME para uso posterior no envio
          confidence: 100,
          productData: match
        });
        logger.debug(`✅ Produto encontrado por ID: ${productId} → ${match.name}`);
      } else {
        errors.push(`Produto com ID "${productId}" não encontrado no catálogo`);
        logger.warn(`⚠️  ID "${productId}" não corresponde a nenhum produto`);
      }
    }

    return {
      valid: matches.length > 0,
      errors,
      warnings: [],
      matches
    };
  }

  /**
   * Valida produtos com fuzzy matching (fallback para leads antigos com nomes)
   */
  private validateProducts(requestedProducts: string[], availableProducts: any[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const matches: ProductMatch[] = [];

    for (const requested of requestedProducts) {
      if (!requested || requested.trim() === '') continue;

      // 1. Busca exata
      let match = availableProducts.find(p =>
        p.name === requested ||
        p.id === requested.toLowerCase() ||
        p.name.toLowerCase() === requested.toLowerCase()
      );

      if (match) {
        matches.push({
          original: requested,
          matched: match.name,
          confidence: 100,
          productData: match
        });
        continue;
      }

      // 2. Busca parcial (contém)
      match = availableProducts.find(p =>
        p.name.toLowerCase().includes(requested.toLowerCase()) ||
        requested.toLowerCase().includes(p.name.toLowerCase())
      );

      if (match) {
        matches.push({
          original: requested,
          matched: match.name,
          confidence: 80,
          productData: match
        });
        warnings.push(`Produto "${requested}" corresponde parcialmente a "${match.name}"`);
        continue;
      }

      // 3. Similaridade (Levenshtein distance simples)
      const similar = availableProducts.find(p =>
        this.calculateSimilarity(requested.toLowerCase(), p.name.toLowerCase()) > 0.6
      );

      if (similar) {
        matches.push({
          original: requested,
          matched: similar.name,
          confidence: 60,
          productData: similar
        });
        warnings.push(`Produto "${requested}" pode ser "${similar.name}" (similaridade)`);
        continue;
      }

      // Produto não encontrado
      errors.push(`Produto "${requested}" não encontrado`);
    }

    return {
      valid: matches.length > 0,
      errors,
      warnings,
      matches
    };
  }

  /**
   * Retorna nome amigável para exibir na UI baseado no template
   */
  private getTemplateFriendlyName(templateName: string, trigger: string): string {
    const friendlyNames: Record<string, string> = {
      'modal_orcamento': 'Solicitação de Orçamento',
      'human_contact_request': 'Contato com Equipe',
      'chat_no_interest': 'Reengajamento',
      'generic_inquiry': 'Consulta Geral',
    };

    // Se tiver mapeamento, usar
    if (friendlyNames[trigger]) {
      return friendlyNames[trigger];
    }

    // Caso contrário, usar o nome do template formatado
    return templateName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Calcula similaridade entre duas strings (0-1)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calcula distância de Levenshtein
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

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

  /**
   * Adiciona automação à fila de processamento
   */
  private addToQueue(automationId: string, priority: number = 1): void {
    this.queue.set(automationId, { priority, retryCount: 0 });
    logger.debug(`📥 Automação ${automationId} adicionada à fila (prioridade: ${priority})`);

    // Iniciar processamento se não estiver rodando
    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  /**
   * ✅ FIX 3: Verifica e corrige automações travadas em PROCESSING há mais de 10 minutos
   */
  private async checkStuckAutomations(): Promise<void> {
    try {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

      const stuckAutomations = await prisma.whatsAppAutomation.findMany({
        where: {
          status: 'PROCESSING',
          startedAt: { lt: tenMinutesAgo }
        },
        select: {
          id: true,
          messagesSent: true,
          messagesTotal: true,
          startedAt: true
        }
      });

      if (stuckAutomations.length === 0) {
        return;
      }

      logger.warn(`⚠️  Encontradas ${stuckAutomations.length} automações travadas em PROCESSING`);

      for (const automation of stuckAutomations) {
        const successPercentage = automation.messagesTotal > 0
          ? automation.messagesSent / automation.messagesTotal
          : 0;

        let newStatus: 'SENT' | 'FAILED' = 'FAILED';

        if (successPercentage >= 0.8) {
          newStatus = 'SENT';
          logger.info(`✅ Auto-completando automação travada ${automation.id} (${automation.messagesSent}/${automation.messagesTotal} = ${(successPercentage * 100).toFixed(1)}%)`);
        } else if (automation.messagesSent > 0) {
          newStatus = 'FAILED';
          logger.warn(`❌ Marcando como FAILED automação ${automation.id} (${automation.messagesSent}/${automation.messagesTotal} = ${(successPercentage * 100).toFixed(1)}%)`);
        } else {
          newStatus = 'FAILED';
          logger.warn(`❌ Marcando como FAILED automação ${automation.id} (0 mensagens enviadas)`);
        }

        await prisma.whatsAppAutomation.update({
          where: { id: automation.id },
          data: {
            status: newStatus,
            completedAt: new Date(),
            error: newStatus === 'FAILED' ? 'Timeout: automação travada em PROCESSING por mais de 10 minutos' : null
          }
        });
      }
    } catch (error) {
      logger.error('❌ Erro ao verificar automações travadas:', error);
    }
  }

  /**
   * Processa fila de automações
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue) return;

    this.isProcessingQueue = true;
    logger.debug(`🔄 Iniciando processamento da fila (${this.queue.size} itens)`);

    // ✅ FIX 3: Verificar e corrigir automações travadas em PROCESSING
    await this.checkStuckAutomations();

    while (this.queue.size > 0) {
      // Ordenar por prioridade (maior primeiro)
      const sorted = Array.from(this.queue.entries())
        .sort((a, b) => b[1].priority - a[1].priority);

      const [automationId, queueData] = sorted[0];
      this.queue.delete(automationId);

      // ✅ Verificar se automação tem agendamento
      const automation = await prisma.whatsAppAutomation.findUnique({
        where: { id: automationId },
        select: { scheduledFor: true, status: true }
      });

      if (automation && automation.scheduledFor) {
        const now = new Date();
        const scheduledTime = new Date(automation.scheduledFor);

        if (scheduledTime > now) {
          // Agendamento ainda não chegou, reagendar
          const delayMs = scheduledTime.getTime() - now.getTime();
          logger.info(`⏰ Automação ${automationId} agendada para ${scheduledTime.toLocaleString('pt-BR')} - reagendando`);

          setTimeout(() => {
            this.queue.set(automationId, queueData);
            if (!this.isProcessingQueue) {
              this.processQueue();
            }
          }, Math.min(delayMs, 300000)); // Max 5 minutos, depois recheca

          continue;
        }
      }

      try {
        await this.executeAutomation(automationId);
      } catch (error) {
        logger.error(`❌ Erro ao processar automação ${automationId}:`, error);

        // Retry se não excedeu limite
        if (queueData.retryCount < this.MAX_RETRY_COUNT) {
          logger.info(`🔄 Agendando retry ${queueData.retryCount + 1}/${this.MAX_RETRY_COUNT} para automação ${automationId}`);

          setTimeout(() => {
            this.queue.set(automationId, {
              priority: queueData.priority - 1,
              retryCount: queueData.retryCount + 1
            });

            if (!this.isProcessingQueue) {
              this.processQueue();
            }
          }, this.RETRY_DELAY_MS * (queueData.retryCount + 1));
        } else {
          logger.error(`❌ Automação ${automationId} falhou após ${this.MAX_RETRY_COUNT} tentativas`);
        }
      }

      // Delay entre processamentos
      if (this.queue.size > 0) {
        await this.delay(5000);
      }
    }

    this.isProcessingQueue = false;
    logger.debug(`✅ Fila processada completamente`);
  }

  /**
   * Executa uma automação de envio WhatsApp (com proteção anti-spam)
   */
  async executeAutomation(automationId: string): Promise<void> {
    const automation = await prisma.whatsAppAutomation.findUnique({
      where: { id: automationId },
      include: { lead: true }
    });

    if (!automation) {
      logger.error(`❌ Automação ${automationId} não encontrada`);
      return;
    }

    const lead = automation.lead;
    const phone = lead.phone;

    // 🛡️ PROTEÇÃO ANTI-SPAM: Verificar se pode enviar
    const antiSpamCheck = await whatsappAntiSpamService.canSendMessage(phone, automationId);

    if (!antiSpamCheck.allowed) {
      logger.warn(`🛡️ Automação ${automationId} bloqueada: ${antiSpamCheck.reason}`);
      logger.info(`   ⏰ Retry agendado para: ${antiSpamCheck.retryAfter ? `${antiSpamCheck.retryAfter}s` : 'indeterminado'}`);

      // ✅ CORREÇÃO: NÃO marcar como erro - apenas reagendar
      await prisma.whatsAppAutomation.update({
        where: { id: automationId },
        data: {
          status: 'PENDING',
          error: null, // ✅ LIMPAR ERRO (não é uma falha real)
          // Agendar para o futuro se tiver retryAfter
          scheduledFor: antiSpamCheck.retryAfter
            ? new Date(Date.now() + antiSpamCheck.retryAfter * 1000)
            : null
        }
      });

      // Re-agendar para depois
      if (antiSpamCheck.retryAfter) {
        setTimeout(() => {
          logger.info(`🔄 Reagendando automação ${automationId} após bloqueio anti-spam`);
          this.addToQueue(automationId, 1);
        }, antiSpamCheck.retryAfter * 1000);
      }

      return; // ✅ NÃO lançar erro - apenas pausar
    }

    // Marcar como processando
    await prisma.whatsAppAutomation.update({
      where: { id: automationId },
      data: {
        status: 'PROCESSING',
        startedAt: new Date(),
        error: null
      }
    });

    // ✅ NOVO: Logging detalhado com status transition
    logger.info(`📊 Automação ${automationId} - Transição de Status:`, {
      previousStatus: automation.status,
      newStatus: 'PROCESSING',
      lead: { name: lead.name, phone },
      messagesSent: automation.messagesSent,
      messagesTotal: automation.messagesTotal,
      products: JSON.parse(automation.productsToSend)
    });

    logger.info(`🚀 Iniciando automação ${automationId} para ${lead.name} (${phone})`);

    try {
      // Buscar configuração e produtos
      const config = await prisma.chatbotConfig.findFirst();
      if (!config) throw new Error('Chatbot config não encontrado');

      const allProducts = JSON.parse(config.products || '[]');
      const productNames = JSON.parse(automation.productsToSend);

      // ✅ NOVO: Detectar automação com template genérico
      if (productNames.length === 1 && productNames[0].startsWith('TEMPLATE:')) {
        // Formato: TEMPLATE:id ou TEMPLATE:id:nome_amigavel
        const parts = productNames[0].split(':');
        const templateId = parts[1]; // Pegar só o ID (posição 1)
        return await this.executeGenericTemplateAutomation(automationId, templateId, lead, config);
      }

      // ✅ NOVO: Detectar automação com fallback hardcoded
      if (productNames.length === 1 && productNames[0].startsWith('FALLBACK:')) {
        const templateTrigger = productNames[0].replace('FALLBACK:', '');
        return await this.executeGenericFallbackAutomation(automationId, templateTrigger, lead, config);
      }

      // Buscar templates (ou usar padrão)
      const templates = JSON.parse(config.whatsappTemplates || '{}');
      const defaultTemplates = {
        initial: 'Olá {{lead.name}}! 👋\n\nConforme nossa conversa no site, seguem mais informações sobre o(s) produto(s) de seu interesse.',
        product: '📦 *{{product.name}}*\n\n{{product.description}}',
        final: '✅ Essas são as informações sobre {{products.count}} produto(s) de seu interesse!\n\n👨‍💼 Um vendedor da {{company.name}} entrará em contato em breve para esclarecer dúvidas e auxiliar na sua compra.\n\n{{company.phone}}'
      };

      const initialTemplate = templates.initial || defaultTemplates.initial;
      const productTemplate = templates.product || defaultTemplates.product;
      const finalTemplate = templates.final || defaultTemplates.final;

      let order = 1;

      // 1. MENSAGEM INICIAL (usando template)
      const initialMessage = this.processTemplate(initialTemplate, {
        lead: { name: lead.name, phone: lead.phone, email: lead.email || '' },
        company: { name: config.companyName, phone: config.companyPhone || '' }
      });

      await this.sendText(
        automationId,
        phone,
        initialMessage,
        order++
      );

      await this.delay(whatsappAntiSpamService.getHumanizedDelay());

      // 2. PARA CADA PRODUTO
      for (const productName of productNames) {
        const product = allProducts.find((p: any) =>
          p.name === productName || p.id === productName.toLowerCase()
        );

        if (!product) {
          logger.warn(`⚠️  Produto "${productName}" não encontrado na configuração`);
          continue;
        }

        logger.info(`   📦 Enviando produto: ${product.name}`);

        // 2.1 Descrição do produto (usando template)
        const description = product.detailedDescription || product.description;
        const productMessage = this.processTemplate(productTemplate, {
          product: {
            name: product.name,
            description: description,
            price: product.price || 'Sob consulta'
          }
        });

        await this.sendText(
          automationId,
          phone,
          productMessage,
          order++
        );
        await this.delay(whatsappAntiSpamService.getHumanizedDelay());

        // 2.2 Imagens
        if (product.images && product.images.length > 0) {
          logger.info(`   🖼️  Enviando ${product.images.length} imagem(ns)`);
          for (const imageUrl of product.images) {
            await this.sendImage(automationId, phone, imageUrl, order++);
            await this.delay(whatsappAntiSpamService.getHumanizedDelay(true)); // Delay maior para mídia
          }
        }

        // 2.3 Vídeos
        if (product.videos && product.videos.length > 0) {
          logger.info(`   🎥 Enviando ${product.videos.length} vídeo(s)`);
          for (const videoUrl of product.videos) {
            await this.sendVideo(automationId, phone, videoUrl, order++);
            await this.delay(whatsappAntiSpamService.getHumanizedDelay(true)); // Delay maior para mídia
          }
        }

        // 2.4 Especificações técnicas
        if (product.specifications && Object.keys(product.specifications).length > 0) {
          const specs = Object.entries(product.specifications)
            .map(([key, value]) => `• *${key}:* ${value}`)
            .join('\n');

          await this.sendText(
            automationId,
            phone,
            `📋 *Especificações Técnicas:*\n\n${specs}`,
            order++
          );
          await this.delay(whatsappAntiSpamService.getHumanizedDelay());
        }
      }

      // 3. MENSAGEM FINAL (usando template)
      const finalMessageText = this.processTemplate(finalTemplate, {
        products: { count: productNames.length.toString() },
        company: {
          name: config.companyName,
          phone: config.companyPhone ? `📞 Caso prefira, você pode nos ligar: ${config.companyPhone}` : ''
        }
      });

      await this.sendText(
        automationId,
        phone,
        finalMessageText,
        order++
      );

      // ✅ CORREÇÃO: Verificar se realmente enviou todas as mensagens
      const finalAutomation = await prisma.whatsAppAutomation.findUnique({
        where: { id: automationId },
        select: { messagesSent: true, messagesTotal: true }
      });

      const sentMessages = finalAutomation?.messagesSent || 0;
      const totalMessages = finalAutomation?.messagesTotal || 0;

      // ✅ FIX 2: Lógica mais permissiva - 80% ou mais = sucesso
      let finalStatus: 'SENT' | 'PROCESSING' | 'PENDING' = 'SENT';
      const successThreshold = 0.8; // 80%
      const successPercentage = totalMessages > 0 ? sentMessages / totalMessages : 0;

      if (sentMessages === 0) {
        finalStatus = 'PENDING';
        logger.warn(`⚠️  Automação ${automationId} não enviou nenhuma mensagem (0/${totalMessages})`);
      } else if (successPercentage < successThreshold) {
        finalStatus = 'PROCESSING';
        logger.warn(`⚠️  Automação ${automationId} parcialmente enviada (${sentMessages}/${totalMessages} = ${(successPercentage * 100).toFixed(1)}%)`);
      } else {
        finalStatus = 'SENT';
        logger.info(`✅ Automação ${automationId} concluída com sucesso! (${sentMessages}/${totalMessages} = ${(successPercentage * 100).toFixed(1)}%)`);
      }

      // Marcar como concluído
      await prisma.whatsAppAutomation.update({
        where: { id: automationId },
        data: {
          status: finalStatus,
          completedAt: finalStatus === 'SENT' ? new Date() : null
        }
      });

    } catch (error: any) {
      logger.error(`❌ Erro ao executar automação ${automationId}:`, error);

      await prisma.whatsAppAutomation.update({
        where: { id: automationId },
        data: {
          status: 'FAILED',
          error: error.message
        }
      });

      throw error;
    }
  }

  /**
   * ✅ NOVO: Executa automação com template genérico (do banco de dados)
   */
  private async executeGenericTemplateAutomation(
    automationId: string,
    templateId: string,
    lead: any,
    config: any
  ): Promise<void> {
    try {
      const template = await prisma.recurrenceMessageTemplate.findUnique({
        where: { id: templateId }
      });

      if (!template) {
        throw new Error(`Template ${templateId} não encontrado`);
      }

      logger.info(`📨 Executando automação genérica com template: ${template.name}`);

      const phone = lead.phone;

      // Processar template com variáveis
      const message = this.processTemplate(template.content, {
        lead: {
          name: lead.name,
          phone: lead.phone,
          email: lead.email || ''
        },
        company: {
          name: config.companyName || 'Ferraco',
          phone: config.companyPhone || '',
          email: config.companyEmail || '',
          website: config.companyWebsite || '',
          workingHours: config.workingHours || 'Segunda a Sexta, 8h às 18h'
        }
      });

      // Enviar mensagem de texto
      await this.sendText(automationId, phone, message, 1);
      await this.delay(whatsappAntiSpamService.getHumanizedDelay());

      // Enviar mídias se houver
      if (template.mediaUrls) {
        const mediaUrls = JSON.parse(template.mediaUrls);
        let order = 2;

        for (const mediaUrl of mediaUrls) {
          if (template.mediaType === 'IMAGE') {
            await this.sendImage(automationId, phone, mediaUrl, order++);
          } else if (template.mediaType === 'VIDEO') {
            await this.sendVideo(automationId, phone, mediaUrl, order++);
          }
          await this.delay(whatsappAntiSpamService.getHumanizedDelay(true));
        }
      }

      // Atualizar contador de uso do template
      await prisma.recurrenceMessageTemplate.update({
        where: { id: templateId },
        data: { usageCount: { increment: 1 } }
      });

      // Verificar se realmente enviou todas as mensagens
      const finalAutomation = await prisma.whatsAppAutomation.findUnique({
        where: { id: automationId },
        select: { messagesSent: true, messagesTotal: true }
      });

      const sentMessages = finalAutomation?.messagesSent || 0;
      const totalMessages = finalAutomation?.messagesTotal || 0;

      // Marcar automação como concluída
      await prisma.whatsAppAutomation.update({
        where: { id: automationId },
        data: {
          status: sentMessages === totalMessages && sentMessages > 0 ? 'SENT' : 'PROCESSING',
          completedAt: sentMessages === totalMessages && sentMessages > 0 ? new Date() : null
        }
      });

      logger.info(`✅ Automação genérica ${automationId} concluída (template: ${template.name}, ${sentMessages}/${totalMessages} mensagens)`);

    } catch (error: any) {
      logger.error(`❌ Erro ao executar automação genérica ${automationId}:`, error);
      await prisma.whatsAppAutomation.update({
        where: { id: automationId },
        data: {
          status: 'FAILED',
          error: error.message
        }
      });
      throw error;
    }
  }

  /**
   * ✅ NOVO: Executa automação com fallback hardcoded (quando não há template no banco)
   */
  private async executeGenericFallbackAutomation(
    automationId: string,
    templateTrigger: string,
    lead: any,
    config: any
  ): Promise<void> {
    try {
      logger.info(`📨 Executando automação fallback para trigger: ${templateTrigger}`);

      const phone = lead.phone;

      // Templates hardcoded por trigger
      const fallbackMessages: Record<string, string> = {
        modal_orcamento: `Olá {{lead.name}}! 👋

Recebemos sua solicitação de orçamento através do nosso site.

Nossa equipe comercial da {{company.name}} entrará em contato com você em até *2 horas úteis* pelo WhatsApp ou telefone.

Enquanto isso, fique à vontade para:
📞 Ligar para {{company.phone}}
📧 Enviar email para {{company.email}}
🌐 Acessar nosso site: {{company.website}}

Obrigado pelo interesse!
Equipe {{company.name}}`,

        human_contact_request: `Olá {{lead.name}}! 👋

Entendemos que você gostaria de falar com um de nossos consultores.

Um especialista da {{company.name}} entrará em contato em breve para atendê-lo pessoalmente.

*Horário de atendimento:* {{company.workingHours}}

Obrigado pela confiança!
Equipe {{company.name}}`,

        generic_inquiry: `Olá {{lead.name}}! 👋

Obrigado por entrar em contato com a {{company.name}}.

Nossa equipe entrará em contato em breve para entender melhor como podemos ajudá-lo.

📞 {{company.phone}}
📧 {{company.email}}

Até breve!`,

        chat_no_interest: `Olá {{lead.name}}! 👋

Vi que você iniciou uma conversa conosco pelo chat, mas não conseguimos finalizar.

Gostaria de conhecer nossos produtos?

*Principais soluções da {{company.name}}:*
🐄 Bebedouros para gado
🏗️ Freestalls
🌾 Equipamentos para fazendas

Um consultor da nossa equipe pode te ajudar a escolher a melhor solução para sua propriedade.

📞 {{company.phone}}

Estou à disposição!
Equipe {{company.name}}`
      };

      const messageTemplate = fallbackMessages[templateTrigger] || fallbackMessages.generic_inquiry;

      // Processar template com variáveis
      const message = this.processTemplate(messageTemplate, {
        lead: {
          name: lead.name,
          phone: lead.phone,
          email: lead.email || ''
        },
        company: {
          name: config.companyName || 'Ferraco',
          phone: config.companyPhone || '',
          email: config.companyEmail || '',
          website: config.companyWebsite || '',
          workingHours: config.workingHours || 'Segunda a Sexta, 8h às 18h'
        }
      });

      // Enviar mensagem de texto
      await this.sendText(automationId, phone, message, 1);

      // Verificar se enviou
      const finalAutomation = await prisma.whatsAppAutomation.findUnique({
        where: { id: automationId },
        select: { messagesSent: true, messagesTotal: true }
      });

      const sentMessages = finalAutomation?.messagesSent || 0;

      // Marcar como concluída
      await prisma.whatsAppAutomation.update({
        where: { id: automationId },
        data: {
          status: sentMessages > 0 ? 'SENT' : 'PROCESSING',
          completedAt: sentMessages > 0 ? new Date() : null
        }
      });

      logger.info(`✅ Automação fallback ${automationId} concluída (${sentMessages} mensagens)`);

    } catch (error: any) {
      logger.error(`❌ Erro ao executar automação fallback ${automationId}:`, error);
      await prisma.whatsAppAutomation.update({
        where: { id: automationId },
        data: {
          status: 'FAILED',
          error: error.message
        }
      });
      throw error;
    }
  }

  /**
   * Envia mensagem de texto (com registro anti-spam)
   */
  private async sendText(
    automationId: string,
    phone: string,
    content: string,
    order: number
  ): Promise<void> {
    let success = false;
    try {
      const service = whatsappWebJSService;
      const result = await service.sendTextMessage(phone, content);
      success = true;

      await prisma.whatsAppAutomationMessage.create({
        data: {
          automationId,
          messageType: 'TEXT',
          content,
          status: 'SENT',
          whatsappMessageId: result?.id || undefined,
          order,
          sentAt: new Date()
        }
      });

      await this.incrementMessageCount(automationId);

      // 🛡️ Registrar no anti-spam
      whatsappAntiSpamService.recordMessage(phone, automationId, true);

    } catch (error) {
      logger.error(`❌ Erro ao enviar texto (ordem ${order}):`, error);

      // 🛡️ Registrar falha no anti-spam
      whatsappAntiSpamService.recordMessage(phone, automationId, false);

      throw error;
    }
  }

  /**
   * Envia imagem (com registro anti-spam)
   */
  private async sendImage(
    automationId: string,
    phone: string,
    imageUrl: string,
    order: number
  ): Promise<void> {
    try {
      const service = whatsappWebJSService;
      const msgId = await service.sendImage(phone, imageUrl);

      await prisma.whatsAppAutomationMessage.create({
        data: {
          automationId,
          messageType: 'IMAGE',
          mediaUrl: imageUrl,
          status: 'SENT',
          whatsappMessageId: msgId || undefined,
          order,
          sentAt: new Date()
        }
      });

      await this.incrementMessageCount(automationId);

      // 🛡️ Registrar no anti-spam
      whatsappAntiSpamService.recordMessage(phone, automationId, true);

    } catch (error) {
      logger.error(`❌ Erro ao enviar imagem (ordem ${order}):`, error);
      whatsappAntiSpamService.recordMessage(phone, automationId, false);
      throw error;
    }
  }

  /**
   * Envia vídeo (com registro anti-spam)
   */
  private async sendVideo(
    automationId: string,
    phone: string,
    videoUrl: string,
    order: number
  ): Promise<void> {
    try {
      const service = whatsappWebJSService;
      const msgId = await service.sendVideo(phone, videoUrl);

      await prisma.whatsAppAutomationMessage.create({
        data: {
          automationId,
          messageType: 'VIDEO',
          mediaUrl: videoUrl,
          status: 'SENT',
          whatsappMessageId: msgId || undefined,
          order,
          sentAt: new Date()
        }
      });

      await this.incrementMessageCount(automationId);

      // 🛡️ Registrar no anti-spam
      whatsappAntiSpamService.recordMessage(phone, automationId, true);

    } catch (error) {
      logger.error(`❌ Erro ao enviar vídeo (ordem ${order}):`, error);
      whatsappAntiSpamService.recordMessage(phone, automationId, false);
      throw error;
    }
  }

  /**
   * Incrementa contador de mensagens enviadas e auto-completa se necessário
   */
  private async incrementMessageCount(automationId: string): Promise<void> {
    const automation = await prisma.whatsAppAutomation.update({
      where: { id: automationId },
      data: { messagesSent: { increment: 1 } },
      select: { messagesSent: true, messagesTotal: true, status: true }
    });

    // ✅ NOVO: Auto-completar se atingiu o total E não está SENT ainda
    if (automation.messagesSent === automation.messagesTotal &&
        automation.status !== 'SENT' &&
        automation.messagesSent > 0) {
      await prisma.whatsAppAutomation.update({
        where: { id: automationId },
        data: {
          status: 'SENT',
          completedAt: new Date()
        }
      });
      logger.info(`✅ Automação ${automationId} auto-concluída (${automation.messagesSent}/${automation.messagesTotal} mensagens)`);
    }
  }

  /**
   * Delay entre mensagens
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Processa template substituindo variáveis
   * Exemplo: "Olá {{lead.name}}!" -> "Olá Fernando!"
   */
  private processTemplate(template: string, data: any): string {
    let processed = template;

    // Substituir todas as variáveis {{key.subkey}}
    const regex = /\{\{([^}]+)\}\}/g;
    processed = processed.replace(regex, (match, path) => {
      const keys = path.trim().split('.');
      let value: any = data;

      for (const key of keys) {
        value = value?.[key];
      }

      return value !== undefined && value !== null ? String(value) : match;
    });

    return processed;
  }

  /**
   * Retry manual de automação
   */
  async retryAutomation(automationId: string, resetMessages: boolean = false): Promise<void> {
    logger.info(`🔄 Retry solicitado para automação ${automationId} (reset: ${resetMessages})`);

    const automation = await prisma.whatsAppAutomation.findUnique({
      where: { id: automationId }
    });

    if (!automation) {
      throw new Error(`Automação ${automationId} não encontrada`);
    }

    // Reset se solicitado
    if (resetMessages) {
      await prisma.whatsAppAutomationMessage.deleteMany({
        where: { automationId }
      });

      await prisma.whatsAppAutomation.update({
        where: { id: automationId },
        data: {
          status: 'PENDING',
          messagesSent: 0,
          error: null,
          startedAt: null,
          completedAt: null
        }
      });
    } else {
      await prisma.whatsAppAutomation.update({
        where: { id: automationId },
        data: {
          status: 'PENDING',
          error: null
        }
      });
    }

    // Adicionar à fila
    this.addToQueue(automationId, 2); // Prioridade alta para retries
  }

  /**
   * 🔄 NOVO: Criar automação para lead recorrente
   * Utiliza template de mensagem específico baseado no histórico
   */
  async createRecurrenceAutomation(
    leadId: string,
    recurrence: RecurrenceResult
  ): Promise<string | null> {
    try {
      const { lead, captureNumber, daysSinceLastCapture, previousInterests, interestChanged } = recurrence;

      logger.info(
        `🔄 Criando automação de recorrência para lead ${leadId} ` +
        `(captura #${captureNumber}, ${daysSinceLastCapture} dias)`
      );

      // 1. Selecionar melhor template de recorrência
      const templateMatch = await recurrenceMessageTemplateService.selectBestTemplate(
        recurrence,
        lead.leadScore
      );

      if (!templateMatch) {
        logger.warn(`⚠️ Nenhum template de recorrência encontrado, usando automação padrão`);
        return await this.createAutomationFromLead(leadId);
      }

      const template = templateMatch.template;
      logger.info(`✅ Template selecionado: "${template.name}" (match: ${templateMatch.matchScore}%)`);

      // 2. Extrair produtos de interesse do metadata
      const metadata = JSON.parse(lead.metadata || '{}');
      const currentInterest = metadata.selectedProducts || [];

      // 3. Processar template substituindo variáveis
      const messageContent = recurrenceMessageTemplateService.processTemplate(
        template.content,
        {
          lead,
          captureNumber,
          daysSinceLastCapture,
          previousInterests,
          currentInterest,
        }
      );

      // 4. Criar automação com mensagem personalizada
      // ✅ UX: Usar nome amigável ao invés de ID técnico
      const friendlyName = `Lead Recorrente (${captureNumber}ª vez)`;

      const automation = await prisma.whatsAppAutomation.create({
        data: {
          leadId,
          status: 'PENDING',
          productsToSend: JSON.stringify([`RECURRENCE_TEMPLATE_${template.id}:${friendlyName}`]),
          messagesTotal: 1 + (template.mediaUrls ? JSON.parse(template.mediaUrls).length : 0),
          scheduledFor: null, // Envio imediato
        },
      });

      logger.info(`✅ Automação de recorrência ${automation.id} criada para lead ${leadId}`);

      // 5. Criar mensagem customizada no banco
      await prisma.whatsAppAutomationMessage.create({
        data: {
          automationId: automation.id,
          messageType: 'TEXT',
          content: messageContent,
          status: 'PENDING',
          order: 1,
        },
      });

      // 6. Se houver mídia, adicionar às mensagens
      if (template.mediaUrls) {
        const mediaUrls = JSON.parse(template.mediaUrls);
        let order = 2;

        for (const mediaUrl of mediaUrls) {
          await prisma.whatsAppAutomationMessage.create({
            data: {
              automationId: automation.id,
              messageType: template.mediaType || 'IMAGE',
              mediaUrl: mediaUrl,
              status: 'PENDING',
              order: order++,
            },
          });
        }
      }

      // 7. Adicionar à fila com prioridade alta (leads recorrentes são mais valiosos)
      const priorityBoost = Math.min(captureNumber * 2, 10); // Captura 2 = prioridade 4, captura 5+ = prioridade 10
      this.addToQueue(automation.id, 5 + priorityBoost);

      return automation.id;
    } catch (error) {
      logger.error(`❌ Erro ao criar automação de recorrência:`, error);
      return null;
    }
  }

  /**
   * Retry em lote de automações falhadas
   */
  async retryAllFailed(leadId?: string): Promise<number> {
    const where: any = { status: 'FAILED' };
    if (leadId) {
      where.leadId = leadId;
    }

    const failedAutomations = await prisma.whatsAppAutomation.findMany({
      where,
      select: { id: true }
    });

    logger.info(`🔄 Retrying ${failedAutomations.length} automações falhadas`);

    for (const automation of failedAutomations) {
      await this.retryAutomation(automation.id, false);
    }

    return failedAutomations.length;
  }

  /**
   * Atualiza o agendamento de uma automação
   */
  async updateSchedule(id: string, scheduledFor: Date | null): Promise<void> {
    const automation = await prisma.whatsAppAutomation.findUnique({
      where: { id }
    });

    if (!automation) {
      throw new Error(`Automação ${id} não encontrada`);
    }

    if (automation.status !== 'PENDING') {
      throw new Error(`Não é possível agendar automação com status ${automation.status}`);
    }

    await prisma.whatsAppAutomation.update({
      where: { id },
      data: { scheduledFor }
    });

    logger.info(`📅 Agendamento atualizado para automação ${id}:`, {
      scheduledFor: scheduledFor?.toISOString() || 'null (envio imediato)'
    });
  }

  /**
   * Remove agendamento e adiciona à fila para envio imediato
   */
  async sendNow(id: string): Promise<void> {
    const automation = await prisma.whatsAppAutomation.findUnique({
      where: { id }
    });

    if (!automation) {
      throw new Error(`Automação ${id} não encontrada`);
    }

    if (automation.status !== 'PENDING') {
      throw new Error(`Não é possível enviar automação com status ${automation.status}`);
    }

    // Remove agendamento
    await prisma.whatsAppAutomation.update({
      where: { id },
      data: { scheduledFor: null }
    });

    // Adiciona à fila com prioridade alta
    this.addToQueue(id, 10);

    logger.info(`🚀 Automação ${id} adicionada à fila para envio imediato`);
  }

  /**
   * Obter estatísticas das automações
   */
  async getStats(): Promise<any> {
    const [total, pending, processing, sent, failed, totalMessages] = await Promise.all([
      prisma.whatsAppAutomation.count(),
      prisma.whatsAppAutomation.count({ where: { status: 'PENDING' } }),
      prisma.whatsAppAutomation.count({ where: { status: 'PROCESSING' } }),
      prisma.whatsAppAutomation.count({ where: { status: 'SENT' } }),
      prisma.whatsAppAutomation.count({ where: { status: 'FAILED' } }),
      prisma.whatsAppAutomationMessage.count()
    ]);

    const lastExecution = await prisma.whatsAppAutomation.findFirst({
      where: { completedAt: { not: null } },
      orderBy: { completedAt: 'desc' },
      select: { completedAt: true }
    });

    const successRate = total > 0 ? (sent / total) * 100 : 0;

    // ✅ NOVO: Incluir estatísticas do anti-spam
    const antiSpamStats = this.getAntiSpamStats();

    return {
      total,
      pending,
      processing,
      sent,
      failed,
      totalMessages,
      successRate: Math.round(successRate * 100) / 100,
      lastExecutionAt: lastExecution?.completedAt || null,
      queueSize: this.queue.size,
      isProcessing: this.isProcessingQueue,
      antiSpam: antiSpamStats // ✅ NOVO: Dados do anti-spam
    };
  }

  /**
   * Listar automações com filtros
   */
  async list(filters: {
    status?: string;
    leadId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.leadId) {
      where.leadId = filters.leadId;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    return prisma.whatsAppAutomation.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },
        messages: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 20,
      skip: filters.offset || 0
    });
  }

  /**
   * Obter detalhes de uma automação
   */
  async getById(automationId: string): Promise<any> {
    const automation = await prisma.whatsAppAutomation.findUnique({
      where: { id: automationId },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            metadata: true
          }
        },
        messages: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!automation) {
      throw new Error(`Automação ${automationId} não encontrada`);
    }

    // Preparar timeline
    const timeline: Array<{ timestamp: Date; event: string; details: string }> = [];

    timeline.push({
      timestamp: automation.createdAt,
      event: 'CREATED',
      details: 'Automação criada'
    });

    if (automation.startedAt) {
      timeline.push({
        timestamp: automation.startedAt,
        event: 'STARTED',
        details: 'Início do envio de mensagens'
      });
    }

    for (const msg of automation.messages) {
      if (msg.sentAt) {
        timeline.push({
          timestamp: msg.sentAt,
          event: 'MESSAGE_SENT',
          details: `${msg.messageType}: ${msg.content?.substring(0, 50) || msg.mediaUrl || ''}...`
        });
      }
    }

    if (automation.completedAt) {
      timeline.push({
        timestamp: automation.completedAt,
        event: 'COMPLETED',
        details: 'Automação concluída com sucesso'
      });
    }

    if (automation.error && automation.createdAt) {
      timeline.push({
        timestamp: automation.createdAt,
        event: 'FAILED',
        details: automation.error
      });
    }

    return {
      automation,
      timeline: timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    };
  }

  /**
   * Obtém estatísticas do sistema anti-spam
   */
  getAntiSpamStats() {
    return whatsappAntiSpamService.getStats();
  }

  /**
   * Reset do sistema anti-spam (usar com cautela - apenas emergências)
   */
  resetAntiSpam() {
    whatsappAntiSpamService.reset();
  }
}

export const whatsappAutomationService = new WhatsAppAutomationService();
