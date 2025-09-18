#!/usr/bin/env node
/**
 * Script de Inicialização de Produção
 * Garante que o banco de dados seja inicializado com o sistema unificado
 */

const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

async function initializeProduction() {
  try {
    console.log('🚀 Iniciando configuração de produção...');

    // Verificar se o banco já existe
    try {
      const userCount = await prisma.user.count();
      const roleCount = await prisma.userRole.count();

      if (userCount > 0 && roleCount > 0) {
        console.log(`✅ Banco já inicializado: ${userCount} usuários, ${roleCount} roles`);
        return;
      }
    } catch (error) {
      console.log('🔄 Banco não inicializado, criando estrutura...');
    }

    // Executar migrations
    console.log('📊 Executando migrations...');
    const { execSync } = require('child_process');
    try {
      execSync('npx prisma migrate deploy', {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
    } catch (error) {
      console.log('⚠️ Migrations já aplicadas ou erro:', error.message);
    }

    // Gerar client
    console.log('🔧 Gerando Prisma client...');
    try {
      execSync('npx prisma generate', {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
    } catch (error) {
      console.log('⚠️ Client já gerado ou erro:', error.message);
    }

    // Criar roles padrão
    console.log('👥 Criando roles padrão...');

    const roles = [
      {
        name: 'Admin',
        description: 'Administrador do sistema',
        level: 1,
        permissions: ['*'], // Todas as permissões
        isActive: true
      },
      {
        name: 'Manager',
        description: 'Gerente de vendas',
        level: 2,
        permissions: [
          'leads.read', 'leads.write', 'leads.delete',
          'users.read', 'reports.read', 'dashboard.read'
        ],
        isActive: true
      },
      {
        name: 'Sales',
        description: 'Vendedor',
        level: 3,
        permissions: [
          'leads.read', 'leads.write',
          'dashboard.read'
        ],
        isActive: true
      }
    ];

    for (const role of roles) {
      await prisma.userRole.upsert({
        where: { name: role.name },
        update: role,
        create: role
      });
    }

    // Criar usuário admin
    console.log('👤 Criando usuário admin...');
    const bcrypt = require('bcryptjs');
    const adminPassword = await bcrypt.hash('Admin123!', 12);

    const adminRole = await prisma.userRole.findUnique({
      where: { name: 'Admin' }
    });

    await prisma.user.upsert({
      where: { email: 'admin@ferraco.com' },
      update: {
        password: adminPassword,
        roleId: adminRole.id,
        isActive: true
      },
      create: {
        email: 'admin@ferraco.com',
        name: 'Admin Ferraco',
        password: adminPassword,
        roleId: adminRole.id,
        isActive: true,
        emailVerified: true
      }
    });

    console.log('✅ Produção inicializada com sucesso!');
    console.log('👑 Admin: admin@ferraco.com / Admin123!');

  } catch (error) {
    console.error('❌ Erro na inicialização:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  initializeProduction();
}

module.exports = { initializeProduction };