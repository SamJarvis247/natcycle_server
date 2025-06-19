const { Router } = require("express");
const thingsMatchAuthController = require("../../controllers/thingsMatch/auth.controller.js");
const {
  isAuth,
  isThingsMatchUser,
} = require("../../middleware/authMiddleware.js");

const router = Router();

// Get ThingsMatch user profile
router.get("/profile", isThingsMatchUser, thingsMatchAuthController.getUser);

//signup/signin Thingsmatch
router.get(
  "/thingsMatchAccount/:token",
  thingsMatchAuthController.thingsMatchAccount
);

// Update ThingsMatch account
router.put(
  "/updateAccount/:token",
  thingsMatchAuthController.updateThingsMatchAccount
);


module.exports = router;
