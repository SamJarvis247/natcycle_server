const jwt = require('jsonwebtoken')
const userModel = require('../models/userModel')
const thingsMatchUser = require('../models/thingsMatch/user.model.js')

// verify token
exports.isAuth = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({
        message: 'Access Denied',
        error: 'No authorization header provided'
      });
    }

    const authHeader = req.headers.authorization;
    const tokenParts = authHeader.split(' ');

    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      return res.status(401).json({
        message: 'Access Denied',
        error: 'Invalid authorization format. Use "Bearer [token]"'
      });
    }

    const token = tokenParts[1];

    const verified = jwt.verify(token, process.env.TOKEN_SECRET);
    req.user = await userModel.findById(verified._id);
    req.id = verified._id;

    // Check if user exists
    if (!req.user) {
      return res.status(401).json({
        message: 'Invalid Token',
        error: 'User not found'
      });
    }

    next();
  } catch (err) {
    console.log('Auth middleware error:', err);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token Expired',
        error: 'Your session has expired. Please log in again.'
      });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Invalid Token',
        error: 'The token provided is malformed or invalid'
      });
    } else if (err.name === 'NotBeforeError') {
      return res.status(401).json({
        message: 'Token Not Active',
        error: 'This token is not active yet'
      });
    }

    // Generic error response
    return res.status(401).json({
      message: 'Authentication Failed',
      error: 'Please log in to access this resource'
    });
  }
}

// check if user is admin
exports.isAdmin = async (req, res, next) => {
  if (req.user.isAdmin) {
    next()
  } else {
    res.status(401).json({ message: 'Not Authorized  Not Admin' })
  }
}

// Check if user is a ThingsMatch user with standalone token verification
exports.isThingsMatchUser = async (req, res, next) => {
  try {
    // Check if authorization header exists
    if (!req.headers.authorization) {
      return res.status(401).json({
        message: 'Access Denied',
        error: 'No authorization header provided'
      });
    }


    const authHeader = req.headers.authorization.replace(/,/g, '');
    console.log("🚀 ~ exports.isThingsMatchUser= ~ cleaned authHeader:", authHeader);


    const tokenParts = authHeader.split(' ').filter(part => part);
    console.log("Token parts:", tokenParts);


    if (tokenParts.length < 2 || tokenParts[tokenParts.length - 2] !== 'Bearer') {
      return res.status(401).json({
        message: 'Access Denied',
        error: 'Invalid authorization format. Use "Bearer [token]"'
      });
    }

    // Extract the token (last item in the array)
    const token = tokenParts[tokenParts.length - 1];
    console.log("Extracted token:", token);

    // Verify the token
    const verified = jwt.verify(token, process.env.TOKEN_SECRET);

    // Check if token has accountType of "thingsmatch"
    if (verified.accountType !== "thingsmatch") {
      return res.status(403).json({
        message: 'Invalid Access',
        error: 'This token is not authorized for ThingsMatch services'
      });
    }

    // Find the ThingsMatch user
    const thingsMatchUserDoc = await thingsMatchUser.findById(verified._id);

    if (!thingsMatchUserDoc) {
      return res.status(404).json({
        message: 'User Not Found',
        error: 'ThingsMatch account not found'
      });
    }

    // Set the ThingsMatch user and ID in the request object
    req.thingsMatchUser = thingsMatchUserDoc;
    req.TMID = thingsMatchUserDoc._id;

    console.log(`ThingsMatch user authenticated: ${req.TMID}`);

    next();
  } catch (err) {
    console.log('ThingsMatch auth middleware error:', err);

    // Handle specific JWT errors
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token Expired',
        error: 'Your ThingsMatch session has expired. Please log in again.'
      });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Invalid Token',
        error: 'The ThingsMatch token provided is malformed or invalid'
      });
    } else if (err.name === 'NotBeforeError') {
      return res.status(401).json({
        message: 'Token Not Active',
        error: 'This ThingsMatch token is not active yet'
      });
    }

    // Generic error response
    return res.status(401).json({
      message: 'ThingsMatch Authentication Failed',
      error: 'Please login to access ThingsMatch resources'
    });
  }
}
