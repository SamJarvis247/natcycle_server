const ThingsMatchUser = require("../../models/thingsMatch/user.model.js");
const User = require("../../models/userModel.js");
const mongoose = require("mongoose");

/**
 * Get nearby ThingsMatch users for leaderboard
 * @param {Object} coordinates - User's coordinates {longitude, latitude}
 * @param {Number} maxDistance - Maximum distance in meters (default: 10000)
 * @param {Number} page - Page number for pagination (default: 1)
 * @param {Number} limit - Items per page (default: 10)
 * @returns {Object} Paginated nearby users with leaderboard data
 */
async function getNearbyUsers(coordinates, maxDistance = 10000, page = 1, limit = 10) {
  try {
    if (!coordinates || !coordinates.longitude || !coordinates.latitude) {
      throw new Error("Valid coordinates (longitude, latitude) are required");
    }

    const { longitude, latitude } = coordinates;
    const startIndex = (page - 1) * limit;

    // Build aggregation pipeline for nearby users with leaderboard data
    const pipeline = [
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          distanceField: "distance",
          maxDistance: maxDistance,
          spherical: true,
          distanceMultiplier: 1 // Distance in meters
        }
      },
      {
        $lookup: {
          from: "users", // Main user collection
          localField: "natcycleId",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $project: {
          _id: 1,
          distance: 1,
          itemsShared: { $ifNull: ["$itemsShared", 0] },
          environmentalImpact: { $ifNull: ["$environmentalImpact", 0] },
          monthlyGoal: { $ifNull: ["$monthlyGoal", 0] },
          interests: 1,
          tags: 1,
          location: 1,
          userDetails: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            profilePicture: 1,
            username: 1,
            CU: 1,
            totalScore: 1,
            isVerified: 1
          }
        }
      },
      {
        $addFields: {
          leaderboardScore: {
            $add: [
              { $multiply: ["$itemsShared", 10] }, // 10 points per shared item
              { $multiply: ["$environmentalImpact", 5] }, // 5 points per environmental impact point
              { $ifNull: ["$userDetails.CU", 0] }, // Include CU points
              { $ifNull: ["$userDetails.totalScore", 0] } // Include total score
            ]
          },
          distanceKm: { $round: [{ $divide: ["$distance", 1000] }, 2] }
        }
      },
      {
        $sort: { leaderboardScore: -1, distance: 1 } // Sort by score desc, then distance asc
      }
    ];

    // Get total count for pagination
    const countPipeline = [
      ...pipeline.slice(0, 4), // Take pipeline up to projection
      { $count: "totalDocuments" }
    ];

    const [users, countResult] = await Promise.all([
      ThingsMatchUser.aggregate([
        ...pipeline,
        { $skip: startIndex },
        { $limit: limit }
      ]),
      ThingsMatchUser.aggregate(countPipeline)
    ]);

    const totalDocuments = countResult.length > 0 ? countResult[0].totalDocuments : 0;
    const totalPages = Math.ceil(totalDocuments / limit);

    if (page < 1 || (page > totalPages && totalPages > 0)) {
      return {
        status: 'fail',
        message: 'Invalid page number'
      };
    }

    return {
      status: 'success',
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalDocuments,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit
        },
        searchParams: {
          coordinates: { longitude, latitude },
          maxDistance,
          maxDistanceKm: Math.round(maxDistance / 1000)
        }
      }
    };

  } catch (error) {
    console.error("Error in getNearbyUsers service:", error);
    throw error;
  }
}

/**
 * Get global leaderboard of all ThingsMatch users
 * @param {Number} page - Page number for pagination (default: 1)
 * @param {Number} limit - Items per page (default: 10)
 * @returns {Object} Paginated global leaderboard
 */
async function getGlobalLeaderboard(page = 1, limit = 10) {
  try {
    const startIndex = (page - 1) * limit;

    const pipeline = [
      {
        $lookup: {
          from: "users",
          localField: "natcycleId",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $project: {
          _id: 1,
          itemsShared: { $ifNull: ["$itemsShared", 0] },
          environmentalImpact: { $ifNull: ["$environmentalImpact", 0] },
          monthlyGoal: { $ifNull: ["$monthlyGoal", 0] },
          interests: 1,
          tags: 1,
          location: 1,
          userDetails: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            profilePicture: 1,
            username: 1,
            CU: 1,
            totalScore: 1,
            isVerified: 1
          }
        }
      },
      {
        $addFields: {
          leaderboardScore: {
            $add: [
              { $multiply: ["$itemsShared", 10] },
              { $multiply: ["$environmentalImpact", 5] },
              { $ifNull: ["$userDetails.CU", 0] },
              { $ifNull: ["$userDetails.totalScore", 0] }
            ]
          }
        }
      },
      {
        $sort: { leaderboardScore: -1 }
      }
    ];

    // Get total count
    const countPipeline = [
      ...pipeline.slice(0, 3), // Take pipeline up to projection
      { $count: "totalDocuments" }
    ];

    const [users, countResult] = await Promise.all([
      ThingsMatchUser.aggregate([
        ...pipeline,
        { $skip: startIndex },
        { $limit: limit }
      ]),
      ThingsMatchUser.aggregate(countPipeline)
    ]);

    const totalDocuments = countResult.length > 0 ? countResult[0].totalDocuments : 0;
    const totalPages = Math.ceil(totalDocuments / limit);

    if (page < 1 || (page > totalPages && totalPages > 0)) {
      return {
        status: 'fail',
        message: 'Invalid page number'
      };
    }

    return {
      status: 'success',
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalDocuments,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit
        }
      }
    };

  } catch (error) {
    console.error("Error in getGlobalLeaderboard service:", error);
    throw error;
  }
}

module.exports = {
  getNearbyUsers,
  getGlobalLeaderboard
};
