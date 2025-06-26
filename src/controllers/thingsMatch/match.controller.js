const matchService = require("../../service/thingsMatch/match.service");
const { catchAsync } = require("../../utility/catchAsync.js");
const AppError = require("../../utility/appError");

const swipeAndSendDefaultMessage = catchAsync(async (req, res, next) => {
  if (!req.TMID) {
    return next(new AppError("User not authenticated for ThingsMatch", 401));
  }

  const { itemId } = req.params;
  const { defaultMessageContent } = req.body;
  if (!defaultMessageContent) {
    return next(new AppError("Default message content is required.", 400));
  }

  const result = await matchService.createMatchOnSwipeAndSendDefaultMessage(
    itemId,
    req.TMID,
    defaultMessageContent
  );

  const io = req.app.get("socketio");
  if (io && result.match && result.message) {
    const itemOwnerTMID = result.match.itemOwnerId.toString();
    const matchIdForRoom = result.match._id.toString();

    // Notify item owner about new pending interest
    const ownerSockets = Array.from(io.sockets.sockets.values()).filter(
      (s) => s.TMID === itemOwnerTMID
    );
    ownerSockets.forEach((ownerSocket) => {
      io.to(ownerSocket.id).emit("newPendingInterest", {
        match: result.match, // Populated match
        message: result.message, // Populated message
      });
    });

    // Emit the default message to the room. Both swiper and owner (if they join) will get it.
    // Client needs to handle joining this room upon swipe or notification.
    io.to(matchIdForRoom).emit("receiveMessage", result.message);
  }

  res.status(201).json({
    status: "success",
    data: { match: result.match, message: result.message },
  });
});

const confirmMatchByOwner = catchAsync(async (req, res, next) => {
  if (!req.TMID) {
    return next(new AppError("User not authenticated for ThingsMatch", 401));
  }
  const { matchId } = req.params;
  const result = await matchService.confirmMatch(matchId, req.TMID); // result = { message, match }

  const io = req.app.get("socketio");
  if (io && result.match) {
    const matchIdForRoom = result.match._id.toString();
    io.to(matchIdForRoom).emit("matchStatusUpdated", result.match);

    // Specifically notify the swiper if they are connected directly (not just in room)
    if (result.match.status === "active") {
      const swiperTMID = result.match.itemSwiperId.toString();
      const swiperSockets = Array.from(io.sockets.sockets.values()).filter(
        (s) => s.TMID === swiperTMID
      );
      swiperSockets.forEach((swiperSocket) => {
        io.to(swiperSocket.id).emit("matchConfirmed", { match: result.match });
      });
    }
  }

  res.status(200).json({
    status: "success",
    data: result,
  });
});

// For getMatchDetails:
const getMatchDetails = catchAsync(async (req, res, next) => {
  if (!req.TMID) {
    return next(new AppError("User not authenticated for ThingsMatch", 401));
  }
  const match = await matchService.getMatchById(req.params.matchId, req.TMID);
  if (!match) {
    return next(
      new AppError("No match found with that ID or not authorized", 404)
    );
  }
  res.status(200).json({
    status: "success",
    data: { match },
  });
});

// For getUserMatches:
const getUserMatches = catchAsync(async (req, res, next) => {
  if (!req.TMID) {
    return next(new AppError("User not authenticated for ThingsMatch", 401));
  }
  const matches = await matchService.getUserMatches(req.TMID);
  res.status(200).json({
    status: "success",
    results: matches.length,
    data: { matches },
  });
});

const getMatchesForItem = catchAsync(async (req, res, next) => {
  if (!req.TMID) {
    return next(new AppError("User not authenticated for ThingsMatch", 401));
  }
  console.log(req.params);
  const { itemId } = req.params;
  const matches = await matchService.getMatchesForItem(itemId);
  res.status(200).json({
    status: "success",
    results: matches.length,
    data: { matches },
  });
});

const adminGetAllMatches = catchAsync(async (req, res, next) => {
  const matches = await matchService.adminGetAllMatches();
  res.status(200).json({
    status: "success",
    results: matches.length,
    data: { matches },
  });
});

const endMatch = catchAsync(async (req, res, next) => {
  if (!req.TMID) {
    return next(new AppError("User not authenticated for ThingsMatch", 401));
  }

  const { matchId } = req.params;

  const result = await matchService.endMatch(matchId, req.TMID);

  const io = req.app.get("socketio");
  if (io && result.match) {
    const matchIdForRoom = result.match._id.toString();
    // Notify both participants that the match has ended
    io.to(matchIdForRoom).emit("matchEnded", {
      match: result.match,
      item: result.item,
      message: "This match has been completed by the item owner",
    });

    // Specifically notify the swiper that the match ended
    const swiperTMID = result.match.itemSwiperId.toString();
    const swiperSockets = Array.from(io.sockets.sockets.values()).filter(
      (s) => s.TMID === swiperTMID
    ); swiperSockets.forEach((swiperSocket) => {
      io.to(swiperSocket.id).emit("matchCompleted", {
        match: result.match,
        reason: "Item has been given away by owner",
      });
    });

    // If other matches were archived, notify those users as well
    if (result.archivedMatches > 0) {
      // Note: In a production system, you might want to fetch the archived matches
      // to get the specific user IDs and notify them individually
      console.log(`${result.archivedMatches} other matches were archived for this item`);
    }
  }

  res.status(200).json({
    status: "success",
    data: result,
  });
});

module.exports = {
  swipeAndSendDefaultMessage,
  confirmMatchByOwner,
  getUserMatches,
  getMatchDetails,
  getMatchesForItem,
  adminGetAllMatches,
  endMatch,
};
