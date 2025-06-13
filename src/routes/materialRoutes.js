const express = require("express");
const materialController = require("../controllers/materialController");
const { isAdmin, isAuth } = require("../middleware/authMiddleware");
const upload = require("../config/multerConfig");

const router = express.Router();

router.get("/", materialController.getAllMaterials);

router.post(
  "/",
  isAuth,
  isAdmin,
  upload.single("file"),
  materialController.createMaterial
);

router.get("/primary-types", materialController.getPrimaryMaterialTypes);

router.get(
  "/subtypes/:primaryType",
  materialController.getSubtypesForPrimaryType
);

router
  .route("/:id")
  .get(materialController.getMaterial)
  .patch(upload.single("file"), materialController.updateMaterial)
  .delete(materialController.deleteMaterial);

module.exports = router;
