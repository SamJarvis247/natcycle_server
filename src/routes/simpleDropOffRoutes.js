const express = require('express');
const router = express.Router();
const multer = require('multer');
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

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

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
  upload.single('proofPicture'),
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
