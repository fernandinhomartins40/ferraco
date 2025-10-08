# Integração FuseChat RAG - Documentação

## 📚 Visão Geral

A aplicação Ferraco foi integrada com **FuseChat**, uma plataforma de IA conversacional com **RAG (Retrieval-Augmented Generation)**. Isso permite que a IA tenha conhecimento específico sobre produtos, serviços e políticas da empresa, respondendo com precisão às perguntas dos clientes.

## 🎯 O que mudou?

### Antes (Ollama Local)
- System prompt enviado em **cada mensagem** (~5KB por mensagem)
- Contexto limitado ao prompt
- Necessário rodar Ollama localmente
- Respostas genéricas sem conhecimento específico

### Depois (FuseChat RAG)
- Mensagens simples e diretas (~100 bytes)
- **RAG busca automaticamente** informações relevantes
- IA na nuvem (sem necessidade de infraestrutura local)
- Respostas precisas baseadas na **Knowledge Base configurada**

## 🚀 Como Usar

### 1. Obter API Key do FuseChat

1. Acesse [https://digiurbis.com.br](https://digiurbis.com.br)
2. Faça login ou crie uma conta
3. Navegue até **API Keys** no menu lateral
4. Clique em **"Nova API Key"**
5. Escolha o modelo de IA (recomendado: **Qwen** ou **Llama 3.2**)
6. Copie a chave gerada (formato: `pk_XXXXXXXXXX`)

### 2. Configurar na Aplicação

#### Via Interface Admin

1. Acesse o painel administrativo
2. Navegue até **Configurações de IA** ou **FuseChat**
3. Cole a API Key no campo correspondente
4. Clique em **"Salvar"**

#### Via Variável de Ambiente (Backend)

Adicione no arquivo `.env` do backend:

```env
FUSECHAT_API_KEY=pk_sua_chave_aqui
```

### 3. Sincronizar Knowledge Base

Após configurar a API Key, sincronize os dados da empresa:

1. No painel admin, vá até **FuseChat Manager**
2. Clique em **"Sincronizar Tudo"** ou sincronize individualmente:
   - **Knowledge Base**: Produtos, FAQs, informações da empresa
   - **Guardrails**: Regras de comportamento da IA

## 🔧 Endpoints da API

### Sincronização

```bash
# Sincronizar Knowledge Base
POST /api/chatbot/fusechat/sync-knowledge
Content-Type: application/json

{
  "apiKey": "pk_sua_chave_aqui"
}
```

```bash
# Configurar Guardrails
POST /api/chatbot/fusechat/sync-guardrails
Content-Type: application/json

{
  "apiKey": "pk_sua_chave_aqui"
}
```

### Consulta

```bash
# Obter Knowledge Base atual
GET /api/chatbot/fusechat/knowledge
X-API-Key: pk_sua_chave_aqui
```

```bash
# Obter Guardrails atuais
GET /api/chatbot/fusechat/guardrails
X-API-Key: pk_sua_chave_aqui
```

```bash
# Obter estatísticas de uso
GET /api/chatbot/fusechat/stats
X-API-Key: pk_sua_chave_aqui
```

### Chat

```bash
# Enviar mensagem para IA (via proxy)
POST /api/chatbot/fusechat-proxy
Content-Type: application/json

{
  "message": "Quanto custa um portão?",
  "apiKey": "pk_sua_chave_aqui",
  "session_id": "uuid-opcional"
}
```

## 📊 O que é Sincronizado?

### Knowledge Base

A sincronização envia os seguintes documentos para o FuseChat:

1. **Política de Atendimento**
   - Nome da empresa
   - Ramo de atuação
   - Descrição
   - Diferenciais
   - Horário e localização
   - Regras de comportamento da IA

2. **Produtos**
   - Nome, descrição, categoria
   - Preço (se disponível)
   - Palavras-chave
   - Instruções de como vender

3. **FAQs**
   - Perguntas frequentes
   - Respostas padronizadas

4. **Scripts de Captação**
   - Estratégias de coleta de dados
   - Qualificação de leads
   - Boas práticas

### Guardrails

Configurações de segurança e comportamento:

- **Tópicos proibidos**: política, religião, clima, notícias
- **Tópicos permitidos**: produtos, serviços, orçamento, atendimento
- **Mensagem de fallback**: quando pergunta está fora do escopo
- **Classificador LLM**: usa IA para detectar tópicos proibidos

## 🔄 Sincronização Automática

**Quando sincronizar?**

A Knowledge Base deve ser sincronizada sempre que:

- ✅ Adicionar/editar/remover produtos
- ✅ Adicionar/editar/remover FAQs
- ✅ Atualizar dados da empresa
- ✅ Mudar políticas de atendimento

**Como funciona?**

O sistema possui um módulo de sincronização automática que pode ser acionado:

```typescript
import { autoSyncKnowledgeBase } from './utils/autoSyncFuseChat';

// Após salvar produto
await autoSyncKnowledgeBase();

// Ou com API Key específica
await autoSyncKnowledgeBase('pk_sua_chave');
```

## 🛡️ Guardrails - Controle de Comportamento

### O que são Guardrails?

Guardrails são regras que controlam o comportamento da IA, garantindo que:

- ✅ Responda APENAS sobre produtos/serviços da empresa
- ❌ Não fale sobre política, religião, notícias
- ✅ Ofereça transferência para humano quando não souber
- ❌ Não invente informações

### Como funcionam?

1. **Keywords proibidas**: Bloqueia respostas sobre tópicos específicos
2. **Tópicos permitidos**: Lista explícita do que a IA pode falar
3. **Classificador LLM**: IA analisa a pergunta antes de responder
4. **Fallback**: Mensagem padrão quando bloqueado

## 📈 Estatísticas e Monitoramento

Acesse as estatísticas para monitorar:

- Total de mensagens enviadas
- Documentos na Knowledge Base
- Rate limit restante (60/minuto)
- Modelo de IA utilizado

## 🐛 Troubleshooting

### "API Key inválida"
- Verifique se copiou a chave completa (começa com `pk_`)
- Confirme se a chave está ativa em digiurbis.com.br

### "Rate limit excedido"
- FuseChat tem limites de requisições por hora/minuto
- Aguarde alguns minutos antes de tentar novamente
- Considere fazer cache das respostas frequentes

### "Knowledge Base vazia"
- Execute a sincronização completa
- Verifique se há produtos/FAQs cadastrados no sistema
- Confira os logs do backend para erros de sincronização

### "IA responde sobre tópicos proibidos"
- Re-sincronize os Guardrails
- Ative `use_llm_classifier: true` para detecção mais precisa
- Adicione keywords proibidas específicas

## 📝 Boas Práticas

1. **Sincronize regularmente**: Sempre que atualizar dados da empresa
2. **Use session_id**: Mantém contexto da conversa entre mensagens
3. **Monitore rate limits**: Evite ultrapassar 60 msg/minuto
4. **Atualize Guardrails**: Adicione novos tópicos proibidos conforme necessário
5. **Teste respostas**: Valide se a IA está respondendo corretamente após sincronizar

## 🔗 Links Úteis

- **FuseChat**: [https://digiurbis.com.br](https://digiurbis.com.br)
- **Documentação API**: Incluída no projeto
- **Suporte**: Contate a equipe FuseChat para dúvidas técnicas

## 🎓 Conceitos Importantes

### RAG (Retrieval-Augmented Generation)

1. **Cliente pergunta**: "Quanto custa um portão?"
2. **FuseChat busca**: Documentos sobre portões na Knowledge Base
3. **IA gera resposta**: Com informações precisas encontradas
4. **Retorna**: Resposta contextualizada e atualizada

### Session ID

Identificador único da conversa. Use o mesmo ID para:
- Manter contexto entre mensagens
- Histórico de conversa
- Análise de jornada do cliente

### Chunks e Embeddings

- Documentos são divididos em **chunks** (pedaços de ~500 caracteres)
- Cada chunk é transformado em **embedding** (vetor numérico)
- Busca por similaridade encontra chunks relevantes
- IA usa chunks como contexto para responder

## 🚀 Próximos Passos

1. [ ] Implementar sincronização automática em hooks de CRUD
2. [ ] Adicionar dashboard de métricas do FuseChat
3. [ ] Criar testes A/B de diferentes prompts
4. [ ] Implementar feedback loop (usuário avalia respostas)
5. [ ] Adicionar suporte a upload de documentos (PDFs, DOCX)
