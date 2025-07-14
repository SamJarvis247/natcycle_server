const { catchAsync } = require('../utility/catchAsync');
const campaignService = require('../service/campaignService');
const cloudinaryUpload = require('../config/cloudinaryUpload');

/**
 * Create a new campaign
 */
exports.createCampaign = catchAsync(async (req, res) => {
  const {
    name,
    organizationName,
    latitude,
    longitude,
    address,
    description,
    startDate,
    endDate,
    status,
    goal,
    itemType,
    dropOffLocationId
  } = req.body;

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
  }

  const campaignData = {
    name,
    organizationName,
    latitude,
    longitude,
    address,
    description,
    startDate,
    endDate,
    status,
    goal,
    itemType,
    dropOffLocationId,
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
    itemType,
    organizationName,
    sortBy,
    sortOrder,
    includeInactive
  } = req.query;

  const options = {
    page,
    limit,
    status,
    itemType,
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
  const { latitude, longitude, radius, limit, itemType, status } = req.query;

  const options = {
    radius,
    limit,
    itemType,
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
 * Get campaign statistics
 */
exports.getCampaignStats = catchAsync(async (req, res) => {
  const { startDate, endDate, status, itemType } = req.query;

  const filters = { startDate, endDate, status, itemType };
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
  const { id: campaignId } = req.params;
  const {
    itemType,
    dropOffQuantity,
    description,
    latitude,
    longitude
  } = req.body;

  // Validate required fields
  if (!itemType || !dropOffQuantity || !latitude || !longitude) {
    return res.status(400).json({
      success: false,
      message: "Item type, drop-off quantity, and GPS coordinates are required"
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

  const dropOffData = {
    itemType,
    dropOffQuantity,
    description,
    latitude,
    longitude,
    proofPicture
  };

  const newDropOff = await campaignService.createCampaignDropOff(req.user._id, campaignId, dropOffData);

  res.status(201).json({
    success: true,
    message: 'Campaign drop-off completed successfully! You earned extra CU for participating in this campaign.',
    data: newDropOff
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
