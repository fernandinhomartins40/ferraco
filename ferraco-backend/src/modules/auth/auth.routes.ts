import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validation';
import { authMiddleware } from '../../middleware/auth';
import { loginSchema, registerSchema, changePasswordSchema } from './auth.validators';

const router = Router();
const authController = new AuthController();

/**
 * @route POST /api/auth/login
 * @desc Login de usuário
 * @access Public
 */
router.post('/login', validate(loginSchema), authController.login.bind(authController));

/**
 * @route POST /api/auth/register
 * @desc Registro de novo usuário
 * @access Public
 */
router.post('/register', validate(registerSchema), authController.register.bind(authController));

/**
 * @route GET /api/auth/me
 * @desc Obter informações do usuário autenticado
 * @access Private
 */
router.get('/me', authMiddleware, authController.me.bind(authController));

/**
 * @route POST /api/auth/logout
 * @desc Logout do usuário
 * @access Private
 */
router.post('/logout', authMiddleware, authController.logout.bind(authController));

/**
 * @route POST /api/auth/change-password
 * @desc Alterar senha do usuário
 * @access Private
 */
router.post('/change-password', authMiddleware, validate(changePasswordSchema), authController.changePassword.bind(authController));

export default router;
