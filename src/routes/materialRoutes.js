const express = require("express");
const materialController = require("../controllers/materialController");
const { isAdmin } = require("../middleware/authMiddleware");
const upload = require("../config/multerConfig");

const router = express.Router();

router.get("/", materialController.getAllMaterials);

router.post(
  "/",
  isAdmin,
  upload.single("image"),
  materialController.createMaterial
);

router
  .route("/:id")
  .get(materialController.getMaterial)
  .patch(upload.single("image"), materialController.updateMaterial)
  .delete(materialController.deleteMaterial);

module.exports = router;
