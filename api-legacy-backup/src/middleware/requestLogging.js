/**
 * Request Logging Middleware
 * Logs all incoming requests and generates request IDs
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const requestLoggingMiddleware = (req, res, next) => {
  // Generate request ID
  const requestId = req.headers['x-request-id'] || uuidv4();
  req.requestId = requestId;
  req.startTime = Date.now();

  // Log request
  logger.http(
    `${req.method} ${req.path} - Request ID: ${requestId}`,
    {
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      userId: req.user?.id,
      tenantId: req.user?.tenantId,
    }
  );

  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    res.send = originalSend;

    const duration = Date.now() - req.startTime;

    // Log response
    logger.http(
      `${req.method} ${req.path} - ${res.statusCode} (${duration}ms) - Request ID: ${requestId}`,
      {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        requestId,
      }
    );

    // Add request ID to response headers
    res.set('X-Request-ID', requestId);

    return res.send(data);
  };

  next();
};

module.exports = requestLoggingMiddleware;
