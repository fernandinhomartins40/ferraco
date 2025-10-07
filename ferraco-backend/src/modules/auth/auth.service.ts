import { User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/database';
import { jwtConfig } from '../../config/jwt';
import { PASSWORD } from '../../config/constants';
import { AppError } from '../../middleware/errorHandler';

export class AuthService {
  /**
   * Realizar login do usuário
   */
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    if (!user) {
      throw new AppError(401, 'Credenciais inválidas');
    }

    if (!user.isActive) {
      throw new AppError(401, 'Usuário inativo');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError(401, 'Credenciais inválidas');
    }

    const permissions = user.permissions.map(
      (up) => `${up.permission.resource}:${up.permission.action}`
    );

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions,
    };

    const token = jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
    } as jwt.SignOptions);

    // Atualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return {
      token,
      expiresIn: jwtConfig.expiresIn,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        permissions,
      },
    };
  }

  /**
   * Verificar token JWT
   */
  async verifyToken(token: string): Promise<User> {
    try {
      const decoded = jwt.verify(token, jwtConfig.secret) as any;

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      });

      if (!user || !user.isActive) {
        throw new AppError(401, 'Usuário inválido');
      }

      return user;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new AppError(401, 'Token expirado');
      }
      throw new AppError(401, 'Token inválido');
    }
  }

  /**
   * Obter informações do usuário atual
   */
  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
   * Criar novo usuário (registro)
   */
  async register(data: {
    email: string;
    username: string;
    password: string;
    name: string;
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

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
        name: data.name,
        role: 'USER',
      },
    });

    // Não retornar a senha
    const { password: _, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  /**
   * Alterar senha
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, 'Usuário não encontrado');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new AppError(401, 'Senha atual incorreta');
    }

    const hashedPassword = await bcrypt.hash(newPassword, PASSWORD.saltRounds);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Senha alterada com sucesso' };
  }
}
