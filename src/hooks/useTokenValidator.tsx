import { useEffect, useCallback, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';

interface TokenValidationResult {
  isValid: boolean;
  isExpired: boolean;
  timeUntilExpiration: number;
  shouldRefresh: boolean;
}

interface UseTokenValidatorOptions {
  validateInterval?: number; // Interval in ms to validate token
  refreshThreshold?: number; // Time in ms before expiration to refresh
  onTokenExpired?: () => void;
  onTokenInvalid?: () => void;
  onRefreshNeeded?: () => void;
  enabled?: boolean;
}

/**
 * Hook for real-time token validation and management
 */
export const useTokenValidator = (options: UseTokenValidatorOptions = {}) => {
  const {
    validateInterval = 60000, // 1 minute default
    refreshThreshold = 5 * 60 * 1000, // 5 minutes default
    onTokenExpired,
    onTokenInvalid,
    onRefreshNeeded,
    enabled = true
  } = options;

  const { token, isAuthenticated, logout, refreshToken } = useAuth();
  const [validationResult, setValidationResult] = useState<TokenValidationResult>({
    isValid: false,
    isExpired: false,
    timeUntilExpiration: 0,
    shouldRefresh: false
  });

  const intervalRef = useRef<NodeJS.Timeout>();
  const lastValidationRef = useRef<number>(0);

  // Validate token structure and expiration
  const validateToken = useCallback((tokenToValidate?: string): TokenValidationResult => {
    const currentToken = tokenToValidate || token;

    if (!currentToken || !isAuthenticated) {
      return {
        isValid: false,
        isExpired: true,
        timeUntilExpiration: 0,
        shouldRefresh: false
      };
    }

    try {
      // Decode JWT token
      const parts = currentToken.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Date.now();
      const expirationTime = payload.exp * 1000;
      const timeUntilExpiration = expirationTime - currentTime;

      const isExpired = timeUntilExpiration <= 0;
      const shouldRefresh = timeUntilExpiration <= refreshThreshold && timeUntilExpiration > 0;

      return {
        isValid: !isExpired,
        isExpired,
        timeUntilExpiration: Math.max(0, timeUntilExpiration),
        shouldRefresh
      };
    } catch (error) {
      logger.error('Token validation error:', error);
      return {
        isValid: false,
        isExpired: true,
        timeUntilExpiration: 0,
        shouldRefresh: false
      };
    }
  }, [token, isAuthenticated, refreshThreshold]);

  // Perform validation and update state
  const performValidation = useCallback(() => {
    if (!enabled || !token) return;

    const result = validateToken();
    setValidationResult(result);
    lastValidationRef.current = Date.now();

    // Handle validation results
    if (result.isExpired) {
      logger.warn('🔒 Token expirado detectado');
      onTokenExpired?.();
      logout();
    } else if (!result.isValid) {
      logger.warn('⚠️ Token inválido detectado');
      onTokenInvalid?.();
      logout();
    } else if (result.shouldRefresh) {
      logger.debug('🔄 Token precisa ser renovado');
      onRefreshNeeded?.();

      // Auto-refresh token if possible
      refreshToken().catch(error => {
        logger.error('Falha ao renovar token automaticamente:', error);
      });
    }
  }, [enabled, token, validateToken, onTokenExpired, onTokenInvalid, onRefreshNeeded, logout, refreshToken]);

  // Start/stop validation interval
  useEffect(() => {
    if (!enabled || !isAuthenticated || !token) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      return;
    }

    // Perform initial validation
    performValidation();

    // Set up interval for periodic validation
    intervalRef.current = setInterval(performValidation, validateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    };
  }, [enabled, isAuthenticated, token, validateInterval, performValidation]);

  // Validate before critical operations
  const validateBeforeAction = useCallback(async (): Promise<boolean> => {
    if (!enabled || !token) return false;

    const result = validateToken();

    if (result.isExpired || !result.isValid) {
      logout();
      return false;
    }

    if (result.shouldRefresh) {
      try {
        await refreshToken();
        return true;
      } catch (error) {
        logger.error('Failed to refresh token before action:', error);
        logout();
        return false;
      }
    }

    return true;
  }, [enabled, token, validateToken, logout, refreshToken]);

  // Manual validation trigger
  const validateNow = useCallback(() => {
    performValidation();
    return validationResult;
  }, [performValidation, validationResult]);

  // Format time until expiration
  const formatTimeUntilExpiration = useCallback(() => {
    if (!validationResult.timeUntilExpiration) return '0m';

    const minutes = Math.floor(validationResult.timeUntilExpiration / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else {
      return `${minutes}m`;
    }
  }, [validationResult.timeUntilExpiration]);

  return {
    validationResult,
    validateBeforeAction,
    validateNow,
    formatTimeUntilExpiration: formatTimeUntilExpiration(),
    isValidating: enabled && isAuthenticated,
    lastValidation: lastValidationRef.current,
    // Convenience getters
    isValid: validationResult.isValid,
    isExpired: validationResult.isExpired,
    shouldRefresh: validationResult.shouldRefresh,
    timeUntilExpiration: validationResult.timeUntilExpiration
  };
};

/**
 * Higher-order function to wrap async functions with token validation
 */
export const withTokenValidation = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  validator: () => Promise<boolean>
) => {
  return async (...args: T): Promise<R> => {
    const isValid = await validator();
    if (!isValid) {
      throw new Error('Token validation failed. Please login again.');
    }
    return fn(...args);
  };
};

/**
 * React component wrapper that validates token before rendering
 */
interface TokenValidatedComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  validateOnMount?: boolean;
}

export const TokenValidatedComponent: React.FC<TokenValidatedComponentProps> = ({
  children,
  fallback = null,
  validateOnMount = true
}) => {
  const [isValid, setIsValid] = useState(!validateOnMount);
  const { validateBeforeAction } = useTokenValidator();

  useEffect(() => {
    if (validateOnMount) {
      validateBeforeAction().then(setIsValid);
    }
  }, [validateOnMount, validateBeforeAction]);

  if (!isValid) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default useTokenValidator;