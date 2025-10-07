import bcrypt from 'bcryptjs';
import prisma from '../../config/database';
import { PASSWORD, PAGINATION } from '../../config/constants';
import { AppError } from '../../middleware/errorHandler';
import { UserRole } from '@prisma/client';

export class UsersService {
  /**
   * Listar usuários com filtros e paginação
   */
  async getUsers(filters: {
    search?: string;
    role?: UserRole;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const {
      search,
      role,
      isActive,
      page = PAGINATION.defaultPage,
      limit = PAGINATION.defaultLimit,
    } = filters;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          role: true,
          avatar: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
          permissions: {
            include: {
              permission: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: Math.min(limit, PAGINATION.maxLimit),
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users.map((user) => ({
        ...user,
        permissions: user.permissions.map(
          (up) => `${up.permission.resource}:${up.permission.action}`
        ),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obter usuário por ID
   */
  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError(404, 'Usuário não encontrado');
    }

    return {
      ...user,
      permissions: user.permissions.map(
        (up) => `${up.permission.resource}:${up.permission.action}`
      ),
    };
  }

  /**
   * Criar novo usuário
   */
  async createUser(data: {
    email: string;
    username: string;
    password: string;
    name: string;
    role?: UserRole;
  }) {
    // Verificar se email já existe
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingEmail) {
      throw new AppError(409, 'Email já cadastrado');
    }

    // Verificar se username já existe
    const existingUsername = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUsername) {
      throw new AppError(409, 'Nome de usuário já cadastrado');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(data.password, PASSWORD.saltRounds);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
        name: data.name,
        role: data.role || 'USER',
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
      },
    });

    return user;
  }

  /**
   * Atualizar usuário
   */
  async updateUser(
    id: string,
    data: {
      email?: string;
      username?: string;
      name?: string;
      role?: UserRole;
      avatar?: string;
      isActive?: boolean;
    }
  ) {
    // Verificar se usuário existe
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      throw new AppError(404, 'Usuário não encontrado');
    }

    // Verificar email duplicado
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (emailExists) {
        throw new AppError(409, 'Email já cadastrado');
      }
    }

    // Verificar username duplicado
    if (data.username && data.username !== existingUser.username) {
      const usernameExists = await prisma.user.findUnique({
        where: { username: data.username },
      });
      if (usernameExists) {
        throw new AppError(409, 'Nome de usuário já cadastrado');
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Deletar usuário
   */
  async deleteUser(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError(404, 'Usuário não encontrado');
    }

    await prisma.user.delete({ where: { id } });

    return { message: 'Usuário deletado com sucesso' };
  }
}
