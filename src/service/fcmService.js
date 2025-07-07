const { getMessaging } = require('../config/firebaseConfig');
const User = require('../models/userModel');
const ThingsMatchUser = require('../models/thingsMatch/user.model');

/**
 * Send push notification to a single FCM token
 * @param {string} token - FCM token
 * @param {Object} notification - Notification payload
 * @param {Object} data - Data payload (optional)
 * @returns {Promise<Object>} - Result of the send operation
 */
const sendNotificationToToken = async (token, notification, data = {}) => {
  try {
    const messaging = getMessaging();
    if (!messaging) {
      throw new Error('Firebase messaging is not initialized');
    }

    const message = {
      token,
      notification: {
        title: notification.title,
        body: notification.body,
        ...(notification.imageUrl && { imageUrl: notification.imageUrl })
      },
      data: {
        ...data,
        // Ensure all data values are strings
        ...(data.type && { type: String(data.type) }),
        ...(data.id && { id: String(data.id) }),
        timestamp: String(Date.now())
      },
      android: {
        notification: {
          channelId: 'natcycle_notifications',
          priority: 'high',
          defaultSound: true,
          defaultVibrateTimings: true
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    const result = await messaging.send(message);
    console.log('Successfully sent notification to token:', token.substring(0, 20) + '...');
    return { success: true, messageId: result };

  } catch (error) {
    console.error('Error sending notification to token:', error.message);

    // Handle invalid tokens
    if (error.code === 'messaging/invalid-registration-token' ||
      error.code === 'messaging/registration-token-not-registered') {
      return { success: false, error: 'INVALID_TOKEN', token };
    }

    return { success: false, error: error.message };
  }
};

/**
 * Send notification to multiple FCM tokens
 * @param {Array<string>} tokens - Array of FCM tokens
 * @param {Object} notification - Notification payload
 * @param {Object} data - Data payload (optional)
 * @returns {Promise<Object>} - Results of the send operations
 */
const sendNotificationToMultipleTokens = async (tokens, notification, data = {}) => {
  try {
    const messaging = getMessaging();
    if (!messaging) {
      throw new Error('Firebase messaging is not initialized');
    }

    if (!tokens || tokens.length === 0) {
      return { success: false, error: 'No tokens provided' };
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
        ...(notification.imageUrl && { imageUrl: notification.imageUrl })
      },
      data: {
        ...data,
        // Ensure all data values are strings
        ...(data.type && { type: String(data.type) }),
        ...(data.id && { id: String(data.id) }),
        timestamp: String(Date.now())
      },
      tokens
    };

    const result = await messaging.sendMulticast(message);

    // Handle invalid tokens
    const invalidTokens = [];
    if (result.failureCount > 0) {
      result.responses.forEach((response, index) => {
        if (!response.success &&
          (response.error?.code === 'messaging/invalid-registration-token' ||
            response.error?.code === 'messaging/registration-token-not-registered')) {
          invalidTokens.push(tokens[index]);
        }
      });
    }

    console.log(`Successfully sent ${result.successCount}/${tokens.length} notifications`);

    return {
      success: true,
      successCount: result.successCount,
      failureCount: result.failureCount,
      invalidTokens,
      responses: result.responses
    };

  } catch (error) {
    console.error('Error sending notifications to multiple tokens:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send notification to a user (all their devices)
 * @param {string} userId - User ID (either regular user or ThingsMatch user)
 * @param {Object} notification - Notification payload
 * @param {Object} data - Data payload (optional)
 * @param {string} userType - 'regular' or 'thingsMatch'
 * @returns {Promise<Object>} - Results of the send operations
 */
const sendNotificationToUser = async (userId, notification, data = {}, userType = 'regular') => {
  try {
    let user;

    if (userType === 'thingsMatch') {
      user = await ThingsMatchUser.findById(userId).select('fcmTokens');
    } else {
      user = await User.findById(userId).select('fcmTokens');
    }

    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      console.log(`No FCM tokens found for user ${userId}`);
      return { success: false, error: 'No FCM tokens found for user' };
    }

    const tokens = user.fcmTokens.map(tokenObj => tokenObj.token);
    const result = await sendNotificationToMultipleTokens(tokens, notification, data);

    // Clean up invalid tokens
    if (result.invalidTokens && result.invalidTokens.length > 0) {
      await cleanupInvalidTokens(userId, result.invalidTokens, userType);
    }

    return result;

  } catch (error) {
    console.error('Error sending notification to user:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Remove invalid FCM tokens from user's record
 * @param {string} userId - User ID
 * @param {Array<string>} invalidTokens - Array of invalid tokens to remove
 * @param {string} userType - 'regular' or 'thingsMatch'
 */
const cleanupInvalidTokens = async (userId, invalidTokens, userType = 'regular') => {
  try {
    const Model = userType === 'thingsMatch' ? ThingsMatchUser : User;

    await Model.findByIdAndUpdate(userId, {
      $pull: { fcmTokens: { token: { $in: invalidTokens } } }
    });

    console.log(`Cleaned up ${invalidTokens.length} invalid tokens for user ${userId}`);
  } catch (error) {
    console.error('Error cleaning up invalid tokens:', error.message);
  }
};

/**
 * Send topic notification (for broadcasting)
 * @param {string} topic - Topic name
 * @param {Object} notification - Notification payload
 * @param {Object} data - Data payload (optional)
 * @returns {Promise<Object>} - Result of the send operation
 */
const sendTopicNotification = async (topic, notification, data = {}) => {
  try {
    const messaging = getMessaging();
    if (!messaging) {
      throw new Error('Firebase messaging is not initialized');
    }

    const message = {
      topic,
      notification: {
        title: notification.title,
        body: notification.body,
        ...(notification.imageUrl && { imageUrl: notification.imageUrl })
      },
      data: {
        ...data,
        timestamp: String(Date.now())
      }
    };

    const result = await messaging.send(message);
    console.log('Successfully sent topic notification:', result);
    return { success: true, messageId: result };

  } catch (error) {
    console.error('Error sending topic notification:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendNotificationToToken,
  sendNotificationToMultipleTokens,
  sendNotificationToUser,
  sendTopicNotification,
  cleanupInvalidTokens
};
