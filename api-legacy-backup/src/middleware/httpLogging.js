/**
 * Advanced HTTP Logging Middleware
 * Logs all incoming requests and outgoing responses with detailed information
 */

const logger = require('../utils/logger');

/**
 * Request logging middleware
 * Captures and logs all incoming HTTP requests
 */
function requestLoggingMiddleware(req, res, next) {
  const startTime = Date.now();
  
  // Store original res.json and res.send methods
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  
  // Log incoming request
  logIncomingRequest(req);
  
  // Override res.json to capture response
  res.json = function(data) {
    const duration = Date.now() - startTime;
    logOutgoingResponse(req, res, data, duration);
    return originalJson(data);
  };
  
  // Override res.send to capture response
  res.send = function(data) {
    const duration = Date.now() - startTime;
    if (!res.get('Content-Type')?.includes('json')) {
      logOutgoingResponse(req, res, data, duration);
    }
    return originalSend(data);
  };
  
  // Handle errors
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      const duration = Date.now() - startTime;
      logResponseError(req, res, duration);
    }
  });
  
  next();
}

/**
 * Log incoming HTTP request with all details
 */
function logIncomingRequest(req) {
  const method = req.method;
  const url = req.originalUrl || req.url;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent') || 'Unknown';
  
  const requestInfo = {
    method,
    url,
    ip,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    body: req.body && Object.keys(req.body).length > 0 ? sanitizeBody(req.body) : undefined,
    headers: sanitizeHeaders(req.headers),
  };
  
  // Log to logger
  logger.http(`📥 ${method.toUpperCase()} ${url}`, requestInfo);
}

/**
 * Log outgoing HTTP response
 */
function logOutgoingResponse(req, res, data, duration) {
  const method = req.method;
  const url = req.originalUrl || req.url;
  const status = res.statusCode;
  const statusText = getStatusText(status);
  
  const responseInfo = {
    method,
    url,
    status,
    statusText,
    duration: `${duration}ms`,
    contentType: res.get('Content-Type'),
    contentLength: res.get('Content-Length'),
  };
  
  // Add response data if it's not too large
  if (data && typeof data === 'object' && Object.keys(data).length > 0) {
    const dataStr = JSON.stringify(data);
    if (dataStr.length < 1000) {
      responseInfo.responseData = data;
    } else {
      responseInfo.responseDataSize = dataStr.length + ' bytes';
    }
  }
  
  const logLevel = status < 300 ? 'http' : status < 400 ? 'warn' : 'error';
  logger[logLevel](`📤 ${method.toUpperCase()} ${url} - ${status} ${statusText} (${duration}ms)`, responseInfo);
}

/**
 * Log response errors
 */
function logResponseError(req, res, duration) {
  const method = req.method;
  const url = req.originalUrl || req.url;
  const status = res.statusCode;
  
  logger.error(`❌ ${method.toUpperCase()} ${url} - ${status} Error`, {
    method,
    url,
    status,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Sanitize request body to remove sensitive information
 */
function sanitizeBody(body) {
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization'];
  const sanitized = { ...body };
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  });
  
  return sanitized;
}

/**
 * Sanitize headers to remove sensitive information
 */
function sanitizeHeaders(headers) {
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
  const sanitized = { ...headers };
  
  sensitiveHeaders.forEach(header => {
    if (sanitized[header]) {
      sanitized[header] = '***REDACTED***';
    }
  });
  
  return sanitized;
}

/**
 * Get HTTP status text
 */
function getStatusText(status) {
  const statusMap = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    301: 'Moved Permanently',
    302: 'Found',
    304: 'Not Modified',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
  };
  
  return statusMap[status] || 'Unknown';
}

/**
 * Error logging middleware
 * Captures and logs all unhandled errors
 */
function errorLoggingMiddleware(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const method = req.method;
  const url = req.originalUrl || req.url;
  
  const errorInfo = {
    method,
    url,
    status,
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
  };
  
  // Log the error
  logger.error(`🔥 Error handling ${method} ${url}`, errorInfo);
  
  // Send error response
  res.status(status).json({
    success: false,
    error: {
      status,
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}

/**
 * Database operation logging
 * Call this when performing database operations
 */
function logDatabaseOperation(operation, table, duration, affectedRows = 0, error = null) {
  const operationInfo = {
    operation,
    table,
    duration: `${duration}ms`,
    affectedRows,
  };
  
  if (error) {
    logger.error(`Database Error: ${operation} on ${table}`, {
      ...operationInfo,
      error: error.message,
    });
  } else {
    logger.debug(`Database: ${operation} on ${table} completed in ${duration}ms`, operationInfo);
  }
}

module.exports = {
  requestLoggingMiddleware,
  errorLoggingMiddleware,
  logDatabaseOperation,
  logIncomingRequest,
  logOutgoingResponse,
  getStatusText,
};
