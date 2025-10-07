import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';

interface UseInactivityTimerOptions {
  timeout?: number;
  warningTime?: number;
  onWarning?: () => void;
  onTimeout?: () => void;
  enabled?: boolean;
}

interface InactivityState {
  isWarning: boolean;
  timeRemaining: number;
  isActive: boolean;
}

export const useInactivityTimer = (options: UseInactivityTimerOptions = {}) => {
  const {
    timeout = 30 * 60 * 1000,
    warningTime = 5 * 60 * 1000,
    onWarning,
    onTimeout,
    enabled = true
  } = options;

  const { isAuthenticated, logout } = useAuth();
  const [state, setState] = useState<InactivityState>({
    isWarning: false,
    timeRemaining: timeout,
    isActive: false
  });

  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningTimeoutRef = useRef<NodeJS.Timeout>();
  const intervalRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());
  
  const onWarningRef = useRef(onWarning);
  const onTimeoutRef = useRef(onTimeout);
  const logoutRef = useRef(logout);

  useEffect(() => {
    onWarningRef.current = onWarning;
    onTimeoutRef.current = onTimeout;
    logoutRef.current = logout;
  }, [onWarning, onTimeout, logout]);

  const activityEvents = [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click',
    'focus'
  ];

  const handleTimeout = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    setState({
      isWarning: false,
      timeRemaining: 0,
      isActive: false
    });

    onTimeoutRef.current?.();
    logoutRef.current();
  }, []);

  const resetTimer = useCallback(() => {
    if (!enabled || !isAuthenticated) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    lastActivityRef.current = Date.now();

    setState({
      isWarning: false,
      timeRemaining: timeout,
      isActive: true
    });

    warningTimeoutRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, isWarning: true }));
      onWarningRef.current?.();

      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = now - lastActivityRef.current;
        const remaining = timeout - elapsed;

        if (remaining <= 0) {
          clearInterval(intervalRef.current!);
          handleTimeout();
        } else {
          setState(prev => ({ ...prev, timeRemaining: remaining }));
        }
      }, 1000);
    }, timeout - warningTime);

    timeoutRef.current = setTimeout(() => {
      handleTimeout();
    }, timeout);
  }, [enabled, isAuthenticated, timeout, warningTime, handleTimeout]);

  const handleActivity = useCallback(() => {
    if (!enabled || !isAuthenticated) return;

    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;

    if (state.isWarning || timeSinceLastActivity > 60000) {
      resetTimer();
    } else {
      lastActivityRef.current = now;
    }
  }, [enabled, isAuthenticated, state.isWarning, resetTimer]);

  const extendSession = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    if (!enabled || !isAuthenticated) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);

      setState({
        isWarning: false,
        timeRemaining: timeout,
        isActive: false
      });
      return;
    }

    resetTimer();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, isAuthenticated, timeout]);

  useEffect(() => {
    if (!enabled || !isAuthenticated) return;

    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [enabled, isAuthenticated, handleActivity]);

  const formatTimeRemaining = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    ...state,
    formattedTimeRemaining: formatTimeRemaining(state.timeRemaining),
    extendSession,
    resetTimer,
    handleTimeout,
    config: {
      timeout: timeout / 1000 / 60,
      warningTime: warningTime / 1000 / 60,
      enabled
    }
  };
};

export const useDefaultInactivityTimer = () => {
  const [showWarning, setShowWarning] = useState(false);

  return useInactivityTimer({
    timeout: 30 * 60 * 1000,
    warningTime: 5 * 60 * 1000,
    onWarning: () => setShowWarning(true),
    onTimeout: () => {
      setShowWarning(false);
      logger.debug('🔒 Usuário deslogado por inatividade');
    },
    enabled: true
  });
};

export default useInactivityTimer;
