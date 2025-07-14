const { body, query, param } = require('express-validator');
const { getPrimaryMaterialTypes } = require('../models/enums/materialTypeHierarchy');

/**
 * Validation for creating simple drop-off location
 */
const validateCreateSimpleDropOffLocation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Location name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Location name must be between 3 and 100 characters'),

  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  body('materialType')
    .isIn(getPrimaryMaterialTypes())
    .withMessage(`Material type must be one of: ${getPrimaryMaterialTypes().join(', ')}`),

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

  body('verificationRequired')
    .optional()
    .isBoolean()
    .withMessage('Verification required must be a boolean'),

  body('maxItemsPerDropOff')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Max items per drop-off must be between 1 and 100'),

  body('operatingHours')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Operating hours must not exceed 100 characters'),

  body('contactNumber')
    .optional()
    .trim()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Contact number must be a valid phone number')
];

/**
 * Validation for updating simple drop-off location
 */
const validateUpdateSimpleDropOffLocation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid location ID'),

  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Location name cannot be empty')
    .isLength({ min: 3, max: 100 })
    .withMessage('Location name must be between 3 and 100 characters'),

  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  body('materialType')
    .optional()
    .isIn(getPrimaryMaterialTypes())
    .withMessage(`Material type must be one of: ${getPrimaryMaterialTypes().join(', ')}`),

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

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),

  body('verificationRequired')
    .optional()
    .isBoolean()
    .withMessage('Verification required must be a boolean'),

  body('maxItemsPerDropOff')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Max items per drop-off must be between 1 and 100')
];

/**
 * Validation for getting nearby locations
 */
const validateGetNearbyLocations = [
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

  query('materialType')
    .optional()
    .isIn(getPrimaryMaterialTypes())
    .withMessage(`Material type must be one of: ${getPrimaryMaterialTypes().join(', ')}`),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('organizationName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Organization name must be between 1 and 100 characters')
];

/**
 * Validation for creating simple drop-off
 */
const validateCreateSimpleDropOff = [
  body('simpleDropOffLocationId')
    .isMongoId()
    .withMessage('Invalid location ID'),

  body('materialType')
    .isIn(getPrimaryMaterialTypes())
    .withMessage(`Material type must be one of: ${getPrimaryMaterialTypes().join(', ')}`),

  body('quantity')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Quantity must be between 1 and 50'),

  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180')
];

/**
 * Validation for verifying drop-off
 */
const validateVerifyDropOff = [
  param('id')
    .isMongoId()
    .withMessage('Invalid drop-off ID'),

  body('isApproved')
    .isBoolean()
    .withMessage('isApproved must be a boolean'),

  body('rejectionReason')
    .if(body('isApproved').equals(false))
    .notEmpty()
    .withMessage('Rejection reason is required when rejecting')
    .isLength({ min: 5, max: 500 })
    .withMessage('Rejection reason must be between 5 and 500 characters')
];

/**
 * Validation for bulk verify drop-offs
 */
const validateBulkVerifyDropOffs = [
  body('dropOffIds')
    .isArray({ min: 1, max: 50 })
    .withMessage('dropOffIds must be an array with 1-50 items'),

  body('dropOffIds.*')
    .isMongoId()
    .withMessage('Each drop-off ID must be valid'),

  body('isApproved')
    .isBoolean()
    .withMessage('isApproved must be a boolean'),

  body('rejectionReason')
    .if(body('isApproved').equals(false))
    .notEmpty()
    .withMessage('Rejection reason is required when rejecting')
    .isLength({ min: 5, max: 500 })
    .withMessage('Rejection reason must be between 5 and 500 characters')
];

/**
 * Validation for pagination and filtering
 */
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
    .isIn(['createdAt', 'updatedAt', 'name', 'materialType', 'cuEarned'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),

  query('materialType')
    .optional()
    .isIn(getPrimaryMaterialTypes())
    .withMessage(`Material type must be one of: ${getPrimaryMaterialTypes().join(', ')}`),

  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),

  query('isVerified')
    .optional()
    .isBoolean()
    .withMessage('isVerified must be a boolean')
];

/**
 * Validation for date ranges
 */
const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),

  query('endDate')
    .optional()
    .custom((endDate, { req }) => {
      if (req.query.startDate && endDate) {
        const start = new Date(req.query.startDate);
        const end = new Date(endDate);
        if (end <= start) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    })
];

/**
 * Common ID validation
 */
const validateMongoId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format')
];

module.exports = {
  validateCreateSimpleDropOffLocation,
  validateUpdateSimpleDropOffLocation,
  validateGetNearbyLocations,
  validateCreateSimpleDropOff,
  validateVerifyDropOff,
  validateBulkVerifyDropOffs,
  validatePagination,
  validateDateRange,
  validateMongoId
};
