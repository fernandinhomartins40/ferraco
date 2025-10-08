# 🔍 Como Investigar o Erro 500 na Sincronização RAG

## ✅ Commits Enviados

1. **234418d** - Logs detalhados no backend (fusechatService.ts)
2. **7672409** - Logs detalhados no frontend (AdminAI.tsx)

## 📋 Passos para Diagnosticar

### 1️⃣ Aguardar Deploy Automático

Aguarde o deploy do Vercel/Netlify finalizar (~2-3 minutos)

### 2️⃣ Abrir Console do Navegador

1. Abra: `https://painelcheckar.com.br/admin/ai`
2. Pressione **F12** para abrir DevTools
3. Vá na aba **Console**

### 3️⃣ Configurar e Testar

1. Configure a **API Key** na aba "1. API & RAG"
2. Adicione **dados da empresa** na aba "2. Empresa"
3. Adicione **pelo menos 1 produto** na aba "3. Produtos"
4. Volte para aba "1. API & RAG"
5. Clique em **"Sincronizar Knowledge Base"**

### 4️⃣ Verificar Logs do Frontend

No console do navegador, você verá:

```
🔍 Dados do localStorage: {
  companyData: {...},
  products: X,
  faqs: Y,
  apiKey: "✅ Presente"
}

📤 Enviando payload para backend: {
  "apiKey": "pk_xxx...",
  "companyData": {...},
  "products": [...],
  "faqs": [...]
}

📥 Resposta recebida: 500 Internal Server Error

❌ Erro do servidor: {conteúdo completo do erro}
```

### 5️⃣ Verificar Logs do Backend

**No servidor (via SSH ou painel):**

```bash
# Ver logs em tempo real
pm2 logs ferraco-backend

# Ou via Docker
docker logs -f container_name
```

**Logs esperados no backend:**

```
📚 Requisição de sincronização recebida
🔑 API Key presente: true
🏢 CompanyData presente: true
📦 Products: 2
❓ FAQs: 0
📦 Usando dados enviados pelo frontend (localStorage)
📤 Enviando 5 documentos para FuseChat...
🔑 API Key: pk_xxxxxxxx...
🌐 URL: https://digiurbis.com.br/api/rag/knowledge
📋 Payload: {...}

❌ ERRO DETALHADO ao sincronizar Knowledge Base:
▶ Status HTTP: 500
▶ Status Text: Internal Server Error
▶ Response Data: {...}
▶ Error Message: ...
▶ Error Code: ...
▶ Stack: ...
```

## 🎯 Possíveis Causas do Erro

### 1. **API Key Inválida** (Status 401)
- **Sintoma:** `▶ Status HTTP: 401`
- **Solução:** Verificar API Key no painel FuseChat

### 2. **URL da API Incorreta** (Status 404)
- **Sintoma:** `▶ Status HTTP: 404`
- **Solução:** Verificar se endpoint `/api/rag/knowledge` existe

### 3. **Payload Inválido** (Status 400)
- **Sintoma:** `▶ Status HTTP: 400` + detalhes do erro
- **Solução:** Verificar estrutura do payload no log

### 4. **Timeout de Rede** (ECONNABORTED/ETIMEDOUT)
- **Sintoma:** `▶ Error Code: ECONNABORTED`
- **Solução:** Aumentar timeout no axios (atualmente 60s)

### 5. **Erro no Servidor FuseChat** (Status 500)
- **Sintoma:** `▶ Status HTTP: 500` + mensagem de erro da API
- **Solução:** Entrar em contato com suporte do FuseChat

### 6. **Dados Vazios**
- **Sintoma:** `Erro: Nenhum documento para sincronizar`
- **Solução:** Adicionar dados da empresa e produtos

### 7. **CORS ou Proxy**
- **Sintoma:** `Error: Network Error` sem status HTTP
- **Solução:** Verificar configuração de CORS no backend

## 🛠️ Soluções Rápidas

### Se o erro for de API Key:
```typescript
// Verificar se API Key está correta
console.log('API Key:', aiConfig.fuseChatApiKey);
```

### Se o erro for de payload:
```typescript
// Verificar estrutura dos dados
console.log('CompanyData:', JSON.stringify(companyData, null, 2));
console.log('Products:', JSON.stringify(products, null, 2));
```

### Se o erro for de rede:
```typescript
// Testar conexão direta (no backend)
curl -X POST https://digiurbis.com.br/api/rag/knowledge \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sua_api_key" \
  -d '{"name": "teste", "description": "teste", "documents": []}'
```

## 📞 Próximos Passos

1. **Testar em produção** após o deploy
2. **Capturar logs completos** (frontend + backend)
3. **Identificar a causa** usando os logs
4. **Aplicar correção específica** baseada no erro

---

**🔴 IMPORTANTE:** Copie e cole aqui os logs completos do erro (frontend e backend) para que eu possa ajudar a resolver!
