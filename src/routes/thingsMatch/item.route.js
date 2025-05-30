const { Router } = require("express");
const thingsMatchItemController = require("../../controllers/thingsMatch/item.controller.js");
const { isThingsMatchUser } = require("../../middleware/authMiddleware.js");
const upload = require("../../config/multerConfig");

const router = Router();

router.use(isThingsMatchUser);

router
  .route("/")
  .post(upload.array("itemImages", 5), thingsMatchItemController.addItem)
  .get(thingsMatchItemController.getItemsToSwipe);

// router.get("/my-items", thingsMatchItemController.getCreatedItems);

router
  .route("/:itemId")
  .get(thingsMatchItemController.getItemById)
  // .put(upload.array("itemImages", 5), thingsMatchItemController.updateItem)
  .delete(thingsMatchItemController.deleteItem);

router.patch(
  "/:itemId/status",
  thingsMatchItemController.updateItemDiscoveryStatus
);

module.exports = router;
