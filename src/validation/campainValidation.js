
const { body, param, query } = require('express-validator');
const { getPrimaryMaterialTypes } = require('../models/enums/materialTypeHierarchy');


/** * Validation for creating a campaign
 */
const validateCreateCampaign = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Name must be between 3 and 100 characters'),

  body('organizationName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Organization name must not exceed 100 characters'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),

  body('location.type')
    .equals('Point')
    .withMessage('Location type must be "Point"'),

  body('location.coordinates')
    .isArray({ min: 2, max: 2 })
    .withMessage('Location coordinates must be an array of two numbers')
    .custom((value) => {
      if (value[0] < -180 || value[0] > 180 || value[1] < -90 || value[1] > 90) {
        throw new Error('Coordinates must be valid longitude and latitude values');
      }
      return true;
    }),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address must not exceed 200 characters'),

  body('startDate')
    .isISO8601()
    .toDate()
    .withMessage('Start date must be a valid date in ISO 8601 format'),

  body('endDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('End date must be a valid date in ISO 8601 format')
    .custom((value, { req }) => {
      if (value && new Date(value) < new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

  body('isHidden')
    .optional()
    .isBoolean()
    .withMessage('isHidden must be a boolean'),

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
    .withMessage('Goal must be a non-negative integer'),

  body('progress')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Progress must be a non-negative integer'),

  body('dropOffLocation')
    .optional()
    .isMongoId()
    .withMessage('Drop-off location must be a valid MongoDB ObjectId, note that this is already deprecated and we don\'t use a certain User for campaigns'),
]

/**
 * Validation for updating a campaign
 */

const validateUpdateCampaign = [
  param('id')
    .isMongoId()
    .withMessage('Invalid campaign ID'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Name must be between 3 and 100 characters'),

  body('organizationName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Organization name must not exceed 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),

  body('location.type')
    .optional()
    .equals('Point')
    .withMessage('Location type must be "Point"'),

  body('location.coordinates')
    .optional()
    .isArray({ min: 2, max: 2 })
    .withMessage('Location coordinates must be an array of two numbers')
    .custom((value) => {
      if (value[0] < -180 || value[0] > 180 || value[1] < -90 || value[1] > 90) {
        throw new Error('Coordinates must be valid longitude and latitude values');
      }
      return true;
    }),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address must not exceed 200 characters'),

  body('startDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Start date must be a valid date in ISO 8601 format'),

  body('endDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('End date must be a valid date in ISO 8601 format')
    .custom((value, { req }) => {
      if (value && new Date(value) < new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),

  body('isHidden')
    .optional()
    .isBoolean()
    .withMessage('isHidden must be a boolean'),

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
    .withMessage('Goal must be a non-negative integer'),

  body('progress')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Progress must be a non-negative integer'),

  body('dropOffLocation')
    .optional()
    .isMongoId()
    .withMessage('Drop-off location must be a valid MongoDB ObjectId, note that this is already deprecated and we don\'t use a certain User for campaigns'),
]

/**
 * Validation for getting nearby campaigns 
 */

const validateGetNearbyCampaigns = [
  query('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be a valid float between -90 and 90'),

  query('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be a valid float between -180 and 180'),

  query('distance')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Distance must be a non-negative integer'),

  query('limit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Limit must be a positive integer'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
]
const validateGetCampaignById = [
  param('id')
    .isMongoId()
    .withMessage('Invalid campaign ID'),
];

const validateDeleteCampaign = [
  param('id')
    .isMongoId()
    .withMessage('Invalid campaign ID'),
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'name', 'itemType', 'cuEarned'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),

  query('itemType')
    .optional()
    .isIn(getPrimaryMaterialTypes())
    .withMessage(`Item type must be one of: ${getPrimaryMaterialTypes().join(', ')}`),

  query('status')
    .optional()
    .isIn(['active', 'completed', 'cancelled'])
    .withMessage('Status must be one of: active, completed, cancelled'),

  query('isHidden')
    .optional()
    .isBoolean()
    .withMessage('isHidden must be a boolean'),

  query('goal')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Goal must be a non-negative integer')
];

module.exports = {
  validateCreateCampaign,
  validateUpdateCampaign,
  validateGetNearbyCampaigns,
  validateGetCampaignById,
  validateDeleteCampaign,
  validatePagination
}
