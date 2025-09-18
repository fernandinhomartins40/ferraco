require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('🌱 Iniciando seed do banco de dados...');

    // Criar roles padrão
    console.log('📋 Criando roles...');

    const adminRole = await prisma.userRole.upsert({
      where: { name: 'Admin' },
      update: {},
      create: {
        name: 'Admin',
        description: 'Administrador do sistema',
        level: 1,
        permissions: JSON.stringify([
          'leads:read', 'leads:write', 'leads:delete',
          'users:read', 'users:write', 'users:delete',
          'admin:access', 'reports:read', 'reports:write'
        ]),
        canCreateUsers: true,
        canManageRoles: true,
        canViewAuditLogs: true
      }
    });

    const userRole = await prisma.userRole.upsert({
      where: { name: 'User' },
      update: {},
      create: {
        name: 'User',
        description: 'Usuário padrão',
        level: 5,
        permissions: JSON.stringify([
          'leads:read', 'leads:write',
          'reports:read'
        ]),
        canCreateUsers: false,
        canManageRoles: false,
        canViewAuditLogs: false
      }
    });

    console.log(`✅ Role Admin criada: ${adminRole.id}`);
    console.log(`✅ Role User criada: ${userRole.id}`);

    // Criar usuário admin padrão
    console.log('👤 Criando usuário admin...');

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@ferraco.com' },
      update: {
        password: hashedPassword,
        isActive: true,
        roleId: adminRole.id
      },
      create: {
        email: 'admin@ferraco.com',
        name: 'Admin Ferraco',
        password: hashedPassword,
        isActive: true,
        roleId: adminRole.id,
        preferences: JSON.stringify({
          theme: 'light',
          language: 'pt-BR',
          notifications: true
        })
      }
    });

    console.log(`✅ Usuário admin criado: ${adminUser.id}`);

    // Criar alguns usuários de teste
    console.log('👥 Criando usuários de teste...');

    const userPassword = await bcrypt.hash('user123', 10);

    const testUser = await prisma.user.upsert({
      where: { email: 'user@ferraco.com' },
      update: {
        password: userPassword,
        isActive: true,
        roleId: userRole.id
      },
      create: {
        email: 'user@ferraco.com',
        name: 'Usuário Teste',
        password: userPassword,
        isActive: true,
        roleId: userRole.id,
        preferences: JSON.stringify({
          theme: 'light',
          language: 'pt-BR',
          notifications: true
        })
      }
    });

    console.log(`✅ Usuário teste criado: ${testUser.id}`);

    console.log('🎉 Seed concluído com sucesso!');
    console.log('\n📝 Credenciais de acesso:');
    console.log('  Admin: admin@ferraco.com / admin123');
    console.log('  User:  user@ferraco.com / user123');

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed();