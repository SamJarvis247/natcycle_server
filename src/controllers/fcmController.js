const User = require('../models/userModel');
const ThingsMatchUser = require('../models/thingsMatch/user.model');
const { successResponse, errorResponse } = require('../utility/response');
const { sendNotificationToToken } = require('../service/fcmService');

/**
 * Register or update FCM token for a user
 * @route POST /api/user/fcm-token
 * @route POST /api/thingsMatch/user/fcm-token
 */
const registerFCMToken = async (req, res) => {
  try {
    const { token, deviceId, platform } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!token) {
      return errorResponse(res, 'FCM token is required', 400);
    }

    // Validate platform if provided
    const validPlatforms = ['ios', 'android', 'web'];
    if (platform && !validPlatforms.includes(platform)) {
      return errorResponse(res, 'Invalid platform. Must be one of: ios, android, web', 400);
    }

    // Determine user type based on route
    const isThingsMatchUser = req.route.path.includes('thingsMatch');
    const Model = isThingsMatchUser ? ThingsMatchUser : User;

    // Find the user
    const user = await Model.findById(userId);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Initialize fcmTokens array if it doesn't exist
    if (!user.fcmTokens) {
      user.fcmTokens = [];
    }

    // Check if token already exists
    const existingTokenIndex = user.fcmTokens.findIndex(
      tokenObj => tokenObj.token === token
    );

    if (existingTokenIndex !== -1) {
      // Update existing token
      user.fcmTokens[existingTokenIndex].lastUsed = new Date();
      if (deviceId) user.fcmTokens[existingTokenIndex].deviceId = deviceId;
      if (platform) user.fcmTokens[existingTokenIndex].platform = platform;
    } else {
      // Add new token
      const newToken = {
        token,
        deviceId: deviceId || null,
        platform: platform || null,
        createdAt: new Date(),
        lastUsed: new Date()
      };

      user.fcmTokens.push(newToken);

      // Limit to 5 tokens per user (remove oldest if exceeding)
      if (user.fcmTokens.length > 5) {
        user.fcmTokens.sort((a, b) => new Date(a.lastUsed) - new Date(b.lastUsed));
        user.fcmTokens = user.fcmTokens.slice(-5);
      }
    }

    await user.save();

    // Send a test notification to verify the token works
    try {
      await sendNotificationToToken(token, {
        title: 'Welcome to NatCycle! 🌱',
        body: 'Push notifications are now enabled for your account.'
      }, {
        type: 'welcome',
        userId: userId.toString()
      });
    } catch (notificationError) {
      console.warn('Test notification failed:', notificationError.message);
      // Don't fail the token registration if test notification fails
    }

    return successResponse(
      res,
      {
        message: 'FCM token registered successfully',
        tokenCount: user.fcmTokens.length,
        registeredAt: new Date()
      },
      'FCM token registered successfully'
    );

  } catch (error) {
    console.error('Error registering FCM token:', error.message);
    return errorResponse(res, 'Failed to register FCM token', 500);
  }
};

/**
 * Remove FCM token for a user
 * @route DELETE /api/user/fcm-token
 * @route DELETE /api/thingsMatch/user/fcm-token
 */
const removeFCMToken = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user._id;

    if (!token) {
      return errorResponse(res, 'FCM token is required', 400);
    }

    // Determine user type based on route
    const isThingsMatchUser = req.route.path.includes('thingsMatch');
    const Model = isThingsMatchUser ? ThingsMatchUser : User;

    // Remove the token
    const result = await Model.findByIdAndUpdate(
      userId,
      { $pull: { fcmTokens: { token } } },
      { new: true }
    );

    if (!result) {
      return errorResponse(res, 'User not found', 404);
    }

    return successResponse(
      res,
      {
        message: 'FCM token removed successfully',
        tokenCount: result.fcmTokens ? result.fcmTokens.length : 0
      },
      'FCM token removed successfully'
    );

  } catch (error) {
    console.error('Error removing FCM token:', error.message);
    return errorResponse(res, 'Failed to remove FCM token', 500);
  }
};

/**
 * Get all FCM tokens for a user
 * @route GET /api/user/fcm-tokens
 * @route GET /api/thingsMatch/user/fcm-tokens
 */
const getFCMTokens = async (req, res) => {
  try {
    const userId = req.user._id;

    // Determine user type based on route
    const isThingsMatchUser = req.route.path.includes('thingsMatch');
    const Model = isThingsMatchUser ? ThingsMatchUser : User;

    const user = await Model.findById(userId).select('fcmTokens');
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Format the response to hide sensitive token data
    const tokens = (user.fcmTokens || []).map(tokenObj => ({
      id: tokenObj._id,
      deviceId: tokenObj.deviceId,
      platform: tokenObj.platform,
      createdAt: tokenObj.createdAt,
      lastUsed: tokenObj.lastUsed,
      tokenPreview: tokenObj.token ? `${tokenObj.token.substring(0, 20)}...` : null
    }));

    return successResponse(
      res,
      {
        tokens,
        totalCount: tokens.length
      },
      'FCM tokens retrieved successfully'
    );

  } catch (error) {
    console.error('Error retrieving FCM tokens:', error.message);
    return errorResponse(res, 'Failed to retrieve FCM tokens', 500);
  }
};

/**
 * Send test notification to user's devices
 * @route POST /api/user/test-notification
 * @route POST /api/thingsMatch/user/test-notification
 */
const sendTestNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const { title = 'Test Notification', body = 'This is a test notification from NatCycle!' } = req.body;

    // Determine user type based on route
    const isThingsMatchUser = req.route.path.includes('thingsMatch');
    const userType = isThingsMatchUser ? 'thingsMatch' : 'regular';

    const { sendNotificationToUser } = require('../service/fcmService');

    const result = await sendNotificationToUser(
      userId,
      { title, body },
      { type: 'test', userId: userId.toString() },
      userType
    );

    if (result.success) {
      return successResponse(
        res,
        {
          message: 'Test notification sent successfully',
          successCount: result.successCount,
          failureCount: result.failureCount
        },
        'Test notification sent successfully'
      );
    } else {
      return errorResponse(res, result.error || 'Failed to send test notification', 400);
    }

  } catch (error) {
    console.error('Error sending test notification:', error.message);
    return errorResponse(res, 'Failed to send test notification', 500);
  }
};

module.exports = {
  registerFCMToken,
  removeFCMToken,
  getFCMTokens,
  sendTestNotification
};
