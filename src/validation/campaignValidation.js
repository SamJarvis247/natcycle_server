const { body, query, param } = require('express-validator');
const { getPrimaryMaterialTypes } = require('../models/enums/materialTypeHierarchy');

const validateCreateCampaign = [
  body('*').custom((value, { req }) => {
    return true;
  }),
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

  body('locations')
    .custom((value) => {
      let locations;
      try {
        locations = typeof value === 'string' ? JSON.parse(value) : value;
      } catch (error) {
        throw new Error('Locations must be valid JSON');
      }

      if (!Array.isArray(locations) || locations.length === 0) {
        throw new Error('At least one location is required');
      }

      for (const location of locations) {
        const hasSimpleDropoff = location.simpleDropoffLocationId;
        const hasDropoff = location.dropoffLocationId;
        const hasCustom = location.customLocation &&
          location.customLocation.coordinates &&
          location.customLocation.coordinates.length === 2 &&
          location.customLocation.address;

        if (!hasSimpleDropoff && !hasDropoff && !hasCustom) {
          throw new Error('Each location must have either a linked location ID or complete custom location data (coordinates and address)');
        }

        if (location.customLocation && location.customLocation.coordinates) {
          const [lng, lat] = location.customLocation.coordinates;
          if (typeof lat !== 'number' || lat < -90 || lat > 90) {
            throw new Error('Custom location latitude must be between -90 and 90');
          }
          if (typeof lng !== 'number' || lng < -180 || lng > 180) {
            throw new Error('Custom location longitude must be between -180 and 180');
          }
        }
      }

      return true;
    }), body('organizationName')
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
      now.setHours(0, 0, 0, 0);
      if (startDate < now) {
        throw new Error('Start date cannot be in the past');
      }
      return true;
    }),

  body('endDate')
    .optional()
    .custom((value, { req }) => {
      const isIndefiniteStr = req.body.isIndefinite;
      const isIndefinite = isIndefiniteStr === 'true' || isIndefiniteStr === true;

      if (isIndefinite && value && value.trim() !== '') {
        throw new Error('Indefinite campaigns cannot have an end date');
      }

      if (!isIndefinite && value && value.trim() !== '') {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          throw new Error('End date must be a valid date in YYYY-MM-DD format');
        }

        if (req.body.startDate) {
          const startDate = new Date(req.body.startDate);
          const endDate = new Date(value);
          if (endDate <= startDate) {
            throw new Error('End date must be after start date');
          }
        }
      }

      return true;
    }),

  body('isIndefinite')
    .optional()
    .custom((value, { req }) => {
      const isIndefiniteStr = req.body.isIndefinite;

      if (isIndefiniteStr !== undefined &&
        isIndefiniteStr !== 'true' &&
        isIndefiniteStr !== 'false' &&
        typeof isIndefiniteStr !== 'boolean') {
        throw new Error('isIndefinite must be a boolean or boolean string');
      }

      const isIndefinite = isIndefiniteStr === 'true' || isIndefiniteStr === true;

      if (isIndefinite && req.body.endDate) {
        throw new Error('Indefinite campaigns cannot have an end date');
      }
      return true;
    }),

  body('status')
    .optional()
    .isIn(['active', 'completed', 'cancelled'])
    .withMessage('Status must be one of: active, completed, cancelled'),

  body('materialTypes')
    .optional()
    .custom((value) => {
      console.log(value)
      if (!value) return true;

      if (Array.isArray(value) && value.length === 1 && value[0] === 'All') {
        return true;
      }

      return new Error('Material types must be an array');
    }),

  body('goal')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Goal must be a positive number')
];

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

  body('locations')
    .optional()
    .custom((value) => {
      if (!value) return true;

      let locations;
      try {
        locations = typeof value === 'string' ? JSON.parse(value) : value;
      } catch (error) {
        throw new Error('Locations must be valid JSON');
      }

      if (!Array.isArray(locations) || locations.length === 0) {
        throw new Error('If provided, at least one location is required');
      }

      for (const location of locations) {
        const hasSimpleDropoff = location.simpleDropoffLocationId;
        const hasDropoff = location.dropoffLocationId;
        const hasCustom = location.customLocation &&
          location.customLocation.coordinates &&
          location.customLocation.coordinates.length === 2 &&
          location.customLocation.address;

        if (!hasSimpleDropoff && !hasDropoff && !hasCustom) {
          throw new Error('Each location must have either a linked location ID or complete custom location data (coordinates and address)');
        }

        if (location.customLocation && location.customLocation.coordinates) {
          const [lng, lat] = location.customLocation.coordinates;
          if (typeof lat !== 'number' || lat < -90 || lat > 90) {
            throw new Error('Custom location latitude must be between -90 and 90');
          }
          if (typeof lng !== 'number' || lng < -180 || lng > 180) {
            throw new Error('Custom location longitude must be between -180 and 180');
          }
        }
      }

      return true;
    }),

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

  body('materialTypes')
    .optional()
    .custom((value) => {
      if (!value) return true;

      if (Array.isArray(value) && value.length === 1 && value[0] === 'All') {
        return true;
      }

      if (Array.isArray(value)) {
        const validTypes = getPrimaryMaterialTypes();
        const invalidTypes = value.filter(type => !validTypes.includes(type));
        if (invalidTypes.length > 0) {
          throw new Error(`Invalid material types: ${invalidTypes.join(', ')}`);
        }
        return true;
      }

      throw new Error('Material types must be an array');
    }),

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
    .withMessage('isHidden must be a boolean')
];

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

  query('materialType')
    .optional()
    .isIn(getPrimaryMaterialTypes())
    .withMessage(`Material type must be one of: ${getPrimaryMaterialTypes().join(', ')}`),

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

const validateGetNearbyCampaigns = [
  query('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  query('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  query('radius')
    .optional()
    .isInt({ min: 50, max: 50000 })
    .withMessage('Radius must be between 100 and 50000 meters'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('materialType')
    .optional()
    .isIn(getPrimaryMaterialTypes())
    .withMessage(`Material type must be one of: ${getPrimaryMaterialTypes().join(', ')}`),

  query('status')
    .optional()
    .isIn(['active', 'completed', 'cancelled'])
    .withMessage('Status must be one of: active, completed, cancelled')
];

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

const validateGetContributorsDetails = [
  param('id')
    .isMongoId()
    .withMessage('Invalid campaign ID format'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

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

const validateMongoId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format')
];

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

const validateCreateCampaignDropOff = [
  param('id')
    .isMongoId()
    .withMessage('Invalid campaign ID'),

  body('materialType')
    .isIn(getPrimaryMaterialTypes())
    .withMessage(`Material type must be one of: ${getPrimaryMaterialTypes().join(', ')}`),

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
];

const validateGetCampaignDropOffs = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((endDate, { req }) => {
      if (req.query.startDate && endDate) {
        const start = new Date(req.query.startDate);
        const end = new Date(endDate);
        if (end < start) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    }),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'itemQuantity', 'pointsEarned'])
    .withMessage('Sort by must be one of: createdAt, itemQuantity, pointsEarned'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

const validateGetCampaignDropOffsById = [
  param('id')
    .isMongoId()
    .withMessage('Invalid campaign ID format'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((endDate, { req }) => {
      if (req.query.startDate && endDate) {
        const start = new Date(req.query.startDate);
        const end = new Date(endDate);
        if (end < start) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    }),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'itemQuantity', 'pointsEarned'])
    .withMessage('Sort by must be one of: createdAt, itemQuantity, pointsEarned'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either asc or desc')
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
  validateCreateCampaignDropOff,
  validateGetCampaignDropOffs,
  validateGetContributorsDetails,
  validateGetCampaignDropOffsById
};
