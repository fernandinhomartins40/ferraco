import { User, UserRole } from '@prisma/client';

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface CreateUserDTO {
  username: string;
  email: string;
  password: string;
  name: string;
  role?: UserRole;
  avatar?: string;
}

export interface UpdateUserDTO {
  username?: string;
  email?: string;
  name?: string;
  role?: UserRole;
  avatar?: string;
}

export interface UserFiltersDTO {
  search?: string;
  role?: UserRole[];
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'lastLogin';
  sortOrder?: 'asc' | 'desc';
}

export interface UpdatePasswordDTO {
  currentPassword: string;
  newPassword: string;
}

// ============================================================================
// Response Types
// ============================================================================

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  avatar: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date | null;
}

export interface UserStatsResponse {
  total: number;
  active: number;
  inactive: number;
  byRole: Record<string, number>;
}

// ============================================================================
// Internal Types for Prisma Includes
// ============================================================================

export interface UserWithRelations {
  id: string;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  avatar: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date | null;
}
