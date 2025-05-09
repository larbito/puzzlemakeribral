import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: 'error.log', 
      level: 'error',
      dirname: 'logs'
    }),
    new winston.transports.File({ 
      filename: 'combined.log',
      dirname: 'logs'
    })
  ]
});

// Create logs directory if it doesn't exist
import { mkdir } from 'fs/promises';
try {
  await mkdir('logs', { recursive: true });
} catch (error) {
  console.error('Failed to create logs directory:', error);
}

export default logger; 