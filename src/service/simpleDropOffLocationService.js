const SimpleDropOffLocation = require("../models/simpleDropOffLocationModel.js");
const { getPrimaryMaterialTypes } = require("../models/enums/materialTypeHierarchy.js");

/**
 * Create a new simple drop-off location
 */
async function createSimpleDropOffLocation(locationData) {
  try {
    console.log("Creating simple drop-off location with data:", locationData.bulkMaterialTypes);
    let materialTypes = locationData.bulkMaterialTypes;
    let processedMaterialTypes = [];

    // If bulkMaterialTypes is "All", get all primary material types
    if (locationData.bulkMaterialTypes && Array.isArray(locationData.bulkMaterialTypes) && locationData.bulkMaterialTypes.length === 1 && locationData.bulkMaterialTypes[0] === "All") {
      processedMaterialTypes = getPrimaryMaterialTypes();
    }
    //otherwise
    else if (locationData.bulkMaterialTypes && Array.isArray(locationData.bulkMaterialTypes) && locationData.bulkMaterialTypes.length > 0) {
      const validTypes = getPrimaryMaterialTypes();
      const invalidTypes = locationData.bulkMaterialTypes.filter(type => !validTypes.includes(type));
      if (invalidTypes.length > 0) {
        throw new Error(`Invalid bulk material types: ${invalidTypes.join(", ")}`);
      }

      processedMaterialTypes = locationData.bulkMaterialTypes;
    }

    console.log("Processed Material Types:", processedMaterialTypes);

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
    console.log(locationData, processedMaterialTypes);
    const newLocation = new SimpleDropOffLocation({
      name: locationData.name,
      location: locationData.location,
      address: locationData.address,
      acceptedSubtypes: locationData.acceptedSubtypes || [],
      organizationName: locationData.organizationName,
      verificationRequired: locationData.verificationRequired || false,
      maxItemsPerDropOff: locationData.maxItemsPerDropOff || 20,
      operatingHours: locationData.operatingHours?.trim(),
      contactNumber: locationData.contactNumber?.trim(),
      createdAt: new Date(),
      lastUpdated: new Date(),
      isActive: true,
      lastVerified: new Date(),
      materialType: locationData.materialType,
      bulkMaterialTypes: processedMaterialTypes,
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

    // Filter by material type if provided - check if materialType is in the bulkMaterialTypes array
    if (materialType) {
      query.bulkMaterialTypes = { $in: [materialType] };
    }
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

    console.log("Paginate Options:", paginateOptions, "Query:", query);

    return await SimpleDropOffLocation.find(query)
      .sort(sortOptions)
      .skip((paginateOptions.page - 1) * paginateOptions.limit)
      .limit(paginateOptions.limit)
      .populate(paginateOptions.populate);
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

    // Process bulkMaterialTypes if provided
    if (updateData.bulkMaterialTypes) {
      let processedMaterialTypes = [];

      // If bulkMaterialTypes contains 'All', include all available material types
      if (Array.isArray(updateData.bulkMaterialTypes) && updateData.bulkMaterialTypes.length === 1 && updateData.bulkMaterialTypes[0] === 'All') {
        processedMaterialTypes = getPrimaryMaterialTypes();
      }
      // Otherwise validate each material type
      else if (Array.isArray(updateData.bulkMaterialTypes)) {
        const validTypes = getPrimaryMaterialTypes();
        const invalidTypes = updateData.bulkMaterialTypes.filter(type => !validTypes.includes(type));

        if (invalidTypes.length > 0) {
          throw new Error(`Invalid bulk material types: ${invalidTypes.join(', ')}`);
        }

        processedMaterialTypes = updateData.bulkMaterialTypes;
      }

      updateData.bulkMaterialTypes = processedMaterialTypes;
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

    // Filter by material type if provided - check if materialType is in the bulkMaterialTypes array
    if (materialType) {
      query.bulkMaterialTypes = { $in: [materialType] };
    }
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
    console.log("Verifying location status:", locationId, isVerified);
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
      { $unwind: "$bulkMaterialTypes" },
      {
        $group: {
          _id: "$bulkMaterialTypes",
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

/**
 * Search simple drop-off locations for campaign creation
 */
async function searchLocations({ search, limit = 10, page = 1 }) {
  try {
    let query = { isActive: true };

    if (search) {
      query = {
        ...query,
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { address: { $regex: search, $options: 'i' } },
          { organizationName: { $regex: search, $options: 'i' } },
          { materialType: { $regex: search, $options: 'i' } },
          { bulkMaterialTypes: { $in: [new RegExp(search, 'i')] } }
        ]
      };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      select: 'name address organizationName materialType bulkMaterialTypes location acceptedSubtypes verificationRequired',
      sort: { name: 1 }
    };

    const result = await SimpleDropOffLocation.paginate(query, options);
    return result;
  } catch (error) {
    throw new Error(`Error searching simple drop-off locations: ${error.message}`);
  }
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
  getLocationStatistics,
  searchLocations
};
