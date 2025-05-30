const Message = require("../../models/thingsMatch/message.model.js");
const Match = require("../../models/thingsMatch/match.model.js");
const mongoose = require("mongoose");

async function sendMessage(
  matchId,
  senderId,
  receiverId,
  content,
  messageType = "custom"
) {
  try {

    const match = await Match.findById(matchId);
    if (!match) throw new Error("Match not found for sending message.");

    if (match.status === "blocked")
      throw new Error("Cannot send message, chat is blocked.");
    if (match.status === "unmatched")
      throw new Error("Cannot send message, chat is unmatched.");

    // Authorize sender and verify receiver
    const isSenderOwner = match.itemOwnerId?.toString() === senderId;
    const isSenderInterested = match.itemSwiperId?.toString() === senderId;

    if (!isSenderOwner && !isSenderInterested) {
      throw new Error("Sender is not part of this match.");
    }
    const expectedReceiver = isSenderOwner
      ? match.itemSwiperId?.toString()
      : match.itemOwnerId?.toString();
    if (expectedReceiver !== receiverId) {
      throw new Error(
        "Message receiver does not match the other party in the match."
      );
    }

    // If item owner sends a message in a 'pendingInterest' match, it confirms the match.
    if (isSenderOwner && match.status === "pendingInterest") {
      match.status = "active";
      match.matchedAt = new Date();
      // TODO: Notify interestedUser that the owner has responded and matched.
    }

    const message = new Message({
      matchId,
      senderId,
      receiverId,
      content,
      isDefaultMsg: messageType === "default",
    });

    await message.save();

    match.lastMessageAt = message.createdAt;
    await match.save();

    return message;
  } catch (error) {
    console.error("Error sending message:", error);
    throw new Error("Failed to send message: " + error.message);
  }
}

async function getMessagesForMatch(matchId, userId, page = 1, limit = 20) {
  try {
    const match = await Match.findById(matchId);
    if (!match) throw new Error("Match not found.");
    if (
      match.itemOwnerId.toString() !== userId &&
      match.interestedUserId.toString() !== userId
    ) {
      throw new Error("User not authorized to view these messages.");
    }

    const messages = await Message.find({ matchId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("senderId", "name profilePicture"); // Adjust as needed

    // Mark messages as read by this user (the one fetching them)
    // This is a simplified approach. A more robust system might handle this differently (e.g., specific endpoint, background job).
    await Message.updateMany(
      { matchId, receiverId: userId, status: { $in: ["sent", "delivered"] } },
      { $set: { status: "read", readAt: new Date() } }
    );

    const totalMessages = await Message.countDocuments({ matchId });
    return {
      messages: messages.reverse(),
      currentPage: page,
      totalPages: Math.ceil(totalMessages / limit),
      totalMessages,
    };
  } catch (error) {
    console.error("Error fetching messages for match:", error);
    throw new Error("Failed to fetch messages: " + error.message);
  }
}

async function updateMessageStatus(messageId, userId, status) {
  try {
    const message = await Message.findById(messageId);
    if (!message) throw new Error("Message not found.");

    if (
      message.receiverId.toString() !== userId &&
      (status === "read" || status === "delivered")
    ) {
      throw new Error(
        "User not authorized to update this message status for receiver."
      );
    }

    message.status = status;
    if (status === "read" && !message.readAt) message.readAt = new Date();
    // if (status === 'delivered' && !message.deliveredAt) message.deliveredAt = new Date();
    await message.save();
    return message;
  } catch (error) {
    console.error("Error updating message status:", error);
    throw new Error("Failed to update message status: " + error.message);
  }
}

module.exports = {
  sendMessage,
  getMessagesForMatch,
  updateMessageStatus,
};
