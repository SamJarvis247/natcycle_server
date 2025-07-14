const { body, query, param } = require('express-validator');
const { getPrimaryMaterialTypes } = require('../models/enums/materialTypeHierarchy');

/**
 * Validation for creating campaign
 */
const validateCreateCampaign = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Campaign name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Campaign name must be between 3 and 100 characters'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Campaign description is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Campaign description must be between 10 and 1000 characters'),

  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address must not exceed 200 characters'),

  body('organizationName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Organization name must not exceed 100 characters'),

  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date')
    .custom((value) => {
      const startDate = new Date(value);
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Set to start of today
      if (startDate < now) {
        throw new Error('Start date cannot be in the past');
      }
      return true;
    }),

  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (value && req.body.startDate) {
        const startDate = new Date(req.body.startDate);
        const endDate = new Date(value);
        if (endDate <= startDate) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    }),

  body('status')
    .optional()
    .isIn(['active', 'completed', 'cancelled'])
    .withMessage('Status must be one of: active, completed, cancelled'),

  body('itemType')
    .optional()
    .isIn(getPrimaryMaterialTypes())
    .withMessage(`Item type must be one of: ${getPrimaryMaterialTypes().join(', ')}`),

  body('goal')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Goal must be a positive number'),

  body('dropOffLocationId')
    .optional()
    .isMongoId()
    .withMessage('Drop-off location ID must be a valid MongoDB ObjectId')
];

/**
 * Validation for updating campaign
 */
const validateUpdateCampaign = [
  param('id')
    .isMongoId()
    .withMessage('Invalid campaign ID'),

  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Campaign name cannot be empty')
    .isLength({ min: 3, max: 100 })
    .withMessage('Campaign name must be between 3 and 100 characters'),

  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Campaign description cannot be empty')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Campaign description must be between 10 and 1000 characters'),

  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address must not exceed 200 characters'),

  body('organizationName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Organization name must not exceed 100 characters'),

  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),

  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),

  body('status')
    .optional()
    .isIn(['active', 'completed', 'cancelled'])
    .withMessage('Status must be one of: active, completed, cancelled'),

  body('itemType')
    .optional()
    .isIn(getPrimaryMaterialTypes())
    .withMessage(`Item type must be one of: ${getPrimaryMaterialTypes().join(', ')}`),

  body('goal')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Goal must be a positive number'),

  body('progress')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Progress must be a positive number'),

  body('isHidden')
    .optional()
    .isBoolean()
    .withMessage('isHidden must be a boolean'),

  body('dropOffLocationId')
    .optional()
    .isMongoId()
    .withMessage('Drop-off location ID must be a valid MongoDB ObjectId')
];

/**
 * Validation for getting campaigns with pagination
 */
const validateGetCampaigns = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('status')
    .optional()
    .isIn(['active', 'completed', 'cancelled'])
    .withMessage('Status must be one of: active, completed, cancelled'),

  query('itemType')
    .optional()
    .isIn(getPrimaryMaterialTypes())
    .withMessage(`Item type must be one of: ${getPrimaryMaterialTypes().join(', ')}`),

  query('organizationName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Organization name must be between 1 and 100 characters'),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'startDate', 'endDate', 'name', 'goal', 'progress'])
    .withMessage('Sort by must be one of: createdAt, startDate, endDate, name, goal, progress'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either asc or desc'),

  query('includeInactive')
    .optional()
    .isBoolean()
    .withMessage('Include inactive must be a boolean')
];

/**
 * Validation for getting nearby campaigns
 */
const validateGetNearbyCampaigns = [
  query('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  query('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  query('radius')
    .optional()
    .isInt({ min: 100, max: 50000 })
    .withMessage('Radius must be between 100 and 50000 meters'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('itemType')
    .optional()
    .isIn(getPrimaryMaterialTypes())
    .withMessage(`Item type must be one of: ${getPrimaryMaterialTypes().join(', ')}`),

  query('status')
    .optional()
    .isIn(['active', 'completed', 'cancelled'])
    .withMessage('Status must be one of: active, completed, cancelled')
];

/**
 * Validation for getting campaign contributors
 */
const validateGetContributors = [
  param('id')
    .isMongoId()
    .withMessage('Invalid campaign ID'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

/**
 * Validation for date range queries
 */
const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (value && req.query.startDate) {
        const startDate = new Date(req.query.startDate);
        const endDate = new Date(value);
        if (endDate <= startDate) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    })
];

/**
 * Validation for MongoDB ObjectId parameters
 */
const validateMongoId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format')
];

/**
 * Validation for pagination
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

/**
 * Validation for creating campaign drop-off
 */
const validateCreateCampaignDropOff = [
  param('id')
    .isMongoId()
    .withMessage('Invalid campaign ID'),

  body('itemType')
    .isIn(getPrimaryMaterialTypes())
    .withMessage(`Item type must be one of: ${getPrimaryMaterialTypes().join(', ')}`),

  body('dropOffQuantity')
    .notEmpty()
    .withMessage('Drop-off quantity is required')
    .custom((value) => {
      try {
        const quantity = typeof value === 'string' ? JSON.parse(value) : value;
        if (!Array.isArray(quantity)) {
          throw new Error("Drop-off quantity must be an array");
        }
        if (quantity.length === 0) {
          throw new Error("Drop-off quantity cannot be empty");
        }
        for (const item of quantity) {
          if (!item.materialType || typeof item.units !== 'number' || item.units <= 0) {
            throw new Error("Each item must have a materialType and positive units");
          }
        }
        return true;
      } catch (error) {
        throw new Error("Invalid drop-off quantity format: " + error.message);
      }
    }),

  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters')
];

module.exports = {
  validateCreateCampaign,
  validateUpdateCampaign,
  validateGetCampaigns,
  validateGetNearbyCampaigns,
  validateGetContributors,
  validateDateRange,
  validateMongoId,
  validatePagination,
  validateCreateCampaignDropOff
};
