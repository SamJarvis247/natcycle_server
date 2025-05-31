const { Router } = require("express");
const thingsMatchMatchController = require("../../controllers/thingsMatch/match.controller.js");
const { isThingsMatchUser } = require("../../middleware/authMiddleware.js");

const router = Router();

router.use(isThingsMatchUser);

// Swiper initiates a match by expressing interest (liking) and sending a default message
router.post(
  "/:itemId/swipe-interest",
  thingsMatchMatchController.swipeAndSendDefaultMessage
);

//get all matches for a specific item
router.get(
  "/:itemId/matches",
  thingsMatchMatchController.getMatchesForItem
);

// //get all users created items with matches
// router.get(
//   "/my-items",
//   thingsMatchMatchController.getUserCreatedItemsWithMatches
// );


// Item owner confirms a pending match request
router.patch(
  "/:matchId/confirm",
  thingsMatchMatchController.confirmMatchByOwner
);

// Update match status (e.g., 'blocked', 'unmatched') by either party
// router.patch("/:matchId/status", thingsMatchMatchController.updateMatchStatus);

// Get all matches for the logged-in user
router.get("/my-matches", thingsMatchMatchController.getUserMatches);

// Get a specific match by its ID
// router.get("/:matchId", thingsMatchMatchController.getMatchById);

module.exports = router;
