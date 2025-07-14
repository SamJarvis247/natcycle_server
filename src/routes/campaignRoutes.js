const express = require('express');
const router = express.Router();
const { isAuth } = require('../middleware/authMiddleware');
const {
  checkAdminRole,
  handleValidationErrors,
  handleFileUploadErrors,
  ensureUploadsDirectory
} = require('../middleware/simpleDropOffMiddleware');
const {
  validateCreateCampaign,
  validateUpdateCampaign,
  validateGetCampaigns,
  validateGetNearbyCampaigns,
  validateGetContributors,
  validateDateRange,
  validateMongoId,
  validatePagination,
  validateCreateCampaignDropOff
} = require('../validation/campaignValidation');

// Use the shared Multer config
const upload = require('../config/multerConfig');

const {
  createCampaign,
  getCampaigns,
  getNearbyCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  getCampaignContributors,
  getCampaignStats,
  createCampaignDropOff
} = require('../controllers/campaignController');

/**
 * Public routes (no authentication required)
 */

// Get all campaigns with pagination and filtering
router.get('/',
  validateGetCampaigns,
  handleValidationErrors,
  getCampaigns
);

// Get nearby campaigns based on location
router.get('/nearby',
  validateGetNearbyCampaigns,
  handleValidationErrors,
  getNearbyCampaigns
);

// Get campaign statistics
router.get('/stats',
  validateDateRange,
  handleValidationErrors,
  getCampaignStats
);

// Get campaign by ID
router.get('/:id',
  validateMongoId,
  handleValidationErrors,
  getCampaignById
);

// Get campaign contributors
router.get('/:id/contributors',
  validateGetContributors,
  handleValidationErrors,
  getCampaignContributors
);

/**
 * Protected routes (authentication required)
 */
router.use(isAuth);
router.use(ensureUploadsDirectory);

/**
 * Admin routes
 */

// Create a new campaign (Admin only)
router.post('/',
  checkAdminRole,
  upload.single('file'),
  handleFileUploadErrors,
  validateCreateCampaign,
  handleValidationErrors,
  createCampaign
);

// Update campaign (Admin only)
router.put('/:id',
  checkAdminRole,
  upload.single('file'),
  handleFileUploadErrors,
  validateUpdateCampaign,
  handleValidationErrors,
  updateCampaign
);

// Delete campaign (Admin only)
router.delete('/:id',
  checkAdminRole,
  validateMongoId,
  handleValidationErrors,
  deleteCampaign
);

/**
 * Campaign drop-off routes
 */

// Create a drop-off at a campaign location (Authenticated users)
router.post('/:id/dropoff',
  upload.single('file'),
  handleFileUploadErrors,
  validateCreateCampaignDropOff,
  handleValidationErrors,
  createCampaignDropOff
);

module.exports = router;
