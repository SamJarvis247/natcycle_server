const { Router } = require("express");
const thingsMatchMatchController = require("../../controllers/thingsMatch/match.controller.js");
const { isThingsMatchUser } = require("../../middleware/authMiddleware.js");

const router = Router();

// Middleware to ensure user is a ThingsMatch user for all match routes
router.use(isThingsMatchUser);

// Get all matches for the logged-in user
router.get(
  "/my-matches",
  thingsMatchMatchController.getUserMatches
);

// Swiper initiates a match by expressing interest (liking) and sending a default message
router.post(
  "/:itemId/swipe-interest",
  thingsMatchMatchController.swipeAndSendDefaultMessage
);

// Get all matches for a specific item
router.get(
  "/:itemId/matches",
  thingsMatchMatchController.getMatchesForItem
);

// Get a specific match by its ID
router.get(
  "/:matchId",
  thingsMatchMatchController.getMatchDetails
);

// Item owner confirms a pending match request
router.patch(
  "/:matchId/confirm",
  thingsMatchMatchController.confirmMatchByOwner
);

// Example for updating match status (can be uncommented and implemented)
// router.patch("/:matchId/status", thingsMatchMatchController.updateMatchStatus);

module.exports = router;
