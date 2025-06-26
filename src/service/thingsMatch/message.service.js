const Message = require("../../models/thingsMatch/message.model.js");
const Match = require("../../models/thingsMatch/match.model.js");
const ThingsMatchUser = require("../../models/thingsMatch/user.model.js");

async function populateSenderDetails(message) {
  if (!message || !message.senderId) return message;
  let messageObject = message.toObject ? message.toObject() : { ...message };

  try {
    const senderTMUser = await ThingsMatchUser.findById(
      message.senderId
    ).populate({
      path: "natcycleId",
      select: "firstName lastName profilePicture email",
    });

    if (senderTMUser && senderTMUser.natcycleId) {
      const mainUser = senderTMUser.natcycleId;
      messageObject.senderDetails = {
        _id: mainUser._id,
        thingsMatchId: senderTMUser._id,
        name: `${mainUser.firstName || ""} ${mainUser.lastName || ""}`.trim(),
        profilePicture: mainUser.profilePicture?.url || null,
      };
    } else {
      console.warn(
        `Could not populate full sender details for senderId (ThingsMatchUser): ${message.senderId}`
      );
      if (senderTMUser) {
        messageObject.senderDetails = {
          thingsMatchId: senderTMUser._id,
          name: "User", // Fallback name
        };
      } else {
        messageObject.senderDetails = null;
      }
    }
  } catch (error) {
    console.error("Error populating sender details in message.service:", error);
    messageObject.senderDetails = null;
  }
  return messageObject;
}

async function sendMessage(
  matchId,
  senderId, // ThingsMatchUser ID
  receiverId, // ThingsMatchUser ID
  content,
  messageType = "custom"
) {
  try {
    const match = await Match.findById(matchId);
    if (!match) throw new Error("Match not found for sending message.");

    const blockedStatuses = [
      "blocked",
      "owner_blocked_swiper",
      "swiper_blocked_owner",
    ];
    if (blockedStatuses.includes(match.status)) {
      throw new Error("Cannot send message, chat is blocked.");
    }
    if (match.status === "unmatched") {
      throw new Error("Cannot send message, chat is unmatched.");
    }
    if (
      match.status !== "pendingInterest" &&
      match.status !== "active" &&
      messageType === "custom"
    ) {
      throw new Error(
        `Cannot send custom message for match status: ${match.status}`
      );
    }

    const isSenderOwner = match.itemOwnerId?.toString() === senderId.toString();
    const isSenderSwiper =
      match.itemSwiperId?.toString() === senderId.toString();

    if (!isSenderOwner && !isSenderSwiper) {
      throw new Error("Sender is not part of this match.");
    }

    const expectedReceiver = isSenderOwner
      ? match.itemSwiperId?.toString()
      : match.itemOwnerId?.toString();

    if (expectedReceiver !== receiverId.toString()) {
      throw new Error(
        "Receiver ID does not match the other participant in the match."
      );
    }

    let message = new Message({
      matchId,
      senderId,
      receiverId,
      content,
      isDefaultMsg: messageType === "default",
    });
    await message.save();

    match.lastMessageAt = message.createdAt;
    if (messageType === "default") {
      match.defaultMessageSent = true;
    }
    await match.save();

    return await populateSenderDetails(message);
  } catch (error) {
    console.error("Error sending message in service:", error);
    throw new Error(`Failed to send message: ${error.message}`);
  }
}

async function getMessagesForMatch(matchId, userId, page = 1, limit = 20) {
  try {
    const match = await Match.findById(matchId);
    if (!match) throw new Error("Match not found.");

    if (
      match.itemOwnerId.toString() !== userId.toString() &&
      match.itemSwiperId.toString() !== userId.toString()
    ) {
      throw new Error("User not authorized to view messages for this match.");
    }

    const skip = (page - 1) * limit;
    const messages = await Message.find({ matchId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const populatedMessages = await Promise.all(
      messages.map((msg) => populateSenderDetails(msg))
    );

    return {
      messages: populatedMessages.reverse(),
      currentPage: page,
      totalPages: Math.ceil(
        (await Message.countDocuments({ matchId })) / limit
      ),
    };
  } catch (error) {
    console.error("Error fetching messages for match:", error);
    throw new Error(`Failed to fetch messages: ${error.message}`);
  }
}

async function updateMessageStatus(messageId, userId, status) {
  try {
    const message = await Message.findById(messageId);
    if (!message) throw new Error("Message not found.");

    if (
      message.receiverId.toString() !== userId.toString() &&
      (status === "read" || status === "delivered")
    ) {
      throw new Error(
        "User not authorized to update this message status for receiver actions."
      );
    }

    let updated = false;
    if (
      status === "read" &&
      message.receiverId.toString() === userId.toString()
    ) {
      if (message.status !== "read") {
        message.status = "read";
        message.readByReceiver = true;
        updated = true;
      }
    } else if (
      status === "delivered" &&
      message.receiverId.toString() === userId.toString()
    ) {
      if (message.status === "sent") {
        message.status = "delivered";
        message.deliveredToReceiverAt = new Date();
        updated = true;
      }
    }

    if (updated) {
      await message.save();
    }
    return await populateSenderDetails(message);
  } catch (error) {
    console.error("Error updating message status:", error);
    throw new Error(`Failed to update message status: ${error.message}`);
  }
}

async function deleteMessagesForMatch(matchId) {
  try {
    const result = await Message.deleteMany({ matchId: matchId });
    return {
      deletedCount: result.deletedCount,
      message: `Deleted ${result.deletedCount} messages for match ${matchId}`
    };
  } catch (error) {
    console.error("Error deleting messages for match:", error);
    throw new Error(`Failed to delete messages: ${error.message}`);
  }
}

module.exports = {
  sendMessage,
  getMessagesForMatch,
  updateMessageStatus,
  deleteMessagesForMatch,
};
