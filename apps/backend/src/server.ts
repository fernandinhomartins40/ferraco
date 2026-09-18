import 'dotenv/config';
import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { PORT, NODE_ENV } from './config/constants';
import { logger } from './utils/logger';
import { ensureDefaultKanbanColumn } from './scripts/ensure-kanban-columns';
import { ensureDefaultChatbotConfig } from './scripts/ensure-chatbot-config';
import { whatsappWebJSService } from './services/whatsappWebJS.service';
import { chatbotAutosaveService } from './modules/chatbot/chatbot-autosave.service';
import { automationSchedulerService } from './services/automationScheduler.service';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { registerSocketAuth } from './middleware/socketAuth';
import { webhookRetryService } from './services/webhook-retry.service';

async function startServer(): Promise<void> {
  try {
    // Connect to database
    await connectDatabase();

    // Garantir que a coluna padrão do Kanban existe
    await ensureDefaultKanbanColumn();

    // Garantir que a configuração do chatbot existe
    await ensureDefaultChatbotConfig();

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

    // T-02: autenticar o handshake ANTES de qualquer emissão.
    // Sem isso o servidor entregava `whatsapp:qr` a qualquer conexão anônima.
    registerSocketAuth(io);

    // Configure WebSocket events
    io.on('connection', (socket) => {
      const userId = socket.data.user?.userId;
      logger.info(`🔌 Cliente WebSocket conectado: ${socket.id} (usuário ${userId})`);

      // ✅ NOVO: Enviar status e QR code atual quando cliente conecta
      const currentStatus = whatsappWebJSService.getStatus();
      const currentQR = whatsappWebJSService.getQRCode();

      if (currentStatus.connected) {
        socket.emit('whatsapp:status', 'CONNECTED');
        logger.info(`✅ Status CONNECTED enviado para cliente ${socket.id}`);
      } else if (currentQR) {
        socket.emit('whatsapp:qr', { qr: currentQR });
        socket.emit('whatsapp:status', 'INITIALIZING');
        logger.info(`📱 QR Code enviado para cliente ${socket.id}`);
      } else {
        socket.emit('whatsapp:status', 'INITIALIZING');
        logger.info(`⏳ Status INITIALIZING enviado para cliente ${socket.id}`);
      }

      socket.on('disconnect', () => {
        logger.info(`🔌 Cliente WebSocket desconectado: ${socket.id}`);
      });

      // ✅ NOVO: Cliente solicita status atual
      socket.on('whatsapp:request-status', () => {
        logger.info(`📡 Cliente ${socket.id} solicitou status`);
        const status = whatsappWebJSService.getStatus();

        if (status.connected) {
          socket.emit('whatsapp:status', 'CONNECTED');
        } else if (status.hasQR) {
          socket.emit('whatsapp:status', 'INITIALIZING');
        } else {
          socket.emit('whatsapp:status', 'DISCONNECTED');
        }
      });

      // ✅ NOVO: Cliente solicita QR code atual
      socket.on('whatsapp:request-qr', () => {
        logger.info(`📡 Cliente ${socket.id} solicitou QR Code`);
        const qr = whatsappWebJSService.getQRCode();

        if (qr) {
          socket.emit('whatsapp:qr', { qr });
          socket.emit('whatsapp:status', 'INITIALIZING');
        } else {
          socket.emit('whatsapp:status', whatsappWebJSService.isWhatsAppConnected() ? 'CONNECTED' : 'DISCONNECTED');
        }
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

    // ✅ CRÍTICO: Configurar Socket.IO ANTES de inicializar WhatsApp
    // (para que eventos QR sejam emitidos imediatamente)
    whatsappWebJSService.setSocketIO(io);
    automationSchedulerService.setSocketIO(io);

    // ✅ Inicializar WhatsApp Service (whatsapp-web.js)
    // Agora o QR code será emitido via Socket.IO imediatamente
    logger.info('📱 Inicializando WhatsApp Web JS...');
    await whatsappWebJSService.initialize();

    // ⭐ Inicializar Auto-save Service do Chatbot (verifica a cada 2 minutos)
    chatbotAutosaveService.start(2);
    logger.info('💾 Chatbot auto-save service iniciado');

    // ⭐ Inicializar Automation Scheduler Service (processa a cada 30 segundos)
    automationSchedulerService.start();
    logger.info('🤖 Automation Scheduler iniciado');

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

        // Parar automation scheduler
        automationSchedulerService.stop();

        // T-16: parar o cron de retry de webhooks — sem isso o CronJob
        // segue ativo e impede o encerramento limpo do processo.
        webhookRetryService.stop();

        // ✅ Desconectar WhatsApp
        await whatsappWebJSService.disconnect();

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
