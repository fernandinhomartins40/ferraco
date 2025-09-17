import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from './useAuth';

interface UseInactivityTimerOptions {
  timeout?: number; // Timeout in milliseconds
  warningTime?: number; // Warning time before logout in milliseconds
  onWarning?: () => void;
  onTimeout?: () => void;
  enabled?: boolean;
}

interface InactivityState {
  isWarning: boolean;
  timeRemaining: number;
  isActive: boolean;
}

/**
 * Hook for managing user inactivity and auto-logout
 */
export const useInactivityTimer = (options: UseInactivityTimerOptions = {}) => {
  const {
    timeout = 30 * 60 * 1000, // 30 minutes default
    warningTime = 5 * 60 * 1000, // 5 minutes warning
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

  // Events that indicate user activity
  const activityEvents = [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click',
    'focus'
  ];

  // Reset the timer
  const resetTimer = useCallback(() => {
    if (!enabled || !isAuthenticated) return;

    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Update last activity
    lastActivityRef.current = Date.now();

    // Reset state
    setState({
      isWarning: false,
      timeRemaining: timeout,
      isActive: true
    });

    // Set warning timer
    warningTimeoutRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, isWarning: true }));
      onWarning?.();

      // Start countdown
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

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      handleTimeout();
    }, timeout);
  }, [enabled, isAuthenticated, timeout, warningTime, onWarning]);

  // Handle timeout (logout)
  const handleTimeout = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    setState({
      isWarning: false,
      timeRemaining: 0,
      isActive: false
    });

    onTimeout?.();
    logout();
  }, [onTimeout, logout]);

  // Handle user activity
  const handleActivity = useCallback(() => {
    if (!enabled || !isAuthenticated) return;

    // Only reset if warning is showing or if significant time has passed
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;

    if (state.isWarning || timeSinceLastActivity > 60000) { // Reset if warning or 1 minute passed
      resetTimer();
    } else {
      // Just update last activity without full reset
      lastActivityRef.current = now;
    }
  }, [enabled, isAuthenticated, state.isWarning, resetTimer]);

  // Extend session (manual reset)
  const extendSession = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  // Start/stop timer based on authentication
  useEffect(() => {
    if (enabled && isAuthenticated) {
      resetTimer();
    } else {
      // Clear all timers if not authenticated or disabled
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);

      setState({
        isWarning: false,
        timeRemaining: timeout,
        isActive: false
      });
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, isAuthenticated, resetTimer, timeout]);

  // Add activity listeners
  useEffect(() => {
    if (!enabled || !isAuthenticated) return;

    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [enabled, isAuthenticated, handleActivity]);

  // Format time remaining
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
    // Configuration info
    config: {
      timeout: timeout / 1000 / 60, // in minutes
      warningTime: warningTime / 1000 / 60, // in minutes
      enabled
    }
  };
};

/**
 * Hook for inactivity timer with default settings
 */
export const useDefaultInactivityTimer = () => {
  const [showWarning, setShowWarning] = useState(false);

  return useInactivityTimer({
    timeout: 30 * 60 * 1000, // 30 minutes
    warningTime: 5 * 60 * 1000, // 5 minutes warning
    onWarning: () => setShowWarning(true),
    onTimeout: () => {
      setShowWarning(false);
      console.log('🔒 Usuário deslogado por inatividade');
    },
    enabled: true
  });
};

export default useInactivityTimer;