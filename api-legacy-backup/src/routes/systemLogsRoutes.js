const express = require('express');
const SystemLogsController = require('../controllers/SystemLogsController');
const authMiddleware = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Dashboard statistics
router.get(
  '/dashboard',
  rbacMiddleware(['activity-dashboard'], ['view']),
  SystemLogsController.getDashboard,
);

// System logs
router.get(
  '/system',
  rbacMiddleware(['system-logs'], ['view']),
  SystemLogsController.getSystemLogs,
);

// Audit logs
router.get(
  '/audit',
  rbacMiddleware(['audit-logs'], ['view']),
  SystemLogsController.getAuditLogs,
);

// Filter options
router.get(
  '/filters',
  rbacMiddleware(['system-logs'], ['view']),
  SystemLogsController.getFilterOptions,
);

module.exports = router;
