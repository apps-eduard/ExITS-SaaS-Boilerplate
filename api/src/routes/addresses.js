/**
 * Philippine Address Routes
 */

const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Get Philippine regions list
router.get('/regions', addressController.getRegions);

// CRUD operations
router.get('/', addressController.getAllAddresses);
router.get('/:id', addressController.getAddressById);
router.post('/', addressController.createAddress);
router.put('/:id', addressController.updateAddress);
router.delete('/:id', addressController.deleteAddress);

// Special operations
router.patch('/:id/set-primary', addressController.setPrimaryAddress);
router.patch('/:id/verify', addressController.verifyAddress);

module.exports = router;
