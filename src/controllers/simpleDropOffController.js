const { catchAsync } = require("../utility/catchAsync.js");
const SimpleDropOff = require("../models/simpleDropOffModel.js");
const simpleDropOffService = require("../service/simpleDropOffService.js");
const cloudinaryUpload = require("../config/cloudinaryUpload.js");

/**
 * Create a new simple drop-off
 */
exports.createSimpleDropOff = catchAsync(async (req, res) => {
  const {
    simpleDropOffLocationId,
    materialType,
    quantity,
    latitude,
    longitude
  } = req.body;

  // Validate required fields
  if (!simpleDropOffLocationId || !materialType || !latitude || !longitude) {
    return res.status(400).json({
      success: false,
      message: "Location ID, material type, and coordinates are required"
    });
  }

  // Validate proof picture
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Proof picture is required"
    });
  }

  // Validate coordinates
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return res.status(400).json({
      success: false,
      message: "Invalid coordinates provided"
    });
  }

  try {
    // Determine if the file is a video or an image
    const isVideo = req.file.mimetype.startsWith('video/');

    // Upload proof picture/video to Cloudinary using appropriate method
    const result = isVideo
      ? await cloudinaryUpload.video(req.file.path)
      : await cloudinaryUpload.image(req.file.path);

    if (!result) {
      return res.status(400).json({
        success: false,
        message: "Error uploading proof media"
      });
    }

    const dropOffData = {
      simpleDropOffLocationId,
      materialType,
      quantity: quantity ? parseInt(quantity) : 1,
      proofPicture: {
        public_id: result.public_id,
        url: result.secure_url,
        resource_type: isVideo ? 'video' : 'image'
      },
      gpsCoordinates: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      }
    };

    const newDropOff = await simpleDropOffService.createSimpleDropOff(req.user._id, dropOffData);

    res.status(201).json({
      success: true,
      message: "Simple drop-off created successfully",
      data: newDropOff
    });

  } catch (error) {
    console.error("Error creating simple drop-off:", error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get user's simple drop-off history
 */
exports.getUserSimpleDropOffs = catchAsync(async (req, res) => {
  console.log(req.query, "User Simple Drop Offs Query");
  const {
    page,
    limit,
    materialType,
    isVerified,
    sortBy,
    sortOrder
  } = req.query;

  const options = {
    page,
    limit,
    materialType,
    isVerified: isVerified === 'true' ? true : isVerified === 'false' ? false : undefined,
    sortBy,
    sortOrder
  };

  const result = await simpleDropOffService.getUserSimpleDropOffs(req.user._id, options);

  res.status(200).json({
    success: true,
    message: "User simple drop-offs fetched successfully",
    data: result
  });
});

/**
 * Get pending verifications (Admin only)
 */
exports.getPendingVerifications = catchAsync(async (req, res) => {
  const {
    page,
    limit,
    materialType,
    sortBy,
    sortOrder
  } = req.query;

  const options = {
    page,
    limit,
    materialType,
    sortBy,
    sortOrder
  };

  const result = await simpleDropOffService.getPendingVerifications(options);

  res.status(200).json({
    success: true,
    message: "Pending verifications fetched successfully",
    data: result
  });
});

/**
 * Verify or reject a simple drop-off (Admin only)
 */
exports.verifyDropOff = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { isApproved, rejectionReason } = req.body;

  if (typeof isApproved !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: "isApproved field must be a boolean value"
    });
  }

  if (!isApproved && !rejectionReason) {
    return res.status(400).json({
      success: false,
      message: "Rejection reason is required when rejecting a drop-off"
    });
  }

  const verifiedDropOff = await simpleDropOffService.verifyDropOff(id, isApproved, rejectionReason);

  res.status(200).json({
    success: true,
    message: `Drop-off ${isApproved ? 'approved' : 'rejected'} successfully`,
    data: verifiedDropOff
  });
});

/**
 * Get simple drop-off by ID
 */
exports.getSimpleDropOffById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const dropOff = await simpleDropOffService.getSimpleDropOffById(id);

  // Check if user can access this drop-off (owner or admin)
  if (dropOff.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: "Access denied"
    });
  }

  res.status(200).json({
    success: true,
    message: "Simple drop-off fetched successfully",
    data: dropOff
  });
});

/**
 * Get drop-off statistics
 */
exports.getDropOffStats = catchAsync(async (req, res) => {
  const { startDate, endDate, materialType, userId } = req.query;

  // For non-admin users, only allow their own stats
  const filters = {
    startDate,
    endDate,
    materialType,
    userId: req.user.role === 'admin' ? userId : req.user._id
  };

  const statistics = await simpleDropOffService.getDropOffStats(filters);

  res.status(200).json({
    success: true,
    message: "Drop-off statistics fetched successfully",
    data: statistics
  });
});

/**
 * Delete simple drop-off (Admin only)
 */
exports.deleteSimpleDropOff = catchAsync(async (req, res) => {
  const { id } = req.params;

  await simpleDropOffService.deleteSimpleDropOff(id);

  res.status(200).json({
    success: true,
    message: "Simple drop-off deleted successfully"
  });
});

/**
 * Get all simple drop-offs (Admin only)
 */
exports.getAllSimpleDropOffs = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    materialType,
    isVerified,
    userId,
    startDate,
    endDate,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build query
  const query = {};

  if (materialType) query.materialType = materialType;
  if (typeof isVerified !== 'undefined') {
    query.isVerified = isVerified === 'true';
  }
  if (userId) query.user = userId;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;



  const paginateOptions = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: sortOptions,
    populate: [
      { path: 'user', select: 'name email' },
      { path: 'simpleDropOffLocation', select: 'name materialType organizationName address' }
    ]
  };
  console.log("Paginate Options:", paginateOptions, "Query:", query);

  const result = await SimpleDropOff.find(query)
    .sort(sortOptions)
    .skip((paginateOptions.page - 1) * paginateOptions.limit)
    .limit(paginateOptions.limit)
    .populate(paginateOptions.populate);

  res.status(200).json({
    success: true,
    message: "Simple drop-offs fetched successfully",
    data: result
  });
});

/**
 * Bulk verify drop-offs (Admin only)
 */
exports.bulkVerifyDropOffs = catchAsync(async (req, res) => {
  const { dropOffIds, isApproved, rejectionReason } = req.body;

  if (!Array.isArray(dropOffIds) || dropOffIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: "dropOffIds array is required and cannot be empty"
    });
  }

  if (typeof isApproved !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: "isApproved field must be a boolean value"
    });
  }

  const results = [];
  const errors = [];

  for (const dropOffId of dropOffIds) {
    try {
      const result = await simpleDropOffService.verifyDropOff(dropOffId, isApproved, rejectionReason);
      results.push(result);
    } catch (error) {
      errors.push({
        dropOffId,
        error: error.message
      });
    }
  }

  res.status(200).json({
    success: true,
    message: `Bulk verification completed. ${results.length} successful, ${errors.length} failed`,
    data: {
      successful: results,
      failed: errors
    }
  });
});
