import 'dotenv/config';
import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { PORT, NODE_ENV } from './config/constants';
import { logger } from './utils/logger';
import { ensureDefaultKanbanColumn } from './scripts/ensure-kanban-columns';
import { ensureDefaultChatbotConfig } from './scripts/ensure-chatbot-config';
import { whatsappService } from './services/whatsappService';
import whatsappChatService from './services/whatsappChatService';
import { chatbotAutosaveService } from './modules/chatbot/chatbot-autosave.service';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';

async function startServer(): Promise<void> {
  try {
    // Connect to database
    await connectDatabase();

    // Garantir que a coluna padrão do Kanban existe
    await ensureDefaultKanbanColumn();

    // Garantir que a configuração do chatbot existe
    await ensureDefaultChatbotConfig();

    // Inicializar WhatsApp Service (assíncrono, não bloqueia o servidor)
    await whatsappService.initialize();

    // ⭐ Inicializar Auto-save Service do Chatbot (verifica a cada 2 minutos)
    chatbotAutosaveService.start(2);
    logger.info('💾 Chatbot auto-save service iniciado');

    // Create Express app
    const app = createApp();

    // Create HTTP server
    const httpServer = createServer(app);

    // Setup WebSocket (Socket.io) for real-time chat
    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    // Configure WebSocket events
    io.on('connection', (socket) => {
      logger.info(`🔌 Cliente WebSocket conectado: ${socket.id}`);

      socket.on('disconnect', () => {
        logger.info(`🔌 Cliente WebSocket desconectado: ${socket.id}`);
      });

      // Client pode se inscrever em conversas específicas
      socket.on('subscribe:conversation', (conversationId: string) => {
        socket.join(`conversation:${conversationId}`);
        logger.info(`📺 Cliente inscrito na conversa: ${conversationId}`);
      });

      socket.on('unsubscribe:conversation', (conversationId: string) => {
        socket.leave(`conversation:${conversationId}`);
        logger.info(`📺 Cliente desinscrito da conversa: ${conversationId}`);
      });
    });

    // Pass Socket.io instance to WhatsAppChatService and WhatsAppService
    whatsappChatService.setSocketServer(io);
    whatsappService.setSocketServer(io);

    // Start server
    const server = httpServer.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
      logger.info(`📡 API available at http://localhost:${PORT}/api`);
      logger.info(`💚 Health check at http://localhost:${PORT}/health`);
      logger.info(`🔌 WebSocket server ready for real-time chat`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      server.close(async () => {
        logger.info('Server closed');

        // Parar auto-save service
        chatbotAutosaveService.stop();

        // Desconectar WhatsApp
        await whatsappService.disconnect();

        await disconnectDatabase();

        logger.info('Database disconnected');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
