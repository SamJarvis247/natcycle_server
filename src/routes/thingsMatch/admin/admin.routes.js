const { Router } = require("express");
const thingsMatchAuthController = require("../../../controllers/thingsMatch/auth.controller.js");
const { isAuth, isAdmin } = require("../../../middleware/authMiddleware.js");
const router = Router();

router.use(isAuth);
// router.use(isAdmin);

router.get("/users", thingsMatchAuthController.getAllUsers);
router.get("/users/:userId", thingsMatchAuthController.getUserById);

module.exports = router;
