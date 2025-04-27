const { Router } = require("express");
const thingsMatchItemController = require("../../controllers/thingsMatch/item.controller.js");
const { isThingsMatchUser } = require("../../middleware/authMiddleware.js");

const router = Router();

// Item routes
router.post("/add", isThingsMatchUser, thingsMatchItemController.addItem);

router.get(
  "/swipe",
  isThingsMatchUser,
  thingsMatchItemController.getItemsToSwipe
);

router.get(
  "/created",
  isThingsMatchUser,
  thingsMatchItemController.getCreatedItems
);

router.get(
  "/like/:itemId",
  isThingsMatchUser,
  thingsMatchItemController.swipeLike
);
router.get(
  "/dislike/:itemId",
  isThingsMatchUser,
  thingsMatchItemController.swipeDislike
);

// This generic route should be last
router.get(
  "/:itemId",
  isThingsMatchUser,
  thingsMatchItemController.getItemById
);

module.exports = router;
