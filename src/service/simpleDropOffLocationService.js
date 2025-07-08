const SimpleDropOffLocation = require("../models/simpleDropOffLocationModel");
const { getPrimaryMaterialTypes } = require("../models/enums/materialTypeHierarchy");

/**
 * Create a new simple drop-off location
 */
async function createSimpleDropOffLocation(locationData) {
  try {
    // Validate material type
    if (!getPrimaryMaterialTypes().includes(locationData.materialType)) {
      throw new Error(`Invalid material type: ${locationData.materialType}`);
    }

    // Check for duplicate location within 50m radius
    const nearbyLocations = await SimpleDropOffLocation.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: locationData.location.coordinates
          },
          $maxDistance: 50 // 50 meters
        }
      },
      isActive: true
    });

    if (nearbyLocations.length > 0) {
      throw new Error("A location already exists within 50 meters of this position");
    }

    const newLocation = new SimpleDropOffLocation({
      ...locationData,
      lastVerified: new Date()
    });

    return await newLocation.save();
  } catch (error) {
    console.error("Error creating simple drop-off location:", error);
    throw error;
  }
}

/**
 * Get all simple drop-off locations with pagination and filters
 */
async function getAllSimpleDropOffLocations(options = {}) {
  try {
    const {
      page = 1,
      limit = 10,
      materialType,
      isActive,
      organizationName,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const query = {};

    if (materialType) query.materialType = materialType;
    if (typeof isActive === 'boolean') query.isActive = isActive;
    if (organizationName) {
      query.organizationName = { $regex: organizationName, $options: 'i' };
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const paginateOptions = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: sortOptions,
      populate: []
    };

    return await SimpleDropOffLocation.paginate(query, paginateOptions);
  } catch (error) {
    console.error("Error fetching simple drop-off locations:", error);
    throw error;
  }
}

/**
 * Get simple drop-off location by ID
 */
async function getSimpleDropOffLocationById(locationId) {
  try {
    const location = await SimpleDropOffLocation.findById(locationId);
    if (!location) {
      throw new Error("Simple drop-off location not found");
    }
    return location;
  } catch (error) {
    console.error("Error fetching simple drop-off location by ID:", error);
    throw error;
  }
}

/**
 * Update simple drop-off location
 */
async function updateSimpleDropOffLocation(locationId, updateData) {
  try {
    // Validate material type if being updated
    if (updateData.materialType && !getPrimaryMaterialTypes().includes(updateData.materialType)) {
      throw new Error(`Invalid material type: ${updateData.materialType}`);
    }

    const updatedLocation = await SimpleDropOffLocation.findByIdAndUpdate(
      locationId,
      { ...updateData, lastVerified: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedLocation) {
      throw new Error("Simple drop-off location not found");
    }

    return updatedLocation;
  } catch (error) {
    console.error("Error updating simple drop-off location:", error);
    throw error;
  }
}

/**
 * Soft delete simple drop-off location
 */
async function deleteSimpleDropOffLocation(locationId) {
  try {
    const deletedLocation = await SimpleDropOffLocation.findByIdAndUpdate(
      locationId,
      { isActive: false },
      { new: true }
    );

    if (!deletedLocation) {
      throw new Error("Simple drop-off location not found");
    }

    return deletedLocation;
  } catch (error) {
    console.error("Error deleting simple drop-off location:", error);
    throw error;
  }
}

/**
 * Get nearby simple drop-off locations for a user
 */
async function getNearbySimpleDropOffLocations(userCoordinates, options = {}) {
  try {
    const {
      radius = 5000, // 5km default
      materialType,
      limit = 20,
      organizationName
    } = options;

    const query = {
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [userCoordinates.longitude, userCoordinates.latitude]
          },
          $maxDistance: radius
        }
      },
      isActive: true
    };

    if (materialType) query.materialType = materialType;
    if (organizationName) {
      query.organizationName = { $regex: organizationName, $options: 'i' };
    }

    const locations = await SimpleDropOffLocation.find(query)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Add distance calculation for each location
    const locationsWithDistance = locations.map(location => {
      const distance = calculateDistance(
        userCoordinates.latitude,
        userCoordinates.longitude,
        location.location.coordinates[1],
        location.location.coordinates[0]
      );

      return {
        ...location.toJSON(),
        distance: Math.round(distance * 100) / 100 // Round to 2 decimal places
      };
    });

    return locationsWithDistance;
  } catch (error) {
    console.error("Error fetching nearby simple drop-off locations:", error);
    throw error;
  }
}

/**
 * Verify location status (admin function)
 */
async function verifyLocationStatus(locationId, isVerified) {
  try {
    const updatedLocation = await SimpleDropOffLocation.findByIdAndUpdate(
      locationId,
      {
        lastVerified: new Date(),
        isActive: isVerified
      },
      { new: true }
    );

    if (!updatedLocation) {
      throw new Error("Simple drop-off location not found");
    }

    return updatedLocation;
  } catch (error) {
    console.error("Error verifying location status:", error);
    throw error;
  }
}

/**
 * Get location statistics
 */
async function getLocationStatistics() {
  try {
    const stats = await SimpleDropOffLocation.aggregate([
      {
        $group: {
          _id: null,
          totalLocations: { $sum: 1 },
          activeLocations: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] }
          },
          inactiveLocations: {
            $sum: { $cond: [{ $eq: ["$isActive", false] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalLocations: 1,
          activeLocations: 1,
          inactiveLocations: 1
        }
      }
    ]);

    const materialTypeStats = await SimpleDropOffLocation.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$materialType",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          materialType: "$_id",
          count: 1,
          _id: 0
        }
      }
    ]);

    return {
      overview: stats[0] || { totalLocations: 0, activeLocations: 0, inactiveLocations: 0 },
      byMaterialType: materialTypeStats
    };
  } catch (error) {
    console.error("Error fetching location statistics:", error);
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
  createSimpleDropOffLocation,
  getAllSimpleDropOffLocations,
  getSimpleDropOffLocationById,
  updateSimpleDropOffLocation,
  deleteSimpleDropOffLocation,
  getNearbySimpleDropOffLocations,
  verifyLocationStatus,
  getLocationStatistics
};
