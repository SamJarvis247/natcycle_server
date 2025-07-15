const Material = require("../models/materialModel");
const User = require("../models/userModel");

// Calculate CU for a specific material and quantity
async function calculateCU(materialCategory, materialSpecific, quantity) {
  try {
    // Find the material in the database
    let materialQuery = {
      category: materialCategory,
      isActive: true,
    };

    if (materialSpecific) {
      materialQuery.subCategory = materialSpecific;
    }

    console.log(materialQuery, "Material Query");
    const material = await Material.findOne(materialQuery);

    if (!material) {
      throw new Error(`Material not found: ${materialCategory}`);
    }

    // Calculate CU based on material's CU value and quantity
    const totalCU = material.cuValue * (quantity / 2);

    return {
      material,
      totalCU,
    };
  } catch (error) {
    console.error("Error calculating CU:", error);
    throw error;
  }
}

// Update a user's CU based on recycled items
async function updateUserCU(
  userId,
  materialCategory,
  quantity,
  materialSpecific
) {
  try {
    const { totalCU } = await calculateCU(
      materialCategory,
      materialSpecific,
      quantity
    );

    // Update user's carbon units
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Update the specific item count
    const itemsCount = { ...user.itemsCount };
    itemsCount[materialCategory] =
      (itemsCount[materialCategory] || 0) + quantity;

    // Update user with new CU and item count
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $inc: {
          carbonUnits: totalCU,
          totalItemsCollected: quantity,
        },
        itemsCount,
      },
      { new: true }
    );

    return {
      addedCU: totalCU,
      newTotalCU: updatedUser.carbonUnits,
      itemsCount: updatedUser.itemsCount,
    };
  } catch (error) {
    console.error("Error updating user CU:", error);
    throw error;
  }
}

// Recalculate CU for all users based on their item counts
async function recalculateAllUsersCU() {
  try {
    const users = await User.find({});
    const materials = await Material.find({ isActive: true });

    // Create a map for quick material lookup
    const materialMap = {};
    materials.forEach((material) => {
      if (!materialMap[material.category]) {
        materialMap[material.category] = [];
      }
      materialMap[material.category].push(material);
    });

    // Default material to use if multiple exist in a category
    const defaultMaterials = {};
    Object.keys(materialMap).forEach((category) => {
      if (materialMap[category] && materialMap[category].length > 0) {
        defaultMaterials[category] = materialMap[category][0];
      }
    });

    // Process each user
    const updatePromises = users.map(async (user) => {
      let totalCU = 0;

      // Calculate CU for each material type
      Object.keys(user.itemsCount || {}).forEach((category) => {
        const count = user.itemsCount[category] || 0;
        if (count > 0 && defaultMaterials[category]) {
          totalCU += defaultMaterials[category].cuValue * count;
        }
      });

      // Update user with calculated CU
      return User.findByIdAndUpdate(user._id, { carbonUnits: totalCU });
    });

    await Promise.all(updatePromises);

    return {
      message: "All users CU values recalculated successfully",
      usersProcessed: users.length,
    };
  } catch (error) {
    console.error("Error recalculating all users CU:", error);
    throw error;
  }
}

//CU to NATPOINTS CONVERSION(1CU = 5NATPOINTS)
async function convertCUToNatPoints(cuValue) {
  try {
    const natPoints = cuValue * 1.5;
    return natPoints;
  } catch (error) {
    console.error("Error converting CU to NatPoints:", error);
    throw error;
  }
}
//update user natpoints
async function updateUserNatPoints(userId, totalCU) {
  try {
    const natPoints = await convertCUToNatPoints(totalCU);

    // Update user's carbon units
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Update user with new CU and item count
    const updatedUser = await User.findByIdAndUpdate(userId, {
      $inc: {
        pointsEarned: natPoints,
      },
    });
    return {
      natPoints: natPoints,
      newTotalCU: updatedUser.natPoints,
    };
  } catch (error) {
    console.error("Error updating user CU:", error);
    throw error;
  }
}

module.exports = {
  calculateCU,
  updateUserCU,
  recalculateAllUsersCU,
  convertCUToNatPoints,
  updateUserNatPoints,
};
