import { PrismaClient, Prisma } from '@prisma/client';
import {
  CreateUserDTO,
  UpdateUserDTO,
  UserFiltersDTO,
  UpdatePasswordDTO,
  UserResponse,
  UserStatsResponse,
  UserWithRelations,
} from './users.types';
import { logger } from '../../utils/logger';
import { hashPassword, comparePassword } from '../../utils/password';

// ============================================================================
// UsersService
// ============================================================================

export class UsersService {
  constructor(private prisma: PrismaClient) {}

  // ==========================================================================
  // CRUD Operations
  // ==========================================================================

  async create(data: CreateUserDTO): Promise<UserResponse> {
    logger.info('Creating new user', { username: data.username, email: data.email });

    // Check if username already exists
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUsername) {
      throw new Error('Username já está em uso');
    }

    // Check if email already exists
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingEmail) {
      throw new Error('Email já está em uso');
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role,
        avatar: data.avatar || null,
      },
    });

    logger.info('User created successfully', { userId: user.id });

    return this.mapToResponse(user);
  }

  async findAll(filters: UserFiltersDTO): Promise<{
    data: UserResponse[];
    total: number;
    page: number;
    limit: number;
  }> {
    logger.debug('Finding users with filters', { filters });

    const where = this.buildWhereClause(filters);
    const orderBy = this.buildOrderByClause(filters);

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map(this.mapToResponse),
      total,
      page,
      limit,
    };
  }

  async findById(id: string): Promise<UserResponse | null> {
    logger.debug('Finding user by ID', { id });

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return null;
    }

    return this.mapToResponse(user);
  }

  async getByEmail(email: string): Promise<UserResponse | null> {
    logger.debug('Finding user by email', { email });

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    return this.mapToResponse(user);
  }

  async update(id: string, data: UpdateUserDTO): Promise<UserResponse> {
    logger.info('Updating user', { id, data });

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new Error('Usuário não encontrado');
    }

    // Check if new username is already taken (if changing username)
    if (data.username && data.username !== existingUser.username) {
      const usernameExists = await this.prisma.user.findUnique({
        where: { username: data.username },
      });

      if (usernameExists) {
        throw new Error('Username já está em uso');
      }
    }

    // Check if new email is already taken (if changing email)
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: data.email },
      });

      if (emailExists) {
        throw new Error('Email já está em uso');
      }
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        username: data.username,
        email: data.email,
        name: data.name,
        role: data.role,
        avatar: data.avatar !== undefined ? data.avatar || null : undefined,
      },
    });

    logger.info('User updated successfully', { userId: id });

    return this.mapToResponse(user);
  }

  async delete(id: string): Promise<void> {
    logger.info('Soft deleting user', { id });

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Soft delete by setting isActive to false
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    logger.info('User soft deleted successfully', { userId: id });
  }

  async updatePassword(
    id: string,
    data: UpdatePasswordDTO
  ): Promise<void> {
    logger.info('Updating user password', { id });

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, password: true },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Verify current password
    const isPasswordValid = await comparePassword(
      data.currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      throw new Error('Senha atual incorreta');
    }

    // Hash new password
    const hashedPassword = await hashPassword(data.newPassword);

    // Update password
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    logger.info('User password updated successfully', { userId: id });
  }

  async activate(id: string): Promise<UserResponse> {
    logger.info('Activating user', { id });

    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
    });

    logger.info('User activated successfully', { userId: id });

    return this.mapToResponse(user);
  }

  async deactivate(id: string): Promise<UserResponse> {
    logger.info('Deactivating user', { id });

    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    logger.info('User deactivated successfully', { userId: id });

    return this.mapToResponse(user);
  }

  async getStats(): Promise<UserStatsResponse> {
    logger.debug('Getting user stats');

    const [total, active, inactive, byRoleData] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { isActive: false } }),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),
    ]);

    const byRole: Record<string, number> = {};
    byRoleData.forEach((item) => {
      byRole[item.role] = item._count.role;
    });

    return {
      total,
      active,
      inactive,
      byRole,
    };
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  private buildWhereClause(filters: UserFiltersDTO): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { username: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.role && filters.role.length > 0) {
      where.role = { in: filters.role };
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return where;
  }

  private buildOrderByClause(filters: UserFiltersDTO): Prisma.UserOrderByWithRelationInput {
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';

    return { [sortBy]: sortOrder };
  }

  private mapToResponse(user: UserWithRelations): UserResponse {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
    };
  }
}
