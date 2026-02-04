-- Adiciona coluna "ATENDIMENTO HUMANO" ao Kanban
-- Esta coluna deve ser a primeira para prioridade máxima

INSERT INTO "KanbanColumn" (id, name, color, status, "order", "isSystem", "isActive", "createdAt", "updatedAt")
VALUES (
  'atendimento_humano_col',
  'ATENDIMENTO HUMANO',
  '#FF6B6B',  -- Vermelho para destaque visual
  'ATENDIMENTO_HUMANO',
  0,  -- Ordem 0 = primeira coluna
  false,
  true,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- Ajustar ordem das outras colunas (incrementar em 1)
UPDATE "KanbanColumn"
SET "order" = "order" + 1
WHERE id != 'atendimento_humano_col';
