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
    const { name, organizationName, latitude, longitude, address, description, startDate, endDate, status, goal, itemType, dropOffLocationId, image } = campaignData;

    // Check if campaign name already exists
    const existingCampaign = await Campaign.findOne({ name });
    if (existingCampaign) {
      throw new Error('Campaign with this name already exists');
    }

    // Validate material type if provided
    if (itemType && !getPrimaryMaterialTypes().includes(itemType)) {
      throw new Error(`Invalid material type: ${itemType}`);
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
      itemType,
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
      itemType,
      organizationName,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeInactive = false
    } = options;

    const query = {};

    if (status) query.status = status;
    if (itemType) query.itemType = itemType;
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
      itemType,
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

    if (itemType) query.itemType = itemType;

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

    // Validate material type if being updated
    if (updateData.itemType && !getPrimaryMaterialTypes().includes(updateData.itemType)) {
      throw new Error(`Invalid material type: ${updateData.itemType}`);
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
 * Get campaign statistics
 */
async function getCampaignStats(filters = {}) {
  try {
    const { startDate, endDate, status, itemType } = filters;

    const matchQuery = {};

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    if (status) matchQuery.status = status;
    if (itemType) matchQuery.itemType = itemType;

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

    const itemTypeStats = await Campaign.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$itemType',
          count: { $sum: 1 },
          totalGoal: { $sum: '$goal' },
          totalProgress: { $sum: '$progress' }
        }
      },
      {
        $project: {
          itemType: '$_id',
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
      byItemType: itemTypeStats
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
    const { itemType, dropOffQuantity, description, latitude, longitude, proofPicture } = dropOffData;

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

    // Validate material type matches campaign
    if (campaign.itemType && campaign.itemType !== itemType) {
      throw new Error(`This campaign only accepts ${campaign.itemType} items, but you're trying to drop off ${itemType}`);
    }

    // Validate user location is within range (100m tolerance)
    const distanceToLocation = calculateDistance(
      parseFloat(latitude),
      parseFloat(longitude),
      campaign.location.coordinates[1], // campaign latitude
      campaign.location.coordinates[0]  // campaign longitude
    );

    const maxDistance = 0.1; // 100 meters in kilometers
    if (distanceToLocation > maxDistance) {
      throw new Error(`You must be within 100 meters of the campaign location. You are ${Math.round(distanceToLocation * 1000)}m away.`);
    }

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
      itemType,
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
          itemType,
          item.units,
          item.materialType
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

    // Save both the drop-off and updated campaign
    await Promise.all([
      dropOff.save(),
      campaign.save()
    ]);

    // Update user's NAT Points if service exists
    try {
      await cuCalculationService.updateUserNatPoints(userId, user.carbonUnits + calculatedTotalCUforDropOff);
    } catch (natPointsError) {
      console.warn('Could not update NAT Points:', natPointsError.message);
    }

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

module.exports = {
  createCampaign,
  getCampaigns,
  getNearbyCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  getCampaignContributors,
  getCampaignStats,
  createCampaignDropOff
};
