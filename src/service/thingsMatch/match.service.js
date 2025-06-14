const Match = require("../../models/thingsMatch/match.model.js");
const Item = require("../../models/thingsMatch/items.model.js");
const Message = require("../../models/thingsMatch/message.model.js");
const User = require("../../models/userModel.js");
const itemService = require("./item.service.js");
const messageService = require("./message.service.js"); // Will be created next
const mongoose = require("mongoose");

// Called when an ItemSwiper swipes right and sends a default message
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

    // If match was 'unmatched', we can create a new interaction or update existing one.
    // For simplicity, let's assume a new interaction cycle starts.
    if (existingMatch && existingMatch.status === "unmatched") {
      // Option: reuse and update status, or create new. Let's update for now.
      existingMatch.status = "pendingInterest"; // Swiper shows interest again
      existingMatch.lastMessageAt = new Date(); // Will be updated by message send
      await existingMatch.save();
    } else {
      existingMatch = new Match({
        itemId,
        itemOwnerId,
        interestedUserId: swiperId,
        status: "pendingInterest", // Swiper shows interest, owner needs to see message and respond
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

    existingMatch.lastMessageAt = message.createdAt; // Ensure match has latest message timestamp
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

// Called by ItemOwner when they respond to an interest, effectively matching.
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
      $or: [{ itemOwnerId: userId }, { itemSwiperId: userId }],
      status: { $in: ["pendingInterest", "active"] },
    });

    const populatedMatches = await Promise.all(
      matches.map(async (match) => {
        const matchObject = match.toObject ? match.toObject() : { ...match };
        let matchID = matchObject._id;
        let itemOwnerID = matchObject.itemOwnerId;
        let itemSwiperID = matchObject.itemSwiperId;
        let itemID = matchObject.itemId;

        const DETAILS = await Promise.all([
          User.findOne({
            thingsMatchAccount: itemOwnerID,
          }),
          User.findOne({
            thingsMAtchAccount: itemSwiperID,
          }),
          Message.findOne({
            matchId: matchID,
          }),
          Item.findById(itemID),
        ]);
        matchObject.itemDetails = {
          item: DETAILS.length ? DETAILS[3] : "Unknown Item",
        };
        matchObject.itemOwnerDetails = {
          name: DETAILS.length
            ? DETAILS[0].firstName + " " + DETAILS[0].lastName
            : "Unknown User",
          email: DETAILS.length ? DETAILS[0].email : null,
          profilePicture: DETAILS.length
            ? DETAILS[0].profilePicture?.url
            : null,
        };
        matchObject.itemSwiperDetails = {
          name: DETAILS.length
            ? DETAILS[1].firstName + " " + DETAILS[1].lastName
            : "Unknown User",
          email: DETAILS.length ? DETAILS[1].email : null,
          profilePicture: DETAILS.length
            ? DETAILS[1].profilePicture?.url
            : null,
        };
        matchObject.hasMessages = {
          status: DETAILS[2] ? true : false,
        };

        matchObject.userRole = {
          itemOwner:
            itemOwnerID.toString() === userId.toString() ? true : false,
          itemSwiper:
            itemSwiperID.toString() === userId.toString() ? true : false,
        };

        return matchObject;
      })
    );

    return populatedMatches;
  } catch (error) {
    console.error("Error fetching user matches:", error);
    throw new Error("Failed to fetch user matches: " + error.message);
  }
}

async function getMatchById(matchId) {
  try {
    const match = await Match.findById(matchId)
    if (!match) throw new Error("Match not found");
    const matchObject = match.toObject ? match.toObject() : { ...match };
    let matchID = matchObject._id;
    let itemOwnerID = matchObject.itemOwnerId;
    let itemSwiperID = matchObject.itemSwiperId;
    let itemID = matchObject.itemId;
    const DETAILS = await Promise.all([
      User.findOne({
        thingsMatchAccount: itemOwnerID,
      }),
      User.findOne({
        thingsMAtchAccount: itemSwiperID,
      }),
      Message.findOne({
        matchId: matchID,
      }),
      Item.findById(itemID),
    ]);
    matchObject.itemDetails = {
      item: DETAILS.length ? DETAILS[3] : "Unknown Item",
    };
    matchObject.itemOwnerDetails = {
      name: DETAILS.length
        ? DETAILS[0].firstName + " " + DETAILS[0].lastName
        : "Unknown User",
      email: DETAILS.length ? DETAILS[0].email : null,
      profilePicture: DETAILS.length ? DETAILS[0].profilePicture?.url : null,
    };
    matchObject.itemSwiperDetails = {
      name: DETAILS.length
        ? DETAILS[1].firstName + " " + DETAILS[1].lastName
        : "Unknown User",
      email: DETAILS.length ? DETAILS[1].email : null,
      profilePicture: DETAILS.length ? DETAILS[1].profilePicture?.url : null,
    };
    matchObject.hasMessages = {
      status: DETAILS[2] ? true : false,
    };
    matchObject.userRole = {
      itemOwner: itemOwnerID.toString() === matchObject.itemOwnerId.toString(),
      itemSwiper: itemSwiperID.toString() === matchObject.itemSwiperId.toString(),
    };
    matchObject.matchId = matchID;

    return matchObject;
  } catch (error) {
    console.error(`Error fetching match by ID ${matchId}:`, error);
    throw new Error("Failed to fetch match details");
  }
}

async function getMatchesForItem(itemId) {
  try {
    const matches = await Match.find({ itemId });
    const populatedMatches = await Promise.all(
      matches.map(async (match) => {
        const matchObject = match.toObject ? match.toObject() : { ...match };
        let matchID = matchObject._id;
        let itemOwnerID = matchObject.itemOwnerId;
        let itemSwiperID = matchObject.itemSwiperId;
        let itemID = matchObject.itemId;

        const DETAILS = await Promise.all([
          User.findOne({
            thingsMatchAccount: itemOwnerID,
          }),
          User.findOne({
            thingsMAtchAccount: itemSwiperID,
          }),
          Message.findOne({
            matchId: matchID,
          }),
          Item.findById(itemID),
        ]);
        matchObject.itemDetails = {
          item: DETAILS.length ? DETAILS[3] : "Unknown Item",
        };
        matchObject.itemOwnerDetails = {
          name: DETAILS.length
            ? DETAILS[0].firstName + " " + DETAILS[0].lastName
            : "Unknown User",
        };
        matchObject.itemSwiperDetails = {
          name: DETAILS.length
            ? DETAILS[1].firstName + " " + DETAILS[1].lastName
            : "Unknown User",
        };
        matchObject.hasMessages = {
          status: DETAILS[2] ? true : false,
        };

        return matchObject;
      })
    );
    return populatedMatches;
  } catch (error) {
    console.error(`Error fetching matches for item ${itemId}:`, error);
    throw new Error("Failed to fetch matches for item");
  }
}

//Admin
async function adminGetAllMatches() {
  const matches = await Match.find();
  const populatedMatches = await Promise.all(
    matches.map(async (match) => {
      const matchObject = match.toObject ? match.toObject() : { ...match };
      let matchID = matchObject._id;
      let itemOwnerID = matchObject.itemOwnerId;
      let itemSwiperID = matchObject.itemSwiperId;
      let itemID = matchObject.itemId;

      const DETAILS = await Promise.all([
        User.findOne({
          thingsMatchAccount: itemOwnerID,
        }),
        User.findOne({
          thingsMAtchAccount: itemSwiperID,
        }),
        Message.findOne({
          matchId: matchID,
        }),
        Item.findById(itemID),
      ]);
      matchObject.itemDetails = {
        item: DETAILS.length ? DETAILS[3] : "Unknown Item",
      };
      matchObject.itemOwnerDetails = {
        name: DETAILS.length
          ? DETAILS[0].firstName + " " + DETAILS[0].lastName
          : "Unknown User",
        email: DETAILS.length ? DETAILS[0].email : null,
        profilePicture: DETAILS.length ? DETAILS[0].profilePicture?.url : null,
      };
      matchObject.itemSwiperDetails = {
        name: DETAILS.length
          ? DETAILS[1].firstName + " " + DETAILS[1].lastName
          : "Unknown User",
        email: DETAILS.length ? DETAILS[1].email : null,
        profilePicture: DETAILS.length ? DETAILS[1].profilePicture?.url : null,
      };
      matchObject.hasMessages = {
        status: DETAILS[2] ? true : false,
      };

      return matchObject;
    })
  );

  return populatedMatches;
}

module.exports = {
  createMatchOnSwipeAndSendDefaultMessage,
  confirmMatch,
  updateMatchStatus,
  getUserMatches,
  getMatchById,
  adminGetAllMatches,
  getMatchesForItem,
};
