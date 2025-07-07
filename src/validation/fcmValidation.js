const { body, validationResult } = require('express-validator');

/**
 * Validation rules for FCM token registration
 */
const validateFCMTokenRegistration = [
  body('token')
    .notEmpty()
    .withMessage('FCM token is required')
    .isLength({ min: 100 })
    .withMessage('FCM token appears to be invalid (too short)')
    .matches(/^[A-Za-z0-9_:-]+$/)
    .withMessage('FCM token contains invalid characters'),

  body('deviceId')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Device ID must be between 1 and 100 characters')
    .trim(),

  body('platform')
    .optional()
    .isIn(['ios', 'android', 'web'])
    .withMessage('Platform must be one of: ios, android, web'),

  // Middleware to handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * Validation rules for FCM token removal
 */
const validateFCMTokenRemoval = [
  body('token')
    .notEmpty()
    .withMessage('FCM token is required')
    .isLength({ min: 100 })
    .withMessage('FCM token appears to be invalid (too short)'),

  // Middleware to handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * Validation rules for test notification
 */
const validateTestNotification = [
  body('title')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters')
    .trim(),

  body('body')
    .optional()
    .isLength({ min: 1, max: 500 })
    .withMessage('Body must be between 1 and 500 characters')
    .trim(),

  // Middleware to handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

module.exports = {
  validateFCMTokenRegistration,
  validateFCMTokenRemoval,
  validateTestNotification
};
