import { Router } from 'express';
import { UsersController } from './users.controller';
import { validate } from '../../middleware/validation';
import { authMiddleware, requireRole } from '../../middleware/auth';
import {
  createUserSchema,
  updateUserSchema,
  userFiltersSchema,
  userIdSchema,
} from './users.validators';

const router = Router();
const usersController = new UsersController();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

/**
 * @route GET /api/users
 * @desc Listar usuários
 * @access Private (Admin)
 */
router.get(
  '/',
  requireRole('ADMIN'),
  validate(userFiltersSchema),
  usersController.getUsers.bind(usersController)
);

/**
 * @route GET /api/users/:id
 * @desc Obter usuário por ID
 * @access Private (Admin)
 */
router.get(
  '/:id',
  requireRole('ADMIN'),
  validate(userIdSchema),
  usersController.getUserById.bind(usersController)
);

/**
 * @route POST /api/users
 * @desc Criar novo usuário
 * @access Private (Admin)
 */
router.post(
  '/',
  requireRole('ADMIN'),
  validate(createUserSchema),
  usersController.createUser.bind(usersController)
);

/**
 * @route PUT /api/users/:id
 * @desc Atualizar usuário
 * @access Private (Admin)
 */
router.put(
  '/:id',
  requireRole('ADMIN'),
  validate(userIdSchema),
  validate(updateUserSchema),
  usersController.updateUser.bind(usersController)
);

/**
 * @route DELETE /api/users/:id
 * @desc Deletar usuário
 * @access Private (Admin)
 */
router.delete(
  '/:id',
  requireRole('ADMIN'),
  validate(userIdSchema),
  usersController.deleteUser.bind(usersController)
);

export default router;
