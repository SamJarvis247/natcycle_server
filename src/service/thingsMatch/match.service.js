const Match = require("../../models/thingsMatch/match.model.js");
const Item = require("../../models/thingsMatch/items.model.js");
const itemService = require("./item.service.js");
const messageService = require("./message.service.js");
const mongoose = require("mongoose");

async function createMatchOnSwipeAndSendDefaultMessage(
  itemId,
  swiperId,
  defaultMessageContent
) {
  try {
    const item = await itemService.getItemById(itemId);
    if (!item) throw new Error("Item not found.");

    const itemOwnerId = item.userId._id.toString();
    if (itemOwnerId === swiperId)
      throw new Error("Cannot show interest in your own item.");

    // Check if interest already expressed by this swiper for this item
    let existingMatch = await Match.findOne({
      itemId,
      itemOwnerId,
      interestedUserId: swiperId,
    });

    if (existingMatch && existingMatch.status !== "unmatched") {
      // Allow re-interest if previously unmatched
      // If interest exists and is active (pending/matched/blocked), don't create new, just return existing or error
      // Depending on exact flow, might allow sending another message if already pending
      throw new Error(
        "Interest already registered or match active for this item by you."
      );
    }

    if (existingMatch && existingMatch.status === "unmatched") {
      existingMatch.status = "pendingInterest";
      existingMatch.lastMessageAt = new Date();
      await existingMatch.save();
    } else {
      existingMatch = new Match({
        itemId,
        itemOwnerId,
        interestedUserId: swiperId,
        status: "pendingInterest",
      });
      await existingMatch.save();
    }

    // Increment item's interest count
    await itemService.updateItemInterest(itemId, "increment");

    // Send the default message from swiper to item owner
    const message = await messageService.sendMessage(
      existingMatch._id.toString(),
      swiperId,
      itemOwnerId,
      defaultMessageContent,
      "default"
    );

    existingMatch.lastMessageAt = message.createdAt;
    await existingMatch.save();

    return {
      message: "Interest and default message sent successfully.",
      match: existingMatch,
      firstMessage: message,
    };
  } catch (error) {
    console.error("Error in createMatchOnSwipeAndSendDefaultMessage:", error);
    throw new Error(
      "Failed to register interest and send message: " + error.message
    );
  }
}

async function confirmMatch(matchId, ownerId) {
  try {
    const match = await Match.findById(matchId);
    if (!match) throw new Error("Match not found.");

    if (match.itemOwnerId.toString() !== ownerId) {
      throw new Error("Only the item owner can confirm this match.");
    }

    if (match.status === "pendingInterest") {
      match.status = "matched";
      match.matchedAt = new Date();
      await match.save();
      // TODO: Send notification to swiper that owner has matched.
      return { message: "Match confirmed. You can now chat.", match };
    } else if (match.status === "matched") {
      return { message: "Already matched.", match };
    } else {
      throw new Error(`Cannot confirm match from status: ${match.status}`);
    }
  } catch (error) {
    console.error("Error confirming match:", error);
    throw new Error("Failed to confirm match: " + error.message);
  }
}

async function updateMatchStatus(matchId, newStatus, userId) {
  try {
    const match = await Match.findById(matchId).populate("itemId");
    if (!match) throw new Error("Match not found");

    if (
      match.itemOwnerId.toString() !== userId &&
      match.interestedUserId.toString() !== userId
    ) {
      throw new Error("User not authorized to update this match.");
    }

    const oldStatus = match.status;
    match.status = newStatus;

    if (newStatus === "blocked") {
      // Additional logic for blocking
    } else if (newStatus === "unmatched") {
      match.unmatchedAt = new Date();
      // If the match was 'matched' or 'pendingInterest' and is now 'unmatched',
      // decrement interest count for the item.
      if (["matched", "pendingInterest"].includes(oldStatus)) {
        await itemService.updateItemInterest(
          match.itemId._id.toString(),
          "decrement"
        );
      }
      // TODO: Notify other user about unmatch.
    }

    await match.save();
    return match;
  } catch (error) {
    console.error("Error updating match status:", error);
    throw new Error("Failed to update match status: " + error.message);
  }
}

async function getUserMatches(userId) {
  try {
    const matches = await Match.find({
      $or: [{ itemOwnerId: userId }, { interestedUserId: userId }],
      status: { $in: ["pendingInterest", "matched"] },
    })
      .populate("itemId itemOwnerId interestedUserId")
      .sort({ lastMessageAt: -1, updatedAt: -1 });
    return matches;
  } catch (error) {
    console.error("Error fetching user matches:", error);
    throw new Error("Failed to fetch user matches: " + error.message);
  }
}

async function getMatchById(matchId) {
  try {
    const match = await Match.findById(matchId).populate(
      "itemId itemOwnerId interestedUserId"
    );
    if (!match) throw new Error("Match not found");
    return match;
  } catch (error) {
    console.error(`Error fetching match by ID ${matchId}:`, error);
    throw new Error("Failed to fetch match details");
  }
}

module.exports = {
  createMatchOnSwipeAndSendDefaultMessage,
  confirmMatch,
  updateMatchStatus,
  getUserMatches,
  getMatchById,
};
