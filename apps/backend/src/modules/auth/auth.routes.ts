import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { authLimiter } from '../../middleware/rateLimit';
import {
  LoginSchema,
  RegisterSchema,
  ChangePasswordSchema,
  RefreshTokenSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  UpdateProfileSchema,
} from './auth.validators';

// ============================================================================
// AUTH ROUTES
// ============================================================================

const router = Router();

/**
 * Public routes (no authentication required)
 */

// POST /api/auth/login
router.post(
  '/login',
  authLimiter,
  validate({ body: LoginSchema }),
  authController.login.bind(authController)
);

// POST /api/auth/register
router.post(
  '/register',
  authLimiter,
  validate({ body: RegisterSchema }),
  authController.register.bind(authController)
);

// POST /api/auth/refresh
router.post(
  '/refresh',
  validate({ body: RefreshTokenSchema }),
  authController.refresh.bind(authController)
);

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  authLimiter,
  validate({ body: ForgotPasswordSchema }),
  authController.forgotPassword.bind(authController)
);

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  authLimiter,
  validate({ body: ResetPasswordSchema }),
  authController.resetPassword.bind(authController)
);

/**
 * Protected routes (authentication required)
 */

// GET /api/auth/me
router.get(
  '/me',
  authenticate,
  authController.me.bind(authController)
);

// PUT /api/auth/profile
router.put(
  '/profile',
  authenticate,
  validate({ body: UpdateProfileSchema }),
  authController.updateProfile.bind(authController)
);

// PUT /api/auth/change-password
router.put(
  '/change-password',
  authenticate,
  validate({ body: ChangePasswordSchema }),
  authController.changePassword.bind(authController)
);

// POST /api/auth/logout
router.post(
  '/logout',
  authenticate,
  validate({ body: RefreshTokenSchema }),
  authController.logout.bind(authController)
);

// POST /api/auth/complete-first-login
router.post(
  '/complete-first-login',
  authenticate,
  authController.completeFirstLogin.bind(authController)
);

// GET /api/auth/sessions
router.get(
  '/sessions',
  authenticate,
  authController.getSessions.bind(authController)
);

// POST /api/auth/revoke-all-sessions
router.post(
  '/revoke-all-sessions',
  authenticate,
  authController.revokeAllSessions.bind(authController)
);

export default router;
