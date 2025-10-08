import fusechatService from '../services/fusechatService';

/**
 * Utilitário para sincronização automática com FuseChat
 * Chamado quando produtos, FAQs ou dados da empresa são atualizados
 */

let isSyncing = false;
let syncQueue: (() => Promise<void>)[] = [];

/**
 * Adiciona uma tarefa de sincronização à fila
 */
async function queueSync(syncFn: () => Promise<void>) {
  syncQueue.push(syncFn);

  // Se não está sincronizando, inicia o processo
  if (!isSyncing) {
    await processSyncQueue();
  }
}

/**
 * Processa a fila de sincronização
 */
async function processSyncQueue() {
  if (isSyncing || syncQueue.length === 0) return;

  isSyncing = true;

  while (syncQueue.length > 0) {
    const syncFn = syncQueue.shift();
    if (syncFn) {
      try {
        await syncFn();
      } catch (error) {
        console.error('❌ Erro na sincronização automática:', error);
      }
    }
  }

  isSyncing = false;
}

/**
 * Sincroniza Knowledge Base após alteração nos dados
 */
export async function autoSyncKnowledgeBase(apiKey?: string): Promise<void> {
  // Pegar API Key do ambiente se não fornecida
  const key = apiKey || process.env.FUSECHAT_API_KEY;

  if (!key) {
    console.warn('⚠️  FuseChat API Key não configurada. Sincronização automática desabilitada.');
    return;
  }

  await queueSync(async () => {
    console.log('🔄 Sincronização automática: Knowledge Base...');
    const result = await fusechatService.syncKnowledgeBase(key);

    if (result.success) {
      console.log(`✅ ${result.message}`);
    } else {
      console.error(`❌ Falha na sincronização: ${result.message}`);
    }
  });
}

/**
 * Sincroniza Guardrails após alteração nas configurações
 */
export async function autoSyncGuardrails(apiKey?: string): Promise<void> {
  const key = apiKey || process.env.FUSECHAT_API_KEY;

  if (!key) {
    console.warn('⚠️  FuseChat API Key não configurada. Sincronização automática desabilitada.');
    return;
  }

  await queueSync(async () => {
    console.log('🔄 Sincronização automática: Guardrails...');
    const result = await fusechatService.syncGuardrails(key);

    if (result.success) {
      console.log(`✅ ${result.message}`);
    } else {
      console.error(`❌ Falha na sincronização: ${result.message}`);
    }
  });
}

/**
 * Sincroniza tudo (Knowledge Base + Guardrails)
 */
export async function autoSyncAll(apiKey?: string): Promise<void> {
  await autoSyncKnowledgeBase(apiKey);
  await autoSyncGuardrails(apiKey);
}
