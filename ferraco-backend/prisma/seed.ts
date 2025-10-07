import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ==========================================
  // CRIAR PERMISSÕES
  // ==========================================
  console.log('📝 Creating permissions...');

  const permissions = [
    { resource: 'leads', action: 'read', description: 'Visualizar leads' },
    { resource: 'leads', action: 'write', description: 'Criar e editar leads' },
    { resource: 'leads', action: 'delete', description: 'Deletar leads' },
    { resource: 'leads', action: 'export', description: 'Exportar leads' },
    { resource: 'tags', action: 'read', description: 'Visualizar tags' },
    { resource: 'tags', action: 'write', description: 'Criar e editar tags' },
    { resource: 'tags', action: 'delete', description: 'Deletar tags' },
    { resource: 'notes', action: 'read', description: 'Visualizar notas' },
    { resource: 'notes', action: 'write', description: 'Criar e editar notas' },
    { resource: 'notes', action: 'delete', description: 'Deletar notas' },
    { resource: 'users', action: 'read', description: 'Visualizar usuários' },
    { resource: 'users', action: 'write', description: 'Criar e editar usuários' },
    { resource: 'users', action: 'delete', description: 'Deletar usuários' },
    { resource: 'reports', action: 'read', description: 'Visualizar relatórios' },
    { resource: 'reports', action: 'export', description: 'Exportar relatórios' },
    { resource: 'admin', action: 'read', description: 'Acessar área administrativa' },
    { resource: 'admin', action: 'write', description: 'Modificar configurações' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: {
        resource_action: {
          resource: perm.resource,
          action: perm.action,
        },
      },
      update: {},
      create: perm,
    });
  }

  console.log(`✅ Created ${permissions.length} permissions`);

  // ==========================================
  // CRIAR USUÁRIO ADMIN
  // ==========================================
  console.log('👤 Creating admin user...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ferraco.com' },
    update: {},
    create: {
      email: 'admin@ferraco.com',
      username: 'admin',
      password: hashedPassword,
      name: 'Administrador',
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Admin user created');

  // ==========================================
  // ATRIBUIR PERMISSÕES AO ADMIN
  // ==========================================
  console.log('🔐 Assigning permissions to admin...');

  const allPermissions = await prisma.permission.findMany();

  for (const perm of allPermissions) {
    await prisma.userPermission.upsert({
      where: {
        userId_permissionId: {
          userId: admin.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        userId: admin.id,
        permissionId: perm.id,
      },
    });
  }

  console.log(`✅ Assigned ${allPermissions.length} permissions to admin`);

  // ==========================================
  // CRIAR USUÁRIO DE VENDAS
  // ==========================================
  console.log('👤 Creating sales user...');

  const salesPassword = await bcrypt.hash('sales123', 10);

  const salesUser = await prisma.user.upsert({
    where: { email: 'vendas@ferraco.com' },
    update: {},
    create: {
      email: 'vendas@ferraco.com',
      username: 'vendas',
      password: salesPassword,
      name: 'Equipe de Vendas',
      role: 'SALES',
      isActive: true,
    },
  });

  console.log('✅ Sales user created');

  // Atribuir permissões básicas de leads ao vendedor
  const salesPermissions = await prisma.permission.findMany({
    where: {
      OR: [
        { resource: 'leads', action: 'read' },
        { resource: 'leads', action: 'write' },
        { resource: 'notes', action: 'read' },
        { resource: 'notes', action: 'write' },
        { resource: 'tags', action: 'read' },
      ],
    },
  });

  for (const perm of salesPermissions) {
    await prisma.userPermission.upsert({
      where: {
        userId_permissionId: {
          userId: salesUser.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        userId: salesUser.id,
        permissionId: perm.id,
      },
    });
  }

  console.log(`✅ Assigned ${salesPermissions.length} permissions to sales user`);

  // ==========================================
  // CRIAR TAGS DO SISTEMA
  // ==========================================
  console.log('🏷️  Creating system tags...');

  const systemTags = [
    { name: 'VIP', color: '#FFD700', description: 'Cliente VIP', isSystem: true },
    { name: 'Urgente', color: '#FF0000', description: 'Atendimento urgente', isSystem: true },
    { name: 'Follow-up', color: '#00FF00', description: 'Necessita follow-up', isSystem: true },
    { name: 'Novo Lead', color: '#0000FF', description: 'Lead novo', isSystem: true },
    { name: 'Em Negociação', color: '#FFA500', description: 'Em processo de negociação', isSystem: true },
    { name: 'Fechado', color: '#008000', description: 'Negócio fechado', isSystem: true },
    { name: 'Perdido', color: '#808080', description: 'Negócio perdido', isSystem: true },
  ];

  for (const tag of systemTags) {
    await prisma.tag.upsert({
      where: { name: tag.name },
      update: {},
      create: tag,
    });
  }

  console.log(`✅ Created ${systemTags.length} system tags`);

  // ==========================================
  // SUMÁRIO
  // ==========================================
  console.log('\n========================================');
  console.log('✅ Seed completed successfully!');
  console.log('========================================');
  console.log('\n📧 Admin User:');
  console.log('   Email: admin@ferraco.com');
  console.log('   Password: admin123');
  console.log('\n📧 Sales User:');
  console.log('   Email: vendas@ferraco.com');
  console.log('   Password: sales123');
  console.log('\n🏷️  System Tags:', systemTags.length);
  console.log('🔐 Permissions:', permissions.length);
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
