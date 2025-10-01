# Ferraco CRM - Frontend

Este é o frontend do sistema Ferraco CRM, uma aplicação React desenvolvida com Vite e TypeScript para gerenciamento de leads e clientes.

## Tecnologias Utilizadas

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Axios
- React Router

## Configuração do Ambiente

1. Clone o repositório
2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
VITE_API_URL=http://localhost:3051/api  # URL da API backend (opcional para modo mock)
VITE_USE_MOCK_API=true  # Define se deve usar o modo mock para as APIs
VITE_APP_NAME="Ferraco CRM"
```

## Modo de Desenvolvimento

Execute o servidor de desenvolvimento:

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:8080`

## Build para Produção

Para gerar o build de produção:

```bash
npm run build
```

## Testes

Execute os testes:

```bash
npm run test
```

## Funcionalidades

- Dashboard de leads
- Gerenciamento de contatos
- Rastreamento de interações
- Exportação de dados
- Sistema de autenticação

## Arquitetura

O projeto segue uma estrutura de pastas organizada:

```
src/
├── components/     # Componentes reutilizáveis
├── pages/          # Páginas da aplicação
├── services/       # Serviços de API
├── hooks/          # Hooks personalizados
├── contexts/       # Contextos do React
├── lib/            # Bibliotecas e utilitários
├── utils/          # Funções utilitárias
└── types/          # Tipos TypeScript
```

## Modo Mock

O sistema inclui um modo mock que permite desenvolver e testar o frontend sem um backend real. Para ativar, defina `VITE_USE_MOCK_API=true` nas variáveis de ambiente.