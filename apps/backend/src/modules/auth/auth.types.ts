import { User, UserRole } from '@prisma/client';

// ============================================================================
// AUTH TYPES - TypeScript Types
// ============================================================================

/**
 * User without sensitive data
 */
export type SafeUser = Omit<User, 'password'>;

/**
 * User with permissions
 */
export interface UserWithPermissions extends SafeUser {
  permissions: string[];
}

/**
 * Login response
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: UserWithPermissions;
}

/**
 * Register response
 */
export interface RegisterResponse extends LoginResponse {}

/**
 * Refresh token response
 */
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

/**
 * User session data
 */
export interface UserSession {
  userId: string;
  username: string;
  email: string;
  role: UserRole;
  permissions: string[];
}

/**
 * Password reset token data
 */
export interface PasswordResetToken {
  token: string;
  userId: string;
  expiresAt: Date;
}

/**
 * Auth service methods
 */
export interface IAuthService {
  login(email: string, password: string): Promise<LoginResponse | null>;
  register(data: RegisterData): Promise<RegisterResponse>;
  refreshToken(refreshToken: string): Promise<RefreshTokenResponse | null>;
  changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
  logout(refreshToken: string): Promise<void>;
  getUserById(userId: string): Promise<UserWithPermissions>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
}

/**
 * Register data
 */
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

/**
 * Permission check
 */
export interface PermissionCheck {
  resource: string;
  action: string;
}

/**
 * Permission definition
 */
export interface Permission {
  resource: string;
  actions: string[];
}

/**
 * Role permissions map
 */
export type RolePermissionsMap = Record<UserRole, Permission[]>;
