const SimpleDropOff = require("../models/simpleDropOffModel.js");
const SimpleDropOffLocation = require("../models/simpleDropOffLocationModel.js");
const Material = require("../models/materialModel.js");
const User = require("../models/userModel.js");
const { getPrimaryMaterialTypes } = require("../models/enums/materialTypeHierarchy.js");

/**
 * Create a new simple drop-off entry
 */
async function createSimpleDropOff(userId, dropOffData) {
  try {
    const { simpleDropOffLocationId, materialType, quantity, proofPicture, gpsCoordinates } = dropOffData;

    // Validate material type
    if (!getPrimaryMaterialTypes().includes(materialType)) {
      throw new Error(`Invalid material type: ${materialType}`);
    }

    // Verify the location exists and is active
    const location = await SimpleDropOffLocation.findById(simpleDropOffLocationId);
    if (!location || !location.isActive) {
      throw new Error("Simple drop-off location not found or inactive");
    }

    // Check if location accepts this material type
    if (location.materialType !== materialType) {
      throw new Error(`This location only accepts ${location.materialType} items`);
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Validate GPS coordinates (ensure user is near the location)
    const distanceToLocation = calculateDistance(
      gpsCoordinates.coordinates[1], // latitude
      gpsCoordinates.coordinates[0], // longitude
      location.location.coordinates[1],
      location.location.coordinates[0]
    );

    // // Allow 100m tolerance
    // if (distanceToLocation > 0.1) { // 0.1 km = 100m
    //   throw new Error("You must be within 100 meters of the drop-off location");
    // }

    // Check daily drop-off limit per user per location
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayDropOffs = await SimpleDropOff.countDocuments({
      user: userId,
      simpleDropOffLocation: simpleDropOffLocationId,
      createdAt: { $gte: today, $lt: tomorrow }
    });

    if (todayDropOffs >= (location.maxItemsPerDropOff || 5)) {
      throw new Error(`Daily limit reached for this location (max ${location.maxItemsPerDropOff || 5} items per day)`);
    }

    // Calculate CU earned
    const cuEarned = await calculateSimpleCU(materialType, quantity || 1);

    // Create the simple drop-off
    const simpleDropOff = new SimpleDropOff({
      user: userId,
      simpleDropOffLocation: simpleDropOffLocationId,
      materialType,
      quantity: quantity || 1,
      proofPicture,
      cuEarned,
      gpsCoordinates: gpsCoordinates,
      isVerified: !location.verificationRequired // Auto-verify if location doesn't require verification
    });

    const savedDropOff = await simpleDropOff.save();

    // Update user's CU if auto-verified
    if (!location.verificationRequired) {
      await updateUserSimpleCU(userId, cuEarned);
    }

    return await SimpleDropOff.findById(savedDropOff._id)
      .populate('user', 'name email')
      .populate('simpleDropOffLocation', 'name materialType organizationName');

  } catch (error) {
    console.error("Error creating simple drop-off:", error);
    throw error;
  }
}

/**
 * Get user's simple drop-off history
 */
async function getUserSimpleDropOffs(userId, options = {}) {
  try {
    const {
      page = 1,
      limit = 10,
      materialType,
      isVerified,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const query = { user: userId };

    if (materialType) query.materialType = materialType;
    if (typeof isVerified === 'boolean') query.isVerified = isVerified;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const paginateOptions = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: sortOptions,
      populate: [
        { path: 'simpleDropOffLocation', select: 'name materialType organizationName address' }
      ]
    };

    return await SimpleDropOff.paginate(query, paginateOptions);
  } catch (error) {
    console.error("Error fetching user simple drop-offs:", error);
    throw error;
  }
}

/**
 * Get pending verifications for admin
 */
async function getPendingVerifications(options = {}) {
  try {
    const {
      page = 1,
      limit = 20,
      materialType,
      sortBy = 'createdAt',
      sortOrder = 'asc'
    } = options;

    const query = { isVerified: false, rejectionReason: { $exists: false } };

    if (materialType) query.materialType = materialType;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const paginateOptions = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: sortOptions,
      populate: [
        { path: 'user', select: 'name email' },
        { path: 'simpleDropOffLocation', select: 'name materialType organizationName' }
      ]
    };

    return await SimpleDropOff.paginate(query, paginateOptions);
  } catch (error) {
    console.error("Error fetching pending verifications:", error);
    throw error;
  }
}

/**
 * Verify or reject a simple drop-off
 */
async function verifyDropOff(dropOffId, isApproved, rejectionReason = null) {
  try {
    const dropOff = await SimpleDropOff.findById(dropOffId);
    if (!dropOff) {
      throw new Error("Simple drop-off not found");
    }

    if (dropOff.isVerified) {
      throw new Error("This drop-off has already been verified");
    }

    if (isApproved) {
      // Approve the drop-off
      dropOff.isVerified = true;
      dropOff.rejectionReason = undefined;

      // Update user's CU
      await updateUserSimpleCU(dropOff.user, dropOff.cuEarned);
    } else {
      // Reject the drop-off
      dropOff.isVerified = false;
      dropOff.rejectionReason = rejectionReason || "Verification failed";
    }

    await dropOff.save();

    return await SimpleDropOff.findById(dropOffId)
      .populate('user', 'name email')
      .populate('simpleDropOffLocation', 'name materialType organizationName');

  } catch (error) {
    console.error("Error verifying drop-off:", error);
    throw error;
  }
}

/**
 * Get drop-off statistics
 */
async function getDropOffStats(filters = {}) {
  try {
    const { startDate, endDate, materialType, userId } = filters;

    const matchQuery = {};

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    if (materialType) matchQuery.materialType = materialType;
    if (userId) matchQuery.user = userId;

    const stats = await SimpleDropOff.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalDropOffs: { $sum: 1 },
          verifiedDropOffs: {
            $sum: { $cond: [{ $eq: ["$isVerified", true] }, 1, 0] }
          },
          pendingDropOffs: {
            $sum: { $cond: [{ $eq: ["$isVerified", false] }, 1, 0] }
          },
          totalCUEarned: { $sum: "$cuEarned" },
          totalQuantity: { $sum: "$quantity" }
        }
      }
    ]);

    const materialTypeStats = await SimpleDropOff.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$materialType",
          count: { $sum: 1 },
          totalCU: { $sum: "$cuEarned" },
          totalQuantity: { $sum: "$quantity" }
        }
      },
      {
        $project: {
          materialType: "$_id",
          count: 1,
          totalCU: 1,
          totalQuantity: 1,
          _id: 0
        }
      }
    ]);

    const dailyStats = await SimpleDropOff.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 },
          cuEarned: { $sum: "$cuEarned" }
        }
      },
      { $sort: { "_id": 1 } },
      { $limit: 30 } // Last 30 days
    ]);

    return {
      overview: stats[0] || {
        totalDropOffs: 0,
        verifiedDropOffs: 0,
        pendingDropOffs: 0,
        totalCUEarned: 0,
        totalQuantity: 0
      },
      byMaterialType: materialTypeStats,
      dailyTrend: dailyStats
    };
  } catch (error) {
    console.error("Error fetching drop-off statistics:", error);
    throw error;
  }
}

/**
 * Calculate CU for simple drop-offs (simplified calculation)
 */
async function calculateSimpleCU(materialType, quantity = 1) {
  try {
    // Find material in database
    const material = await Material.findOne({
      category: materialType,
      isActive: true
    });

    if (!material) {
      // Default CU values if material not found
      const defaultCUValues = {
        plastic: 2,
        paper: 1.5,
        metal: 3,
        glass: 2.5,
        electronics: 5,
        textile: 1.8,
        organic: 1
      };

      return (defaultCUValues[materialType] || 1) * quantity * 0.5; // Half of regular drop-off
    }

    // Simple drop-offs earn 50% of regular CU rate
    return material.cuValue * quantity * 0.5;
  } catch (error) {
    console.error("Error calculating simple CU:", error);
    return 1; // Default minimal CU
  }
}

/**
 * Update user's CU from simple drop-offs
 */
async function updateUserSimpleCU(userId, cuAmount) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    user.carbonUnits = (user.carbonUnits || 0) + cuAmount;
    await user.save();

    return user;
  } catch (error) {
    console.error("Error updating user simple CU:", error);
    throw error;
  }
}

/**
 * Get simple drop-off by ID
 */
async function getSimpleDropOffById(dropOffId) {
  try {
    const dropOff = await SimpleDropOff.findById(dropOffId)
      .populate('user', 'name email')
      .populate('simpleDropOffLocation', 'name materialType organizationName address');

    if (!dropOff) {
      throw new Error("Simple drop-off not found");
    }

    return dropOff;
  } catch (error) {
    console.error("Error fetching simple drop-off by ID:", error);
    throw error;
  }
}

/**
 * Delete simple drop-off (admin only)
 */
async function deleteSimpleDropOff(dropOffId) {
  try {
    const dropOff = await SimpleDropOff.findById(dropOffId);
    if (!dropOff) {
      throw new Error("Simple drop-off not found");
    }

    // If it was verified, subtract CU from user
    if (dropOff.isVerified) {
      await updateUserSimpleCU(dropOff.user, -dropOff.cuEarned);
    }

    await SimpleDropOff.findByIdAndDelete(dropOffId);
    return { message: "Simple drop-off deleted successfully" };
  } catch (error) {
    console.error("Error deleting simple drop-off:", error);
    throw error;
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

module.exports = {
  createSimpleDropOff,
  getUserSimpleDropOffs,
  getPendingVerifications,
  verifyDropOff,
  getDropOffStats,
  calculateSimpleCU,
  updateUserSimpleCU,
  getSimpleDropOffById,
  deleteSimpleDropOff
};
