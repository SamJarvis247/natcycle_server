/* eslint-disable comma-dangle */
/* eslint-disable semi */
/* eslint-disable quotes */
const express = require("express");
const router = express.Router();

const {
  addDropOff,
  getDropOffs,
  getDropOffById,
  updateDropOffStatus,
  adminGetDropOffs,
  getUserDropOffs,
} = require("../controllers/dropOffController");

const { isAuth, isAdmin } = require("../middleware/authMiddleware");

const upload = require("../config/multerConfig");

router.post("/", isAuth, upload.single("file"), addDropOff);

router.get("/admin", isAuth, isAdmin, adminGetDropOffs);

router.get("/", isAuth, isAdmin, getDropOffs);

router.get("/user/:userId", isAuth, getUserDropOffs);

router
  .route("/:id")
  .get(isAuth, getDropOffById)
  .put(isAuth, updateDropOffStatus);

module.exports = router;
