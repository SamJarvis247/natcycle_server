const TMUsersService = require("../../service/thingsMatch/TMUsers.service");
const { catchAsync } = require("../../utility/catchAsync.js");
const AppError = require("../../utility/appError");

/**
 * Get nearby users for leaderboard
 */
const getNearbyUsers = catchAsync(async (req, res, next) => {
  if (!req.thingsMatchUser || !req.TMID) {
    return next(new AppError("User not authenticated for ThingsMatch", 401));
  }

  const { longitude, latitude, maxDistance, page, limit } = req.query;

  if (!longitude || !latitude) {
    return next(new AppError("Longitude and latitude are required", 400));
  }

  const coordinates = {
    longitude: parseFloat(longitude),
    latitude: parseFloat(latitude)
  };

  const maxDist = maxDistance ? parseInt(maxDistance, 10) : 10000; // Default 10km
  const pageNum = page ? parseInt(page, 10) : 1;
  const limitNum = limit ? parseInt(limit, 10) : 10;

  if (isNaN(coordinates.longitude) || isNaN(coordinates.latitude)) {
    return next(new AppError("Invalid longitude or latitude values", 400));
  }

  if (coordinates.longitude < -180 || coordinates.longitude > 180) {
    return next(new AppError("Longitude must be between -180 and 180", 400));
  }

  if (coordinates.latitude < -90 || coordinates.latitude > 90) {
    return next(new AppError("Latitude must be between -90 and 90", 400));
  }

  if (maxDist < 100 || maxDist > 100000) {
    return next(new AppError("Max distance must be between 100 and 100000 meters", 400));
  }

  if (pageNum < 1) {
    return next(new AppError("Page number must be greater than 0", 400));
  }

  if (limitNum < 1 || limitNum > 50) {
    return next(new AppError("Limit must be between 1 and 50", 400));
  }

  const result = await TMUsersService.getNearbyUsers(coordinates, maxDist, pageNum, limitNum);

  if (result.status === 'fail') {
    return next(new AppError(result.message, 400));
  }

  res.status(200).json({
    status: "success",
    message: "Nearby users retrieved successfully",
    ...result.data
  });
});

/**
 * Get global leaderboard
 */
const getGlobalLeaderboard = catchAsync(async (req, res, next) => {
  if (!req.thingsMatchUser || !req.TMID) {
    return next(new AppError("User not authenticated for ThingsMatch", 401));
  }

  const { page, limit } = req.query;

  const pageNum = page ? parseInt(page, 10) : 1;
  const limitNum = limit ? parseInt(limit, 10) : 10;

  if (pageNum < 1) {
    return next(new AppError("Page number must be greater than 0", 400));
  }

  if (limitNum < 1 || limitNum > 50) {
    return next(new AppError("Limit must be between 1 and 50", 400));
  }

  const result = await TMUsersService.getGlobalLeaderboard(pageNum, limitNum);

  if (result.status === 'fail') {
    return next(new AppError(result.message, 400));
  }

  res.status(200).json({
    status: "success",
    message: "Global leaderboard retrieved successfully",
    ...result.data
  });
});

module.exports = {
  getNearbyUsers,
  getGlobalLeaderboard
};
