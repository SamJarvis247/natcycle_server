const { catchAsync } = require("../utility/catchAsync");
const simpleDropOffLocationService = require("../service/simpleDropOffLocationService");
const { getPrimaryMaterialTypes } = require("../models/enums/materialTypeHierarchy");

/**
 * Create a new simple drop-off location (Admin only)
 */
exports.createSimpleDropOffLocation = catchAsync(async (req, res) => {
  const {
    name,
    latitude,
    longitude,
    address,
    materialType,
    bulkMaterialTypes,
    acceptedSubtypes,
    organizationName,
    verificationRequired,
    maxItemsPerDropOff,
    operatingHours,
    contactNumber
  } = req.body;
  console.log("Creating simple drop-off location with data:", req.body);

  // Validate required fields
  if (!name || !latitude || !longitude || !materialType) {
    return res.status(400).json({
      success: false,
      message: "Name, coordinates, and material type are required"
    });
  }

  // Validate coordinates
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return res.status(400).json({
      success: false,
      message: "Invalid coordinates provided"
    });
  }

  const locationData = {
    name: name.trim(),
    location: {
      type: "Point",
      coordinates: [parseFloat(longitude), parseFloat(latitude)]
    },
    address: address?.trim(),
    bulkMaterialTypes: bulkMaterialTypes || [],
    acceptedSubtypes: acceptedSubtypes || [],
    organizationName: organizationName?.trim(),
    verificationRequired: verificationRequired || false,
    maxItemsPerDropOff: maxItemsPerDropOff || 20,
    operatingHours: operatingHours?.trim(),
    contactNumber: contactNumber?.trim()
  };

  const newLocation = await simpleDropOffLocationService.createSimpleDropOffLocation(locationData);

  res.status(201).json({
    success: true,
    message: "Simple drop-off location created successfully",
    data: newLocation
  });
});

/**
 * Get all simple drop-off locations with pagination (Admin)
 */
exports.getAllSimpleDropOffLocations = catchAsync(async (req, res) => {
  const {
    page,
    limit,
    materialType,
    isActive,
    organizationName,
    sortBy,
    sortOrder
  } = req.query;

  const options = {
    page,
    limit,
    materialType,
    isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    organizationName,
    sortBy,
    sortOrder
  };

  const result = await simpleDropOffLocationService.getAllSimpleDropOffLocations(options);

  res.status(200).json({
    success: true,
    message: "Simple drop-off locations fetched successfully",
    data: result
  });
});

/**
 * Get simple drop-off location by ID
 */
exports.getSimpleDropOffLocationById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const location = await simpleDropOffLocationService.getSimpleDropOffLocationById(id);

  res.status(200).json({
    success: true,
    message: "Simple drop-off location fetched successfully",
    data: location
  });
});

/**
 * Update simple drop-off location (Admin only)
 */
exports.updateSimpleDropOffLocation = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Handle coordinate updates
  if (req.body.latitude && req.body.longitude) {
    updateData.location = {
      type: "Point",
      coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
    };
    delete updateData.latitude;
    delete updateData.longitude;
  }

  const updatedLocation = await simpleDropOffLocationService.updateSimpleDropOffLocation(id, updateData);

  res.status(200).json({
    success: true,
    message: "Simple drop-off location updated successfully",
    data: updatedLocation
  });
});

/**
 * Delete simple drop-off location (Admin only)
 */
exports.deleteSimpleDropOffLocation = catchAsync(async (req, res) => {
  const { id } = req.params;

  await simpleDropOffLocationService.deleteSimpleDropOffLocation(id);

  res.status(200).json({
    success: true,
    message: "Simple drop-off location deleted successfully"
  });
});

/**
 * Get nearby simple drop-off locations for users
 */
exports.getNearbySimpleDropOffLocations = catchAsync(async (req, res) => {
  const { latitude, longitude, radius, materialType, limit, organizationName } = req.query;

  // Validate required coordinates
  if (!latitude || !longitude) {
    return res.status(400).json({
      success: false,
      message: "Latitude and longitude are required"
    });
  }

  const userCoordinates = {
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude)
  };

  // Validate coordinates
  if (userCoordinates.latitude < -90 || userCoordinates.latitude > 90 ||
    userCoordinates.longitude < -180 || userCoordinates.longitude > 180) {
    return res.status(400).json({
      success: false,
      message: "Invalid coordinates provided"
    });
  }

  const options = {
    radius: radius ? parseInt(radius) : 5000,
    materialType,
    limit: limit ? parseInt(limit) : 20,
    organizationName
  };

  const nearbyLocations = await simpleDropOffLocationService.getNearbySimpleDropOffLocations(
    userCoordinates,
    options
  );

  res.status(200).json({
    success: true,
    message: "Nearby simple drop-off locations fetched successfully",
    data: nearbyLocations,
    count: nearbyLocations.length
  });
});

/**
 * Verify location status (Admin only)
 */
exports.verifyLocationStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { isVerified } = req.body;

  if (typeof isVerified !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: "isVerified field must be a boolean value"
    });
  }

  const updatedLocation = await simpleDropOffLocationService.verifyLocationStatus(id, isVerified);

  res.status(200).json({
    success: true,
    message: `Location ${isVerified ? 'verified' : 'marked as inactive'} successfully`,
    data: updatedLocation
  });
});

/**
 * Get location statistics (Admin only)
 */
exports.getLocationStatistics = catchAsync(async (req, res) => {
  const statistics = await simpleDropOffLocationService.getLocationStatistics();

  res.status(200).json({
    success: true,
    message: "Location statistics fetched successfully",
    data: statistics
  });
});

/**
 * Get all supported material types
 */
exports.getSupportedMaterialTypes = catchAsync(async (req, res) => {
  const materialTypes = getPrimaryMaterialTypes();

  res.status(200).json({
    success: true,
    message: "Supported material types fetched successfully",
    data: materialTypes
  });
});

/**
 * Search simple drop-off locations for campaign creation
 */
exports.searchSimpleDropOffLocations = catchAsync(async (req, res) => {
  const { search, limit = 10, page = 1 } = req.query;

  const searchResults = await simpleDropOffLocationService.searchLocations({
    search,
    limit: parseInt(limit),
    page: parseInt(page)
  });

  res.status(200).json({
    success: true,
    message: "Simple drop-off locations retrieved successfully",
    data: searchResults.docs,
    pagination: {
      currentPage: searchResults.page,
      totalPages: searchResults.totalPages,
      totalItems: searchResults.totalDocs,
      hasNext: searchResults.hasNextPage,
      hasPrev: searchResults.hasPrevPage
    }
  });
});
