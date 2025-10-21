/**
 * Service Logger Utilities
 * Helpers for logging database operations and service actions
 */

const logger = require('./logger');

class ServiceLogger {
  /**
   * Log database query execution
   */
  static logQuery(query, params = null, executionTime = null) {
    const logData = { query };
    if (params) {
      logData.params = this.sanitizeParams(params);
    }
    if (executionTime) {
      logData.executionTime = `${executionTime}ms`;
    }
    
    logger.debug('Database Query', logData);
  }

  /**
   * Log database operation with results
   */
  static logOperation(operation, table, rows = null, executionTime = null, error = null) {
    const logData = {
      operation,
      table,
    };
    
    if (rows !== null) {
      logData.affectedRows = rows;
    }
    
    if (executionTime) {
      logData.executionTime = `${executionTime}ms`;
    }
    
    if (error) {
      logData.error = error.message;
      logger.error(`Database Operation Failed: ${operation} on ${table}`, logData);
    } else {
      logger.debug(`Database Operation: ${operation} on ${table}`, logData);
    }
  }

  /**
   * Log service action
   */
  static logAction(service, action, details = null, duration = null) {
    const logData = {
      service,
      action,
    };
    
    if (details) {
      logData.details = details;
    }
    
    if (duration) {
      logData.duration = `${duration}ms`;
    }
    
    logger.info(`${service}: ${action}`, logData);
  }

  /**
   * Log authentication event
   */
  static logAuthEvent(event, email, success = true, details = null) {
    const logData = {
      event,
      email,
      success,
    };
    
    if (details) {
      logData.details = details;
    }
    
    const level = success ? 'info' : 'warn';
    logger[level](`Auth Event: ${event} for ${email}`, logData);
  }

  /**
   * Log permission check
   */
  static logPermissionCheck(userId, resource, action, allowed = true, reason = null) {
    const logData = {
      userId,
      resource,
      action,
      allowed,
    };
    
    if (reason) {
      logData.reason = reason;
    }
    
    const level = allowed ? 'debug' : 'warn';
    logger[level](`Permission Check: User ${userId} ${allowed ? 'allowed' : 'denied'} ${action} on ${resource}`, logData);
  }

  /**
   * Log role change
   */
  static logRoleChange(userId, previousRole, newRole, changedBy = null) {
    const logData = {
      userId,
      previousRole,
      newRole,
    };
    
    if (changedBy) {
      logData.changedBy = changedBy;
    }
    
    logger.info(`Role Changed: User ${userId} role changed from ${previousRole} to ${newRole}`, logData);
  }

  /**
   * Log tenant operation
   */
  static logTenantOperation(operation, tenantId, details = null) {
    const logData = {
      operation,
      tenantId,
    };
    
    if (details) {
      logData.details = details;
    }
    
    logger.info(`Tenant Operation: ${operation} on tenant ${tenantId}`, logData);
  }

  /**
   * Log performance issue
   */
  static logPerformanceIssue(operation, duration, threshold = 1000) {
    if (duration > threshold) {
      logger.warn(`Slow Operation: ${operation} took ${duration}ms (threshold: ${threshold}ms)`, {
        operation,
        duration,
        threshold,
      });
    }
  }

  /**
   * Sanitize parameters for logging (remove sensitive info)
   */
  static sanitizeParams(params) {
    if (!params) return params;
    
    const sensitiveFields = [
      'password',
      'passwordHash',
      'token',
      'refreshToken',
      'secret',
      'apiKey',
      'creditCard',
      'ssn',
    ];
    
    const sanitized = Array.isArray(params) ? [...params] : { ...params };
    
    if (Array.isArray(sanitized)) {
      return sanitized.map(param => {
        if (typeof param === 'object' && param !== null) {
          return this.sanitizeObject(param, sensitiveFields);
        }
        return param;
      });
    } else {
      return this.sanitizeObject(sanitized, sensitiveFields);
    }
  }

  /**
   * Helper to sanitize object
   */
  static sanitizeObject(obj, sensitiveFields) {
    const result = { ...obj };
    
    sensitiveFields.forEach(field => {
      if (field in result && result[field]) {
        result[field] = '***REDACTED***';
      }
    });
    
    return result;
  }

  /**
   * Start operation timer
   */
  static startTimer() {
    return Date.now();
  }

  /**
   * End operation timer and get duration
   */
  static endTimer(startTime) {
    return Date.now() - startTime;
  }
}

module.exports = ServiceLogger;
