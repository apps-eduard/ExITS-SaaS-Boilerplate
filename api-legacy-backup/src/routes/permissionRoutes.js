/**
 * Permission Routes
 */

const express = require('express');
const PermissionController = require('../controllers/PermissionController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All permission routes require authentication
router.use(authMiddleware);

// Check permission
router.get('/check', PermissionController.checkPermission);

// Check permission with constraints
router.post('/check-constraints', PermissionController.checkPermissionWithConstraints);

// Get my permissions
router.get('/my-permissions', PermissionController.getMyPermissions);

// Permission delegation
router.post('/delegate', PermissionController.delegatePermission);
router.delete('/delegations/:delegationId', PermissionController.revokeDelegation);
router.get('/delegations', PermissionController.getDelegatedPermissions);

module.exports = router;
