# Importação e Exportação de Leads

Este documento descreve as funcionalidades de importação e exportação de leads implementadas no Ferraco CRM.

## 📋 Funcionalidades

### 1. Exportação de Leads

Você pode exportar seus leads em três formatos diferentes:

- **CSV**: Formato de valores separados por vírgula, compatível com Excel e Google Sheets
- **Excel (XLSX)**: Formato nativo do Microsoft Excel com formatação
- **JSON**: Formato de dados estruturados para integração com sistemas

#### Como exportar:

1. Acesse a página de **Leads** no painel administrativo
2. Clique no botão **Exportar CSV** ou **Exportar Excel**
3. O arquivo será baixado automaticamente

#### Campos exportados:

- ID
- Nome
- Email
- Telefone
- Empresa
- Cargo
- Status
- Prioridade
- Origem
- Lead Score
- Responsável
- Data de Criação

### 2. Importação de Leads

Você pode importar leads em massa através de arquivos CSV ou Excel.

#### Como importar:

1. Acesse a página de **Leads** no painel administrativo
2. Clique no botão **Importar Leads**
3. Selecione um arquivo CSV ou Excel
4. Clique em **Importar**
5. Aguarde o processamento e veja o resultado

#### Formato do arquivo:

O arquivo deve conter as seguintes colunas (apenas **Nome** e **Telefone** são obrigatórios):

| Coluna      | Obrigatório | Descrição                                           |
|-------------|-------------|-----------------------------------------------------|
| Nome        | ✅ Sim      | Nome completo do lead                               |
| Telefone    | ✅ Sim      | Número de telefone (apenas números)                 |
| Email       | ❌ Não      | Endereço de e-mail                                  |
| Empresa     | ❌ Não      | Nome da empresa                                     |
| Cargo       | ❌ Não      | Cargo/posição do lead                               |
| Status      | ❌ Não      | Status do lead (padrão: NOVO)                       |
| Prioridade  | ❌ Não      | Prioridade: LOW, MEDIUM, HIGH, URGENT (padrão: MEDIUM) |
| Origem      | ❌ Não      | Origem do lead (padrão: IMPORT)                     |

#### Exemplo de arquivo CSV:

Veja o arquivo de exemplo em: `apps/backend/docs/IMPORT_LEADS_EXAMPLE.csv`

```csv
Nome,Telefone,Email,Empresa,Cargo,Status,Prioridade,Origem
João Silva,11999998888,joao@exemplo.com,Empresa A,Gerente,NOVO,MEDIUM,MANUAL
Maria Santos,11988887777,maria@exemplo.com,Empresa B,Diretora,QUALIFICADO,HIGH,REFERRAL
```

### 3. Identificação de Leads Importados

Todos os leads importados via upload de arquivo são automaticamente marcados com:

- **Origem**: `IMPORT`
- **Badge visual**: Badge roxo com texto "Lead Importado" no card do Kanban

Isso permite:
- Diferenciar leads capturados do site vs. leads importados
- Filtrar e analisar leads por origem
- Rastrear a fonte de cada lead

## 🔧 Detalhes Técnicos

### Backend

#### Endpoints:

**Exportar Leads**
```
GET /api/leads/export?format={csv|excel|json}
```

**Importar Leads**
```
POST /api/leads/import
Content-Type: multipart/form-data
Body: file (CSV ou Excel)
```

#### Serviços:

- `LeadsExportService` - Gerencia exportação e importação
  - `exportToCSV()` - Gera arquivo CSV
  - `exportToExcel()` - Gera arquivo Excel com formatação
  - `parseFile()` - Processa arquivo CSV/Excel
  - `importLeads()` - Importa leads para o banco de dados

#### Dependências:

- `exceljs` - Manipulação de arquivos Excel
- `csv-parse` - Parsing de arquivos CSV
- `multer` - Upload de arquivos

### Frontend

#### Componentes:

- Botões de exportação no header da página de Leads
- Modal de importação com seleção de arquivo
- Feedback visual de sucesso/erro
- Exibição de estatísticas de importação
- Badge de identificação de leads importados

## 📊 Funcionalidades Adicionais

### Validações:

- Telefone já existente: atualiza o lead existente
- Nome ou telefone ausente: lead é ignorado
- Formato de arquivo inválido: erro retornado
- Limite de tamanho: 10MB

### Processamento:

- Normalização de números de telefone (remove caracteres especiais)
- Tratamento de erros individualizado por lead
- Relatório detalhado de sucessos e falhas
- Atualização automática da lista após importação

### Segurança:

- Apenas usuários autenticados podem importar/exportar
- Permissão `leads:create` necessária para importação
- Permissão `leads:read` necessária para exportação
- Validação de tipo de arquivo no upload

## 🎯 Casos de Uso

### 1. Migração de Sistema

Exportar leads do sistema antigo e importar no Ferraco CRM:
1. Exportar dados do sistema antigo em CSV
2. Adequar formato às colunas especificadas
3. Importar no Ferraco CRM via interface

### 2. Integração com Planilhas

Trabalhar com leads em Excel/Google Sheets:
1. Exportar leads do Ferraco CRM
2. Fazer análises ou modificações na planilha
3. Importar dados atualizados de volta

### 3. Importação em Massa

Adicionar múltiplos leads de uma vez:
1. Criar planilha com dados dos leads
2. Importar via interface
3. Leads automaticamente marcados como "IMPORT"

## 🐛 Troubleshooting

### Problema: Arquivo não aceito

**Solução**: Certifique-se de que o arquivo é CSV (.csv) ou Excel (.xlsx, .xls)

### Problema: Leads não importados

**Solução**: Verifique se as colunas Nome e Telefone estão preenchidas

### Problema: Erro ao exportar

**Solução**: Verifique se você tem permissão de leitura de leads

### Problema: Arquivo muito grande

**Solução**: Divida o arquivo em partes menores (limite: 10MB)

## 📝 Observações

- Leads duplicados (mesmo telefone) são atualizados, não criados novamente
- Status e prioridade padrão são aplicados se não especificados
- A origem "IMPORT" é sempre aplicada em importações via arquivo
- Leads da landing page/chatbot mantêm suas origens originais (WEBSITE, WHATSAPP, etc.)
