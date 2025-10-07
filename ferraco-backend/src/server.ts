import { config } from 'dotenv';
import { createApp } from './app';
import { APP_CONFIG } from './config/constants';
import { logger } from './utils/logger';
import { disconnectDatabase } from './config/database';

// Carregar variáveis de ambiente
config();

// Criar aplicação
const app = createApp();

// Iniciar servidor
const server = app.listen(APP_CONFIG.port, () => {
  logger.info('========================================');
  logger.info(`🚀 ${APP_CONFIG.name} v${APP_CONFIG.version}`);
  logger.info(`📡 Server running on port ${APP_CONFIG.port}`);
  logger.info(`🌍 Environment: ${APP_CONFIG.env}`);
  logger.info(`🔗 API URL: http://localhost:${APP_CONFIG.port}/api`);
  logger.info(`❤️  Health check: http://localhost:${APP_CONFIG.port}/api/health`);
  logger.info('========================================');
});

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================

async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Parar de aceitar novas conexões
  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      // Desconectar do banco de dados
      await disconnectDatabase();
      logger.info('Database disconnected');

      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });

  // Forçar shutdown após 10 segundos
  setTimeout(() => {
    logger.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
}

// Event listeners
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

export default server;
