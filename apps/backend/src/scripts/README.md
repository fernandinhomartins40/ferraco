# Scripts de Manutenção

## fix-menu-hrefs.ts

Corrige os hrefs do menu do header no banco de dados de produção.

### Problema
O banco de dados de produção contém hrefs antigos em inglês que não correspondem aos IDs das sections:

- ❌ Banco: `#hero`, `#about`, `#products`, `#contact`, `#experience`
- ✅ Sections: `#inicio`, `#sobre`, `#produtos`, `#contato`, `#experiencia`

### Solução
Este script atualiza os hrefs no banco de dados para corresponder aos IDs corretos.

### Execução Local

```bash
cd apps/backend
npm run fix:menu-hrefs
```

### Execução na VPS (Produção)

**Opção 1: Via Docker (Recomendado)**
```bash
ssh root@72.60.10.108
cd /root/ferraco
docker exec -it ferraco-app npm run fix:menu-hrefs
```

**Opção 2: Diretamente na VPS**
```bash
ssh root@72.60.10.108
cd /root/ferraco/apps/backend
npx tsx src/scripts/fix-menu-hrefs.ts
```

### O que o script faz

1. ✅ Conecta ao banco de dados (PostgreSQL em produção, SQLite em dev)
2. ✅ Busca a configuração atual da landing page
3. ✅ Verifica os hrefs dos menu items
4. ✅ Substitui hrefs em inglês por português usando mapeamento
5. ✅ Atualiza no banco de dados
6. ✅ **NÃO afeta** o Landing Page Editor (preserva toda estrutura)

### Hrefs Corrigidos

| Antigo (Inglês) | Novo (Português) |
|-----------------|------------------|
| `#hero` | `#inicio` |
| `#about` | `#sobre` |
| `#products` | `#produtos` |
| `#contact` | `#contato` |
| `#experience` | `#experiencia` |

### Após Executar

1. Faça hard refresh no navegador (Ctrl + Shift + R)
2. Teste clicando nos itens do menu
3. Agora deve scrollar corretamente para as sections

### Segurança

- ✅ Script é **idempotente** (pode ser executado múltiplas vezes sem problemas)
- ✅ Verifica se hrefs já estão corretos antes de atualizar
- ✅ **NÃO sobrescreve** customizações feitas no Landing Page Editor
- ✅ Apenas atualiza hrefs que correspondem ao mapeamento definido
