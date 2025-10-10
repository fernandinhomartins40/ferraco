import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Singleton instance do Prisma Client
let prisma: PrismaClient | null = null;
let isConnecting = false;
let connectionPromise: Promise<void> | null = null;

/**
 * Obtém a instância do Prisma Client
 * Implementa o padrão Singleton para evitar múltiplas conexões
 * IMPORTANTE: O cliente já está conectado e pronto para uso
 */
export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
    });
  }

  return prisma;
}

/**
 * Conecta o Prisma Client ao banco de dados
 * DEVE ser chamado antes de usar o cliente
 */
export async function connectDatabase(): Promise<void> {
  // Evita múltiplas tentativas de conexão simultâneas
  if (isConnecting && connectionPromise) {
    return connectionPromise;
  }

  if (prisma) {
    // Já conectado
    return Promise.resolve();
  }

  isConnecting = true;
  connectionPromise = (async () => {
    try {
      const client = getPrismaClient();
      await client.$connect();
      logger.info('✅ Database connected successfully');
      isConnecting = false;
    } catch (error) {
      isConnecting = false;
      logger.error('❌ Database connection failed:', error);
      throw error;
    }
  })();

  return connectionPromise;
}

/**
 * Desconecta do banco de dados
 * Útil para graceful shutdown
 */
export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
    isConnecting = false;
    connectionPromise = null;
    logger.info('Database disconnected');
  }
}

// ==========================================
// NOTA: Event handlers de shutdown removidos daqui
// Eles estão centralizados em server.ts para evitar
// race conditions e handlers duplicados
// ==========================================

// Exporta a instância do cliente (será conectado pelo server.ts)
export default getPrismaClient();
