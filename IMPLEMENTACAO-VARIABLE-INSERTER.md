# Implementação do Variable Inserter - Sistema de Inserção de Variáveis

## 📋 Visão Geral

Sistema completo para facilitar a inserção de variáveis em templates de mensagens através de botões clicáveis, melhorando significativamente a UX.

## ✅ Componentes Criados

### 1. `VariableInserter` Component
**Localização:** `apps/frontend/src/components/ui/variable-inserter.tsx`

**Recursos:**
- 2 variantes de exibição: `badges` (padrão) e `buttons`
- Tooltips descritivos para cada variável
- Animações hover
- Totalmente tipado com TypeScript
- Variáveis padrão pré-configuradas (lead, produto, data)

**Props:**
```typescript
interface VariableInserterProps {
  variables: Variable[];      // Array de variáveis disponíveis
  onInsert: (variable: string) => void;  // Callback ao clicar
  className?: string;          // Classes CSS customizadas
  variant?: 'buttons' | 'badges';  // Estilo de exibição
  title?: string;              // Título customizado
}
```

### 2. `useVariableInsertion` Hook
**Localização:** `apps/frontend/src/hooks/useVariableInsertion.ts`

**Recursos:**
- Gerencia automaticamente a posição do cursor
- Insere variável exatamente onde o cursor estava
- Reposiciona cursor após inserção
- Funciona com qualquer textarea/input

**Retorno:**
```typescript
{
  textareaRef: RefObject<HTMLTextAreaElement>;
  handleBlur: () => void;      // Salvar posição do cursor
  insertVariable: (variable: string, currentValue: string, onChange: (value: string) => void) => void;
}
```

## 🎯 Implementação Passo a Passo

### Exemplo 1: AdminLeads.tsx - Modal de Template

#### Antes:
```tsx
<div>
  <Label htmlFor="template-content">Conteúdo da Mensagem *</Label>
  <textarea
    id="template-content"
    value={templateFormData.content}
    onChange={(e) => setTemplateFormData({ ...templateFormData, content: e.target.value })}
    placeholder="Use {{nome}}, {{produto}}, etc. para variáveis"
    className="w-full min-h-[100px] p-2 border rounded-md"
  />
  <p className="text-xs text-muted-foreground mt-1">
    Variáveis disponíveis: {'{{nome}}'}, {'{{telefone}}'}, {'{{produto}}'}
  </p>
</div>
```

#### Depois:
```tsx
import { VariableInserter, DEFAULT_LEAD_VARIABLES, PRODUCT_VARIABLES } from '@/components/ui/variable-inserter';
import { useVariableInsertion } from '@/hooks/useVariableInsertion';

// No componente
const { textareaRef, handleBlur, insertVariable } = useVariableInsertion();

// No JSX
<div>
  <Label htmlFor="template-content">Conteúdo da Mensagem *</Label>
  <textarea
    ref={textareaRef}
    id="template-content"
    value={templateFormData.content}
    onChange={(e) => setTemplateFormData({ ...templateFormData, content: e.target.value })}
    onBlur={handleBlur}
    placeholder="Use os botões abaixo para inserir variáveis ou digite {{variavel}}"
    className="w-full min-h-[100px] p-2 border rounded-md"
  />

  <VariableInserter
    variables={[...DEFAULT_LEAD_VARIABLES, ...PRODUCT_VARIABLES]}
    onInsert={(variable) => insertVariable(
      variable,
      templateFormData.content,
      (newValue) => setTemplateFormData({ ...templateFormData, content: newValue })
    )}
    variant="buttons"
    className="mt-2"
  />
</div>
```

### Exemplo 2: WhatsAppCommunication.tsx

```tsx
import { VariableInserter, DEFAULT_LEAD_VARIABLES } from '@/components/ui/variable-inserter';
import { useVariableInsertion } from '@/hooks/useVariableInsertion';

// No componente
const { textareaRef, handleBlur, insertVariable } = useVariableInsertion();

// No Template Dialog
<div>
  <label className="text-sm font-medium">Conteúdo</label>
  <Textarea
    ref={textareaRef}
    value={newTemplate.content}
    onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
    onBlur={handleBlur}
    placeholder="Digite sua mensagem ou use os botões para inserir variáveis"
    rows={6}
  />

  <VariableInserter
    variables={DEFAULT_LEAD_VARIABLES}
    onInsert={(variable) => insertVariable(
      variable,
      newTemplate.content,
      (newValue) => setNewTemplate({ ...newTemplate, content: newValue })
    )}
    variant="badges"
    className="mt-2"
  />
</div>
```

### Exemplo 3: AdminChatbotConfig.tsx

```tsx
import { VariableInserter, DEFAULT_LEAD_VARIABLES, PRODUCT_VARIABLES } from '@/components/ui/variable-inserter';
import { useVariableInsertion } from '@/hooks/useVariableInsertion';

// Para cada template WhatsApp (initial, product, final)
const initialTemplateInsertion = useVariableInsertion();
const productTemplateInsertion = useVariableInsertion();
const finalTemplateInsertion = useVariableInsertion();

// Template Inicial
<div>
  <label className="text-sm font-medium">Mensagem Inicial</label>
  <Textarea
    ref={initialTemplateInsertion.textareaRef}
    value={formData.whatsappTemplates.initial}
    onChange={(e) => setFormData({
      ...formData,
      whatsappTemplates: { ...formData.whatsappTemplates, initial: e.target.value }
    })}
    onBlur={initialTemplateInsertion.handleBlur}
    rows={4}
  />
  <VariableInserter
    variables={DEFAULT_LEAD_VARIABLES}
    onInsert={(variable) => initialTemplateInsertion.insertVariable(
      variable,
      formData.whatsappTemplates.initial,
      (newValue) => setFormData({
        ...formData,
        whatsappTemplates: { ...formData.whatsappTemplates, initial: newValue }
      })
    )}
    variant="badges"
  />
</div>
```

## 🎨 Variantes de Exibição

### Badges (Padrão - Compacto)
```tsx
<VariableInserter
  variables={DEFAULT_LEAD_VARIABLES}
  onInsert={handleInsert}
  variant="badges"
/>
```
**Resultado:** Pills clicáveis com `{{variavel}}` exibido

### Buttons (Maior Destaque)
```tsx
<VariableInserter
  variables={DEFAULT_LEAD_VARIABLES}
  onInsert={handleInsert}
  variant="buttons"
/>
```
**Resultado:** Botões com ícone e label descritivo

## 🔧 Variáveis Pré-configuradas

### DEFAULT_LEAD_VARIABLES
- `{{nome}}` - Nome do lead
- `{{telefone}}` - Telefone do lead
- `{{email}}` - Email do lead
- `{{empresa}}` - Empresa do lead

### PRODUCT_VARIABLES
- `{{produto}}` - Nome do produto
- `{{preco}}` - Preço do produto

### DATE_VARIABLES
- `{{data}}` - Data atual
- `{{hora}}` - Hora atual

## 📦 Variáveis Customizadas

```tsx
const CUSTOM_VARIABLES: Variable[] = [
  { key: 'vendedor', label: 'Vendedor', description: 'Nome do vendedor responsável' },
  { key: 'desconto', label: 'Desconto', description: 'Percentual de desconto' },
];

<VariableInserter
  variables={[...DEFAULT_LEAD_VARIABLES, ...CUSTOM_VARIABLES]}
  onInsert={handleInsert}
/>
```

## ✅ Benefícios

1. **UX Melhorada:** Usuário não precisa decorar variáveis
2. **Menos Erros:** Variáveis inseridas corretamente sempre
3. **Descoberta:** Usuário vê todas as variáveis disponíveis
4. **Posicionamento Inteligente:** Insere onde o cursor estava
5. **Visual Consistente:** Design integrado com shadcn/ui
6. **Reutilizável:** Um componente para todo o sistema

## 🎯 Locais para Aplicar

1. ✅ **AdminLeads.tsx** - Modal de Template de Mensagem (linha 990)
2. ✅ **WhatsAppCommunication.tsx** - Dialog de Template (linha 602)
3. ✅ **AdminChatbotConfig.tsx** - Templates WhatsApp (múltiplas textareas)
4. **AdminLandingPageEditor** - Textos editáveis (se aplicável)
5. **Qualquer outro formulário** que aceite variáveis dinâmicas

## 🚀 Próximos Passos

1. Aplicar nos componentes principais (AdminLeads, WhatsAppCommunication)
2. Testar UX com usuários reais
3. Adicionar animação de "copiado" ao clicar
4. Considerar adicionar preview da variável ao hover
5. Documentar variáveis disponíveis em cada contexto
