import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedKanbanColumns() {
  console.log('🌱 Seeding Kanban Columns...');

  // Verificar se já existe a coluna "Lead Novo"
  const existingColumn = await prisma.kanbanColumn.findFirst({
    where: { isSystem: true },
  });

  if (existingColumn) {
    console.log('✅ Coluna sistema "Lead Novo" já existe');
    return;
  }

  // Criar coluna padrão do sistema
  await prisma.kanbanColumn.create({
    data: {
      name: 'Lead Novo',
      color: '#3B82F6', // blue-500
      status: 'NOVO',
      order: 0,
      isSystem: true,
      isActive: true,
    },
  });

  console.log('✅ Coluna "Lead Novo" criada com sucesso');
}

seedKanbanColumns()
  .catch((e) => {
    console.error('❌ Erro ao fazer seed das colunas:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
