const express = require('express');
const router = express.Router();
const { isAuth } = require('../middleware/authMiddleware');
const {
  checkAdminRole,
  handleValidationErrors,
  ensureUploadsDirectory,
  handleFileUploadErrors,
  simpleDropOffRateLimit
} = require('../middleware/simpleDropOffMiddleware');
const {
  validateCreateSimpleDropOff,
  validateVerifyDropOff,
  validateBulkVerifyDropOffs,
  validatePagination,
  validateDateRange,
  validateMongoId
} = require('../validation/simpleDropOffValidation');

// Use the shared Multer config
const upload = require('../config/multerConfig');

const {
  createSimpleDropOff,
  getUserSimpleDropOffs,
  getPendingVerifications,
  verifyDropOff,
  getSimpleDropOffById,
  getDropOffStats,
  deleteSimpleDropOff,
  getAllSimpleDropOffs,
  bulkVerifyDropOffs
} = require('../controllers/simpleDropOffController');


/**
 * All routes require authentication
 */
router.use(isAuth);
router.use(ensureUploadsDirectory);

/**
 * User routes
 */

// Create a new simple drop-off (with proof picture)
router.post('/',
  simpleDropOffRateLimit,
  upload.single('file'),
  handleFileUploadErrors,
  validateCreateSimpleDropOff,
  handleValidationErrors,
  createSimpleDropOff
);

// Get user's own simple drop-off history
router.get('/my-dropoffs',
  validatePagination,
  getUserSimpleDropOffs
);

// Get user's own drop-off statistics
router.get('/my-stats',
  validateDateRange,
  handleValidationErrors,
  getDropOffStats
);

// Get simple drop-off by ID (user can only access their own)
router.get('/:id',
  validateMongoId,
  handleValidationErrors,
  getSimpleDropOffById
);

/**
 * Admin routes
 */

// Get all simple drop-offs (Admin only)
router.get('/',
  validatePagination,
  validateDateRange,
  handleValidationErrors,
  checkAdminRole,
  getAllSimpleDropOffs
);

// Get pending verifications (Admin only)
router.get('/admin/pending',
  validatePagination,
  handleValidationErrors,
  checkAdminRole,
  getPendingVerifications
);

// Get comprehensive statistics (Admin only)
router.get('/admin/stats',
  validateDateRange,
  handleValidationErrors,
  checkAdminRole,
  getDropOffStats
);

// Verify or reject a simple drop-off (Admin only)
router.patch('/:id/verify',
  validateVerifyDropOff,
  handleValidationErrors,
  checkAdminRole,
  verifyDropOff
);

// Bulk verify drop-offs (Admin only)
router.patch('/admin/bulk-verify',
  validateBulkVerifyDropOffs,
  handleValidationErrors,
  checkAdminRole,
  bulkVerifyDropOffs
);

// Delete simple drop-off (Admin only)
router.delete('/:id',
  validateMongoId,
  handleValidationErrors,
  checkAdminRole,
  deleteSimpleDropOff
);

module.exports = router;
