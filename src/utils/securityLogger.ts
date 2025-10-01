/**
 * Frontend Security Logging Service
 * Logs security-related events for monitoring and auditing
 */

import { logger } from '@/lib/logger';
export enum SecurityEventType {
  // Authentication Events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  SESSION_TIMEOUT = 'SESSION_TIMEOUT',

  // Authorization Events
  ACCESS_DENIED = 'ACCESS_DENIED',
  PERMISSION_VIOLATION = 'PERMISSION_VIOLATION',
  ROLE_ESCALATION_ATTEMPT = 'ROLE_ESCALATION_ATTEMPT',

  // Route Protection Events
  PROTECTED_ROUTE_ACCESS = 'PROTECTED_ROUTE_ACCESS',
  UNAUTHORIZED_ROUTE_ATTEMPT = 'UNAUTHORIZED_ROUTE_ATTEMPT',

  // User Activity Events
  USER_ACTION = 'USER_ACTION',
  SENSITIVE_DATA_ACCESS = 'SENSITIVE_DATA_ACCESS',
  ADMIN_ACTION = 'ADMIN_ACTION',

  // Security Events
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  MULTIPLE_FAILED_ATTEMPTS = 'MULTIPLE_FAILED_ATTEMPTS',
  INACTIVITY_WARNING = 'INACTIVITY_WARNING',

  // System Events
  PAGE_LOAD = 'PAGE_LOAD',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

export enum SecurityLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface SecurityLogEntry {
  id: string;
  timestamp: number;
  eventType: SecurityEventType;
  level: SecurityLevel;
  userId?: string;
  username?: string;
  userRole?: string;
  message: string;
  details?: Record<string, unknown>;
  userAgent: string;
  url: string;
  ipAddress?: string;
  sessionId?: string;
  source: 'frontend' | 'backend';
}

class SecurityLogger {
  private logs: SecurityLogEntry[] = [];
  private maxLogs = 1000; // Maximum number of logs to keep in memory
  private storageKey = 'ferraco_security_logs';
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadLogsFromStorage();
    this.setupGlobalErrorHandler();
    this.logEvent(SecurityEventType.PAGE_LOAD, SecurityLevel.LOW, 'Security logger initialized');
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadLogsFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.logs = JSON.parse(stored);
        // Keep only recent logs
        this.logs = this.logs.slice(-this.maxLogs);
      }
    } catch (error) {
      logger.error('Failed to load security logs from storage:', error);
    }
  }

  private saveLogsToStorage(): void {
    try {
      // Keep only the most recent logs
      const recentLogs = this.logs.slice(-this.maxLogs);
      localStorage.setItem(this.storageKey, JSON.stringify(recentLogs));
    } catch (error) {
      logger.error('Failed to save security logs to storage:', error);
    }
  }

  private setupGlobalErrorHandler(): void {
    window.addEventListener('error', (event) => {
      this.logEvent(
        SecurityEventType.ERROR_OCCURRED,
        SecurityLevel.MEDIUM,
        `JavaScript Error: ${event.message}`,
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        }
      );
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.logEvent(
        SecurityEventType.ERROR_OCCURRED,
        SecurityLevel.MEDIUM,
        `Unhandled Promise Rejection: ${event.reason}`,
        {
          reason: event.reason
        }
      );
    });
  }

  /**
   * Main logging method
   */
  logEvent(
    eventType: SecurityEventType,
    level: SecurityLevel,
    message: string,
    details?: Record<string, unknown>,
    userId?: string,
    username?: string,
    userRole?: string
  ): void {
    const logEntry: SecurityLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      eventType,
      level,
      userId,
      username,
      userRole,
      message,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.sessionId,
      source: 'frontend'
    };

    this.logs.push(logEntry);

    // Console logging based on level
    const logMethod = this.getConsoleMethod(level);
    const prefix = this.getLogPrefix(eventType, level);
    logMethod(`${prefix} ${message}`, details ? details : '');

    // Save to storage periodically
    if (this.logs.length % 10 === 0) {
      this.saveLogsToStorage();
    }

    // Send critical events to backend (if configured)
    if (level === SecurityLevel.CRITICAL) {
      this.sendToBackend(logEntry);
    }
  }

  private getConsoleMethod(level: SecurityLevel): (...args: unknown[]) => void {
    switch (level) {
      case SecurityLevel.CRITICAL:
        return logger.error.bind(logger);
      case SecurityLevel.HIGH:
        return logger.warn.bind(logger);
      case SecurityLevel.MEDIUM:
        return logger.info.bind(logger);
      case SecurityLevel.LOW:
      default:
        return logger.debug.bind(logger);
    }
  }

  private getLogPrefix(eventType: SecurityEventType, level: SecurityLevel): string {
    const levelEmoji = {
      [SecurityLevel.LOW]: '🔵',
      [SecurityLevel.MEDIUM]: '🟡',
      [SecurityLevel.HIGH]: '🟠',
      [SecurityLevel.CRITICAL]: '🔴'
    };

    return `${levelEmoji[level]} [SECURITY]`;
  }

  private async sendToBackend(logEntry: SecurityLogEntry): Promise<void> {
    try {
      // This would send to your backend API
      // await fetch('/api/security/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(logEntry)
      // });
      logger.debug('🚨 Critical security event (would be sent to backend):', logEntry);
    } catch (error) {
      logger.error('Failed to send security log to backend:', error);
    }
  }

  // Convenience methods for common security events

  logAuthentication(
    eventType: SecurityEventType.LOGIN_SUCCESS | SecurityEventType.LOGIN_FAILED | SecurityEventType.LOGOUT,
    userId?: string,
    username?: string,
    details?: Record<string, unknown>
  ): void {
    const level = eventType === SecurityEventType.LOGIN_FAILED ? SecurityLevel.MEDIUM : SecurityLevel.LOW;
    const messages = {
      [SecurityEventType.LOGIN_SUCCESS]: `Login successful for user: ${username || userId || 'unknown'}`,
      [SecurityEventType.LOGIN_FAILED]: `Login failed for user: ${username || userId || 'unknown'}`,
      [SecurityEventType.LOGOUT]: `User logged out: ${username || userId || 'unknown'}`
    };

    this.logEvent(eventType, level, messages[eventType], details, userId, username);
  }

  logAccessDenied(
    resource: string,
    requiredPermission?: string,
    userRole?: string,
    userId?: string,
    username?: string
  ): void {
    this.logEvent(
      SecurityEventType.ACCESS_DENIED,
      SecurityLevel.HIGH,
      `Access denied to resource: ${resource}`,
      {
        resource,
        requiredPermission,
        userRole,
        attemptedAction: 'access_resource'
      },
      userId,
      username,
      userRole
    );
  }

  logUserAction(
    action: string,
    resource: string,
    userId?: string,
    username?: string,
    userRole?: string,
    details?: Record<string, unknown>
  ): void {
    const level = this.getActionSecurityLevel(action, resource);

    this.logEvent(
      SecurityEventType.USER_ACTION,
      level,
      `User action: ${action} on ${resource}`,
      {
        action,
        resource,
        ...details
      },
      userId,
      username,
      userRole
    );
  }

  logSuspiciousActivity(
    description: string,
    userId?: string,
    username?: string,
    details?: Record<string, unknown>
  ): void {
    this.logEvent(
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      SecurityLevel.CRITICAL,
      `Suspicious activity detected: ${description}`,
      details,
      userId,
      username
    );
  }

  logRouteAccess(
    route: string,
    authorized: boolean,
    userId?: string,
    username?: string,
    userRole?: string
  ): void {
    const eventType = authorized
      ? SecurityEventType.PROTECTED_ROUTE_ACCESS
      : SecurityEventType.UNAUTHORIZED_ROUTE_ATTEMPT;

    const level = authorized ? SecurityLevel.LOW : SecurityLevel.HIGH;

    this.logEvent(
      eventType,
      level,
      `Route access ${authorized ? 'granted' : 'denied'}: ${route}`,
      { route, authorized },
      userId,
      username,
      userRole
    );
  }

  private getActionSecurityLevel(action: string, resource: string): SecurityLevel {
    const sensitiveActions = ['delete', 'update', 'create', 'admin', 'manage'];
    const sensitiveResources = ['users', 'roles', 'permissions', 'system'];

    const isSensitiveAction = sensitiveActions.some(a => action.toLowerCase().includes(a));
    const isSensitiveResource = sensitiveResources.some(r => resource.toLowerCase().includes(r));

    if (isSensitiveAction && isSensitiveResource) {
      return SecurityLevel.HIGH;
    } else if (isSensitiveAction || isSensitiveResource) {
      return SecurityLevel.MEDIUM;
    }

    return SecurityLevel.LOW;
  }

  // Query methods
  getLogs(filter?: {
    level?: SecurityLevel;
    eventType?: SecurityEventType;
    userId?: string;
    fromTime?: number;
    toTime?: number;
  }): SecurityLogEntry[] {
    let filteredLogs = [...this.logs];

    if (filter) {
      if (filter.level) {
        filteredLogs = filteredLogs.filter(log => log.level === filter.level);
      }
      if (filter.eventType) {
        filteredLogs = filteredLogs.filter(log => log.eventType === filter.eventType);
      }
      if (filter.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filter.userId);
      }
      if (filter.fromTime) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filter.fromTime!);
      }
      if (filter.toTime) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filter.toTime!);
      }
    }

    return filteredLogs.sort((a, b) => b.timestamp - a.timestamp);
  }

  getRecentLogs(count: number = 50): SecurityLogEntry[] {
    return this.logs
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count);
  }

  getSecuritySummary(timeRange: number = 24 * 60 * 60 * 1000): {
    totalEvents: number;
    criticalEvents: number;
    failedLogins: number;
    accessDenials: number;
    byLevel: Record<SecurityLevel, number>;
    byType: Record<string, number>;
  } {
    const fromTime = Date.now() - timeRange;
    const recentLogs = this.getLogs({ fromTime });

    const summary = {
      totalEvents: recentLogs.length,
      criticalEvents: 0,
      failedLogins: 0,
      accessDenials: 0,
      byLevel: {
        [SecurityLevel.LOW]: 0,
        [SecurityLevel.MEDIUM]: 0,
        [SecurityLevel.HIGH]: 0,
        [SecurityLevel.CRITICAL]: 0
      },
      byType: {} as Record<string, number>
    };

    recentLogs.forEach(log => {
      summary.byLevel[log.level]++;
      summary.byType[log.eventType] = (summary.byType[log.eventType] || 0) + 1;

      if (log.level === SecurityLevel.CRITICAL) {
        summary.criticalEvents++;
      }
      if (log.eventType === SecurityEventType.LOGIN_FAILED) {
        summary.failedLogins++;
      }
      if (log.eventType === SecurityEventType.ACCESS_DENIED) {
        summary.accessDenials++;
      }
    });

    return summary;
  }

  // Cleanup and export
  clearLogs(): void {
    this.logs = [];
    this.saveLogsToStorage();
    this.logEvent(SecurityEventType.USER_ACTION, SecurityLevel.MEDIUM, 'Security logs cleared');
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  destroy(): void {
    this.saveLogsToStorage();
  }
}

// Create singleton instance
export const securityLogger = new SecurityLogger();

// Hook for React components
export const useSecurityLogger = () => {
  return securityLogger;
};

export default securityLogger;