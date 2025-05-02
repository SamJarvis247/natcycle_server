const { Router } = require("express");
const thingsMatchItemController = require("../../controllers/thingsMatch/item.controller.js");
const { isThingsMatchUser } = require("../../middleware/authMiddleware.js");
const upload = require("../../config/multerConfig");

const router = Router();

// Item routes
router.post(
  "/add",
  isThingsMatchUser,
  upload.array("itemImages", 5),
  thingsMatchItemController.addItem
);

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

//update item
router.put(
  "/:itemId",
  isThingsMatchUser,
  upload.array("itemImages", 5),
  thingsMatchItemController.updateItem
);

//get item by id
router.get(
  "/:itemId",
  isThingsMatchUser,
  thingsMatchItemController.getItemById
);

module.exports = router;
