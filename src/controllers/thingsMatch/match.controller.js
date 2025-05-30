const matchService = require("../../service/thingsMatch/match.service");
const { catchAsync } = require("../../utility/catchAsync.js");
const AppError = require("../../utility/appError");

const swipeAndSendDefaultMessage = catchAsync(async (req, res, next) => {
  if (!req.user || !req.user.thingsMatchId) {
    return next(new AppError("User not authenticated for ThingsMatch", 401));
  }
  const { itemId } = req.params;
  const { defaultMessageContent } = req.body;

  if (!defaultMessageContent) {
    return next(new AppError("Default message content is required.", 400));
  }

  const result = await matchService.createMatchOnSwipeAndSendDefaultMessage(
    itemId,
    req.user.thingsMatchId,
    defaultMessageContent
  );
  res.status(201).json({
    status: "success",
    data: result,
  });
});

const confirmMatchByOwner = catchAsync(async (req, res, next) => {
  if (!req.user || !req.user.thingsMatchId) {
    return next(new AppError("User not authenticated for ThingsMatch", 401));
  }
  const { matchId } = req.params;
  const result = await matchService.confirmMatch(
    matchId,
    req.user.thingsMatchId
  );
  res.status(200).json({
    status: "success",
    data: result,
  });
});

const updateMatchStatus = catchAsync(async (req, res, next) => {
  if (!req.user || !req.user.thingsMatchId) {
    return next(new AppError("User not authenticated for ThingsMatch", 401));
  }
  const { matchId } = req.params;
  const { status } = req.body; // e.g., 'blocked', 'unmatched'

  if (!status) {
    return next(new AppError("New match status is required.", 400));
  }

  const result = await matchService.updateMatchStatus(
    matchId,
    status,
    req.user.thingsMatchId
  );
  res.status(200).json({
    status: "success",
    data: result,
  });
});

const getUserMatches = catchAsync(async (req, res, next) => {
  if (!req.user || !req.user.thingsMatchId) {
    return next(new AppError("User not authenticated for ThingsMatch", 401));
  }
  const matches = await matchService.getUserMatches(req.user.thingsMatchId);
  res.status(200).json({
    status: "success",
    results: matches.length,
    data: {
      matches,
    },
  });
});

const getMatchDetails = catchAsync(async (req, res, next) => {
  if (!req.user || !req.user.thingsMatchId) {
    // Ensure user is part of the match to view details
    return next(new AppError("User not authenticated for ThingsMatch", 401));
  }
  const match = await matchService.getMatchById(req.params.matchId);
  if (!match) {
    return next(new AppError("No match found with that ID", 404));
  }
  // Authorization: Check if req.user.thingsMatchId is part of this match
  if (
    match.itemOwnerId._id.toString() !== req.user.thingsMatchId &&
    match.interestedUserId._id.toString() !== req.user.thingsMatchId
  ) {
    return next(
      new AppError("You are not authorized to view this match.", 403)
    );
  }

  res.status(200).json({
    status: "success",
    data: {
      match,
    },
  });
});

module.exports = {
  swipeAndSendDefaultMessage,
  confirmMatchByOwner,
  updateMatchStatus,
  getUserMatches,
  getMatchDetails,
};
