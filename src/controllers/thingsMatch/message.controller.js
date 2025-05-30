const messageService = require("../../service/thingsMatch/message.service");
const catchAsync = require("../../utility/catchAsync");
const AppError = require("../../utility/appError");

exports.sendMessage = catchAsync(async (req, res, next) => {
  if (!req.user || !req.user.thingsMatchId) {
    return next(new AppError("User not authenticated for ThingsMatch", 401));
  }
  const { matchId } = req.params;
  const { receiverId, content, messageType } = req.body;

  if (!receiverId || !content) {
    return next(new AppError("Receiver ID and content are required.", 400));
  }

  const message = await messageService.sendMessage(
    matchId,
    req.user.thingsMatchId,
    receiverId,
    content,
    messageType
  );
  res.status(201).json({
    status: "success",
    data: {
      message,
    },
  });
});

exports.getMessagesForMatch = catchAsync(async (req, res, next) => {
  if (!req.user || !req.user.thingsMatchId) {
    return next(new AppError("User not authenticated for ThingsMatch", 401));
  }
  const { matchId } = req.params;
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 20;

  const result = await messageService.getMessagesForMatch(
    matchId,
    req.user.thingsMatchId,
    page,
    limit
  );
  res.status(200).json({
    status: "success",
    data: result,
  });
});

exports.updateMessageStatus = catchAsync(async (req, res, next) => {
  if (!req.user || !req.user.thingsMatchId) {
    return next(new AppError("User not authenticated for ThingsMatch", 401));
  }
  const { messageId } = req.params;
  const { status } = req.body;

  if (!status) {
    return next(new AppError("New message status is required.", 400));
  }

  const message = await messageService.updateMessageStatus(
    messageId,
    req.user.thingsMatchId,
    status
  );
  res.status(200).json({
    status: "success",
    data: {
      message,
    },
  });
});
