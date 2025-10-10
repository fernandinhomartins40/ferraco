# 🔍 AUDITORIA COMPLETA - Página /admin/ai

**Data:** 2025-10-09
**Problema Reportado:** Dados das abas "Comportamento" e "Empresa" são perdidos ao fazer refresh
**Status:** ✅ **CAUSA RAIZ IDENTIFICADA**

---

## 📊 RESUMO EXECUTIVO

### ❌ **PROBLEMA CONFIRMADO**

Os dados **SÃO PERDIDOS** ao fazer refresh da página porque:

1. ✅ **Backend está correto** - Dados são salvos no banco via API
2. ✅ **Frontend carrega dados** - useEffect chama `loadData()` no mount
3. ❌ **ESTADO LOCAL NÃO É PRESERVADO** - Dados digitados mas não salvos são perdidos
4. ❌ **SEM CACHE/PERSISTÊNCIA TEMPORÁRIA** - Nenhum localStorage como backup

### 🎯 **CAUSA RAIZ**

O problema ocorre no **fluxo de edição → refresh → perda de dados**:

```
1. Usuário digita "Nome da Empresa: Ferraco Metalúrgica"
2. Usuário digita "Descrição: Somos especialistas em..."
3. Usuário NÃO clica em "Salvar"
4. Usuário faz refresh (F5)
5. ❌ DADOS PERDIDOS - voltam ao último estado salvo no banco
```

**Por quê?**
- Dados apenas em `useState` (memória volátil)
- Sem localStorage como backup
- Refresh = reinicialização total do componente
- loadData() busca do banco (que não tem os dados não salvos)

---

## 🔬 ANÁLISE TÉCNICA DETALHADA

### 1. Fluxo de Dados Atual

```typescript
// AdminAI.tsx - Linha 79-129
useEffect(() => {
  loadData(); // ✅ Carrega do banco no mount
}, []);

const loadData = async () => {
  // Busca dados da API
  const company = await configApi.getCompanyData();
  const prods = await configApi.getProducts();
  const config = await configApi.getChatbotConfig();

  // Atualiza estados
  if (company) {
    setCompanyData(company); // ✅ Popula do banco
  }
  // ...
};
```

**✅ Funciona bem quando:**
- Usuário preenche → Salva → Refresh → Dados mantidos

**❌ Falha quando:**
- Usuário preenche → **NÃO** Salva → Refresh → Dados perdidos

---

### 2. Persistência Atual

#### ✅ **Backend (Banco de Dados)**

**Endpoints funcionais:**
```
POST /api/config/company → Salva no banco ✅
GET  /api/config/company → Busca do banco ✅
POST /api/config/chatbot-config → Salva no banco ✅
GET  /api/config/chatbot-config → Busca do banco ✅
```

**Controller correto:**
```typescript
// configController.ts - Linha 38-106
async saveCompanyData(req, res, next) {
  const data = req.body;

  // Validações
  if (!data.name || !data.industry || !data.description) {
    throw new AppError(400, 'Campos obrigatórios...');
  }

  // Salva no banco
  const existing = await prisma.companyData.findFirst();
  if (existing) {
    company = await prisma.companyData.update({...}); // ✅
  } else {
    company = await prisma.companyData.create({...}); // ✅
  }

  res.json({ success: true, data: parsedCompany });
}
```

#### ❌ **Frontend (Sem Cache Temporário)**

**Sem localStorage:**
```typescript
// AdminAI.tsx NÃO tem:
localStorage.setItem('companyData_draft', JSON.stringify(companyData)); // ❌
localStorage.setItem('aiConfig_draft', JSON.stringify(aiConfig)); // ❌
```

**Resultado:**
- Dados só existem em memória (useState)
- Refresh = perda total se não salvou

---

### 3. Gerenciamento de Estado

#### Estados Principais:

```typescript
const [companyData, setCompanyData] = useState<CompanyData>({
  name: '',
  industry: '',
  description: '',
  differentials: [],
  targetAudience: '',
  location: '',
  workingHours: '',
  phone: '',
  website: ''
});

const [aiConfig, setAIConfig] = useState<AIConfig>({
  isEnabled: false,
  welcomeMessage: '',
  fallbackMessage: '',
  handoffTriggers: []
});
```

**Problema:**
- Estados inicializados vazios
- Apenas populados após `loadData()` no mount
- Se banco vazio → estados vazios
- Se digitou sem salvar → estados temporários perdidos

---

### 4. Fluxo de Save

```typescript
// AdminAI.tsx - Linha 166-188
const handleSaveCompany = async () => {
  // Validação
  if (!companyData.name || !companyData.industry || !companyData.description) {
    toast.error('Preencha os campos obrigatórios...');
    return; // ⚠️ Não salva se inválido
  }

  // Salva na API
  const savedCompany = await configApi.saveCompanyData(companyData);
  setCompanyData(savedCompany); // ✅ Atualiza state com resposta da API
  toast.success('Dados da empresa salvos no banco de dados!');

  // Recalcula progresso
  calculateProgress(savedCompany, prods, faqItems, config);
};
```

**✅ Correto:**
- Salva no banco
- Atualiza state com resposta
- Feedback ao usuário

**⚠️ Problema:**
- Se usuário não clicar em "Salvar"
- Dados ficam apenas no state temporário
- Refresh = perda total

---

## 🐛 CENÁRIOS DE PERDA DE DADOS

### Cenário 1: Digitou mas não salvou
```
1. Abre /admin/ai
2. Clica na aba "Empresa"
3. Digita "Nome: Ferraco Metalúrgica"
4. Digita "Descrição: Empresa especializada..."
5. Muda para aba "Produtos" (sem salvar)
6. F5 (refresh)
7. ❌ PERDEU: Nome e Descrição voltam vazios
```

### Cenário 2: Salvou parcialmente
```
1. Preenche "Nome" e "Ramo"
2. Deixa "Descrição" vazio
3. Clica "Salvar"
4. ❌ ERRO: "Preencha os campos obrigatórios..."
5. Digita "Descrição"
6. F5 (refresh) antes de salvar
7. ❌ PERDEU: Descrição volta vazia
```

### Cenário 3: Erro de rede
```
1. Preenche formulário completo
2. Clica "Salvar"
3. ❌ Erro 500 ou timeout
4. Dados não foram salvos no banco
5. F5 (refresh)
6. ❌ PERDEU: Tudo volta vazio
```

---

## ✅ SOLUÇÕES PROPOSTAS

### 🥇 **SOLUÇÃO 1: Auto-save em localStorage (RECOMENDADA)**

**Conceito:** Salvar automaticamente em localStorage a cada mudança

**Implementação:**
```typescript
// Salvar automaticamente ao digitar
useEffect(() => {
  localStorage.setItem('companyData_draft', JSON.stringify(companyData));
}, [companyData]);

useEffect(() => {
  localStorage.setItem('aiConfig_draft', JSON.stringify(aiConfig));
}, [aiConfig]);

// Carregar do localStorage primeiro, depois do banco
useEffect(() => {
  // 1. Carregar draft do localStorage
  const companyDraft = localStorage.getItem('companyData_draft');
  const configDraft = localStorage.getItem('aiConfig_draft');

  if (companyDraft) {
    setCompanyData(JSON.parse(companyDraft));
  }

  if (configDraft) {
    setAIConfig(JSON.parse(configDraft));
  }

  // 2. Carregar dados salvos do banco (sobrescreve se houver)
  loadData();
}, []);

// Limpar localStorage após salvar com sucesso
const handleSaveCompany = async () => {
  const savedCompany = await configApi.saveCompanyData(companyData);
  setCompanyData(savedCompany);
  localStorage.removeItem('companyData_draft'); // ✅ Limpa draft
  toast.success('Dados salvos!');
};
```

**Vantagens:**
- ✅ Zero perda de dados
- ✅ Funciona offline
- ✅ Simples de implementar
- ✅ Não muda fluxo do usuário

**Desvantagens:**
- ⚠️ Pode ficar dessinc se abrir em 2 abas
- ⚠️ Precisa limpar localStorage ao salvar

---

### 🥈 **SOLUÇÃO 2: Modal de confirmação no refresh**

**Conceito:** Avisar usuário antes de perder dados

**Implementação:**
```typescript
useEffect(() => {
  const hasUnsavedChanges = () => {
    // Verificar se há dados não salvos
    return companyData.name !== '' || aiConfig.welcomeMessage !== '';
  };

  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges()) {
      e.preventDefault();
      e.returnValue = 'Você tem alterações não salvas. Deseja sair mesmo assim?';
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [companyData, aiConfig]);
```

**Vantagens:**
- ✅ Alerta o usuário
- ✅ Simples de implementar

**Desvantagens:**
- ❌ Não evita perda de dados
- ❌ Usuário pode ignorar

---

### 🥉 **SOLUÇÃO 3: Auto-save periódico no banco**

**Conceito:** Salvar automaticamente no banco a cada X segundos

**Implementação:**
```typescript
useEffect(() => {
  const autoSaveInterval = setInterval(async () => {
    if (companyData.name) {
      try {
        await configApi.saveCompanyData(companyData);
        toast.success('Salvamento automático', { duration: 1000 });
      } catch (error) {
        // Silencioso se falhar
      }
    }
  }, 30000); // 30 segundos

  return () => clearInterval(autoSaveInterval);
}, [companyData]);
```

**Vantagens:**
- ✅ Zero perda de dados
- ✅ Sempre sincronizado

**Desvantagens:**
- ❌ Muitas requisições ao backend
- ❌ Pode salvar dados incompletos

---

## 📋 RECOMENDAÇÃO FINAL

### ✅ **IMPLEMENTAR SOLUÇÃO 1 + SOLUÇÃO 2**

**Combinação ideal:**
1. **localStorage para draft** → Evita perda de dados
2. **beforeunload warning** → Alerta usuário se esquecer

**Benefícios:**
- ✅ Zero perda de dados
- ✅ UX melhorado
- ✅ Avisos claros ao usuário
- ✅ Compatível com fluxo atual

**Implementação estimada:** 30 minutos

---

## 🔧 CÓDIGO DA SOLUÇÃO COMPLETA

### Arquivo: `src/pages/admin/AdminAI.tsx`

```typescript
// ==========================================
// ADICIONAR após os imports
// ==========================================

// Chaves do localStorage
const STORAGE_KEYS = {
  companyDraft: 'ferraco_companyData_draft',
  aiConfigDraft: 'ferraco_aiConfig_draft',
};

// ==========================================
// MODIFICAR useEffect inicial
// ==========================================

useEffect(() => {
  // 1. Carregar drafts do localStorage primeiro
  const loadDrafts = () => {
    const companyDraft = localStorage.getItem(STORAGE_KEYS.companyDraft);
    const configDraft = localStorage.getItem(STORAGE_KEYS.aiConfigDraft);

    if (companyDraft) {
      try {
        setCompanyData(JSON.parse(companyDraft));
      } catch (error) {
        console.error('Erro ao carregar draft da empresa:', error);
      }
    }

    if (configDraft) {
      try {
        setAIConfig(JSON.parse(configDraft));
      } catch (error) {
        console.error('Erro ao carregar draft do config:', error);
      }
    }
  };

  loadDrafts();

  // 2. Carregar dados salvos do banco
  loadData();
}, []);

// ==========================================
// ADICIONAR novos useEffects para auto-save
// ==========================================

// Auto-save de companyData no localStorage
useEffect(() => {
  // Só salvar se tiver algum dado preenchido
  if (companyData.name || companyData.description || companyData.industry) {
    localStorage.setItem(STORAGE_KEYS.companyDraft, JSON.stringify(companyData));
  }
}, [companyData]);

// Auto-save de aiConfig no localStorage
useEffect(() => {
  // Só salvar se tiver algum dado preenchido
  if (aiConfig.welcomeMessage || aiConfig.fallbackMessage) {
    localStorage.setItem(STORAGE_KEYS.aiConfigDraft, JSON.stringify(aiConfig));
  }
}, [aiConfig]);

// Warning antes de sair com dados não salvos
useEffect(() => {
  const hasUnsavedChanges = () => {
    const hasDraft =
      localStorage.getItem(STORAGE_KEYS.companyDraft) ||
      localStorage.getItem(STORAGE_KEYS.aiConfigDraft);
    return !!hasDraft;
  };

  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges()) {
      e.preventDefault();
      e.returnValue = 'Você tem alterações não salvas. Deseja sair mesmo assim?';
      return e.returnValue;
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, []);

// ==========================================
// MODIFICAR handleSaveCompany
// ==========================================

const handleSaveCompany = async () => {
  if (!companyData.name || !companyData.industry || !companyData.description) {
    toast.error('Preencha os campos obrigatórios: Nome, Ramo e Descrição');
    return;
  }

  try {
    const savedCompany = await configApi.saveCompanyData(companyData);
    setCompanyData(savedCompany);

    // ✅ NOVO: Limpar draft do localStorage após salvar
    localStorage.removeItem(STORAGE_KEYS.companyDraft);

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
    toast.error('Erro ao salvar dados da empresa');
  }
};

// ==========================================
// MODIFICAR handleSaveAIConfig
// ==========================================

const handleSaveAIConfig = async () => {
  if (!aiConfig) return;

  try {
    const savedConfig = await configApi.saveChatbotConfig(aiConfig);
    setAIConfig(savedConfig);

    // ✅ NOVO: Limpar draft do localStorage após salvar
    localStorage.removeItem(STORAGE_KEYS.aiConfigDraft);

    toast.success('Configuração salva no banco de dados!');

    // Recalcular progresso
    const [company, prods, faqItems] = await Promise.all([
      configApi.getCompanyData(),
      configApi.getProducts(),
      configApi.getFAQs()
    ]);
    calculateProgress(company, prods, faqItems, savedConfig);
  } catch (error) {
    console.error('Erro ao salvar config:', error);
    toast.error('Erro ao salvar configuração');
  }
};
```

---

## 🧪 TESTES RECOMENDADOS

### Teste 1: Draft preservado no refresh
```
1. Abrir /admin/ai
2. Preencher "Nome: Teste"
3. NÃO clicar em "Salvar"
4. F5 (refresh)
5. ✅ ESPERADO: "Nome: Teste" ainda preenchido
```

### Teste 2: Draft limpo após salvar
```
1. Preencher formulário
2. Clicar em "Salvar"
3. F5 (refresh)
4. ✅ ESPERADO: Dados do banco, não do draft
```

### Teste 3: Warning ao sair
```
1. Preencher "Nome: Teste"
2. Tentar fechar aba
3. ✅ ESPERADO: Modal "Você tem alterações não salvas..."
```

### Teste 4: Múltiplas abas
```
1. Abrir /admin/ai na aba A
2. Preencher "Nome: A"
3. Abrir /admin/ai na aba B
4. ⚠️ ESPERADO: Pode ver "Nome: A" (draft compartilhado)
```

---

## 📊 COMPARAÇÃO DE SOLUÇÕES

| Critério | localStorage | beforeunload | Auto-save API |
|----------|-------------|-------------|---------------|
| **Previne perda** | ✅ Sim | ❌ Não | ✅ Sim |
| **Offline** | ✅ Sim | ✅ Sim | ❌ Não |
| **Performance** | ✅ Ótima | ✅ Ótima | ⚠️ Ruim |
| **Complexidade** | ✅ Baixa | ✅ Baixa | ⚠️ Média |
| **UX** | ✅ Transparente | ⚠️ Modal | ✅ Transparente |
| **Implementação** | 30 min | 10 min | 1 hora |

**Vencedor:** localStorage + beforeunload

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Definir chaves do localStorage
- [ ] Adicionar useEffect para carregar drafts
- [ ] Adicionar useEffect para auto-save de companyData
- [ ] Adicionar useEffect para auto-save de aiConfig
- [ ] Adicionar useEffect para beforeunload warning
- [ ] Modificar handleSaveCompany para limpar draft
- [ ] Modificar handleSaveAIConfig para limpar draft
- [ ] Testar cenário 1: Draft preservado
- [ ] Testar cenário 2: Draft limpo após save
- [ ] Testar cenário 3: Warning ao sair
- [ ] Testar cenário 4: Múltiplas abas

---

**Data da auditoria:** 2025-10-09
**Auditor:** Claude Code AI
**Status:** ✅ Causa identificada + Solução proposta
**Tempo estimado:** 30-40 minutos de implementação
