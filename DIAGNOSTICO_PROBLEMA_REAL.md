# 🔍 DIAGNÓSTICO - Problema Real em /admin/ai

**Data:** 2025-10-10
**Problema Reportado:** Dados somem DEPOIS de salvar e fazer refresh

---

## 🎯 ENTENDIMENTO CORRETO DO PROBLEMA

### ❌ **FLUXO PROBLEMÁTICO**

```
1. Usuário preenche "Nome: Ferraco" e "Descrição: Empresa..."
2. Clica em "Salvar"
3. ✅ Toast: "Dados da empresa salvos no banco de dados!"
4. F5 (refresh)
5. ❌ CAMPOS VAZIOS! (Dados perdidos)
```

---

## 🔬 POSSÍVEIS CAUSAS

### Hipótese 1: Backend não está salvando
```
POST /api/config/company → 200 OK
Mas dados NÃO vão para o banco
```

### Hipótese 2: Backend salva mas GET não retorna
```
POST /api/config/company → Salva OK
GET /api/config/company → Retorna null ou {}
```

### Hipótese 3: localStorage limpa antes de salvar
```
Minha implementação limpa localStorage APÓS save
Se save falhar → localStorage vazio + banco vazio = PERDA
```

### Hipótese 4: Formato de dados incompatível
```
Frontend envia: { differentials: ['A', 'B'] }
Backend salva: { differentials: '["A","B"]' }  // JSON string
GET retorna: { differentials: '["A","B"]' }  // String
Frontend espera: { differentials: ['A', 'B'] }  // Array
Parse JSON falha → dados ignorados
```

---

## 🐛 CÓDIGO SUSPEITO

### 1. **AdminAI.tsx - Linha 250-251**
```typescript
// ✅ LIMPAR draft do localStorage após salvar com sucesso
localStorage.removeItem(STORAGE_KEYS.companyDraft);
```

**Problema potencial:**
- Se `saveCompanyData` retornar sucesso mas **NÃO salvar** no banco
- localStorage é limpo
- Próximo refresh: nada no localStorage + nada no banco = PERDA

**Solução:**
- Só limpar se **confirmar** que dados foram salvos no banco
- Adicionar verificação extra

---

### 2. **configApiClient.ts - Linha 77-78**
```typescript
async saveCompanyData(data: CompanyData): Promise<CompanyData> {
  const response = await apiClient.post('/config/company', data);
  return response.data?.data || response.data;
}
```

**Problema potencial:**
- Se backend retorna `{ success: true }` sem `data`
- Retorna `{ success: true }` ao invés do objeto salvo
- Frontend acha que salvou mas não recebe os dados

---

### 3. **AdminAI.tsx - Linha 168-170**
```typescript
if (company) {
  setCompanyData(company);
}
```

**Problema potencial:**
- Se `company` for `null`, não atualiza estado
- Estado anterior (draft) é mantido
- Mas se localStorage foi limpo → estado vazio

---

### 4. **configController.ts - Linha 15-20**
```typescript
if (!company) {
  res.json({
    success: true,
    data: null  // ❌ Retorna null
  });
  return;
}
```

**Comportamento:**
- Se não houver dados no banco, retorna `data: null`
- Frontend recebe `null`
- `if (company)` falha → não atualiza estado
- Estado fica como estava (vazio se refresh)

---

## 🧪 TESTE PARA DIAGNOSTICAR

### Adicionar logs temporários no AdminAI.tsx:

```typescript
const loadData = async () => {
  try {
    console.log('🔍 [DEBUG] Iniciando loadData...');

    const company = await configApi.getCompanyData();
    console.log('🔍 [DEBUG] Company retornado da API:', company);

    if (company) {
      console.log('✅ [DEBUG] Atualizando companyData com:', company);
      setCompanyData(company);
    } else {
      console.warn('⚠️  [DEBUG] Company é null/undefined! Estado não atualizado.');
    }

    // ...
  } catch (error: any) {
    console.error('❌ [DEBUG] Erro ao carregar dados:', error);
  }
};

const handleSaveCompany = async () => {
  try {
    console.log('💾 [DEBUG] Salvando companyData:', companyData);

    const savedCompany = await configApi.saveCompanyData(companyData);
    console.log('✅ [DEBUG] Resposta da API:', savedCompany);

    setCompanyData(savedCompany);

    // ✅ LIMPAR draft do localStorage após salvar com sucesso
    console.log('🗑️  [DEBUG] Limpando localStorage...');
    localStorage.removeItem(STORAGE_KEYS.companyDraft);

    toast.success('Dados salvos!');
  } catch (error) {
    console.error('❌ [DEBUG] Erro ao salvar:', error);
  }
};
```

---

## 🔧 SOLUÇÃO PROPOSTA

### Opção 1: Não limpar localStorage (MAIS SEGURA)
```typescript
const handleSaveCompany = async () => {
  try {
    const savedCompany = await configApi.saveCompanyData(companyData);
    setCompanyData(savedCompany);

    // ❌ NÃO LIMPAR localStorage
    // Deixar draft como backup mesmo após salvar
    // localStorage.removeItem(STORAGE_KEYS.companyDraft);

    toast.success('Dados salvos!');
  } catch (error) {
    console.error('Erro ao salvar:', error);
  }
};
```

**Vantagem:**
- Sempre tem backup no localStorage
- Se banco falhar no GET, usa localStorage

**Desvantagem:**
- localStorage pode ficar dessinc com banco

---

### Opção 2: Limpar apenas se GET confirmar
```typescript
const handleSaveCompany = async () => {
  try {
    const savedCompany = await configApi.saveCompanyData(companyData);
    setCompanyData(savedCompany);

    toast.success('Dados salvos!');

    // ✅ Verificar se realmente salvou buscando novamente
    setTimeout(async () => {
      const verified = await configApi.getCompanyData();
      if (verified && verified.name === savedCompany.name) {
        // Confirmado! Pode limpar draft
        localStorage.removeItem(STORAGE_KEYS.companyDraft);
        console.log('✅ Dados confirmados no banco, draft limpo');
      } else {
        console.warn('⚠️  Dados não confirmados, mantendo draft');
      }
    }, 500);
  } catch (error) {
    console.error('Erro ao salvar:', error);
  }
};
```

---

### Opção 3: Merge localStorage + banco
```typescript
const loadData = async () => {
  try {
    const company = await configApi.getCompanyData();
    const localDraft = localStorage.getItem(STORAGE_KEYS.companyDraft);

    if (company) {
      // Se tem dados no banco, usar do banco
      setCompanyData(company);
      // Limpar localStorage já que banco é source of truth
      localStorage.removeItem(STORAGE_KEYS.companyDraft);
    } else if (localDraft) {
      // Se não tem no banco mas tem no localStorage, usar draft
      setCompanyData(JSON.parse(localDraft));
    }
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
  }
};
```

**Esta é a MELHOR opção!**

---

## ✅ IMPLEMENTAÇÃO CORRETA

### 1. Modificar `loadData()` para ser mais inteligente:

```typescript
const loadData = async () => {
  try {
    // Buscar dados do banco
    const company = await configApi.getCompanyData();
    const prods = await configApi.getProducts();
    const config = await configApi.getChatbotConfig();
    const links = await configApi.getChatLinks();
    const faqItems = await configApi.getFAQs();

    // ✅ LÓGICA INTELIGENTE: Banco tem prioridade, depois localStorage
    if (company && company.name) {
      // Banco tem dados → usar e limpar draft
      setCompanyData(company);
      localStorage.removeItem(STORAGE_KEYS.companyDraft);
    } else {
      // Banco vazio → manter draft do localStorage se existir
      console.warn('Banco retornou vazio, mantendo draft do localStorage');
    }

    if (config && config.welcomeMessage) {
      setAIConfig({
        ...config,
        handoffTriggers: Array.isArray(config.handoffTriggers)
          ? config.handoffTriggers
          : JSON.parse(config.handoffTriggers || '[]')
      });
      localStorage.removeItem(STORAGE_KEYS.aiConfigDraft);
    }

    // ... resto do código

    calculateProgress(company, prods, faqItems, config);
  } catch (error: any) {
    console.error('Erro ao carregar dados:', error);
    if (error?.response?.status !== 401) {
      toast.error('Erro ao carregar configurações');
    }
  }
};
```

### 2. Modificar `handleSaveCompany` para NÃO limpar imediatamente:

```typescript
const handleSaveCompany = async () => {
  if (!companyData.name || !companyData.industry || !companyData.description) {
    toast.error('Preencha os campos obrigatórios: Nome, Ramo e Descrição');
    return;
  }

  try {
    const savedCompany = await configApi.saveCompanyData(companyData);

    if (!savedCompany || !savedCompany.name) {
      throw new Error('Resposta da API inválida');
    }

    setCompanyData(savedCompany);

    // ✅ NÃO limpar aqui! Deixar o loadData() fazer isso
    // localStorage.removeItem(STORAGE_KEYS.companyDraft);

    toast.success('Dados da empresa salvos no banco de dados!');

    // Recalcular progresso
    const [prods, faqItems, config] = await Promise.all([
      configApi.getProducts(),
      configApi.getFAQs(),
      configApi.getChatbotConfig()
    ]);
    calculateProgress(savedCompany, prods, faqItems, config);
  } catch (error) {
    console.error('Erro ao salvar empresa:', error);
    toast.error('Erro ao salvar dados da empresa. Draft mantido no localStorage.');
  }
};
```

---

## 🎯 RESUMO DA CORREÇÃO

**Problema identificado:**
- localStorage sendo limpo ANTES de confirmar que dados estão no banco
- Se banco retornar `null` no próximo GET → perda total

**Solução:**
1. ✅ Não limpar localStorage no `handleSave`
2. ✅ Deixar `loadData()` limpar apenas se banco retornar dados válidos
3. ✅ localStorage vira backup permanente até confirmação

**Fluxo corrigido:**
```
1. Preenche → Auto-save em localStorage
2. Clica "Salvar" → Salva no banco
3. localStorage mantido como backup
4. Refresh → loadData()
5. Se banco retorna dados → usa banco + limpa localStorage
6. Se banco vazio → usa localStorage
7. ✅ NUNCA PERDE DADOS
```

---

**Status:** Diagnóstico completo
**Próximo passo:** Implementar correção
