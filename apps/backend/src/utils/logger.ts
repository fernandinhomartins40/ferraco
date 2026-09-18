import winston from 'winston';
import path from 'path';
import { NODE_ENV } from '../config/constants';

const logLevel = process.env.LOG_LEVEL || 'info';

// T-09 (F-56): o destino era relativo ('logs/error.log'), resolvido contra o
// CWD do processo — /app/backend em produção. O volume Docker monta /app/logs,
// então os arquivos caíam FORA do volume e sumiam a cada recreate, deixando o
// volume vazio. Caminho absoluto, configurável para desenvolvimento.
const LOG_DIR = process.env.LOG_DIR || (NODE_ENV === 'production'
  ? '/app/logs'
  : path.join(__dirname, '../../logs'));

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }

    return msg;
  })
);

export const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  defaultMeta: { service: 'ferraco-backend' },
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});

// Add file transport in production
if (NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  logger.add(
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

export default logger;
