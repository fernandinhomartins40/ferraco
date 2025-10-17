/**
 * WhatsApp Version Manager Service
 *
 * Solução híbrida profissional para atualização automática da versão WhatsApp Web
 *
 * Funcionalidades:
 * 1. Usa fetchLatestBaileysVersion() do Baileys (mesma lib que Evolution API usa)
 * 2. Armazena versões no PostgreSQL para histórico
 * 3. Atualiza Evolution API via REST quando versão muda
 * 4. Zero restart de containers necessário
 * 5. Cron job automático a cada 15 minutos
 *
 * Arquitetura:
 * - Backend Ferraco busca versão atual do WhatsApp Web
 * - Compara com última versão conhecida no banco
 * - Se mudou: Deleta e recria instância Evolution API
 * - Evolution API se conecta automaticamente com versão correta
 */

import { PrismaClient } from '@prisma/client';
import { fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Configuração Evolution API
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://evolution-api:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'FERRACO2025';
const EVOLUTION_INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || 'ferraco-crm';

interface WhatsAppVersion {
  id: string;
  version: string;
  detectedAt: Date;
  appliedToEvolution: boolean;
  evolutionInstanceName: string | null;
  errorMessage: string | null;
  metadata: any;
}

interface VersionCheckResult {
  currentVersion: string;
  previousVersion: string | null;
  versionChanged: boolean;
  appliedSuccessfully: boolean;
  error: string | null;
  timestamp: Date;
}

class WhatsAppVersionManagerService {
  private evolutionApi: AxiosInstance;

  constructor() {
    this.evolutionApi = axios.create({
      baseURL: EVOLUTION_API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
    });

    logger.info('🔄 WhatsAppVersionManagerService inicializado', {
      evolutionUrl: EVOLUTION_API_URL,
      instanceName: EVOLUTION_INSTANCE_NAME,
    });
  }

  /**
   * Busca a versão mais recente do WhatsApp Web usando Baileys
   * (Mesma função que Evolution API usa internamente)
   */
  async fetchLatestWhatsAppVersion(): Promise<string> {
    try {
      logger.info('🔍 Buscando versão mais recente do WhatsApp Web via Baileys...');

      const { version, isLatest } = await fetchLatestBaileysVersion();
      const versionString = version.join('.');

      logger.info('✅ Versão WhatsApp Web detectada', {
        version: versionString,
        isLatest,
        raw: version,
      });

      return versionString;

    } catch (error: any) {
      logger.error('❌ Erro ao buscar versão WhatsApp via Baileys:', error.message);
      throw new Error(`Falha ao buscar versão WhatsApp: ${error.message}`);
    }
  }

  /**
   * Busca última versão registrada no banco de dados
   */
  async getLastKnownVersion(): Promise<WhatsAppVersion | null> {
    try {
      const lastVersion = await prisma.$queryRaw<WhatsAppVersion[]>`
        SELECT * FROM whatsapp_versions
        ORDER BY detected_at DESC
        LIMIT 1
      `;

      return lastVersion.length > 0 ? lastVersion[0] : null;

    } catch (error: any) {
      logger.error('❌ Erro ao buscar última versão do banco:', error.message);
      return null;
    }
  }

  /**
   * Salva nova versão no banco de dados
   */
  async saveVersion(
    version: string,
    appliedToEvolution: boolean,
    errorMessage: string | null = null
  ): Promise<WhatsAppVersion> {
    try {
      const saved = await prisma.$queryRaw<WhatsAppVersion[]>`
        INSERT INTO whatsapp_versions (
          id,
          version,
          detected_at,
          applied_to_evolution,
          evolution_instance_name,
          error_message,
          metadata
        ) VALUES (
          gen_random_uuid(),
          ${version},
          CURRENT_TIMESTAMP,
          ${appliedToEvolution},
          ${EVOLUTION_INSTANCE_NAME},
          ${errorMessage},
          ${JSON.stringify({ source: 'baileys', method: 'fetchLatestBaileysVersion' })}::jsonb
        )
        RETURNING *
      `;

      logger.info('💾 Versão salva no banco de dados', {
        version,
        appliedToEvolution,
        errorMessage,
      });

      return saved[0];

    } catch (error: any) {
      logger.error('❌ Erro ao salvar versão no banco:', error.message);
      throw error;
    }
  }

  /**
   * Deleta instância Evolution API
   */
  async deleteEvolutionInstance(): Promise<void> {
    try {
      logger.info('🗑️ Deletando instância Evolution API...', {
        instanceName: EVOLUTION_INSTANCE_NAME,
      });

      const response = await this.evolutionApi.delete(
        `/instance/delete/${EVOLUTION_INSTANCE_NAME}`
      );

      logger.info('✅ Instância Evolution API deletada', response.data);

    } catch (error: any) {
      // Se instância não existe (404), não é erro crítico
      if (error.response?.status === 404) {
        logger.warn('⚠️ Instância não existia (404) - ignorando erro');
        return;
      }

      logger.error('❌ Erro ao deletar instância Evolution:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      throw new Error(`Falha ao deletar instância: ${error.message}`);
    }
  }

  /**
   * Cria nova instância Evolution API
   */
  async createEvolutionInstance(): Promise<void> {
    try {
      logger.info('➕ Criando nova instância Evolution API...', {
        instanceName: EVOLUTION_INSTANCE_NAME,
      });

      const response = await this.evolutionApi.post('/instance/create', {
        instanceName: EVOLUTION_INSTANCE_NAME,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      });

      logger.info('✅ Instância Evolution API criada', {
        instanceName: EVOLUTION_INSTANCE_NAME,
        data: response.data,
      });

    } catch (error: any) {
      // Se instância já existe, tentar conectar
      if (error.response?.status === 403 && error.response?.data?.response?.message?.includes('already in use')) {
        logger.warn('⚠️ Instância já existe - tentando conectar...');
        await this.connectEvolutionInstance();
        return;
      }

      logger.error('❌ Erro ao criar instância Evolution:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      throw new Error(`Falha ao criar instância: ${error.message}`);
    }
  }

  /**
   * Conecta instância Evolution API (gera QR Code)
   */
  async connectEvolutionInstance(): Promise<void> {
    try {
      logger.info('📱 Conectando instância Evolution API...', {
        instanceName: EVOLUTION_INSTANCE_NAME,
      });

      const response = await this.evolutionApi.get(
        `/instance/connect/${EVOLUTION_INSTANCE_NAME}`
      );

      logger.info('✅ Instância Evolution API conectada', {
        data: response.data,
      });

    } catch (error: any) {
      logger.error('❌ Erro ao conectar instância Evolution:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      throw new Error(`Falha ao conectar instância: ${error.message}`);
    }
  }

  /**
   * Atualiza Evolution API com nova versão
   * Processo: DELETE instância antiga → CREATE nova instância
   */
  async updateEvolutionApiVersion(): Promise<void> {
    try {
      logger.info('🔄 Iniciando atualização da instância Evolution API...');

      // Aguardar 2 segundos entre operações para estabilidade
      await this.deleteEvolutionInstance();
      await this.sleep(2000);

      await this.createEvolutionInstance();
      await this.sleep(2000);

      await this.connectEvolutionInstance();

      logger.info('✅ Evolution API atualizada com sucesso!');

    } catch (error: any) {
      logger.error('❌ Erro ao atualizar Evolution API:', error.message);
      throw error;
    }
  }

  /**
   * Verifica e atualiza versão do WhatsApp (MÉTODO PRINCIPAL)
   *
   * Fluxo:
   * 1. Busca versão atual via Baileys
   * 2. Compara com última versão no banco
   * 3. Se mudou: Atualiza Evolution API
   * 4. Salva resultado no banco
   */
  async checkAndUpdateVersion(): Promise<VersionCheckResult> {
    const startTime = Date.now();

    logger.info('========================================');
    logger.info('🔍 VERIFICAÇÃO AUTOMÁTICA DE VERSÃO WHATSAPP WEB');
    logger.info('========================================');

    try {
      // 1. Buscar versão atual via Baileys
      const currentVersion = await this.fetchLatestWhatsAppVersion();

      // 2. Buscar última versão conhecida do banco
      const lastKnown = await this.getLastKnownVersion();
      const previousVersion = lastKnown?.version || null;

      logger.info('📊 Comparação de versões:', {
        versaoAtual: currentVersion,
        versaoAnterior: previousVersion,
        mudou: currentVersion !== previousVersion,
      });

      // 3. Verificar se versão mudou
      if (currentVersion === previousVersion) {
        logger.info('✅ Versão não mudou - nenhuma ação necessária');

        return {
          currentVersion,
          previousVersion,
          versionChanged: false,
          appliedSuccessfully: false,
          error: null,
          timestamp: new Date(),
        };
      }

      // 4. Versão mudou! Atualizar Evolution API
      logger.info('🚨 VERSÃO MUDOU! Atualizando Evolution API...');

      let appliedSuccessfully = false;
      let errorMessage: string | null = null;

      try {
        await this.updateEvolutionApiVersion();
        appliedSuccessfully = true;

        logger.info('✅ Evolution API atualizada com sucesso!');

      } catch (error: any) {
        appliedSuccessfully = false;
        errorMessage = error.message;

        logger.error('❌ Falha ao atualizar Evolution API:', errorMessage);
      }

      // 5. Salvar no banco de dados
      await this.saveVersion(currentVersion, appliedSuccessfully, errorMessage);

      const duration = Date.now() - startTime;

      logger.info('========================================');
      logger.info('✅ VERIFICAÇÃO CONCLUÍDA', {
        duracaoMs: duration,
        versaoAtualizada: appliedSuccessfully,
      });
      logger.info('========================================');

      return {
        currentVersion,
        previousVersion,
        versionChanged: true,
        appliedSuccessfully,
        error: errorMessage,
        timestamp: new Date(),
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;

      logger.error('========================================');
      logger.error('❌ ERRO NA VERIFICAÇÃO', {
        duracaoMs: duration,
        erro: error.message,
      });
      logger.error('========================================');

      throw error;
    }
  }

  /**
   * Força atualização imediata (para endpoint manual)
   */
  async forceUpdate(): Promise<VersionCheckResult> {
    logger.info('🔄 Atualização MANUAL forçada pelo usuário');
    return await this.checkAndUpdateVersion();
  }

  /**
   * Retorna histórico de versões (últimas 50)
   */
  async getVersionHistory(limit: number = 50): Promise<WhatsAppVersion[]> {
    try {
      const history = await prisma.$queryRaw<WhatsAppVersion[]>`
        SELECT * FROM whatsapp_versions
        ORDER BY detected_at DESC
        LIMIT ${limit}
      `;

      return history;

    } catch (error: any) {
      logger.error('❌ Erro ao buscar histórico de versões:', error.message);
      return [];
    }
  }

  /**
   * Helper: Sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton
const whatsappVersionManagerService = new WhatsAppVersionManagerService();
export default whatsappVersionManagerService;
