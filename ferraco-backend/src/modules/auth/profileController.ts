import { Response, NextFunction } from 'express';
import prisma from '../../config/database';
import bcrypt from 'bcryptjs';
import { AppError } from '../../middleware/errorHandler';
import { AuthenticatedRequest } from '../../middleware/auth';

export class ProfileController {
  /**
   * Atualizar dados do perfil do usuário
   */
  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError(401, 'Usuário não autenticado');
      }

      const { name, email, username } = req.body;

      // Verificar se email já está em uso por outro usuário
      if (email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            email,
            NOT: { id: userId }
          }
        });

        if (existingUser) {
          throw new AppError(400, 'Este e-mail já está em uso');
        }
      }

      // Verificar se username já está em uso por outro usuário
      if (username) {
        const existingUser = await prisma.user.findFirst({
          where: {
            username,
            NOT: { id: userId }
          }
        });

        if (existingUser) {
          throw new AppError(400, 'Este nome de usuário já está em uso');
        }
      }

      // Atualizar usuário
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          name: name || undefined,
          email: email || undefined,
          username: username || undefined,
        },
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      });

      // Retornar dados do usuário atualizado
      res.json({
        success: true,
        message: 'Perfil atualizado com sucesso',
        data: {
          id: updatedUser.id,
          username: updatedUser.username,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          permissions: updatedUser.permissions.map(
            (up) => `${up.permission.resource}:${up.permission.action}`
          )
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Alterar senha do usuário
   */
  async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError(401, 'Usuário não autenticado');
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        throw new AppError(400, 'Senha atual e nova senha são obrigatórias');
      }

      if (newPassword.length < 6) {
        throw new AppError(400, 'A nova senha deve ter no mínimo 6 caracteres');
      }

      // Buscar usuário
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new AppError(404, 'Usuário não encontrado');
      }

      // Verificar senha atual
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

      if (!isPasswordValid) {
        throw new AppError(400, 'Senha atual incorreta');
      }

      // Verificar se a nova senha é diferente da atual
      const isSamePassword = await bcrypt.compare(newPassword, user.password);

      if (isSamePassword) {
        throw new AppError(400, 'A nova senha deve ser diferente da senha atual');
      }

      // Hash da nova senha
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Atualizar senha
      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword
        }
      });

      res.json({
        success: true,
        message: 'Senha alterada com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }
}
