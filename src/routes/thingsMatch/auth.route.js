const { Router } = require("express");
const thingsMatchAuthController = require("../../controllers/thingsMatch/auth.controller.js");
const { isAuth } = require("../../middleware/authMiddleware.js");

const router = Router();

//signup/signin Thingsmatch
router.get("/thingsMatchAccount/:token", thingsMatchAuthController.thingsMatchAccount)


module.exports = router;
