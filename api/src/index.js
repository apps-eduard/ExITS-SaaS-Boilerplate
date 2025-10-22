/**
 * Express Server Setup
 * Main application entry point
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const logger = require('./utils/logger');
const CONSTANTS = require('./config/constants');
const db = require('./config/database');
const errorHandlerMiddleware = require('./middleware/errorHandler');
const { requestLogger, errorLogger, logStartupBanner } = require('./middleware/httpLogger');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const roleRoutes = require('./routes/roleRoutes');
const permissionRoutes = require('./routes/permissionRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const moduleRoutes = require('./routes/moduleRoutes');
const rbacRoutes = require('./routes/rbacRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Attach database to app locals
app.locals.db = db;

// ==================== MIDDLEWARE ====================

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:3000', 'http://127.0.0.1:4200'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Beautiful HTTP logging
app.use(requestLogger);

// ==================== ROUTES ====================

// Health check
app.get('/health', (req, res) => {
  res.status(CONSTANTS.HTTP_STATUS.OK).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API version
app.get('/api/version', (req, res) => {
  res.status(CONSTANTS.HTTP_STATUS.OK).json({
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Route mounting
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/rbac', rbacRoutes);

// ==================== 404 HANDLER ====================

app.use((req, res) => {
  res.status(CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
  });
});

// ==================== ERROR HANDLER ====================

app.use(errorLogger);
app.use(errorHandlerMiddleware);

// ==================== SERVER START ====================

const server = app.listen(PORT, () => {
  logStartupBanner(PORT, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
  });
});

// ==================== GRACEFUL SHUTDOWN ====================

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// ==================== UNHANDLED REJECTIONS ====================

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = app;
