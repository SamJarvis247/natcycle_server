const express = require('express');
const router = express.Router();
const { isAuth, isAdmin } = require('../middleware/authMiddleware');
const {
  checkAdminRole,
  handleValidationErrors,
  locationCreationRateLimit
} = require('../middleware/simpleDropOffMiddleware');
const {
  validateCreateSimpleDropOffLocation,
  validateUpdateSimpleDropOffLocation,
  validateGetNearbyLocations,
  validatePagination,
  validateMongoId
} = require('../validation/simpleDropOffValidation');

const {
  createSimpleDropOffLocation,
  getAllSimpleDropOffLocations,
  getSimpleDropOffLocationById,
  updateSimpleDropOffLocation,
  deleteSimpleDropOffLocation,
  getNearbySimpleDropOffLocations,
  verifyLocationStatus,
  getLocationStatistics,
  getSupportedMaterialTypes
} = require('../controllers/simpleDropOffLocationController');

/**
 * Public routes (no authentication required)
 */

// Get nearby simple drop-off locations for users
router.get('/nearby', validateGetNearbyLocations, handleValidationErrors, getNearbySimpleDropOffLocations);

// Get supported material types
router.get('/material-types', getSupportedMaterialTypes);

// Get location by ID (public for user access)
router.get('/:id', validateMongoId, handleValidationErrors, getSimpleDropOffLocationById);

/**
 * Protected routes (authentication required)
 */

// Admin only routes
router.use(isAuth); // Apply auth middleware to all routes below

// Get all simple drop-off locations with filters (Admin only)
router.get('/', validatePagination, handleValidationErrors, checkAdminRole, getAllSimpleDropOffLocations);

// Create new simple drop-off location (Admin only)
router.post('/',
  locationCreationRateLimit,
  validateCreateSimpleDropOffLocation,
  handleValidationErrors,
  checkAdminRole,
  createSimpleDropOffLocation
);

// Update simple drop-off location (Admin only)
router.put('/:id',
  validateUpdateSimpleDropOffLocation,
  handleValidationErrors,
  checkAdminRole,
  updateSimpleDropOffLocation
);

// Delete simple drop-off location (Admin only)
router.delete('/:id',
  validateMongoId,
  handleValidationErrors,
  checkAdminRole,
  deleteSimpleDropOffLocation
);

// Verify location status (Admin only)
router.patch('/:id/verify',
  validateMongoId,
  handleValidationErrors,
  checkAdminRole,
  verifyLocationStatus
);

// Get location statistics (Admin only)
router.get('/admin/statistics', checkAdminRole, getLocationStatistics);

module.exports = router;
