import { Router } from 'express';
import { AuthController } from './auth.controller';
import { ProfileController } from './profileController';
import { validate } from '../../middleware/validation';
import { authMiddleware } from '../../middleware/auth';
import { loginSchema, registerSchema, changePasswordSchema } from './auth.validators';

const router = Router();
const authController = new AuthController();
const profileController = new ProfileController();

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
 * @route POST /api/auth/refresh
 * @desc 🔐 Renovar access token usando refresh token
 * @access Public
 */
router.post('/refresh', authController.refresh.bind(authController));

/**
 * @route POST /api/auth/change-password
 * @desc Alterar senha do usuário
 * @access Private
 */
router.post('/change-password', authMiddleware, validate(changePasswordSchema), authController.changePassword.bind(authController));

/**
 * @route PUT /api/auth/profile
 * @desc Atualizar perfil do usuário
 * @access Private
 */
router.put('/profile', authMiddleware, profileController.updateProfile.bind(profileController));

/**
 * @route PUT /api/auth/change-password
 * @desc Alterar senha (endpoint alternativo via ProfileController)
 * @access Private
 */
router.put('/change-password', authMiddleware, profileController.changePassword.bind(profileController));

export default router;
