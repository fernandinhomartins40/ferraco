/**
 * T-02 — Autenticação do Socket.IO.
 *
 * Antes desta guarda, qualquer cliente que abrisse um socket recebia
 * `whatsapp:qr` na conexão — ou seja, qualquer pessoa na internet podia
 * escanear o QR e sequestrar a conta de WhatsApp da empresa.
 *
 * O middleware valida o JWT do handshake com as mesmas regras do
 * `authenticate` HTTP (assinatura, tipo de token e usuário ativo no banco),
 * e anexa a identidade ao socket para que as emissões possam ser segmentadas
 * por usuário (T-03).
 */

import { Server, Socket } from 'socket.io';
import { verifyAccessToken, JWTPayload } from '../config/jwt';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

/** Socket autenticado: `data.user` é garantido após o middleware. */
export interface AuthenticatedSocket extends Socket {
  data: {
    user: JWTPayload;
  };
}

/**
 * Extrai o token do handshake.
 *
 * Aceita, em ordem: `auth.token` (canal recomendado do Socket.IO, não vai
 * para a query string nem para logs de acesso), o header `Authorization`
 * e, por último, `query.token` — mantido apenas por compatibilidade, pois
 * query strings vazam em logs de proxy.
 */
function extractHandshakeToken(socket: Socket): string | null {
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === 'string' && authToken.length > 0) {
    return authToken.startsWith('Bearer ') ? authToken.slice(7) : authToken;
  }

  const header = socket.handshake.headers?.authorization;
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice(7);
  }

  const queryToken = socket.handshake.query?.token;
  if (typeof queryToken === 'string' && queryToken.length > 0) {
    return queryToken;
  }

  return null;
}

/**
 * Registra o middleware de autenticação no servidor Socket.IO.
 * Deve ser chamado ANTES de `io.on('connection')`.
 */
export function registerSocketAuth(io: Server): void {
  io.use(async (socket, next) => {
    try {
      const token = extractHandshakeToken(socket);

      if (!token) {
        logger.warn(`🔒 Socket ${socket.id} recusado: token ausente`);
        return next(new Error('Authentication required'));
      }

      const payload = verifyAccessToken(token);

      // Mesma verificação do authenticate HTTP: um token válido de usuário
      // desativado não deve abrir socket.
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, isActive: true },
      });

      if (!user || !user.isActive) {
        logger.warn(`🔒 Socket ${socket.id} recusado: usuário inexistente ou inativo`);
        return next(new Error('User not found or inactive'));
      }

      socket.data.user = payload;

      logger.info(`🔓 Socket ${socket.id} autenticado — usuário ${payload.userId}`);
      next();
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Authentication failed';
      logger.warn(`🔒 Socket ${socket.id} recusado: ${reason}`);
      next(new Error(reason));
    }
  });
}
