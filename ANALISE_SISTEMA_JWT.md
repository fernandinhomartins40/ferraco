# 📊 Análise Profissional do Sistema de Tokens JWT - Ferraco CRM

**Data:** 2025-01-19
**Versão:** 1.0
**Status:** 🔴 PROBLEMAS CRÍTICOS IDENTIFICADOS

---

## 📋 Sumário Executivo

O sistema de autenticação JWT do Ferraco CRM apresenta **7 problemas críticos** e **5 inconsistências** que impactam a experiência do usuário e a segurança da aplicação. A análise identificou problemas de configuração, arquitetura e implementação que precisam ser corrigidos urgentemente.

### ⚠️ Problemas Críticos Identificados

1. **JWT_SECRET variável** - Invalida tokens a cada deploy
2. **Falta de validação de configuração** - Valores padrão inseguros
3. **Ausência de limpeza automática de tokens** - Crescimento infinito do banco
4. **Falta de atualização de lastUsedAt** - Impossível rastrear sessões ativas
5. **Refresh token response inconsistente** - Frontend espera estrutura diferente
6. **Falta de gestão de múltiplas sessões** - UX ruim em multi-dispositivo
7. **Ausência de monitoramento** - Impossível detectar abusos

### 🎯 Impacto

- **Usuários**: Forçados a fazer login após cada deploy
- **Segurança**: Tokens expirados acumulam no banco de dados
- **Performance**: Consultas ao banco sem otimização
- **Manutenção**: Código duplicado e inconsistente

---

## 🔍 Problemas Detalhados

### 1. 🔴 CRÍTICO: JWT_SECRET Variável em Deploy

**Arquivo**: `.github/workflows/deploy-vps.yml:261`

```yaml
# PROBLEMA
export JWT_SECRET="ferraco-vps-jwt-production-secret-2025"
```

**Problema**: Secret hardcoded no código fonte público.

**Impacto**:
- ✗ Secret visível no repositório GitHub
- ✗ Qualquer pessoa pode ver a chave de assinatura JWT
- ✗ Impossível rotar sem alterar código
- ✗ Múltiplos ambientes (staging/prod) usam mesmo secret

**Solução Recomendada**:
```yaml
# Usar GitHub Secrets
export JWT_SECRET="${{ secrets.JWT_SECRET }}"

# Fallback para desenvolvimento
if [ -z "$JWT_SECRET" ]; then
  echo "⚠️  JWT_SECRET não configurado, usando valor de desenvolvimento"
  export JWT_SECRET="dev-jwt-secret-$(openssl rand -hex 32)"
fi
```

**Prioridade**: 🔴 URGENTE

---

### 2. 🟡 MÉDIO: Falta de Validação de Configuração JWT

**Arquivo**: `apps/backend/src/config/jwt.ts:4-6`

```typescript
// PROBLEMA
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_ACCESS_EXPIRATION = process.env.JWT_ACCESS_EXPIRATION || '15m';
const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';
```

**Problemas**:
- ✗ Secret padrão fraco ("your-secret-key-change-in-production")
- ✗ Não valida formato de expiração
- ✗ Não valida comprimento mínimo do secret
- ✗ Não avisa em produção se usando valor padrão

**Solução Recomendada**:
```typescript
// Validar configuração
function validateJWTConfig() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET é obrigatório em produção');
    }
    console.warn('⚠️  JWT_SECRET não configurado, usando valor padrão de desenvolvimento');
    return 'development-secret-DO-NOT-USE-IN-PRODUCTION';
  }

  if (secret.length < 32) {
    throw new Error('JWT_SECRET deve ter no mínimo 32 caracteres');
  }

  if (secret === 'your-secret-key-change-in-production') {
    throw new Error('JWT_SECRET padrão detectado - altere para um valor seguro');
  }

  return secret;
}

const JWT_SECRET = validateJWTConfig();
```

**Prioridade**: 🟡 ALTA

---

### 3. 🟡 MÉDIO: Ausência de Limpeza Automática de Tokens

**Arquivo**: `apps/backend/src/modules/auth/refresh-token.service.ts:120-138`

**Problema**: Método `cleanupExpiredTokens()` existe mas **nunca é chamado**.

```typescript
// Método existe mas não é usado
async cleanupExpiredTokens(): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const result = await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        {
          AND: [
            { revokedAt: { not: null } },
            { revokedAt: { lt: thirtyDaysAgo } }
          ]
        },
      ],
    },
  });

  return result.count;
}
```

**Impacto**:
- ✗ Tabela `refresh_tokens` cresce infinitamente
- ✗ Performance degradada em consultas
- ✗ Aumento do tamanho do banco de dados
- ✗ Impossível gerenciar sessões antigas

**Solução Recomendada**:

```typescript
// 1. Criar serviço de limpeza automática
// apps/backend/src/services/token-cleanup.service.ts

import { CronJob } from 'cron';
import { refreshTokenService } from '../modules/auth/refresh-token.service';
import { logger } from '../utils/logger';

export class TokenCleanupService {
  private job: CronJob;

  start() {
    // Executar limpeza todo dia às 3h da manhã
    this.job = new CronJob('0 3 * * *', async () => {
      try {
        logger.info('🧹 Iniciando limpeza de tokens expirados...');
        const count = await refreshTokenService.cleanupExpiredTokens();
        logger.info(`✅ ${count} tokens expirados removidos`);
      } catch (error) {
        logger.error('❌ Erro na limpeza de tokens', { error });
      }
    }, null, true, 'America/Sao_Paulo');

    logger.info('✅ Token cleanup service iniciado (3h diariamente)');
  }

  stop() {
    if (this.job) {
      this.job.stop();
      logger.info('🛑 Token cleanup service parado');
    }
  }
}

export const tokenCleanupService = new TokenCleanupService();

// 2. Registrar no app.ts
// apps/backend/src/app.ts

import { tokenCleanupService } from './services/token-cleanup.service';

export function createApp(): Application {
  // ... código existente ...

  // Iniciar limpeza automática de tokens
  tokenCleanupService.start();
  logger.info('✅ Token cleanup service started');

  return app;
}
```

**Dependências necessárias**:
```bash
npm install --workspace=backend cron
npm install --workspace=backend -D @types/cron
```

**Prioridade**: 🟡 ALTA

---

### 4. 🟠 BAIXO: Falta de Atualização de lastUsedAt

**Arquivo**: `apps/backend/src/modules/auth/refresh-token.service.ts:182-193`

**Problema**: Método `updateLastUsed()` existe mas **nunca é chamado**.

```typescript
// Nunca é usado
async updateLastUsed(token: string): Promise<void> {
  try {
    await prisma.refreshToken.update({
      where: { token },
      data: {
        lastUsedAt: new Date(),
      },
    });
  } catch (error) {
    // Ignore if token doesn't exist
  }
}
```

**Impacto**:
- ✗ Campo `lastUsedAt` sempre `null`
- ✗ Impossível rastrear sessões ativas vs inativas
- ✗ Não é possível implementar "expirar por inatividade"
- ✗ Difícil detectar tokens comprometidos

**Solução Recomendada**:

```typescript
// apps/backend/src/modules/auth/refresh-token.service.ts

async rotateRefreshToken(oldToken: string): Promise<RefreshTokenResponse | null> {
  // Validate old token
  const tokenData = await this.validateRefreshToken(oldToken);

  if (!tokenData) {
    return null;
  }

  // ✅ ADICIONAR: Atualizar lastUsedAt do token antigo antes de revogar
  await this.updateLastUsed(oldToken);

  // Get user with permissions
  const user = await prisma.user.findUnique({
    where: { id: tokenData.userId },
  });

  if (!user || !user.isActive) {
    return null;
  }

  // Revoke old token
  await this.revokeRefreshToken(oldToken);

  // Get user permissions
  const permissions = await permissionsService.getUserPermissions(user.id);

  // Generate new token pair
  const tokens = generateTokenPair(user, permissions);

  // Save new refresh token
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
  await this.createRefreshToken(user.id, tokens.refreshToken, expiresAt);

  return tokens;
}
```

**Benefícios**:
- ✅ Rastrear atividade de sessões
- ✅ Implementar "logout por inatividade" no futuro
- ✅ Melhor auditoria de segurança
- ✅ Detectar tokens comprometidos

**Prioridade**: 🟠 MÉDIA

---

### 5. 🔴 CRÍTICO: Inconsistência na Resposta de Refresh Token

**Arquivos**:
- Backend: `apps/backend/src/modules/auth/auth.controller.ts:76`
- Frontend: `apps/frontend/src/lib/apiClient.ts:186`

**Problema**: Frontend espera estrutura diferente do que backend retorna.

```typescript
// BACKEND retorna (auth.controller.ts:76)
const result = await refreshTokenService.rotateRefreshToken(refreshToken);
// result = { accessToken, refreshToken, expiresIn }

successResponse(res, result, 'Token refreshed successfully');
// Resposta = { success: true, data: { accessToken, refreshToken, expiresIn }, message: '...' }

// FRONTEND espera (apiClient.ts:186)
const { accessToken, refreshToken: newRefreshToken, user } = response.data.data;
//                                                    ^^^^ NÃO EXISTE!
```

**Impacto**:
- ✗ Refresh token falha silenciosamente
- ✗ `user` é `undefined`, causando erro no updateTokens
- ✗ Usuário é deslogado mesmo com refresh token válido

**Solução Recomendada**:

```typescript
// 1. Atualizar backend para incluir dados do usuário
// apps/backend/src/modules/auth/refresh-token.service.ts

async rotateRefreshToken(oldToken: string): Promise<RefreshTokenResponse | null> {
  // ... código existente ...

  // Get user with permissions
  const user = await prisma.user.findUnique({
    where: { id: tokenData.userId },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      role: true,
      avatar: true,
      phone: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      lastLogin: true,
      isFirstLogin: true,
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  // ... código existente ...

  // ✅ RETORNAR dados do usuário também
  return {
    ...tokens,
    user: {
      ...user,
      permissions,
    },
  };
}

// 2. Atualizar tipo de resposta
// apps/backend/src/modules/auth/auth.types.ts

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: UserWithPermissions; // ✅ ADICIONAR
}
```

**Prioridade**: 🔴 URGENTE

---

### 6. 🟠 BAIXO: Falta de Gestão de Múltiplas Sessões

**Problema**: Usuário não tem visibilidade nem controle sobre sessões ativas.

**Impacto**:
- ✗ Impossível ver "Onde estou logado?"
- ✗ Não pode fazer logout remoto
- ✗ UX ruim em multi-dispositivo
- ✗ Dificulta auditoria de segurança

**Solução Recomendada**:

```typescript
// 1. Melhorar modelo de dados
// apps/backend/prisma/schema.prisma

model RefreshToken {
  id        String    @id @default(cuid())
  userId    String
  token     String    @unique
  expiresAt DateTime
  createdAt DateTime  @default(now())
  revokedAt DateTime?
  lastUsedAt DateTime?

  // ✅ ADICIONAR metadados de sessão
  deviceName String?   // "Chrome on Windows"
  ipAddress  String?   // "192.168.1.1"
  userAgent  String?   // "Mozilla/5.0..."
  location   String?   // "São Paulo, Brasil" (opcional, via IP geolocation)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
  @@index([revokedAt])
}

// 2. Criar endpoint de sessões com metadados
// apps/backend/src/modules/auth/auth.controller.ts

async getSessions(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      unauthorizedResponse(res, 'Not authenticated');
      return;
    }

    const sessions = await refreshTokenService.getUserActiveTokensWithMetadata(req.user.userId);

    // Marcar sessão atual
    const currentToken = extractTokenFromHeader(req.headers.authorization);
    const sessionsWithCurrent = sessions.map(session => ({
      ...session,
      isCurrent: session.token === currentToken,
    }));

    successResponse(res, sessionsWithCurrent, 'Sessions retrieved successfully');
  } catch (error) {
    errorResponse(res, error instanceof Error ? error.message : 'Failed to get sessions');
  }
}

// 3. Criar endpoint para revogar sessão específica
async revokeSession(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      unauthorizedResponse(res, 'Not authenticated');
      return;
    }

    const { sessionId } = req.params;

    // Verificar se sessão pertence ao usuário
    const session = await prisma.refreshToken.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== req.user.userId) {
      forbiddenResponse(res, 'Session not found or unauthorized');
      return;
    }

    await refreshTokenService.revokeRefreshToken(session.token);

    successResponse(res, null, 'Session revoked successfully');
  } catch (error) {
    errorResponse(res, error instanceof Error ? error.message : 'Failed to revoke session');
  }
}
```

**Frontend**:
```typescript
// apps/frontend/src/pages/admin/Settings/SessionsTab.tsx

export function SessionsTab() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const response = await api.get('/auth/sessions');
    setSessions(response.data.data);
  };

  const revokeSession = async (sessionId: string) => {
    await api.delete(`/auth/sessions/${sessionId}`);
    loadSessions();
  };

  return (
    <div>
      <h2>Sessões Ativas</h2>
      {sessions.map(session => (
        <div key={session.id} className="session-card">
          <div className="session-info">
            <h3>{session.deviceName || 'Dispositivo desconhecido'}</h3>
            <p>Último acesso: {formatDate(session.lastUsedAt)}</p>
            <p>Localização: {session.location || 'Desconhecida'}</p>
            <p>IP: {session.ipAddress}</p>
          </div>
          {session.isCurrent ? (
            <span className="badge">Sessão atual</span>
          ) : (
            <button onClick={() => revokeSession(session.id)}>
              Encerrar sessão
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

**Prioridade**: 🟠 MÉDIA

---

### 7. 🟠 BAIXO: Ausência de Monitoramento e Métricas

**Problema**: Não há métricas nem logs estruturados para monitorar autenticação.

**Impacto**:
- ✗ Impossível detectar tentativas de invasão
- ✗ Não identifica padrões anormais
- ✗ Dificulta debug de problemas de autenticação
- ✗ Não há alertas proativos

**Solução Recomendada**:

```typescript
// apps/backend/src/services/auth-monitoring.service.ts

import { logger } from '../utils/logger';
import { prisma } from '../config/database';

export class AuthMonitoringService {
  /**
   * Log de evento de autenticação
   */
  async logAuthEvent(
    event: 'login' | 'logout' | 'refresh' | 'failed_login' | 'token_expired',
    userId: string | null,
    metadata: {
      ipAddress?: string;
      userAgent?: string;
      reason?: string;
    }
  ) {
    logger.info(`[AUTH] ${event}`, {
      userId,
      event,
      ...metadata,
      timestamp: new Date().toISOString(),
    });

    // Opcional: Salvar em tabela de auditoria
    await prisma.authLog.create({
      data: {
        event,
        userId,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        reason: metadata.reason,
      },
    });
  }

  /**
   * Detectar tentativas de login suspeitas
   */
  async detectSuspiciousActivity(email: string, ipAddress: string): Promise<boolean> {
    // Verificar múltiplas tentativas falhadas nos últimos 15 minutos
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const failedAttempts = await prisma.authLog.count({
      where: {
        event: 'failed_login',
        ipAddress,
        createdAt: { gte: fifteenMinutesAgo },
      },
    });

    if (failedAttempts >= 5) {
      logger.warn('[AUTH] Atividade suspeita detectada', {
        email,
        ipAddress,
        failedAttempts,
      });
      return true;
    }

    return false;
  }

  /**
   * Gerar relatório de autenticações
   */
  async generateAuthReport(startDate: Date, endDate: Date) {
    const stats = await prisma.authLog.groupBy({
      by: ['event'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    });

    return {
      period: { start: startDate, end: endDate },
      events: stats,
      totalEvents: stats.reduce((sum, s) => sum + s._count, 0),
    };
  }
}

export const authMonitoringService = new AuthMonitoringService();
```

**Schema Prisma**:
```prisma
model AuthLog {
  id        String   @id @default(cuid())
  event     String   // login, logout, refresh, failed_login, etc
  userId    String?
  ipAddress String?
  userAgent String?
  reason    String?  // Motivo de falha
  createdAt DateTime @default(now())

  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([event])
  @@index([createdAt])
  @@index([ipAddress])
}
```

**Uso**:
```typescript
// apps/backend/src/modules/auth/auth.service.ts

async login(email: string, password: string, metadata: { ipAddress?: string; userAgent?: string }): Promise<LoginResponse | null> {
  // Detectar atividade suspeita
  const isSuspicious = await authMonitoringService.detectSuspiciousActivity(email, metadata.ipAddress || '');

  if (isSuspicious) {
    await authMonitoringService.logAuthEvent('failed_login', null, {
      ...metadata,
      reason: 'Múltiplas tentativas falhadas detectadas',
    });
    throw new Error('Conta temporariamente bloqueada por segurança');
  }

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    await authMonitoringService.logAuthEvent('failed_login', null, {
      ...metadata,
      reason: 'Usuário não encontrado',
    });
    return null;
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    await authMonitoringService.logAuthEvent('failed_login', user.id, {
      ...metadata,
      reason: 'Senha incorreta',
    });
    return null;
  }

  // ... código existente de login ...

  // Log sucesso
  await authMonitoringService.logAuthEvent('login', user.id, metadata);

  return result;
}
```

**Prioridade**: 🟠 MÉDIA

---

## 📊 Resumo de Prioridades

| Prioridade | Problema | Esforço | Impacto |
|------------|----------|---------|---------|
| 🔴 URGENTE | JWT_SECRET hardcoded | Baixo (1h) | Alto |
| 🔴 URGENTE | Refresh token response inconsistente | Médio (2h) | Alto |
| 🟡 ALTA | Validação de configuração JWT | Baixo (1h) | Médio |
| 🟡 ALTA | Limpeza automática de tokens | Médio (3h) | Médio |
| 🟠 MÉDIA | Atualização de lastUsedAt | Baixo (30min) | Baixo |
| 🟠 MÉDIA | Gestão de múltiplas sessões | Alto (8h) | Médio |
| 🟠 MÉDIA | Monitoramento e métricas | Alto (6h) | Médio |

**Total estimado**: ~21h de desenvolvimento

---

## ✅ Plano de Ação Recomendado

### Fase 1: Correções Críticas (4h)
1. ✅ Mover JWT_SECRET para GitHub Secrets
2. ✅ Corrigir resposta de refresh token no backend
3. ✅ Adicionar validação de configuração JWT
4. ✅ Testar refresh token no frontend

### Fase 2: Melhorias de Infraestrutura (4h)
5. ✅ Implementar limpeza automática de tokens
6. ✅ Adicionar atualização de lastUsedAt
7. ✅ Criar migration para índices otimizados

### Fase 3: Funcionalidades Avançadas (13h)
8. ✅ Implementar gestão de sessões com metadados
9. ✅ Criar UI de sessões ativas no frontend
10. ✅ Implementar monitoramento e logs de autenticação
11. ✅ Adicionar testes automatizados

---

## 🎯 Métricas de Sucesso

Após implementação das correções:

- ✅ 0 tokens invalidados após deploys
- ✅ 100% de refresh tokens bem-sucedidos
- ✅ Tabela refresh_tokens com crescimento controlado
- ✅ Tempo médio de resposta do refresh < 200ms
- ✅ 0 secrets expostos no código fonte
- ✅ Logs estruturados de todas autenticações
- ✅ Usuários podem gerenciar sessões ativamente

---

## 📝 Notas Técnicas

### Configurações Recomendadas

```env
# Produção
JWT_SECRET=[secret de 64 caracteres gerado com openssl rand -hex 32]
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Desenvolvimento
JWT_SECRET=dev-secret-not-for-production
JWT_ACCESS_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=30d
```

### Boas Práticas

1. **Never commit secrets**: Usar GitHub Secrets, AWS Secrets Manager, etc
2. **Rotate secrets periodically**: JWT_SECRET deve ser rotacionado a cada 6 meses
3. **Monitor token usage**: Alertar sobre padrões anormais
4. **Cleanup regularly**: Limpar tokens expirados diariamente
5. **Audit sessions**: Permitir usuários verem e controlarem sessões

---

**Documento gerado automaticamente por Claude Code**
**Última atualização**: 2025-01-19
