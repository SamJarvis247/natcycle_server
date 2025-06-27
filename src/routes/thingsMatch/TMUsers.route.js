const { Router } = require("express");
const TMUsersController = require("../../controllers/thingsMatch/TMUsers.controller.js");
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

module.exports = router;
