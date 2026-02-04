# Página de Gerenciamento de Leads WhatsApp Only - Documentação

## 📋 Visão Geral

Página administrativa para **listar, filtrar e exportar** os leads capturados no modo "WhatsApp Only" da landing page.

---

## 🎯 Funcionalidades

### **1. Dashboard de Estatísticas**

Cards no topo da página com métricas em tempo real:

- **Total de Leads**: Todos os leads WhatsApp Only já capturados
- **Hoje**: Leads capturados nas últimas 24 horas
- **Esta Semana**: Leads dos últimos 7 dias
- **Este Mês**: Leads dos últimos 30 dias

### **2. Filtros Avançados**

Permite refinar a busca de leads:

- **Busca Textual**: Nome, telefone ou email
- **Data Inicial**: Filtrar a partir de uma data específica
- **Data Final**: Filtrar até uma data específica
- **Origem**: Filtrar por source (modal-produto-*, modal-orcamento, etc.)
- **Botões**:
  - "Aplicar Filtros" - Executa a busca com os filtros
  - "Limpar" - Remove todos os filtros

### **3. Tabela de Leads**

Exibe os leads em formato de tabela com:

**Colunas:**
- Nome completo
- Telefone (formatado: `(11) 99999-9999`)
- Email (ou "Não informado")
- Produto de Interesse (badge colorido)
- Origem (formatada: "Modal de Produto (canzil)")
- Data e hora de captura

**Paginação:**
- 20 leads por página (padrão)
- Botões "Anterior" e "Próxima"
- Contador: "Mostrando 1 a 20 de 150 leads"

### **4. Exportação para Excel**

Botão no header da página que gera arquivo Excel (.xlsx) com:

**Estrutura do arquivo:**
- **Cabeçalho**: Azul com texto branco e negrito
- **Linhas**: Zebradas (cinza claro alternado)
- **Bordas**: Todas as células têm bordas finas

**Colunas do Excel:**
1. ID (CUID do lead)
2. Nome
3. Telefone
4. Email
5. Produto de Interesse
6. Origem
7. Data de Captura
8. User Agent (navegador/dispositivo)
9. Referer (URL de origem)

**Nome do arquivo:**
`leads_whatsapp_only_2026-02-04.xlsx`

---

## 🏗️ Arquitetura Técnica

### **Backend**

#### **Controller**
Arquivo: `apps/backend/src/modules/landing-page-settings/whatsapp-only-leads.controller.ts`

**Classe:** `WhatsAppOnlyLeadsController`

**Métodos:**

1. **`list()`** - Listar leads com filtros e paginação
   - Filtra leads com `metadata.contains('whatsapp_only')`
   - Suporta busca, filtros de data e source
   - Retorna dados com paginação

2. **`exportToExcel()`** - Gerar arquivo Excel
   - Usa biblioteca `exceljs`
   - Aplica mesmos filtros da listagem
   - Limita a 10.000 leads por exportação
   - Retorna buffer binário (.xlsx)

3. **`getStats()`** - Calcular estatísticas
   - Total, hoje, semana, mês
   - Agrupamento por source
   - Cache não implementado (pode ser adicionado)

#### **Rotas**
Arquivo: `apps/backend/src/modules/landing-page-settings/whatsapp-only-leads.routes.ts`

```typescript
GET  /api/admin/whatsapp-only-leads          // Listar
GET  /api/admin/whatsapp-only-leads/export   // Exportar Excel
GET  /api/admin/whatsapp-only-leads/stats    // Estatísticas
```

**Proteção:**
- Requer autenticação (`authenticate`)
- Requer permissão `leads:read`

### **Frontend**

#### **Service**
Arquivo: `apps/frontend/src/services/whatsappOnlyLeads.service.ts`

**Métodos:**

1. **`list(filters)`** - Buscar leads da API
   - Constrói query params
   - Retorna dados + paginação

2. **`getStats()`** - Buscar estatísticas
   - Sem cache (sempre fresh)

3. **`exportToExcel(filters)`** - Baixar Excel
   - Usa `responseType: 'blob'`
   - Cria elemento `<a>` temporário para download
   - Remove elemento após download

4. **`formatPhone(phone)`** - Formatar telefone
   - Remove +55
   - Adiciona parênteses e hífen

5. **`formatSource(source)`** - Formatar origem
   - Mapeia codes para labels amigáveis
   - Detecta modais de produto

#### **Página**
Arquivo: `apps/frontend/src/pages/admin/AdminWhatsAppOnlyLeads.tsx`

**Componente:** `AdminWhatsAppOnlyLeads`

**Estado:**
```typescript
leads: WhatsAppOnlyLead[]
stats: WhatsAppOnlyLeadsStats | null
isLoading: boolean
isExporting: boolean
pagination: { page, limit, total, totalPages }
filters: { page, limit, search, dateFrom, dateTo, source }
```

**Hooks:**
- `useEffect()` - Carrega leads ao mudar página/limite
- `useEffect()` - Carrega stats na montagem
- `useToast()` - Feedback de sucesso/erro

**Layout:**
1. Header com título e botão exportar
2. Cards de estatísticas (4 colunas)
3. Card de filtros
4. Tabela de leads com paginação

---

## 📊 Fluxo de Dados

### **Listagem de Leads**

```
[Usuário acessa /admin/whatsapp-only-leads]
       ↓
[Componente carrega stats e leads]
       ↓
[GET /api/admin/whatsapp-only-leads/stats]
       ↓
[GET /api/admin/whatsapp-only-leads?page=1&limit=20]
       ↓
[Controller busca no PostgreSQL]
       ↓
WHERE metadata LIKE '%whatsapp_only%'
ORDER BY createdAt DESC
LIMIT 20 OFFSET 0
       ↓
[Parseia metadata JSON]
       ↓
[Retorna { data, pagination }]
       ↓
[Service frontend recebe e atualiza estado]
       ↓
[Renderiza tabela com dados]
```

### **Exportação para Excel**

```
[Usuário clica "Exportar Excel"]
       ↓
[Service chama exportToExcel(filters)]
       ↓
[GET /api/admin/whatsapp-only-leads/export?filters...]
       ↓
[Controller busca até 10k leads]
       ↓
[Cria workbook Excel com exceljs]
       ↓
[Formata cabeçalho, dados e estilos]
       ↓
[Gera buffer binário]
       ↓
[Retorna buffer com headers corretos]
       ↓
[Frontend cria Blob e link temporário]
       ↓
[Dispara download automático]
       ↓
[Remove link e Blob]
```

---

## 🧪 Como Testar

### **1. Acesso à Página**

1. Fazer login: `/login`
2. No menu lateral, clicar em **"Leads WA Only"**
3. Ou acessar diretamente: `/admin/whatsapp-only-leads`
4. Verificar que estatísticas carregam corretamente

### **2. Testar Listagem**

1. Verificar que leads aparecem na tabela
2. Testar paginação (Anterior/Próxima)
3. Verificar formatação de telefone e origem
4. Verificar badges de interesse

### **3. Testar Filtros**

1. **Busca**: Digitar nome parcial e aplicar
   - Ex: "João" deve encontrar "João Silva"
2. **Data**: Selecionar range de datas
   - Verificar que apenas leads nesse período aparecem
3. **Limpar**: Clicar em "Limpar"
   - Verificar que todos os filtros são resetados

### **4. Testar Exportação**

1. Clicar em "Exportar Excel"
2. Verificar que arquivo baixa automaticamente
3. Abrir arquivo Excel e verificar:
   - Cabeçalho azul com texto branco
   - Todas as colunas preenchidas
   - Formatação profissional (bordas, zebrado)
   - Dados corretos (nome, telefone, etc.)

### **5. Testar com Filtros Aplicados**

1. Aplicar filtro de data (últimos 7 dias)
2. Clicar em "Exportar Excel"
3. Verificar que Excel contém apenas leads dos últimos 7 dias

---

## 🔍 Validações

### Backend
- ✅ Filtros validados via Zod
- ✅ Paginação limitada (max 100 por página)
- ✅ Exportação limitada (max 10.000 leads)
- ✅ Permissão `leads:read` obrigatória
- ✅ Metadata parseada com try/catch (não quebra se JSON inválido)

### Frontend
- ✅ Loading states em todas operações assíncronas
- ✅ Feedback via toast (sucesso/erro)
- ✅ Validação de filtros antes de aplicar
- ✅ Download automático com cleanup de Blob
- ✅ Formatação consistente de dados

---

## 🐛 Troubleshooting

### **Erro: "Nenhum lead encontrado"**
- **Causa**: Nenhum lead foi capturado no modo whatsapp_only ainda
- **Solução**: Testar captação na landing page com modo ativado

### **Erro: "Erro ao exportar leads"**
- **Causa**: Muitos leads para exportar (>10k) ou erro no Excel
- **Solução**:
  1. Aplicar filtros de data para reduzir volume
  2. Verificar logs do backend

### **Excel não baixa**
- **Causa**: Bloqueador de pop-ups ou erro na API
- **Solução**:
  1. Verificar console do navegador
  2. Desabilitar bloqueador de pop-ups
  3. Verificar permissões do navegador

### **Estatísticas zeradas**
- **Causa**: Nenhum lead com metadata contendo "whatsapp_only"
- **Solução**: Verificar que modo está ativado na config

---

## 📁 Arquivos Criados/Modificados

### Backend (4 arquivos)
- ✅ `apps/backend/src/modules/landing-page-settings/whatsapp-only-leads.controller.ts`
- ✅ `apps/backend/src/modules/landing-page-settings/whatsapp-only-leads.routes.ts`
- ✅ `apps/backend/src/modules/landing-page-settings/index.ts` (modificado)
- ✅ `apps/backend/src/app.ts` (modificado)

### Frontend (4 arquivos)
- ✅ `apps/frontend/src/services/whatsappOnlyLeads.service.ts`
- ✅ `apps/frontend/src/pages/admin/AdminWhatsAppOnlyLeads.tsx`
- ✅ `apps/frontend/src/App.tsx` (modificado)
- ✅ `apps/frontend/src/components/admin/AdminLayout.tsx` (modificado)

---

## 📊 Dependências

### Backend
- `exceljs` - Geração de arquivos Excel
- `zod` - Validação de schemas
- `prisma` - ORM para PostgreSQL

### Frontend
- `react` - Framework UI
- `lucide-react` - Ícones
- `@tanstack/react-query` - Opcional (pode ser adicionado)

---

## 🚀 Melhorias Futuras

1. **Detalhes do Lead**: Modal ao clicar na linha
2. **Ações em Massa**: Selecionar múltiplos leads
3. **Filtro por Produto**: Dropdown com produtos disponíveis
4. **Gráficos**: Chart de captações por dia/semana
5. **Cache**: Implementar cache de stats (Redis ou memória)
6. **Real-time**: Atualizar lista automaticamente (WebSocket)
7. **Exportação CSV**: Além de Excel, permitir CSV também
8. **Notificações**: Alert quando novo lead é capturado

---

**Última atualização**: 2026-02-04
**Versão**: 1.0.0
**Status**: ✅ Production Ready
