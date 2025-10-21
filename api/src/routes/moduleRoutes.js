/**
 * Module Routes
 */

const express = require('express');
const ModuleController = require('../controllers/ModuleController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All module routes require authentication
router.use(authMiddleware);

// Get all modules
router.get('/', ModuleController.listModules);

// Get module by key
router.get('/:menuKey', ModuleController.getModule);

// Get module permissions
router.get('/:menuKey/permissions', ModuleController.getModulePermissions);

// Create module (system admin only)
router.post('/', ModuleController.createModule);

module.exports = router;
