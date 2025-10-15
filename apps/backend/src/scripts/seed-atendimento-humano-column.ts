/**
 * Script para adicionar coluna "ATENDIMENTO HUMANO" ao Kanban
 * Execute com: npx ts-node src/scripts/seed-atendimento-humano-column.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando criação da coluna "ATENDIMENTO HUMANO"...\n');

  try {
    // Verificar se a coluna já existe
    const existingColumn = await prisma.kanbanColumn.findFirst({
      where: { status: 'ATENDIMENTO_HUMANO' },
    });

    if (existingColumn) {
      console.log('✅ Coluna "ATENDIMENTO HUMANO" já existe!');
      console.log(`   ID: ${existingColumn.id}`);
      console.log(`   Nome: ${existingColumn.name}`);
      console.log(`   Ordem: ${existingColumn.order}`);
      console.log(`   Cor: ${existingColumn.color}\n`);
      return;
    }

    // Ajustar ordem das colunas existentes (incrementar em 1)
    console.log('📊 Ajustando ordem das colunas existentes...');
    await prisma.kanbanColumn.updateMany({
      data: {
        order: {
          increment: 1,
        },
      },
    });
    console.log('✅ Ordem das colunas ajustada\n');

    // Criar nova coluna
    console.log('📝 Criando coluna "ATENDIMENTO HUMANO"...');
    const newColumn = await prisma.kanbanColumn.create({
      data: {
        name: 'ATENDIMENTO HUMANO',
        color: '#FF6B6B', // Vermelho para destaque
        status: 'ATENDIMENTO_HUMANO',
        order: 0, // Primeira coluna (prioridade máxima)
        isSystem: false,
        isActive: true,
      },
    });

    console.log('✅ Coluna criada com sucesso!');
    console.log(`   ID: ${newColumn.id}`);
    console.log(`   Nome: ${newColumn.name}`);
    console.log(`   Status: ${newColumn.status}`);
    console.log(`   Ordem: ${newColumn.order}`);
    console.log(`   Cor: ${newColumn.color}\n`);

    // Listar todas as colunas por ordem
    console.log('📋 Ordem atual das colunas Kanban:');
    const allColumns = await prisma.kanbanColumn.findMany({
      orderBy: { order: 'asc' },
      where: { isActive: true },
    });

    allColumns.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.name} (${col.status}) - Ordem: ${col.order}`);
    });

    console.log('\n🎉 Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar coluna:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
