const Campaign = require('../models/campaignModel');
const DropOffLocation = require('../models/dropOffLocationModel');
const PickUp = require('../models/pickUpModel');
const DropOff = require('../models/dropOffModel');
const User = require('../models/userModel');
const { getPrimaryMaterialTypes } = require('../models/enums/materialTypeHierarchy');

/**
 * Create a new campaign
 */
async function createCampaign(campaignData) {
  try {
    const { name, organizationName, latitude, longitude, address, description, startDate, endDate, status, goal, dropOffLocationId, image } = campaignData;
    let materialTypes = campaignData.materialTypes;

    // Check if campaign name already exists
    const existingCampaign = await Campaign.findOne({ name });
    if (existingCampaign) {
      throw new Error('Campaign with this name already exists');
    }

    // Process materialTypes array
    let processedMaterialTypes = [];
    if (materialTypes === "All") {
      console.log("true")
      materialTypes = [materialTypes];
    }

    // If materialTypes contains 'All', include all available material types
    if (materialTypes.length === 1 && materialTypes[0] === 'All') {
      console.log("Material Type is All");
      processedMaterialTypes = getPrimaryMaterialTypes();
      console.log("🚀 ~ createCampaign ~ processedMaterialTypes:", processedMaterialTypes);
    }
    // Otherwise validate each material type
    else if (materialTypes && Array.isArray(materialTypes)) {
      const validTypes = getPrimaryMaterialTypes();
      const invalidTypes = materialTypes.filter(type => !validTypes.includes(type));

      if (invalidTypes.length > 0) {
        throw new Error(`Invalid material types: ${invalidTypes.join(', ')}`);
      }

      processedMaterialTypes = materialTypes;
    }

    // Verify drop-off location exists if provided
    let dropOffLocation = null;
    if (dropOffLocationId) {
      dropOffLocation = await DropOffLocation.findById(dropOffLocationId);
      if (!dropOffLocation) {
        throw new Error('Drop-off location not found');
      }
    }

    // Validate dates
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    if (end && start >= end) {
      throw new Error('End date must be after start date');
    }

    // Create the campaign
    const campaign = new Campaign({
      name,
      organizationName,
      description,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      address,
      startDate: start,
      endDate: end,
      status: status || 'active',
      materialTypes: processedMaterialTypes,
      goal: goal || 0,
      image,
      dropOffLocation: dropOffLocationId || null
    });

    const savedCampaign = await campaign.save();

    return await Campaign.findById(savedCampaign._id)
      .populate('dropOffLocation', 'name address materialType');

  } catch (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }
}

/**
 * Get campaigns with pagination and filtering
 */
async function getCampaigns(options = {}) {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      materialType,
      organizationName,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeInactive = false
    } = options;

    const query = {}; if (status) query.status = status;

    // Filter by material type if provided
    if (materialType) {
      query.materialTypes = { $in: [materialType] }; // Check if materialType is in the array
    }

    if (organizationName) query.organizationName = { $regex: organizationName, $options: 'i' };
    if (!includeInactive) query.isHidden = { $ne: true };

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const paginateOptions = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: sortOptions,
      populate: [
        { path: 'dropOffLocation', select: 'name address materialType' }
      ]
    };

    return await Campaign.paginate(query, paginateOptions);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    throw error;
  }
}

/**
 * Get nearby campaigns within specified radius
 */
async function getNearbyCampaigns(latitude, longitude, options = {}) {
  try {
    const {
      radius = 5000, // 5km default
      limit = 20,
      materialType,
      status = 'active'
    } = options;

    const query = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(radius)
        }
      },
      status,
      isHidden: { $ne: true }
    };

    // Filter by material type if provided
    if (materialType) {
      query.materialTypes = { $in: [materialType] }; // Check if materialType is in the array
    }

    // Only get active campaigns or campaigns that haven't ended
    const now = new Date();
    query.$or = [
      { endDate: { $exists: false } },
      { endDate: null },
      { endDate: { $gte: now } }
    ];

    const campaigns = await Campaign.find(query)
      .populate('dropOffLocation', 'name address materialType')
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    return campaigns;
  } catch (error) {
    console.error('Error fetching nearby campaigns:', error);
    throw error;
  }
}

/**
 * Get campaign by ID with statistics
 */
async function getCampaignById(campaignId) {
  try {
    const campaign = await Campaign.findById(campaignId)
      .populate('dropOffLocation', 'name address materialType organizationName');

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Get statistics
    const [pickupCount, dropOffCount] = await Promise.all([
      PickUp.countDocuments({ campaign: campaignId }),
      DropOff.countDocuments({ campaign: campaignId })
    ]);

    const totalContributions = pickupCount + dropOffCount;

    return {
      campaign,
      statistics: {
        pickupCount,
        dropOffCount,
        totalContributions,
        progressPercentage: campaign.goal > 0 ? Math.min((campaign.progress / campaign.goal) * 100, 100) : 0
      }
    };
  } catch (error) {
    console.error('Error fetching campaign by ID:', error);
    throw error;
  }
}

/**
 * Update campaign
 */
async function updateCampaign(campaignId, updateData) {
  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Validate material types if being updated
    if (updateData.materialTypes) {
      let processedMaterialTypes = [];

      // If materialTypes contains 'All', include all available material types
      if (Array.isArray(updateData.materialTypes) && updateData.materialTypes.length === 1 && updateData.materialTypes[0] === 'All') {
        processedMaterialTypes = getPrimaryMaterialTypes();
        updateData.materialTypes = processedMaterialTypes;
      }
      // Otherwise validate each material type
      else if (Array.isArray(updateData.materialTypes)) {
        const validTypes = getPrimaryMaterialTypes();
        const invalidTypes = updateData.materialTypes.filter(type => !validTypes.includes(type));

        if (invalidTypes.length > 0) {
          throw new Error(`Invalid material types: ${invalidTypes.join(', ')}`);
        }
      } else {
        throw new Error('Material types must be an array');
      }
    }

    // Validate dates if being updated
    if (updateData.startDate || updateData.endDate) {
      const startDate = updateData.startDate ? new Date(updateData.startDate) : campaign.startDate;
      const endDate = updateData.endDate ? new Date(updateData.endDate) : campaign.endDate;

      if (endDate && startDate >= endDate) {
        throw new Error('End date must be after start date');
      }
    }

    // Update location if coordinates are provided
    if (updateData.latitude && updateData.longitude) {
      updateData.location = {
        type: 'Point',
        coordinates: [parseFloat(updateData.longitude), parseFloat(updateData.latitude)]
      };
      delete updateData.latitude;
      delete updateData.longitude;
    }

    const updatedCampaign = await Campaign.findByIdAndUpdate(
      campaignId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('dropOffLocation', 'name address materialType');

    return updatedCampaign;
  } catch (error) {
    console.error('Error updating campaign:', error);
    throw error;
  }
}

/**
 * Delete campaign
 */
async function deleteCampaign(campaignId) {
  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Check if there are any associated pickups or dropoffs
    const [pickupCount, dropOffCount] = await Promise.all([
      PickUp.countDocuments({ campaign: campaignId }),
      DropOff.countDocuments({ campaign: campaignId })
    ]);

    if (pickupCount > 0 || dropOffCount > 0) {
      // Don't delete, just hide the campaign
      campaign.isHidden = true;
      await campaign.save();
      return { message: 'Campaign hidden due to existing contributions' };
    }

    await Campaign.findByIdAndDelete(campaignId);
    return { message: 'Campaign deleted successfully' };
  } catch (error) {
    console.error('Error deleting campaign:', error);
    throw error;
  }
}

/**
 * Get campaign contributors
 */
async function getCampaignContributors(campaignId, options = {}) {
  try {
    const { page = 1, limit = 20 } = options;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Get all pickups and dropoffs for this campaign
    const [pickups, dropOffs] = await Promise.all([
      PickUp.find({ campaign: campaignId }).populate('user', 'firstName lastName email profilePicture'),
      DropOff.find({ campaign: campaignId }).populate('user', 'firstName lastName email profilePicture')
    ]);

    // Combine and group by user
    const userContributions = new Map();

    [...pickups, ...dropOffs].forEach(contribution => {
      const userId = contribution.user._id.toString();
      if (!userContributions.has(userId)) {
        userContributions.set(userId, {
          user: contribution.user,
          pickupCount: 0,
          dropOffCount: 0,
          totalContributions: 0
        });
      }

      const userStats = userContributions.get(userId);
      if (contribution.constructor.modelName === 'PickUp') {
        userStats.pickupCount++;
      } else {
        userStats.dropOffCount++;
      }
      userStats.totalContributions++;
    });

    // Convert to array and sort by total contributions
    const contributors = Array.from(userContributions.values())
      .sort((a, b) => b.totalContributions - a.totalContributions);

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedContributors = contributors.slice(startIndex, endIndex);

    return {
      contributors: paginatedContributors,
      totalContributors: contributors.length,
      totalPickups: pickups.length,
      totalDropOffs: dropOffs.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(contributors.length / limit),
        hasNextPage: endIndex < contributors.length,
        hasPrevPage: page > 1
      }
    };
  } catch (error) {
    console.error('Error fetching campaign contributors:', error);
    throw error;
  }
}

/**
 * Get contributors for a specific campaign
 * @param {string} campaignId - The ID of the campaign
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>} Contributors with pagination info
 */
async function getCampaignContributorsDetails(campaignId, options = {}) {
  try {
    const { page = 1, limit = 10 } = options;

    // Find the campaign and validate
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (!campaign.contributors || campaign.contributors.length === 0) {
      return {
        contributors: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalContributors: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      };
    }

    // Set up pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const totalContributors = campaign.contributors.length;

    // Get paginated contributors with relevant details
    const contributorIds = campaign.contributors.slice(skip, skip + limitNum);

    const contributors = await User.find(
      { _id: { $in: contributorIds } },
      'firstName lastName email phoneNumber profilePicture'
    );

    // Get contribution stats for each contributor
    const contributorStats = await Promise.all(
      contributors.map(async (contributor) => {
        const dropoffs = await DropOff.find({
          user: contributor._id,
          campaign: campaignId
        });

        const totalDropoffs = dropoffs.length;
        const totalCU = dropoffs.reduce((sum, dropoff) => sum + (dropoff.pointsEarned || 0), 0);
        const firstContribution = dropoffs.length > 0 ?
          dropoffs.sort((a, b) => a.createdAt - b.createdAt)[0].createdAt : null;
        const lastContribution = dropoffs.length > 0 ?
          dropoffs.sort((a, b) => b.createdAt - a.createdAt)[0].createdAt : null;

        return {
          user: contributor,
          totalContributions: totalDropoffs,
          totalCU,
          firstContribution,
          lastContribution
        };
      })
    );

    // Calculate pagination info
    const totalPages = Math.ceil(totalContributors / limitNum);

    return {
      contributors: contributorStats,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalContributors,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    };
  } catch (error) {
    console.error('Error getting campaign contributors:', error);
    throw error;
  }
}

/**
 * Get campaign statistics
 */
async function getCampaignStats(filters = {}) {
  try {
    const { startDate, endDate, status, materialType } = filters;

    const matchQuery = {};

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    if (status) matchQuery.status = status;
    if (materialType) {
      matchQuery.materialTypes = { $in: [materialType] };
    }

    const stats = await Campaign.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalCampaigns: { $sum: 1 },
          activeCampaigns: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          completedCampaigns: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelledCampaigns: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          totalGoal: { $sum: '$goal' },
          totalProgress: { $sum: '$progress' }
        }
      }
    ]);

    // Now we need to handle materialTypes differently since it's an array
    // We'll unwind the array and then group by each material type
    const materialTypeStats = await Campaign.aggregate([
      { $match: matchQuery },
      { $unwind: '$materialTypes' }, // Unwind the array to have one document per material type
      {
        $group: {
          _id: '$materialTypes',
          count: { $sum: 1 },
          totalGoal: { $sum: '$goal' },
          totalProgress: { $sum: '$progress' }
        }
      },
      {
        $project: {
          materialType: '$_id',
          count: 1,
          totalGoal: 1,
          totalProgress: 1,
          _id: 0
        }
      }
    ]);

    return {
      overview: stats[0] || {
        totalCampaigns: 0,
        activeCampaigns: 0,
        completedCampaigns: 0,
        cancelledCampaigns: 0,
        totalGoal: 0,
        totalProgress: 0
      },
      byMaterialType: materialTypeStats
    };
  } catch (error) {
    console.error('Error fetching campaign statistics:', error);
    throw error;
  }
}

/**
 * Create a drop-off directly at a campaign location
 */
async function createCampaignDropOff(userId, campaignId, dropOffData) {
  try {
    const { materialType, dropOffQuantity, description, latitude, longitude, proofPicture } = dropOffData;

    // Get the campaign details
    const campaign = await Campaign.findById(campaignId).populate('dropOffLocation');
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Check if campaign is active
    if (campaign.status !== 'active') {
      throw new Error(`Campaign is not active. Current status: ${campaign.status}`);
    }

    // Check if campaign hasn't ended
    if (campaign.endDate && new Date() > new Date(campaign.endDate)) {
      throw new Error('Campaign has ended');
    }

    // Check if campaign hasn't started yet
    if (new Date() < new Date(campaign.startDate)) {
      throw new Error('Campaign has not started yet');
    }

    // Validate material type matches campaign's accepted materials
    if (campaign.materialTypes && campaign.materialTypes.length > 0 && !campaign.materialTypes.includes(materialType)) {
      throw new Error(`This campaign only accepts ${campaign.materialTypes.join(', ')} materials, but you're trying to drop off ${materialType}`);
    }

    // Validate user location is within range (100m tolerance)
    const distanceToLocation = calculateDistance(
      parseFloat(latitude),
      parseFloat(longitude),
      campaign.location.coordinates[1], // campaign latitude
      campaign.location.coordinates[0]  // campaign longitude
    );

    const maxDistance = 0.01; // 40 meters in kilometers
    // if (distanceToLocation > maxDistance) {
    //   throw new Error(`You must be within 400 meters of the campaign location. You are ${Math.round(distanceToLocation * 1000)}m away.`);
    // }
    // TODO: DO LATER

    // Validate and process dropOffQuantity
    let mainQuantity;
    try {
      mainQuantity = typeof dropOffQuantity === 'string' ? JSON.parse(dropOffQuantity) : dropOffQuantity;
      if (!Array.isArray(mainQuantity)) {
        throw new Error("dropOffQuantity must be an array.");
      }
    } catch (parseError) {
      throw new Error("Invalid format for dropOffQuantity. Expected an array of items.");
    }

    const totalItemUnits = mainQuantity.reduce((acc, curr) => {
      return acc + (curr.units || 0);
    }, 0);

    // Create the drop-off record
    const DropOff = require('../models/dropOffModel');
    const dropOff = new DropOff({
      dropOffLocation: campaign.dropOffLocation ? campaign.dropOffLocation._id : null,
      user: userId,
      itemType: materialType,
      dropOffQuantity: mainQuantity,
      itemQuantity: totalItemUnits,
      description: description || `Drop-off at campaign: ${campaign.name}`,
      campaign: campaignId,
      receipt: proofPicture,
      status: 'Approved', // Auto-approve campaign drop-offs
      gpsCoordinates: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      }
    });
    console.log(dropOff, "THe NEW DROPOFF")

    // Calculate and update user CU
    let calculatedTotalCUforDropOff = 0;
    const User = require('../models/userModel');
    const cuCalculationService = require('./cuCalculationService');

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found for CU calculation.");
    }

    for (const item of mainQuantity) {
      if (typeof item.units !== 'number' || item.units <= 0) {
        console.warn(`Skipping item due to invalid units:`, item);
        continue;
      }
      if (!item.materialType) {
        console.warn(`Skipping item due to missing materialType (subtype):`, item);
        continue;
      }

      try {
        const cuResult = await cuCalculationService.updateUserCU(
          user._id,
          item.materialType,
          item.units,
        );

        if (cuResult && typeof cuResult.addedCU === 'number') {
          calculatedTotalCUforDropOff += cuResult.addedCU;
        }
      } catch (cuError) {
        console.error(`Error updating CU for item ${item.materialType}:`, cuError.message);
      }
    }

    // Add campaign bonus CU (20% bonus for campaign participation)
    const campaignBonusCU = calculatedTotalCUforDropOff * 0.2;
    calculatedTotalCUforDropOff += campaignBonusCU;

    dropOff.pointsEarned = calculatedTotalCUforDropOff;

    // Update campaign progress
    campaign.progress = (campaign.progress || 0) + totalItemUnits;

    // Add user to contributors array if not already there
    if (!campaign.contributors || !campaign.contributors.includes(userId)) {
      if (!campaign.contributors) {
        campaign.contributors = [];
      }
      campaign.contributors.push(userId);
    }

    // Save both the drop-off and updated campaign
    await Promise.all([
      dropOff.save().catch(err => {
        console.log(err, "Error in Saving Dropoff")
      }),
      campaign.save()
    ]);

    return await DropOff.findById(dropOff._id)
      .populate('dropOffLocation', 'name address')
      .populate('campaign', 'name organizationName')
      .populate('user', 'firstName lastName email');

  } catch (error) {
    console.error('Error creating campaign drop-off:', error);
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

/**
 * Get all campaign dropoffs
 * @param {Object} options - Options for filtering and pagination
 * @returns {Promise<Object>} Campaign dropoffs with pagination
 */
async function getAllCampaignDropOffs(options = {}) {
  try {
    const {
      page = 1,
      limit = 10,
      campaignId,
      userId,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const query = { campaign: { $exists: true, $ne: null } };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Configure sort options
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Query with pagination
    const DropOff = require('../models/dropOffModel');
    const paginateOptions = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort,
      populate: [
        { path: 'user', select: 'firstName lastName email profilePicture' },
        { path: 'campaign', select: 'name organizationName' },
        { path: 'dropOffLocation', select: 'name address' }
      ]
    };

    const result = await DropOff.paginate(query, paginateOptions);

    return {
      dropOffs: result.docs,
      pagination: {
        currentPage: result.page,
        totalPages: result.totalPages,
        totalDropOffs: result.totalDocs,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage
      }
    };
  } catch (error) {
    console.error('Error getting campaign dropoffs:', error);
    throw error;
  }
}

/**
 * Get all drop-offs for a specific campaign with pagination
 */
async function getCampaignDropOffs(campaignId, options = {}) {
  try {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    // Validate campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Build query for drop-offs related to this campaign
    const query = { campaign: campaignId };

    // Add date filters if provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Configure sort options
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Query with pagination
    const DropOff = require('../models/dropOffModel');
    const paginateOptions = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort,
      populate: [
        { path: 'user', select: 'firstName lastName email profilePicture' },
        { path: 'campaign', select: 'name organizationName' },
        { path: 'dropOffLocation', select: 'name address' }
      ]
    };

    const result = await DropOff.paginate(query, paginateOptions);

    return {
      campaignName: campaign.name,
      dropOffs: result.docs,
      pagination: {
        currentPage: result.page,
        totalPages: result.totalPages,
        totalDropOffs: result.totalDocs,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage
      }
    };
  } catch (error) {
    console.error(`Error getting dropoffs for campaign ${campaignId}:`, error);
    throw error;
  }
}

module.exports = {
  createCampaign,
  getCampaigns,
  getNearbyCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  getCampaignContributors,
  getCampaignStats,
  createCampaignDropOff,
  getAllCampaignDropOffs,
  getCampaignContributorsDetails,
  getCampaignDropOffs
};
