const { catchAsync } = require('../utility/catchAsync');
const campaignService = require('../service/campaignService');
const cloudinaryUpload = require('../config/cloudinaryUpload');

/**
 * Create a new campaign
 */
exports.createCampaign = catchAsync(async (req, res) => {
  console.log("🔥REQ BODY", req.body)
  const {
    name,
    organizationName,
    description,
    startDate,
    endDate,
    isIndefinite,
    status,
    goal,
    materialTypes,
    locations: locationsRaw
  } = req.body;

  // Parse isIndefinite
  const isIndefiniteFlag = isIndefinite === 'true';

  // Parse locations if it's a string
  let locations;
  try {
    locations = typeof locationsRaw === 'string' ? JSON.parse(locationsRaw) : locationsRaw;
    console.log("🔥PARSED LOCATIONS IN CONTROLLER:", locations);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid locations format'
    });
  }

  // Validate and upload image if provided
  let image = null;
  if (req.file) {
    const result = await cloudinaryUpload.image(req.file.path);
    if (!result) {
      return res.status(400).json({
        success: false,
        message: 'Error uploading image'
      });
    }
    image = {
      public_id: result.public_id,
      url: result.secure_url
    };
  } else {
    console.log("Image upload skipped, no file provided", req.file);
    return res.status(400).json({
      success: false,
      message: 'Image is required'
    });
  }

  // Validate locations array
  if (!locations || !Array.isArray(locations) || locations.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'At least one location is required'
    });
  }

  // Validate each location
  for (const location of locations) {
    const hasSimpleDropoff = location.simpleDropoffLocationId;
    const hasDropoff = location.dropoffLocationId;
    const hasCustom = location.customLocation &&
      location.customLocation.coordinates &&
      location.customLocation.coordinates.length === 2;

    if (!hasSimpleDropoff && !hasDropoff && !hasCustom) {
      return res.status(400).json({
        success: false,
        message: 'Each location must have either a linked location ID or custom coordinates'
      });
    }
  }

  const campaignData = {
    name,
    organizationName,
    description,
    startDate,
    ...(isIndefiniteFlag ? {} : { endDate }),  // Only include endDate if not indefinite
    isIndefinite: isIndefiniteFlag,
    status,
    goal,
    materialTypes,
    locations,
    image
  };

  const newCampaign = await campaignService.createCampaign(campaignData);

  res.status(201).json({
    success: true,
    message: 'Campaign created successfully',
    data: newCampaign
  });
});

/**
 * Get all campaigns with pagination and filtering
 */
exports.getCampaigns = catchAsync(async (req, res) => {
  const {
    page,
    limit,
    status,
    materialType,
    organizationName,
    sortBy,
    sortOrder,
    includeInactive
  } = req.query;

  const options = {
    page,
    limit,
    status,
    materialType,
    organizationName,
    sortBy,
    sortOrder,
    includeInactive: includeInactive === 'true'
  };

  const campaigns = await campaignService.getCampaigns(options);

  res.status(200).json({
    success: true,
    message: 'Campaigns fetched successfully',
    data: campaigns
  });
});

/**
 * Get nearby campaigns based on location
 */
exports.getNearbyCampaigns = catchAsync(async (req, res) => {
  const { latitude, longitude, radius, limit, materialType, status } = req.query;

  const options = {
    radius,
    limit,
    materialType: materialType, // Map materialType from request to materialType for service
    status
  };

  const campaigns = await campaignService.getNearbyCampaigns(
    parseFloat(latitude),
    parseFloat(longitude),
    options
  );

  res.status(200).json({
    success: true,
    message: 'Nearby campaigns fetched successfully',
    data: campaigns
  });
});

/**
 * Get campaign by ID with statistics
 */
exports.getCampaignById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await campaignService.getCampaignById(id);

  res.status(200).json({
    success: true,
    message: 'Campaign fetched successfully',
    data: result
  });
});

/**
 * Update campaign
 */
exports.updateCampaign = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Parse locations if it's a string
  if (updateData.locations && typeof updateData.locations === 'string') {
    try {
      updateData.locations = JSON.parse(updateData.locations);
      console.log("🔥PARSED LOCATIONS IN UPDATE:", updateData.locations);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid locations format'
      });
    }
  }

  // Handle image upload if provided
  if (req.file) {
    const result = await cloudinaryUpload.image(req.file.path);
    if (!result) {
      return res.status(400).json({
        success: false,
        message: 'Error uploading image'
      });
    }
    updateData.image = {
      public_id: result.public_id,
      url: result.secure_url
    };
  }

  const updatedCampaign = await campaignService.updateCampaign(id, updateData);

  res.status(200).json({
    success: true,
    message: 'Campaign updated successfully',
    data: updatedCampaign
  });
});

/**
 * Delete campaign
 */
exports.deleteCampaign = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await campaignService.deleteCampaign(id);

  res.status(200).json({
    success: true,
    ...result
  });
});

/**
 * Get campaign contributors
 */
exports.getCampaignContributors = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { page, limit } = req.query;

  const options = { page, limit };
  const result = await campaignService.getCampaignContributors(id, options);

  res.status(200).json({
    success: true,
    message: 'Campaign contributors fetched successfully',
    data: result
  });
});

/**
 * Get detailed contributor information for a specific campaign
 * @route GET /api/campaigns/:id/contributors/details
 * @access Admin only
 */
exports.getCampaignContributorsDetails = catchAsync(async (req, res) => {
  const { id: campaignId } = req.params;
  const { page, limit } = req.query;

  const result = await campaignService.getCampaignContributorsDetails(campaignId, {
    page,
    limit
  });

  return res.status(200).json({
    success: true,
    message: 'Campaign contributors details fetched successfully',
    data: result
  });
});

/**
 * Get campaign statistics
 */
exports.getCampaignStats = catchAsync(async (req, res) => {
  const { startDate, endDate, status, itemType } = req.query;

  const filters = { startDate, endDate, status, materialType: itemType };
  const stats = await campaignService.getCampaignStats(filters);

  res.status(200).json({
    success: true,
    message: 'Campaign statistics fetched successfully',
    data: stats
  });
});

/**
 * Create a drop-off directly at a campaign location
 */
exports.createCampaignDropOff = catchAsync(async (req, res) => {
  console.log(req.body, "THE BODY")
  const { id: campaignId } = req.params;
  const {
    materialType,
    dropOffQuantity,
    description,
    latitude,
    longitude,
    campaignLocationIndex,
    locationId,
    locationType,
    locationCoordinates,
    customLocationName,
    customLocationAddress
  } = req.body;

  // Validate required fields
  if (!materialType || !dropOffQuantity || !latitude || !longitude) {
    return res.status(400).json({
      success: false,
      message: "Material type, drop-off quantity, and GPS coordinates are required"
    });
  }

  // Validate campaign location information
  if (campaignLocationIndex === undefined || locationType === undefined) {
    return res.status(400).json({
      success: false,
      message: "Campaign location index and location type are required"
    });
  }

  // Validate location ID for linked locations
  if ((locationType === 'simple' || locationType === 'centre') && !locationId) {
    return res.status(400).json({
      success: false,
      message: "Location ID is required for linked dropoff locations"
    });
  }

  // Validate custom location details
  if (locationType === 'custom' && (!customLocationAddress || !locationCoordinates)) {
    return res.status(400).json({
      success: false,
      message: "Custom location address and coordinates are required for custom locations"
    });
  }

  // Validate and upload proof picture
  let proofPicture = null;
  if (req.file) {
    const result = await cloudinaryUpload.image(req.file.path);
    if (!result) {
      return res.status(400).json({
        success: false,
        message: 'Error uploading proof picture'
      });
    }
    proofPicture = {
      public_id: result.public_id,
      url: result.secure_url
    };
  }

  // Validate coordinates
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return res.status(400).json({
      success: false,
      message: "Invalid coordinates provided"
    });
  }

  // Parse location coordinates if provided
  let parsedLocationCoordinates = null;
  if (locationCoordinates) {
    try {
      parsedLocationCoordinates = JSON.parse(locationCoordinates);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid location coordinates format"
      });
    }
  }

  const dropOffData = {
    materialType: materialType,
    dropOffQuantity,
    description,
    latitude,
    longitude,
    proofPicture,
    // Campaign location details
    campaignLocationIndex: parseInt(campaignLocationIndex),
    locationId,
    locationType,
    locationCoordinates: parsedLocationCoordinates,
    customLocationName,
    customLocationAddress
  };

  const newDropOff = await campaignService.createCampaignDropOff(req.user._id, campaignId, dropOffData);

  console.log("Campaign dropoff response data:", {
    pointsEarned: newDropOff.pointsEarned,
    carbonUnits: newDropOff.pointsEarned
  });

  res.status(201).json({
    success: true,
    message: 'Campaign drop-off completed successfully! You earned extra CU for participating in this campaign.',
    data: {
      ...newDropOff.toObject(),
      carbonUnits: newDropOff.pointsEarned
    }
  });
});

/**
 * Get all campaign dropoffs
 * @route GET /api/campaigns/dropoffs
 * @access Admin only
 */
exports.getCampaignDropOffs = catchAsync(async (req, res) => {
  const {
    page,
    limit,
    campaignId,
    userId,
    startDate,
    endDate,
    sortBy,
    sortOrder
  } = req.query;

  const options = {
    page,
    limit,
    userId,
    startDate,
    endDate,
    sortBy,
    sortOrder
  };

  const result = await campaignService.getAllCampaignDropOffs(options);
  console.log("🚀 ~ exports.getCampaignDropOffs=catchAsync ~ result:", result)

  return res.status(200).json({
    success: true,
    message: 'Campaign dropoffs fetched successfully',
    data: result
  });
});

/**
 * Get all dropoffs for a specific campaign
 */
exports.getCampaignDropOffsById = catchAsync(async (req, res) => {
  const { id: campaignId } = req.params;
  const {
    page,
    limit,
    startDate,
    endDate,
    sortBy,
    sortOrder
  } = req.query;

  const options = {
    page,
    limit,
    startDate,
    endDate,
    sortBy,
    sortOrder
  };

  const result = await campaignService.getCampaignDropOffs(campaignId, options);

  return res.status(200).json({
    success: true,
    message: 'Campaign dropoffs fetched successfully',
    data: result
  });
});

/**
 * Alias for getCampaignById (backward compatibility)
 */
exports.getCampaign = exports.getCampaignById;

/**
 * Alias for getCampaignContributors (backward compatibility)
 */
exports.getContributors = exports.getCampaignContributors;
