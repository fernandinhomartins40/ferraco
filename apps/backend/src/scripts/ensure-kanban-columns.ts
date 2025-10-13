/**
 * Script para garantir que a coluna "Lead Novo" sempre exista
 * Executado no startup da aplicação
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function ensureDefaultKanbanColumn() {
  try {
    console.log('🔍 Verificando coluna padrão do Kanban...');

    // Verificar se já existe a coluna "Lead Novo"
    const existingColumn = await prisma.kanbanColumn.findFirst({
      where: { isSystem: true, status: 'NOVO' },
    });

    if (existingColumn) {
      console.log('✅ Coluna "Lead Novo" já existe');
      return;
    }

    // Criar coluna padrão se não existir
    console.log('📝 Criando coluna padrão "Lead Novo"...');
    await prisma.kanbanColumn.create({
      data: {
        id: 'clxkanban001',
        name: 'Lead Novo',
        color: '#3B82F6',
        status: 'NOVO',
        order: 0,
        isSystem: true,
        isActive: true,
      },
    });

    console.log('✅ Coluna "Lead Novo" criada com sucesso');
  } catch (error: any) {
    // Se o erro for de chave duplicada (coluna já existe), ignorar
    if (error.code === 'P2002') {
      console.log('✅ Coluna "Lead Novo" já existe (detectado por constraint)');
      return;
    }

    console.error('❌ Erro ao criar coluna padrão:', error.message);
    // Não lançar erro para não impedir o startup da aplicação
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se for chamado diretamente
if (require.main === module) {
  ensureDefaultKanbanColumn()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
