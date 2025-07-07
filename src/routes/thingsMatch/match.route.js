const { Router } = require("express");
const thingsMatchMatchController = require("../../controllers/thingsMatch/match.controller.js");
const { isThingsMatchUser } = require("../../middleware/authMiddleware.js");

const router = Router();

// Middleware to ensure user is a ThingsMatch user for all match routes
router.use(isThingsMatchUser);

// Get all matches for the logged-in user
router.get("/my-matches", thingsMatchMatchController.getUserMatches);

// Get all chats where user is the itemSwiper (with pagination)
router.get("/my-chats-as-swiper", thingsMatchMatchController.getMyChatsAsSwiper);

// Get a specific match by its ID
router.get("/single-match/:matchId", thingsMatchMatchController.getMatchDetails);

// Get all matches for a specific item
router.get("/:itemId", thingsMatchMatchController.getMatchesForItem);

// Swiper initiates a match by expressing interest (liking) and sending a default message
router.post(
  "/:itemId/swipe-interest",
  thingsMatchMatchController.swipeAndSendDefaultMessage
);



// Item owner confirms a pending match request
router.patch(
  "/:matchId/confirm",
  thingsMatchMatchController.confirmMatchByOwner
);

// Item owner ends a match and marks item as given away
router.patch(
  "/:matchId/end",
  thingsMatchMatchController.endMatch
);

// router.patch("/:matchId/status", thingsMatchMatchController.updateMatchStatus);

module.exports = router;
