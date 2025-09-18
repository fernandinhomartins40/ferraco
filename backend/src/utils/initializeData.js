const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function initializeDefaultData() {
  try {
    console.log('🔧 Inicializando dados padrão do sistema...');

    // Verificar se já existem roles
    const existingRoles = await prisma.userRole.count();

    if (existingRoles === 0) {
      console.log('📝 Criando roles padrão...');

      // Criar role Admin
      const adminRole = await prisma.userRole.create({
        data: {
          name: 'Admin',
          description: 'Administrador do sistema',
          level: 10,
          permissions: JSON.stringify([
            'leads:read', 'leads:write', 'leads:delete',
            'tags:read', 'tags:write', 'tags:delete',
            'notes:read', 'notes:write', 'notes:delete',
            'admin:read', 'admin:write',
            'users:read', 'users:write', 'users:delete',
            'dashboard:read', 'reports:read',
            'communications:read', 'communications:write',
            'automations:read', 'automations:write'
          ]),
          canCreateUsers: true,
          canManageRoles: true,
          canViewAuditLogs: true
        }
      });

      // Criar role Sales
      const salesRole = await prisma.userRole.create({
        data: {
          name: 'Sales',
          description: 'Vendedor',
          level: 5,
          permissions: JSON.stringify([
            'leads:read', 'leads:write',
            'tags:read', 'tags:write',
            'notes:read', 'notes:write',
            'dashboard:read',
            'communications:read', 'communications:write'
          ]),
          canCreateUsers: false,
          canManageRoles: false,
          canViewAuditLogs: false
        }
      });

      // Criar role Consultant
      const consultantRole = await prisma.userRole.create({
        data: {
          name: 'Consultant',
          description: 'Consultor',
          level: 3,
          permissions: JSON.stringify([
            'leads:read',
            'tags:read',
            'notes:read',
            'dashboard:read'
          ]),
          canCreateUsers: false,
          canManageRoles: false,
          canViewAuditLogs: false
        }
      });

      console.log('✅ Roles criadas:', { adminRole: adminRole.id, salesRole: salesRole.id, consultantRole: consultantRole.id });

      // Verificar se já existem usuários
      const existingUsers = await prisma.user.count();

      if (existingUsers === 0) {
        console.log('👥 Criando usuários padrão...');

        // Criar usuário Admin
        const adminUser = await prisma.user.create({
          data: {
            email: 'admin@ferraco.com',
            name: 'Administrador',
            password: await bcrypt.hash('Admin123!', 10),
            isActive: true,
            roleId: adminRole.id,
            preferences: JSON.stringify({
              theme: 'light',
              language: 'pt-BR',
              notifications: true
            })
          }
        });

        // Criar usuário Vendedor
        const salesUser = await prisma.user.create({
          data: {
            email: 'vendedor@ferraco.com',
            name: 'Vendedor',
            password: await bcrypt.hash('Vend123!', 10),
            isActive: true,
            roleId: salesRole.id,
            preferences: JSON.stringify({
              theme: 'light',
              language: 'pt-BR',
              notifications: true
            })
          }
        });

        // Criar usuário Consultor
        const consultantUser = await prisma.user.create({
          data: {
            email: 'consultor@ferraco.com',
            name: 'Consultor',
            password: await bcrypt.hash('Cons123!', 10),
            isActive: true,
            roleId: consultantRole.id,
            preferences: JSON.stringify({
              theme: 'light',
              language: 'pt-BR',
              notifications: true
            })
          }
        });

        console.log('✅ Usuários criados:', {
          admin: adminUser.email,
          sales: salesUser.email,
          consultant: consultantUser.email
        });
      } else {
        console.log('👥 Usuários já existem no banco');
      }
    } else {
      console.log('📝 Roles já existem no banco');
    }

    console.log('🎉 Inicialização dos dados concluída!');

    // Mostrar informações de login
    console.log('\n📋 Credenciais de acesso:');
    console.log('👑 Admin: admin@ferraco.com / Admin123!');
    console.log('💼 Vendedor: vendedor@ferraco.com / Vend123!');
    console.log('🔍 Consultor: consultor@ferraco.com / Cons123!');

  } catch (error) {
    console.error('❌ Erro ao inicializar dados:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  initializeDefaultData()
    .then(() => {
      console.log('✅ Script de inicialização executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro na execução do script:', error);
      process.exit(1);
    });
}

module.exports = { initializeDefaultData };