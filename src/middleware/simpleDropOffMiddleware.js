/**
 * Middleware to check if user has admin privileges
 */
const checkAdminRole = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required"
    });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Admin access required"
    });
  }

  next();
};

/**
 * Middleware to check if user can access resource (owner or admin)
 */
const checkOwnershipOrAdmin = (userIdField = 'user') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    // Admin can access anything
    if (req.user.isAdmin) {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.params.userId || req.body[userIdField] || req.query.userId;

    if (resourceUserId && resourceUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only access your own resources."
      });
    }

    next();
  };
};

/**
 * Middleware to validate request body and query parameters using express-validator
 */
const { validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: formattedErrors
    });
  }

  next();
};

/**
 * Middleware to ensure uploads directory exists
 */
const fs = require('fs');
const path = require('path');

const ensureUploadsDirectory = (req, res, next) => {
  const uploadsDir = path.join(process.cwd(), 'uploads');

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  next();
};

/**
 * Error handling middleware for multer file upload errors
 */
const multer = require('multer');

const handleFileUploadErrors = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 10MB."
      });
    }

    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: "Unexpected file field. Use 'proofPicture' field name."
      });
    }
  }

  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      success: false,
      message: "Only image files are allowed for proof pictures."
    });
  }

  next(error);
};

/**
 * Rate limiting middleware for simple drop-offs
 */
const rateLimit = require('express-rate-limit');

const simpleDropOffRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Max 20 simple drop-offs per hour per user
  message: {
    success: false,
    message: "Too many drop-offs submitted. Please try again in an hour."
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user ? req.user._id.toString() : req.ip
});

const locationCreationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Max 10 location creations per hour per admin
  message: {
    success: false,
    message: "Too many locations created. Please try again in an hour."
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user ? req.user._id.toString() : req.ip
});

module.exports = {
  checkAdminRole,
  checkOwnershipOrAdmin,
  handleValidationErrors,
  ensureUploadsDirectory,
  handleFileUploadErrors,
  simpleDropOffRateLimit,
  locationCreationRateLimit
};
