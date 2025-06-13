const Material = require("../models/materialModel");
const { catchAsync } = require("../utility/catchAsync.js");
const cloudinaryUpload = require("../config/cloudinaryUpload");
const {
  getPrimaryMaterialTypes,
  getSubtypesForPrimaryType,
} = require("../models/enums/materialTypeHierarchy");

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
  const { category, subCategory, name, weight, quantity, cuValue, natPoints } =
    req.body;
  console.log(req.body);

  const isValidCategory = getPrimaryMaterialTypes().includes(category);
  if (!isValidCategory) {
    return res.status(400).json({
      status: "fail",
      message: "Invalid material category",
    });
  }
  const isValidSubCat =
    getSubtypesForPrimaryType(category).includes(subCategory);
  if (!isValidSubCat) {
    return res.status(400).json({
      status: "fail",
      message: "Invalid material name for the given category",
    });
  }

  // Create material object
  let materialData = {};
  if (quantity && !weight) {
    materialData = {
      category,
      subCategory,
      name,
      quantity: parseFloat(quantity),
      cuValue: parseFloat(cuValue),
      natPoints: parseFloat(natPoints),
      isActive: true,
    };
  } else if (weight && !quantity) {
    materialData = {
      category,
      subCategory,
      name,
      weight: parseFloat(weight),
      cuValue: parseFloat(cuValue),
      natPoints: parseFloat(natPoints),
      isActive: true,
    };
  }

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

exports.getSubtypesForPrimaryType = catchAsync(async (req, res) => {
  const primaryType = req.params.primaryType;

  const isValidPrimaryType = getPrimaryMaterialTypes().includes(primaryType);
  if (!isValidPrimaryType) {
    return res.status(400).json({
      status: "fail",
      message: "Invalid primary material type",
    });
  }

  const subtypes = getSubtypesForPrimaryType(primaryType);

  res.status(200).json({
    status: "success",
    data: {
      subtypes,
    },
  });
});

exports.getPrimaryMaterialTypes = catchAsync(async (req, res) => {
  const primaryTypes = getPrimaryMaterialTypes();

  res.status(200).json({
    status: "success",
    data: {
      primaryTypes,
    },
  });
});
