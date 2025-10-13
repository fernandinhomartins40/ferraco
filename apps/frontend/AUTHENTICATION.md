# 🔐 Sistema de Autenticação - Ferraco CRM

## Visão Geral

Sistema de autenticação centralizado e profissional com refresh automático de tokens, tratamento de erros 401 e gestão inteligente de requisições concorrentes.

## Arquitetura

### 📦 `apiClient` (apps/frontend/src/lib/apiClient.ts)

Cliente axios centralizado com interceptors configurados para:
- ✅ Adicionar token JWT automaticamente em todas as requisições
- ✅ Refresh automático quando token expira (401)
- ✅ Fila de requisições durante refresh (evita race conditions)
- ✅ Logging estruturado de todas operações
- ✅ Redirecionamento automático para login se autenticação falhar

### 🎯 Fluxo de Autenticação

```
1. Usuário faz login
   ↓
2. Token e RefreshToken salvos no localStorage (Zustand)
   ↓
3. Requisições usam apiClient
   ↓
4. apiClient adiciona Authorization header automaticamente
   ↓
5. Se 401:
   a. Verifica se já está refreshing
   b. Coloca requisições em fila
   c. Faz refresh do token
   d. Atualiza localStorage
   e. Processa fila com novo token
   f. Se refresh falhar → logout + redirect
```

## Como Usar

### ✅ Fazer Requisições (CORRETO)

```typescript
import { apiClient } from '@/lib/apiClient';

// GET
const response = await apiClient.get('/leads');

// POST
const response = await apiClient.post('/leads', { name: 'João' });

// PUT
const response = await apiClient.put('/leads/123', { status: 'ATIVO' });

// DELETE
const response = await apiClient.delete('/leads/123');

// Upload de arquivo
const formData = new FormData();
formData.append('image', file);
const response = await apiClient.post('/upload/image', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

### ❌ NÃO Fazer Isso

```typescript
// ❌ ERRADO - Não usar axios direto
import axios from 'axios';
const response = await axios.get('/api/leads', {
  headers: { Authorization: `Bearer ${token}` } // Não gerenciar token manualmente!
});

// ❌ ERRADO - Não usar fetch
const response = await fetch('/api/leads', {
  headers: { Authorization: `Bearer ${token}` }
});
```

## Estrutura de Armazenamento

### localStorage - `ferraco-auth-storage`

```json
{
  "state": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "123",
      "email": "admin@ferraco.com",
      "role": "ADMIN",
      "permissions": ["leads:read", "leads:write"]
    },
    "isAuthenticated": true
  }
}
```

## Utilidades Exportadas

### getToken()
Recupera o access token atual do localStorage.

```typescript
import { getToken } from '@/lib/apiClient';

const token = getToken(); // string | null
```

### getRefreshToken()
Recupera o refresh token do localStorage.

```typescript
import { getRefreshToken } from '@/lib/apiClient';

const refreshToken = getRefreshToken(); // string | null
```

### clearAuth()
Limpa toda autenticação e redireciona para `/login`.

```typescript
import { clearAuth } from '@/lib/apiClient';

// Logout manual
clearAuth();
```

## Interceptors

### Request Interceptor

```typescript
// Executado ANTES de cada requisição
client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Response Interceptor

```typescript
// Executado DEPOIS de cada resposta
client.interceptors.response.use(
  (response) => response, // Sucesso
  async (error) => {
    // Se 401 → tentar refresh
    if (error.response?.status === 401) {
      // Lógica de refresh aqui
    }
    return Promise.reject(error);
  }
);
```

## Tratamento de Refresh Token

### Problema: Race Conditions

Quando múltiplas requisições retornam 401 ao mesmo tempo, todas tentariam fazer refresh simultaneamente.

### Solução: Fila de Requisições

```typescript
let isRefreshing = false;
let failedQueue = [];

if (isRefreshing) {
  // Adiciona à fila
  return new Promise((resolve, reject) => {
    failedQueue.push({ resolve, reject });
  });
}

// Faz refresh
isRefreshing = true;
const newToken = await refreshToken();

// Processa fila
failedQueue.forEach(prom => prom.resolve(newToken));
isRefreshing = false;
```

## Logs

Todos os eventos são logados para debugging:

```typescript
logger.info('Token refreshed com sucesso');
logger.error('Erro na resposta da API', {
  status: 401,
  url: '/api/leads'
});
logger.warn('Sem refresh token disponível');
```

## Configuração do Backend

### Tempo de Expiração

```env
JWT_ACCESS_EXPIRATION=15m    # Access token expira em 15 minutos
JWT_REFRESH_EXPIRATION=7d    # Refresh token expira em 7 dias
```

### Endpoint de Refresh

```typescript
POST /api/auth/refresh
Body: { refreshToken: "..." }
Response: {
  data: {
    accessToken: "...",
    refreshToken: "...",
    user: { ... }
  }
}
```

## Migração de Código Existente

### Antes

```typescript
// Cada service criava seu próprio axios
const createApiClient = () => {
  const client = axios.create();
  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    // ...
  });
  return client;
};
```

### Depois

```typescript
// Todos usam apiClient centralizado
import { apiClient } from '@/lib/apiClient';

const response = await apiClient.get('/leads');
```

## Segurança

### ✅ Boas Práticas Implementadas

- Token nunca exposto em URL ou query params
- HTTPS obrigatório em produção
- Refresh token com expiração longa (7 dias)
- Access token com expiração curta (15 min)
- Logout automático em erro de refresh
- Redirecionamento seguro para login

### ⚠️ Não Implementado (Melhorias Futuras)

- Fingerprinting de dispositivo
- IP whitelist
- 2FA (Two-Factor Authentication)
- Revogação de tokens no servidor
- Rate limiting por usuário

## Troubleshooting

### Token expira muito rápido
Verifique `JWT_ACCESS_EXPIRATION` no backend.

### Refresh não funciona
1. Verifique endpoint `/api/auth/refresh`
2. Verifique se `refreshToken` está no localStorage
3. Veja logs no console (F12)

### 401 mesmo após login
1. Limpe localStorage
2. Faça login novamente
3. Verifique se token está sendo salvo

### Múltiplos redirects para /login
Verifique se `clearAuth()` não está sendo chamado múltiplas vezes.

## Exemplo Completo

```typescript
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/hooks/useAuth';

const LeadsPage = () => {
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        // apiClient adiciona auth automaticamente
        const response = await apiClient.get('/leads');
        setLeads(response.data.data);
      } catch (error) {
        // Se 401, refresh é tentado automaticamente
        // Se refresh falhar, redirect para /login
        console.error('Erro ao buscar leads:', error);
      }
    };

    if (isAuthenticated) {
      fetchLeads();
    }
  }, [isAuthenticated]);

  return <div>...</div>;
};
```

## Contribuindo

Ao adicionar novos services ou componentes:

1. **SEMPRE** use `apiClient` do `@/lib/apiClient`
2. **NUNCA** crie novos axios instances
3. **NUNCA** gerencie token manualmente
4. **SEMPRE** deixe os interceptors tratarem auth

---

**Última atualização**: 13/10/2025
**Responsável**: Claude (Auditoria Completa do Sistema de Autenticação)
