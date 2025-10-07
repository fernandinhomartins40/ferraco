import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Singleton instance do Prisma Client
let prisma: PrismaClient;

/**
 * Obtém a instância do Prisma Client
 * Implementa o padrão Singleton para evitar múltiplas conexões
 */
export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
    });

    // Log de conexão bem-sucedida
    prisma.$connect()
      .then(() => {
        logger.info('✅ Database connected successfully');
      })
      .catch((error) => {
        logger.error('❌ Database connection failed:', error);
        process.exit(1);
      });
  }

  return prisma;
}

/**
 * Desconecta do banco de dados
 * Útil para graceful shutdown
 */
export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  }
}

// Event handlers para graceful shutdown
process.on('beforeExit', async () => {
  await disconnectDatabase();
});

process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});

export default getPrismaClient();
