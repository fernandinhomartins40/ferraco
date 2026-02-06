# Configuração do Google Analytics 4 (GA4) - Ferraco CRM

Este guia explica como configurar o Google Tag Manager (GTM) para rastrear eventos do formulário de leads da landing page.

## 📊 Eventos Disponíveis

O sistema envia automaticamente os seguintes eventos para o `dataLayer` do GTM:

### 1. **form_start** - Abertura do Modal
Disparado quando o usuário abre o formulário de lead.

**Variáveis disponíveis:**
```javascript
{
  event: 'form_start',
  form_name: 'lead_modal',
  form_type: 'whatsapp_redirect' | 'lead_capture',
  product_name: string,  // Ex: "Canzil" ou "Orçamento Geral"
  product_id: string | null
}
```

### 2. **form_field_interaction** - Interação com Campos
Disparado quando o usuário começa a preencher um campo (nome ou telefone).

**Variáveis disponíveis:**
```javascript
{
  event: 'form_field_interaction',
  form_name: 'lead_modal',
  field_name: 'name' | 'phone',
  product_name: string
}
```

### 3. **form_submit** - Envio do Formulário
Disparado quando o usuário clica em "Solicitar Orçamento".

**Variáveis disponíveis:**
```javascript
{
  event: 'form_submit',
  form_name: 'lead_modal',
  product_name: string,
  product_id: string | null,
  lead_name: string,
  lead_phone: string
}
```

### 4. **form_success** - Sucesso no Envio
Disparado quando o formulário é enviado com sucesso.

**Variáveis disponíveis:**
```javascript
{
  event: 'form_success',
  form_name: 'lead_modal',
  conversion_type: 'whatsapp_redirect' | 'lead_created',
  product_name: string,
  product_id: string | null,
  lead_id: string | null
}
```

### 5. **form_error** - Erro no Envio
Disparado quando há erro ao enviar o formulário.

**Variáveis disponíveis:**
```javascript
{
  event: 'form_error',
  form_name: 'lead_modal',
  error_message: string,
  product_name: string
}
```

---

## 🔧 Como Configurar no Google Tag Manager

### Passo 1: Criar Variáveis Personalizadas

Acesse **Variáveis > Variáveis definidas pelo usuário > Nova**

Crie as seguintes variáveis do tipo **Variável da camada de dados**:

| Nome da Variável GTM | Nome da Variável dataLayer |
|---------------------|---------------------------|
| DL - Form Name | `form_name` |
| DL - Form Type | `form_type` |
| DL - Product Name | `product_name` |
| DL - Product ID | `product_id` |
| DL - Field Name | `field_name` |
| DL - Lead Name | `lead_name` |
| DL - Lead Phone | `lead_phone` |
| DL - Conversion Type | `conversion_type` |
| DL - Lead ID | `lead_id` |
| DL - Error Message | `error_message` |

### Passo 2: Criar Acionadores (Triggers)

Acesse **Acionadores > Novo**

#### Acionador 1: Abertura do Formulário
- **Tipo:** Evento personalizado
- **Nome do evento:** `form_start`
- **Nome:** Form Start - Lead Modal

#### Acionador 2: Interação com Campos
- **Tipo:** Evento personalizado
- **Nome do evento:** `form_field_interaction`
- **Nome:** Form Field Interaction

#### Acionador 3: Envio do Formulário
- **Tipo:** Evento personalizado
- **Nome do evento:** `form_submit`
- **Nome:** Form Submit - Lead Modal

#### Acionador 4: Sucesso no Envio (CONVERSÃO PRINCIPAL)
- **Tipo:** Evento personalizado
- **Nome do evento:** `form_success`
- **Nome:** Form Success - Lead Modal

#### Acionador 5: Erro no Envio
- **Tipo:** Evento personalizado
- **Nome do evento:** `form_error`
- **Nome:** Form Error

### Passo 3: Criar Tags do GA4

Acesse **Tags > Nova**

#### Tag 1: GA4 - Abertura do Formulário
- **Tipo:** Google Analytics: evento GA4
- **ID de medição:** (Seu ID do GA4)
- **Nome do evento:** `form_start`
- **Parâmetros do evento:**
  - `form_name`: {{DL - Form Name}}
  - `form_type`: {{DL - Form Type}}
  - `product_name`: {{DL - Product Name}}
  - `product_id`: {{DL - Product ID}}
- **Acionador:** Form Start - Lead Modal

#### Tag 2: GA4 - Interação com Campos
- **Tipo:** Google Analytics: evento GA4
- **ID de medição:** (Seu ID do GA4)
- **Nome do evento:** `form_field_interaction`
- **Parâmetros do evento:**
  - `form_name`: {{DL - Form Name}}
  - `field_name`: {{DL - Field Name}}
  - `product_name`: {{DL - Product Name}}
- **Acionador:** Form Field Interaction

#### Tag 3: GA4 - Envio do Formulário
- **Tipo:** Google Analytics: evento GA4
- **ID de medição:** (Seu ID do GA4)
- **Nome do evento:** `form_submit`
- **Parâmetros do evento:**
  - `form_name`: {{DL - Form Name}}
  - `product_name`: {{DL - Product Name}}
  - `product_id`: {{DL - Product ID}}
  - `lead_name`: {{DL - Lead Name}}
  - `lead_phone`: {{DL - Lead Phone}}
- **Acionador:** Form Submit - Lead Modal

#### Tag 4: GA4 - Conversão (Sucesso) ⭐
- **Tipo:** Google Analytics: evento GA4
- **ID de medição:** (Seu ID do GA4)
- **Nome do evento:** `generate_lead` (evento de conversão padrão do GA4)
- **Parâmetros do evento:**
  - `form_name`: {{DL - Form Name}}
  - `conversion_type`: {{DL - Conversion Type}}
  - `product_name`: {{DL - Product Name}}
  - `product_id`: {{DL - Product ID}}
  - `lead_id`: {{DL - Lead ID}}
- **Acionador:** Form Success - Lead Modal

**IMPORTANTE:** Após criar esta tag, marque `generate_lead` como conversão no GA4:
1. Acesse GA4 > Admin > Eventos
2. Encontre `generate_lead`
3. Ative "Marcar como conversão"

#### Tag 5: GA4 - Erro
- **Tipo:** Google Analytics: evento GA4
- **ID de medição:** (Seu ID do GA4)
- **Nome do evento:** `form_error`
- **Parâmetros do evento:**
  - `form_name`: {{DL - Form Name}}
  - `error_message`: {{DL - Error Message}}
  - `product_name`: {{DL - Product Name}}
- **Acionador:** Form Error

### Passo 4: Testar

1. Ative o **Modo de visualização** no GTM
2. Abra a landing page
3. Interaja com o formulário:
   - Abra o modal
   - Preencha os campos
   - Envie o formulário
4. Verifique se todos os eventos estão sendo disparados corretamente
5. Publique o container do GTM

---

## 🎯 Funil de Conversão Recomendado

Configure o seguinte funil no GA4:

1. **form_start** → Visitante abriu o formulário
2. **form_field_interaction** → Visitante começou a preencher
3. **form_submit** → Visitante enviou o formulário
4. **generate_lead** → CONVERSÃO! Lead criado com sucesso

---

## 📈 Relatórios Recomendados no GA4

### Relatório 1: Taxa de Conversão por Produto
- **Dimensão:** Product Name
- **Métricas:**
  - form_start (visualizações)
  - generate_lead (conversões)
  - Taxa de conversão

### Relatório 2: Abandono de Formulário
- **Dimensão:** Field Name
- **Métricas:**
  - form_field_interaction (interações por campo)
  - form_submit (envios)

### Relatório 3: Tipo de Conversão
- **Dimensão:** Conversion Type
- **Valores:**
  - `whatsapp_redirect`: Lead redirecionado para WhatsApp
  - `lead_created`: Lead capturado no CRM

---

## 🔍 Debug no Navegador

Para verificar se os eventos estão sendo enviados corretamente:

1. Abra o DevTools (F12)
2. No Console, digite:
   ```javascript
   window.dataLayer
   ```
3. Você verá todos os eventos enviados para o dataLayer

Ou use a extensão:
- **Google Tag Assistant** (Chrome)
- **GA Debugger** (Chrome)

---

## ✅ Checklist de Configuração

- [ ] Google Tag Manager instalado no site (já está no `index.html`)
- [ ] Variáveis personalizadas criadas no GTM
- [ ] Acionadores criados no GTM
- [ ] Tags GA4 criadas e configuradas
- [ ] Evento `generate_lead` marcado como conversão no GA4
- [ ] Teste realizado no Modo de visualização
- [ ] Container GTM publicado

---

## 📞 Suporte

Dúvidas sobre a implementação? Entre em contato com o desenvolvedor.

**Arquivos modificados nesta implementação:**
- `apps/frontend/src/components/LeadModal.tsx`

**Data:** 2026-02-06
