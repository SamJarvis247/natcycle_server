const Material = require("../models/materialModel");
const { catchAsync } = require("../utility/catchAsync.js");
const cloudinaryUpload = require("../config/cloudinaryUpload");

// Get all materials
exports.getAllMaterials = catchAsync(async (req, res) => {
  const materials = await Material.find({});

  res.status(200).json({
    status: "success",
    results: materials.length,
    data: {
      materials,
    },
  });
});

// Get a single material
exports.getMaterial = catchAsync(async (req, res) => {
  const material = await Material.findById(req.params.id);

  if (!material) {
    return res.status(404).json({
      status: "fail",
      message: "Material not found",
    });
  }

  res.status(200).json({
    status: "success",
    data: {
      material,
    },
  });
});

// Create a new material
exports.createMaterial = catchAsync(async (req, res) => {
  const { category, name, weight, cuValue } = req.body;

  // Create material object
  const materialData = {
    category,
    name,
    weight: parseFloat(weight),
    cuValue: parseFloat(cuValue),
    isActive: true,
  };

  // Handle image upload if provided
  if (req.file) {
    try {
      const result = await cloudinaryUpload.image(req.file.path);
      materialData.image = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    } catch (error) {
      console.error("Error uploading material image:", error);
    }
  }

  // Create the material
  const newMaterial = await Material.create(materialData);

  res.status(201).json({
    status: "success",
    data: {
      material: newMaterial,
    },
  });
});

// Update a material
exports.updateMaterial = catchAsync(async (req, res) => {
  const { category, name, weight, cuValue, isActive } = req.body;

  // Find the material
  const material = await Material.findById(req.params.id);

  if (!material) {
    return res.status(404).json({
      status: "fail",
      message: "Material not found",
    });
  }

  // Update fields
  if (category) material.category = category;
  if (name) material.name = name;
  if (weight) material.weight = parseFloat(weight);
  if (cuValue) material.cuValue = parseFloat(cuValue);
  if (isActive !== undefined) material.isActive = isActive;

  // Handle image upload if provided
  if (req.file) {
    try {
      // Delete old image if exists
      if (material.image && material.image.public_id) {
        await cloudinaryUpload.deleteImage(material.image.public_id);
      }

      // Upload new image
      const result = await cloudinaryUpload.image(req.file.path);
      material.image = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    } catch (error) {
      console.error("Error updating material image:", error);
    }
  }

  // Save the updated material
  await material.save();

  res.status(200).json({
    status: "success",
    data: {
      material,
    },
  });
});

// Delete a material
exports.deleteMaterial = catchAsync(async (req, res) => {
  const material = await Material.findById(req.params.id);

  if (!material) {
    return res.status(404).json({
      status: "fail",
      message: "Material not found",
    });
  }

  // Delete image from cloudinary if exists
  if (material.image && material.image.public_id) {
    try {
      await cloudinaryUpload.deleteImage(material.image.public_id);
    } catch (error) {
      console.error("Error deleting material image:", error);
    }
  }

  // Delete the material
  await Material.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});
