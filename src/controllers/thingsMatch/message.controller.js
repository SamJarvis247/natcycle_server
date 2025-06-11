const messageService = require("../../service/thingsMatch/message.service");
const { catchAsync } = require("../../utility/catchAsync.js");
const AppError = require("../../utility/appError");

const sendMessage = catchAsync(async (req, res, next) => {
  const senderThingsMatchId = req.TMID;
  if (!senderThingsMatchId) {
    return next(new AppError("User not authenticated for ThingsMatch", 401));
  }

  const { matchId } = req.params;
  const { receiverId, content } = req.body;

  if (!receiverId || !content) {
    return next(new AppError("Receiver ID and content are required.", 400));
  }
  if (String(content).trim() === "") {
    return next(new AppError("Message content cannot be empty.", 400));
  }

  const savedMessage = await messageService.sendMessage(
    matchId,
    senderThingsMatchId,
    receiverId,
    content
  );

  const io = req.app.get("socketio");
  if (io && savedMessage) {
    io.to(matchId).emit("receiveMessage", savedMessage); // Emits populated message
  }

  res.status(201).json({
    status: "success",
    data: { message: savedMessage },
  });
});

const getMessagesForMatch = catchAsync(async (req, res, next) => {
  const userThingsMatchId = req.TMID;
  if (!userThingsMatchId) {
    return next(new AppError("User not authenticated for ThingsMatch", 401));
  }
  const { matchId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const result = await messageService.getMessagesForMatch(
    matchId,
    userThingsMatchId,
    page,
    limit
  );
  res.status(200).json({
    status: "success",
    data: result,
  });
});

const updateMessageStatus = catchAsync(async (req, res, next) => {
  const userThingsMatchId = req.TMID;
  if (!userThingsMatchId) {
    return next(new AppError("User not authenticated for ThingsMatch", 401));
  }

  // Route: /:matchId/messages/status. This implies messageId should be in body or query.
  const { matchId } = req.params; // Available from route
  const { messageId, status } = req.body; // Expect messageId and status in body

  if (!messageId || !status) {
    return next(
      new AppError("Message ID and new status are required in the body.", 400)
    );
  }

  const updatedMessage = await messageService.updateMessageStatus(
    messageId,
    userThingsMatchId,
    status
  );

  const io = req.app.get("socketio");
  if (io && updatedMessage) {
    // Use matchId from the updatedMessage object for broadcasting to the correct room
    io.to(updatedMessage.matchId.toString()).emit(
      "messageStatusUpdated",
      updatedMessage
    );
  }

  res.status(200).json({
    status: "success",
    data: { message: updatedMessage },
  });
});

module.exports = {
  sendMessage,
  getMessagesForMatch,
  updateMessageStatus,
};
