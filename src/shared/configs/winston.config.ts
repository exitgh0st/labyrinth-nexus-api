import * as winston from 'winston';
import * as path from 'path';

const logDir = 'logs';

export const winstonConfig = {
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, context }) => {
          return `${timestamp} [${context}] ${level}: ${message}`;
        })
      ),
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logDir, 'application.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    // File transport for errors only
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    // File transport for HTTP logs
    new winston.transports.File({
      filename: path.join(logDir, 'http.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ],
};