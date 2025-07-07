const { Router } = require("express");
const TMUsersController = require("../../controllers/thingsMatch/TMUsers.controller.js");
const fcmController = require("../../controllers/fcmController.js");
const {
  validateFCMTokenRegistration,
  validateFCMTokenRemoval,
  validateTestNotification
} = require("../../validation/fcmValidation.js");
const { isThingsMatchUser } = require("../../middleware/authMiddleware.js");

const router = Router();

// Apply ThingsMatch authentication middleware to all routes
router.use(isThingsMatchUser);

/**
 * @route GET /api/tm/users/nearby
 * @desc Get nearby users for leaderboard
 * @access Private (ThingsMatch users only)
 * @query {number} longitude - User's longitude (required)
 * @query {number} latitude - User's latitude (required)
 * @query {number} maxDistance - Maximum distance in meters (optional, default: 10000)
 * @query {number} page - Page number (optional, default: 1)
 * @query {number} limit - Items per page (optional, default: 10, max: 50)
 */
router.get("/nearby", TMUsersController.getNearbyUsers);

/**
 * @route GET /api/tm/users/leaderboard
 * @desc Get global leaderboard of all ThingsMatch users
 * @access Private (ThingsMatch users only)
 * @query {number} page - Page number (optional, default: 1)
 * @query {number} limit - Items per page (optional, default: 10, max: 50)
 */
router.get("/leaderboard", TMUsersController.getGlobalLeaderboard);

// FCM Token Management Routes for ThingsMatch Users
router.post("/fcm-token", validateFCMTokenRegistration, fcmController.registerFCMToken);
router.delete("/fcm-token", validateFCMTokenRemoval, fcmController.removeFCMToken);
router.get("/fcm-tokens", fcmController.getFCMTokens);
router.post("/test-notification", validateTestNotification, fcmController.sendTestNotification);

module.exports = router;
