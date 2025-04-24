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
} = require("../controllers/dropOffController");

const { isAuth, isAdmin } = require("../middleware/authMiddleware");

const upload = require("../config/multerConfig");

router.post("/", isAuth, upload.single("file"), addDropOff);

router.get("/admin", isAuth, isAdmin, adminGetDropOffs);

router.get("/", isAuth, isAdmin, getDropOffs);

router.get("/:id", isAuth, getDropOffById);

router.put("/:id", isAuth, isAdmin, updateDropOffStatus);

module.exports = router;
