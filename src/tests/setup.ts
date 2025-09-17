/**
 * Setup global para testes Vitest
 * Configurações e mocks necessários para todos os testes
 */

import '@testing-library/jest-dom';
import { expect, beforeAll, vi } from 'vitest';

// Mock global do localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock global do sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock global do fetch
global.fetch = vi.fn();

// Mock do location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    reload: vi.fn(),
    replace: vi.fn(),
  },
  writable: true,
});

// Mock do navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    language: 'pt-BR',
    languages: ['pt-BR', 'pt', 'en'],
  },
  writable: true,
});

// Mock de console para testes silenciosos
const consoleMock = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};

// Configurar mocks globais antes de todos os testes
beforeAll(() => {
  // Limpar todos os mocks
  vi.clearAllMocks();

  // Configurar console mock para testes silenciosos
  Object.assign(console, consoleMock);

  // Mock de Date para testes consistentes
  const mockDate = new Date('2024-01-01T12:00:00.000Z');
  vi.setSystemTime(mockDate);
});

// Extend expect com matchers customizados se necessário
expect.extend({
  toBeValidJWT(received: string) {
    const parts = received.split('.');
    const isValid = parts.length === 3 &&
                   parts.every(part => part.length > 0);

    return {
      message: () => `expected ${received} to be a valid JWT token`,
      pass: isValid,
    };
  },
});

// Export para uso em outros arquivos de teste
export {
  localStorageMock,
  sessionStorageMock,
  consoleMock,
};