type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogConfig {
  level: LogLevel;
  enabledInProduction: boolean;
}

class Logger {
  private config: LogConfig = {
    level: 'debug',
    enabledInProduction: false,
  };

  private shouldLog(level: LogLevel): boolean {
    const isDev = import.meta.env.DEV;
    const isProd = import.meta.env.PROD;

    if (isProd && !this.config.enabledInProduction) {
      return level === 'error'; // Apenas errors em produção
    }

    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex >= currentLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string, ...args: unknown[]): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (level === 'error') {
      console.error(prefix, message, ...args);
    } else if (level === 'warn') {
      console.warn(prefix, message, ...args);
    } else if (level === 'info') {
      console.info(prefix, message, ...args);
    } else {
      console.log(prefix, message, ...args);
    }
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      this.formatMessage('debug', message, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      this.formatMessage('info', message, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      this.formatMessage('warn', message, ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      this.formatMessage('error', message, ...args);
    }
  }

  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  enableInProduction(enable: boolean): void {
    this.config.enabledInProduction = enable;
  }
}

export const logger = new Logger();
export default logger;
