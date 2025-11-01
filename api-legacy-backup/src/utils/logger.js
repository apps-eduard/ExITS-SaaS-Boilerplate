// src/utils/logger.js
/**
 * Beautiful, human-readable logger with emojis and colors
 */
const winston = require('winston');
const chalk = require('chalk');
const config = require('../config/env');

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  success: 4,
  debug: 5,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'cyan',
  http: 'magenta',
  success: 'green',
  debug: 'gray',
};

winston.addColors(colors);

// Emoji icons for different log types
const icons = {
  error: '❌',
  warn: '⚠️',
  info: 'ℹ️',
  http: '🌐',
  success: '✅',
  debug: '🔍',
};

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...args } = info;
    const ts = timestamp.slice(0, 19).replace('T', ' ');
    const icon = icons[level.replace(/\x1B\[[0-9;]*m/g, '')] || '•';
    
    let logMessage = `${chalk.dim(ts)} ${icon}  ${message}`;
    
    if (Object.keys(args).length) {
      logMessage += '\n' + chalk.dim(JSON.stringify(args, null, 2));
    }
    
    return logMessage;
  })
);

const transports = [
  // Console output
  new winston.transports.Console(),
  // Error log file
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  }),
  // All logs file
  new winston.transports.File({
    filename: 'logs/all.log',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  }),
];

const logger = winston.createLogger({
  level: config.logging.level,
  levels,
  format,
  transports,
});

// Helper methods
logger.success = (message, meta = {}) => {
  logger.log('success', message, meta);
};

module.exports = logger;
