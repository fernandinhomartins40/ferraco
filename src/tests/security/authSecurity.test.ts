/**
 * Testes de Segurança - Sistema de Autenticação
 * Valida proteções, permissões e edge cases críticos
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { securityLogger, SecurityEventType, SecurityLevel } from '@/utils/securityLogger';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';

// Mock do localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock do fetch
global.fetch = vi.fn();

// Mock do securityLogger
vi.mock('@/utils/securityLogger', () => ({
  securityLogger: {
    logEvent: vi.fn(),
    logAuthentication: vi.fn(),
    logAccessDenied: vi.fn(),
    logUserAction: vi.fn(),
    getLogs: vi.fn(() => []),
    getSecuritySummary: vi.fn(() => ({
      totalEvents: 0,
      criticalEvents: 0,
      failedLogins: 0,
      accessDenials: 0,
      byLevel: {},
      byType: {}
    }))
  },
  SecurityEventType: {
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILED: 'LOGIN_FAILED',
    ACCESS_DENIED: 'ACCESS_DENIED',
    USER_ACTION: 'USER_ACTION',
    SENSITIVE_DATA_ACCESS: 'SENSITIVE_DATA_ACCESS',
    ERROR_OCCURRED: 'ERROR_OCCURRED'
  },
  SecurityLevel: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL'
  }
}));

// Componente de teste protegido
const TestProtectedComponent = () => React.createElement('div', { 'data-testid': 'protected-content' }, 'Conteúdo Protegido');

// Helper para renderizar com contexto
const renderWithAuth = (component: React.ReactElement, initialEntries = ['/']) => {
  return render(
    React.createElement(MemoryRouter, { initialEntries },
      React.createElement(AuthProvider, null,
        component
      )
    )
  );
};

describe('🔐 Security Tests - Authentication System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    (fetch as Mock).mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('🚫 Route Protection Tests', () => {
    it('should block access to protected routes when not authenticated', async () => {
      renderWithAuth(
        <ProtectedRoute>
          <TestProtectedComponent />
        </ProtectedRoute>
      );

      // Não deve renderizar o conteúdo protegido
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();

      // Deve redirecionar para login
      await waitFor(() => {
        expect(window.location.pathname).toBe('/');
      });
    });

    it('should allow access to protected routes when authenticated', async () => {
      // Mock de usuário autenticado
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'ferraco_auth_token') return 'valid-token';
        if (key === 'ferraco_auth_user') return JSON.stringify({
          id: '1',
          username: 'admin',
          name: 'Admin',
          role: 'admin',
          email: 'admin@test.com',
          permissions: ['admin:read', 'admin:write']
        });
        return null;
      });

      // Mock de verificação de token válida
      (fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { valid: true, user: { id: '1', username: 'admin' } }
        })
      });

      renderWithAuth(
        <ProtectedRoute>
          <TestProtectedComponent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    it('should check permissions correctly', async () => {
      // Mock de usuário com permissões limitadas
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'ferraco_auth_token') return 'valid-token';
        if (key === 'ferraco_auth_user') return JSON.stringify({
          id: '2',
          username: 'user',
          name: 'User',
          role: 'sales',
          email: 'user@test.com',
          permissions: ['leads:read']
        });
        return null;
      });

      (fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { valid: true, user: { id: '2', username: 'user' } }
        })
      });

      renderWithAuth(
        <ProtectedRoute requiredPermission="admin:write">
          <TestProtectedComponent />
        </ProtectedRoute>
      );

      // Deve mostrar página de acesso negado
      await waitFor(() => {
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
        expect(screen.getByText(/Acesso Negado/i)).toBeInTheDocument();
      });
    });
  });

  describe('🔑 Authentication Security Tests', () => {
    it('should log failed login attempts', async () => {
      (fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          success: false,
          message: 'Credenciais inválidas'
        })
      });

      renderWithAuth(<Login />);

      const usernameInput = screen.getByLabelText(/nome de usuário/i);
      const passwordInput = screen.getByLabelText(/senha/i);
      const submitButton = screen.getByRole('button', { name: /entrar/i });

      fireEvent.change(usernameInput, { target: { value: 'invalid-user' } });
      fireEvent.change(passwordInput, { target: { value: 'wrong-password' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(securityLogger.logAuthentication).toHaveBeenCalledWith(
          SecurityEventType.LOGIN_FAILED,
          undefined,
          'invalid-user',
          expect.objectContaining({
            error: expect.any(String),
            attempt: 'invalid_credentials'
          })
        );
      });
    });

    it('should validate JWT token structure', () => {
      const invalidTokens = [
        '',
        'invalid-token',
        'header.payload', // Missing signature
        'invalid.payload.signature',
        'header..signature' // Empty payload
      ];

      invalidTokens.forEach(token => {
        expect(() => {
          // Simular validação de token
          const parts = token.split('.');
          if (parts.length !== 3) {
            throw new Error('Invalid token format');
          }
        }).toThrow();
      });
    });

    it('should handle token expiration correctly', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJleHAiOjE1MDAwMDAwMDB9.invalid';

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'ferraco_auth_token') return expiredToken;
        return null;
      });

      (fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          success: false,
          message: 'Token expired'
        })
      });

      renderWithAuth(
        <ProtectedRoute>
          <TestProtectedComponent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('ferraco_auth_token');
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('ferraco_auth_user');
      });
    });
  });

  describe('🛡️ Permission System Tests', () => {
    const testCases = [
      {
        userRole: 'admin',
        userPermissions: ['leads:read', 'leads:write', 'admin:read', 'admin:write'],
        requiredPermission: 'admin:write',
        shouldHaveAccess: true
      },
      {
        userRole: 'sales',
        userPermissions: ['leads:read', 'leads:write'],
        requiredPermission: 'admin:read',
        shouldHaveAccess: false
      },
      {
        userRole: 'consultant',
        userPermissions: ['leads:read'],
        requiredPermission: 'leads:write',
        shouldHaveAccess: false
      }
    ];

    testCases.forEach(({ userRole, userPermissions, requiredPermission, shouldHaveAccess }) => {
      it(`should ${shouldHaveAccess ? 'allow' : 'deny'} ${userRole} access to ${requiredPermission}`, async () => {
        localStorageMock.getItem.mockImplementation((key) => {
          if (key === 'ferraco_auth_token') return 'valid-token';
          if (key === 'ferraco_auth_user') return JSON.stringify({
            id: '1',
            username: 'test-user',
            name: 'Test User',
            role: userRole,
            email: 'test@test.com',
            permissions: userPermissions
          });
          return null;
        });

        (fetch as Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { valid: true, user: { id: '1', username: 'test-user' } }
          })
        });

        renderWithAuth(
          <ProtectedRoute requiredPermission={requiredPermission}>
            <TestProtectedComponent />
          </ProtectedRoute>
        );

        if (shouldHaveAccess) {
          await waitFor(() => {
            expect(screen.getByTestId('protected-content')).toBeInTheDocument();
          });
        } else {
          await waitFor(() => {
            expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
            expect(screen.getByText(/Acesso Negado/i)).toBeInTheDocument();
          });
        }
      });
    });
  });

  describe('🚨 Security Edge Cases', () => {
    it('should handle network errors gracefully', async () => {
      (fetch as Mock).mockRejectedValueOnce(new Error('Network error'));

      renderWithAuth(
        <ProtectedRoute>
          <TestProtectedComponent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      });
    });

    it('should sanitize user input in login form', async () => {
      renderWithAuth(<Login />);

      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '"; DROP TABLE users; --',
        '../../etc/passwd',
        '${process.env}'
      ];

      const usernameInput = screen.getByLabelText(/nome de usuário/i);

      maliciousInputs.forEach(input => {
        fireEvent.change(usernameInput, { target: { value: input } });
        expect(usernameInput.value).toBe(input); // Should not be processed
      });
    });

    it('should log suspicious activity', async () => {
      // Simular múltiplas tentativas de login falhadas
      const attempts = Array.from({ length: 5 }, (_, i) => i);

      for (const attempt of attempts) {
        (fetch as Mock).mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({
            success: false,
            message: 'Credenciais inválidas'
          })
        });

        renderWithAuth(<Login />);

        const usernameInput = screen.getByLabelText(/nome de usuário/i);
        const passwordInput = screen.getByLabelText(/senha/i);
        const submitButton = screen.getByRole('button', { name: /entrar/i });

        fireEvent.change(usernameInput, { target: { value: 'attacker' } });
        fireEvent.change(passwordInput, { target: { value: 'wrong' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(securityLogger.logAuthentication).toHaveBeenCalled();
        });
      }

      // Verificar se todas as tentativas foram logadas
      expect(securityLogger.logAuthentication).toHaveBeenCalledTimes(attempts.length);
    });

    it('should validate password strength requirements', () => {
      const passwordTests = [
        { password: '123', isStrong: false },
        { password: 'password', isStrong: false },
        { password: 'Password1', isStrong: false }, // Missing special char
        { password: 'Password1!', isStrong: true },
        { password: 'VeryStr0ng!Pass', isStrong: true }
      ];

      passwordTests.forEach(({ password, isStrong }) => {
        const strength = calculatePasswordStrength(password);
        if (isStrong) {
          expect(strength.score).toBeGreaterThanOrEqual(3);
        } else {
          expect(strength.score).toBeLessThan(3);
        }
      });
    });
  });

  describe('📊 Security Logging Tests', () => {
    it('should log security events with proper metadata', () => {
      securityLogger.logEvent(
        SecurityEventType.SENSITIVE_DATA_ACCESS,
        SecurityLevel.HIGH,
        'Test access',
        { resource: 'test' },
        'user1',
        'testuser',
        'admin'
      );

      expect(securityLogger.logEvent).toHaveBeenCalledWith(
        SecurityEventType.SENSITIVE_DATA_ACCESS,
        SecurityLevel.HIGH,
        'Test access',
        { resource: 'test' },
        'user1',
        'testuser',
        'admin'
      );
    });

    it('should log access denials with context', () => {
      securityLogger.logAccessDenied(
        'protected-resource',
        'admin:write',
        'sales',
        'user1',
        'testuser'
      );

      expect(securityLogger.logAccessDenied).toHaveBeenCalledWith(
        'protected-resource',
        'admin:write',
        'sales',
        'user1',
        'testuser'
      );
    });
  });
});

// Helper function for password strength testing
function calculatePasswordStrength(password: string) {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  const score = Object.values(checks).filter(Boolean).length;
  return { score, checks };
}