/**
 * Audit Log Routes
 */

const express = require('express');
const AuditLogController = require('../controllers/AuditLogController');
const authMiddleware = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');
const tenantIsolationMiddleware = require('../middleware/tenantIsolation');

const router = express.Router();

// All audit log routes require authentication and tenant isolation
router.use(authMiddleware, tenantIsolationMiddleware, rbacMiddleware(['audit-logs'], ['view']));

// Get audit logs
router.get('/', AuditLogController.getAuditLogs);

// Get specific audit log
router.get('/:id', AuditLogController.getAuditLogById);

// Get user audit history
router.get('/user/:userId/history', AuditLogController.getUserAuditHistory);

// Export audit logs
router.get('/export', AuditLogController.exportAuditLogs);

// Get statistics
router.get('/stats', AuditLogController.getAuditStats);

// Get suspicious activities
router.get('/suspicious', AuditLogController.getSuspiciousActivities);

module.exports = router;
