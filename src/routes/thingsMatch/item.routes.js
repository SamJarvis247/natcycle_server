const express = require("express");
const itemController = require("../../controllers/thingsMatch/item.controller");
const authMiddleware = require("../../middleware/authMiddleware"); // Assuming you have general auth middleware
const thingsMatchAuth = require("../../middleware/thingsMatchAuth"); // Specific middleware to ensure user has ThingsMatch profile
const { uploadItemImages } = require("../../middleware/multerUpload"); // Assuming multer setup for image uploads

const router = express.Router();

// All routes below require general authentication and a ThingsMatch profile
router.use(authMiddleware.protect);
router.use(thingsMatchAuth.ensureThingsMatchProfile); // Ensures req.user.thingsMatchId is set

router
  .route("/")
  .post(uploadItemImages, itemController.addItem) // Assuming 'uploadItemImages' handles multiple files for 'itemImages'
  .get(itemController.getItemsToSwipe);

router
  .route("/:itemId")
  .get(itemController.getItemById)
  // .patch(itemController.updateItem) // If you add an update item details endpoint
  .delete(itemController.deleteItem);

router.patch(
  "/:itemId/discovery-status",
  itemController.updateItemDiscoveryStatus
);

module.exports = router;
