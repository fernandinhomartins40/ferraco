/**
 * WhatsApp Version Manager Service - SOLUÇÃO HÍBRIDA COMPLETA
 *
 * Monitoramento inteligente da versão WhatsApp Web com restart automático
 *
 * Funcionalidades:
 * 1. Detecta versão atual do WhatsApp Web via Baileys
 * 2. Compara com versão configurada no docker-compose.vps.yml
 * 3. Quando versão muda E começam erros: atualiza arquivo + restart container
 * 4. Mantém histórico no PostgreSQL
 * 5. Cron job automático a cada 30 minutos
 *
 * Arquitetura Híbrida:
 * - Evolution API v2.2.3 com CONFIG_SESSION_PHONE_VERSION fixo (estável)
 * - Backend monitora versão real do WhatsApp Web
 * - Quando detecta desatualização: atualiza docker-compose + restart
 * - Reconexão automática (sem escanear QR Code novamente)
 */

import { PrismaClient } from '@prisma/client';
import { fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import axios, { AxiosInstance } from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

// Configuração
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://evolution-api:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'FERRACO2025';
const EVOLUTION_INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || 'ferraco-crm';
const VPS_SSH_HOST = process.env.VPS_SSH_HOST || '72.60.10.108';
const VPS_SSH_USER = process.env.VPS_SSH_USER || 'root';

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
  needsUpdate: boolean;
  updateApplied: boolean;
  error: string | null;
  timestamp: Date;
}

interface ConnectionStatus {
  state: string;
  isConnected: boolean;
  hasErrors: boolean;
}

class WhatsAppVersionManagerService {
  private evolutionApi: AxiosInstance;
  private errorCount: number = 0;
  private readonly MAX_ERRORS_BEFORE_UPDATE = 3; // 3 erros consecutivos = atualizar

  constructor() {
    this.evolutionApi = axios.create({
      baseURL: EVOLUTION_API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
    });

    logger.info('🔄 WhatsAppVersionManagerService inicializado (SOLUÇÃO HÍBRIDA COMPLETA)', {
      evolutionUrl: EVOLUTION_API_URL,
      instanceName: EVOLUTION_INSTANCE_NAME,
      vpsHost: VPS_SSH_HOST,
    });
  }

  /**
   * Busca a versão mais recente do WhatsApp Web usando Baileys
   */
  async fetchLatestWhatsAppVersion(): Promise<string> {
    try {
      logger.info('🔍 Buscando versão WhatsApp Web via Baileys...');

      const { version, isLatest } = await fetchLatestBaileysVersion();

      // Formato: [2, 3000, 1023204200] -> "2,3000,1023204200"
      const versionString = version.join(',');

      logger.info('✅ Versão WhatsApp Web detectada', {
        version: versionString,
        isLatest,
      });

      return versionString;

    } catch (error: any) {
      logger.error('❌ Erro ao buscar versão WhatsApp:', error.message);
      throw new Error(`Falha ao buscar versão: ${error.message}`);
    }
  }

  /**
   * Verifica se Evolution API está com erros de conexão
   */
  async checkEvolutionApiHealth(): Promise<ConnectionStatus> {
    try {
      const response = await this.evolutionApi.get(`/instance/connectionState/${EVOLUTION_INSTANCE_NAME}`);

      const state = response.data?.state || 'unknown';
      const isConnected = state === 'open';
      const hasErrors = state === 'close' || state === 'connecting' && this.errorCount >= this.MAX_ERRORS_BEFORE_UPDATE;

      logger.info('📊 Status Evolution API', {
        state,
        isConnected,
        errorCount: this.errorCount,
      });

      if (!isConnected) {
        this.errorCount++;
      } else {
        this.errorCount = 0; // Reset contador se conectado
      }

      return { state, isConnected, hasErrors };

    } catch (error: any) {
      this.errorCount++;
      logger.warn('⚠️ Erro ao verificar status Evolution API', {
        error: error.message,
        errorCount: this.errorCount,
      });

      return {
        state: 'error',
        isConnected: false,
        hasErrors: this.errorCount >= this.MAX_ERRORS_BEFORE_UPDATE
      };
    }
  }

  /**
   * Busca versão configurada atualmente no docker-compose.vps.yml da VPS
   */
  async getCurrentConfiguredVersion(): Promise<string | null> {
    try {
      const command = `ssh ${VPS_SSH_USER}@${VPS_SSH_HOST} "grep CONFIG_SESSION_PHONE_VERSION /root/ferraco-crm/docker-compose.vps.yml | grep -v '#' | cut -d'=' -f2"`;

      const { stdout } = await execAsync(command);
      const version = stdout.trim();

      logger.info('📄 Versão atual no docker-compose.vps.yml', { version });

      return version || null;

    } catch (error: any) {
      logger.error('❌ Erro ao buscar versão configurada:', error.message);
      return null;
    }
  }

  /**
   * Atualiza docker-compose.vps.yml na VPS com nova versão
   */
  async updateDockerComposeVersion(newVersion: string): Promise<boolean> {
    try {
      logger.info('📝 Atualizando docker-compose.vps.yml na VPS', { newVersion });

      // Comando sed para substituir a linha CONFIG_SESSION_PHONE_VERSION
      const sedCommand = `sed -i 's/CONFIG_SESSION_PHONE_VERSION=.*/CONFIG_SESSION_PHONE_VERSION=${newVersion}/' /root/ferraco-crm/docker-compose.vps.yml`;

      const command = `ssh ${VPS_SSH_USER}@${VPS_SSH_HOST} "${sedCommand}"`;

      await execAsync(command);

      logger.info('✅ docker-compose.vps.yml atualizado com sucesso');
      return true;

    } catch (error: any) {
      logger.error('❌ Erro ao atualizar docker-compose.vps.yml:', error.message);
      return false;
    }
  }

  /**
   * Reinicia container Evolution API na VPS (restart suave)
   */
  async restartEvolutionContainer(): Promise<boolean> {
    try {
      logger.info('🔄 Reiniciando container Evolution API na VPS...');

      const command = `ssh ${VPS_SSH_USER}@${VPS_SSH_HOST} "cd /root/ferraco-crm && docker-compose -f docker-compose.vps.yml restart evolution-api"`;

      const { stdout, stderr } = await execAsync(command, { timeout: 60000 });

      if (stderr && !stderr.includes('Warning')) {
        throw new Error(stderr);
      }

      logger.info('✅ Container Evolution API reiniciado', { stdout });

      // Aguardar 30 segundos para container estabilizar
      await this.sleep(30000);

      return true;

    } catch (error: any) {
      logger.error('❌ Erro ao reiniciar container:', error.message);
      return false;
    }
  }

  /**
   * Salva versão no histórico do banco de dados
   */
  async saveVersion(version: string, applied: boolean, error: string | null = null): Promise<void> {
    try {
      await prisma.$executeRaw`
        INSERT INTO whatsapp_versions (id, version, detected_at, applied_to_evolution, evolution_instance_name, error_message, metadata)
        VALUES (
          gen_random_uuid()::text,
          ${version},
          NOW(),
          ${applied},
          ${EVOLUTION_INSTANCE_NAME},
          ${error},
          ${JSON.stringify({ errorCount: this.errorCount })}::jsonb
        )
      `;

      logger.info('💾 Versão salva no banco de dados', { version, applied });

    } catch (error: any) {
      logger.error('❌ Erro ao salvar versão no banco:', error.message);
    }
  }

  /**
   * MÉTODO PRINCIPAL - Verificação inteligente e atualização automática
   *
   * Lógica:
   * 1. Verifica saúde da Evolution API
   * 2. Se tiver erros (3+ consecutivos): busca versão atual do WhatsApp
   * 3. Compara com versão configurada
   * 4. Se diferente: atualiza docker-compose + restart container
   * 5. Sessão reconecta automaticamente
   */
  async checkAndUpdateIfNeeded(): Promise<VersionCheckResult> {
    try {
      logger.info('🔍 Iniciando verificação inteligente de versão WhatsApp...');

      // 1. Verificar saúde da Evolution API
      const health = await this.checkEvolutionApiHealth();

      // 2. Se está conectado e funcionando, não fazer nada
      if (health.isConnected) {
        logger.info('✅ Evolution API conectado e funcionando - nenhuma ação necessária');

        return {
          currentVersion: 'N/A',
          previousVersion: null,
          versionChanged: false,
          needsUpdate: false,
          updateApplied: false,
          error: null,
          timestamp: new Date(),
        };
      }

      // 3. Se tem erros consecutivos, verificar versão
      if (!health.hasErrors) {
        logger.info('⏳ Evolution API com problemas mas ainda não atingiu limite de erros', {
          errorCount: this.errorCount,
          maxErrors: this.MAX_ERRORS_BEFORE_UPDATE,
        });

        return {
          currentVersion: 'N/A',
          previousVersion: null,
          versionChanged: false,
          needsUpdate: false,
          updateApplied: false,
          error: `Aguardando mais erros (${this.errorCount}/${this.MAX_ERRORS_BEFORE_UPDATE})`,
          timestamp: new Date(),
        };
      }

      logger.warn('⚠️ Evolution API com muitos erros - verificando versão WhatsApp...');

      // 4. Buscar versão atual do WhatsApp Web
      const latestVersion = await this.fetchLatestWhatsAppVersion();

      // 5. Buscar versão configurada no docker-compose
      const configuredVersion = await this.getCurrentConfiguredVersion();

      logger.info('📊 Comparação de versões', {
        latestVersion,
        configuredVersion,
      });

      // 6. Se versões são diferentes, atualizar
      if (latestVersion !== configuredVersion) {
        logger.warn('🔄 Versão desatualizada detectada - iniciando atualização...');

        // Atualizar docker-compose.vps.yml
        const updateSuccess = await this.updateDockerComposeVersion(latestVersion);

        if (!updateSuccess) {
          throw new Error('Falha ao atualizar docker-compose.vps.yml');
        }

        // Reiniciar container
        const restartSuccess = await this.restartEvolutionContainer();

        if (!restartSuccess) {
          throw new Error('Falha ao reiniciar container Evolution API');
        }

        // Salvar no histórico
        await this.saveVersion(latestVersion, true, null);

        // Reset contador de erros
        this.errorCount = 0;

        logger.info('✅ Atualização completa! Evolution API reiniciado com nova versão', {
          oldVersion: configuredVersion,
          newVersion: latestVersion,
        });

        return {
          currentVersion: latestVersion,
          previousVersion: configuredVersion,
          versionChanged: true,
          needsUpdate: true,
          updateApplied: true,
          error: null,
          timestamp: new Date(),
        };
      }

      // 7. Versões iguais mas ainda com erro - pode ser outro problema
      logger.warn('⚠️ Versão está atualizada mas Evolution API ainda com erros - pode ser outro problema');

      return {
        currentVersion: latestVersion,
        previousVersion: configuredVersion,
        versionChanged: false,
        needsUpdate: false,
        updateApplied: false,
        error: 'Versão atualizada mas API ainda com erros',
        timestamp: new Date(),
      };

    } catch (error: any) {
      logger.error('❌ Erro na verificação/atualização de versão:', error.message);

      await this.saveVersion('unknown', false, error.message);

      return {
        currentVersion: 'unknown',
        previousVersion: null,
        versionChanged: false,
        needsUpdate: false,
        updateApplied: false,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Força atualização imediata (para testes ou trigger manual)
   */
  async forceUpdate(): Promise<VersionCheckResult> {
    logger.info('🚀 Forçando atualização imediata...');

    // Setar contador de erros alto para forçar update
    this.errorCount = this.MAX_ERRORS_BEFORE_UPDATE;

    return await this.checkAndUpdateIfNeeded();
  }

  /**
   * Busca histórico de versões
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
      logger.error('❌ Erro ao buscar histórico:', error.message);
      return [];
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new WhatsAppVersionManagerService();
