/**
 * HTTP Request/Response Logger Middleware
 * Beautiful, human-readable logging for all HTTP requests
 */

const logger = require('../utils/logger');
const chalk = require('chalk');

/**
 * Format request body with sensitive data redaction
 */
const formatBody = (body) => {
  if (!body || Object.keys(body).length === 0) return null;
  
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***';
    }
  });
  
  return sanitized;
};

/**
 * Beautiful request logger middleware
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Build request info
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress;
  
  // Log incoming request with emoji and colors
  const methodColor = {
    GET: chalk.green.bold,
    POST: chalk.blue.bold,
    PUT: chalk.yellow.bold,
    PATCH: chalk.cyan.bold,
    DELETE: chalk.red.bold,
  }[method] || chalk.white.bold;

  console.log('\n' + chalk.gray('━'.repeat(80)));
  console.log(`📥 ${methodColor(method.padEnd(7))} ${chalk.underline(url)}`);
  console.log(chalk.dim(`   From: ${ip}`));
  
  // Log body if present
  if (req.body && Object.keys(req.body).length > 0) {
    const body = formatBody(req.body);
    const bodyStr = JSON.stringify(body, null, 2);
    console.log(chalk.dim('   Body:'), chalk.cyan(bodyStr.split('\n').map((line, i) => i === 0 ? line : '         ' + line).join('\n')));
  }

  // Capture response
  const originalSend = res.send;
  const originalJson = res.json;
  
  const logResponse = function (data) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    // Status color coding
    const statusColor = statusCode >= 500 ? chalk.red.bold :
                       statusCode >= 400 ? chalk.yellow.bold :
                       statusCode >= 300 ? chalk.cyan.bold :
                       chalk.green.bold;

    const emoji = statusCode >= 500 ? '❌' :
                 statusCode >= 400 ? '⚠️' :
                 statusCode >= 300 ? '🔄' :
                 '✅';

    console.log(`${emoji} ${statusColor(statusCode)} ${chalk.dim(`in ${duration}ms`)}`);
    console.log(chalk.gray('━'.repeat(80)) + '\n');
    
    // Log to file
    logger.http(`${method} ${url} ${statusCode} (${duration}ms)`, {
      method,
      url,
      status: statusCode,
      duration: `${duration}ms`,
      ip,
    });
  };

  res.send = function (data) {
    logResponse(data);
    return originalSend.call(this, data);
  };

  res.json = function (data) {
    logResponse(data);
    return originalJson.call(this, data);
  };

  next();
};

/**
 * Error logger middleware
 */
const errorLogger = (err, req, res, next) => {
  console.log('\n' + chalk.red('━'.repeat(80)));
  console.log(chalk.red.bold('💥 ERROR'));
  console.log(chalk.red(`   ${req.method} ${req.originalUrl}`));
  console.log(chalk.red(`   ${err.message}`));
  
  if (process.env.NODE_ENV === 'development') {
    console.log(chalk.dim('\n   Stack Trace:'));
    console.log(chalk.dim('   ' + err.stack.split('\n').slice(1, 4).join('\n   ')));
  }
  
  console.log(chalk.red('━'.repeat(80)) + '\n');
  
  // Log to file
  logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, {
    method: req.method,
    url: req.originalUrl,
    error: err.message,
    stack: err.stack,
  });

  next(err);
};

/**
 * Startup banner
 */
const logStartupBanner = (port, dbConfig) => {
  console.log('\n' + chalk.cyan('═'.repeat(80)));
  console.log(chalk.cyan.bold('                       🚀 ExITS SaaS API Server 🚀                        '));
  console.log(chalk.cyan('═'.repeat(80)));
  console.log('');
  console.log(chalk.green('  ✅ Status:          ') + chalk.white.bold('RUNNING'));
  console.log(chalk.cyan('  🌐 Port:            ') + chalk.white.bold(`http://localhost:${port}`));
  console.log(chalk.blue('  📝 Environment:     ') + chalk.white.bold(process.env.NODE_ENV || 'development'));
  console.log(chalk.magenta('  🗄️  Database:       ') + chalk.white.bold(`${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`));
  console.log(chalk.yellow('  💡 Health Check:    ') + chalk.white.bold(`http://localhost:${port}/health`));
  console.log('');
  console.log(chalk.cyan('═'.repeat(80)));
  console.log(chalk.dim('  Ready to handle requests... Press Ctrl+C to stop'));
  console.log(chalk.cyan('═'.repeat(80)) + '\n');
};

module.exports = {
  requestLogger,
  errorLogger,
  logStartupBanner,
};
