const Match = require("../../models/thingsMatch/match.model.js");
const Item = require("../../models/thingsMatch/items.model.js");
const Message = require("../../models/thingsMatch/message.model.js");
const User = require("../../models/userModel.js");
const ThingsMatchUser = require("../../models/thingsMatch/user.model.js");
const itemService = require("./item.service.js");
const messageService = require("./message.service.js");
const { populateSenderDetails } = require("./message.service.js");
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
      itemSwiperId: swiperId,
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
        itemSwiperId: swiperId,
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
      match.itemSwiperId.toString() !== userId
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
            thingsMatchAccount: itemSwiperID,
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
        thingsMatchAccount: itemSwiperID,
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
            thingsMatchAccount: itemSwiperID,
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
          thingsMatchAccount: itemSwiperID,
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

// Called by ItemOwner to end a match and mark item as given away
async function endMatch(matchId, userId) {
  try {
    const match = await Match.findById(matchId).populate("itemId");
    if (!match) throw new Error("Match not found");

    // Check if user is the item owner
    if (match.itemOwnerId.toString() !== userId.toString()) {
      throw new Error("Only the item owner can end this match");
    }

    // Check if match is in a valid state to be ended
    const validStatuses = ["active", "pendingInterest"];
    if (!validStatuses.includes(match.status)) {
      throw new Error(`Cannot end match with status: ${match.status}`);
    }

    // Update the item status to given_away
    const item = await Item.findById(match.itemId);
    if (!item) throw new Error("Item not found");

    item.status = "given_away";
    item.discoveryStatus = "faded"; // Hide from discovery
    await item.save();

    // Update match status to completed_by_owner
    match.status = "completed_by_owner";
    await match.save();

    // Delete all messages for this match to clean up database
    await messageService.deleteMessagesForMatch(matchId);

    // Update user stats - increment items shared for the owner
    const ownerThingsMatchUser = await ThingsMatchUser.findById(match.itemOwnerId);
    if (ownerThingsMatchUser) {
      ownerThingsMatchUser.itemsShared = (ownerThingsMatchUser.itemsShared || 0) + 1;
      await ownerThingsMatchUser.save();
    }

    // Optional: End all other pending matches for this item since it's now given away
    const otherMatches = await Match.find({
      itemId: match.itemId,
      _id: { $ne: matchId },
      status: { $in: ["active", "pendingInterest"] }
    });

    if (otherMatches.length > 0) {
      // Update other matches to archived status
      await Match.updateMany(
        {
          itemId: match.itemId,
          _id: { $ne: matchId },
          status: { $in: ["active", "pendingInterest"] }
        },
        {
          status: "archived",
          archivedReason: "item_given_away_to_other_user"
        }
      );

      // Clean up messages for archived matches as well
      for (const otherMatch of otherMatches) {
        await messageService.deleteMessagesForMatch(otherMatch._id);
      }
    }

    return {
      message: "Match ended successfully. Item marked as given away.",
      match: match,
      item: item,
      archivedMatches: otherMatches.length
    };
  } catch (error) {
    console.error("Error ending match:", error);
    throw new Error("Failed to end match: " + error.message);
  }
}

// Get all chats where the user is the itemSwiper
const getMyChatsAsSwiper = async (userId, page = 1, limit = 10) => {
  try {
    // First, find all matches where user is itemSwiper and has messages
    const matches = await Match.find({
      itemSwiperId: userId,
      status: { $in: ["active", "pendingInterest"] }
    }).sort({ updatedAt: -1 });

    // Filter matches that have messages using Message collection
    const matchesWithMessages = [];
    for (const match of matches) {
      const hasMessage = await Message.findOne({ matchId: match._id });
      if (hasMessage) {
        matchesWithMessages.push(match);
      }
    }
    console.log("Has messages matches:", matchesWithMessages.length);

    // Apply pagination after filtering
    const totalDocuments = matchesWithMessages.length;
    const totalPages = Math.ceil(totalDocuments / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    if (page < 1 || (page > totalPages && totalPages > 0)) {
      return {
        success: false,
        message: 'Invalid page number',
        data: null
      };
    }

    const paginatedMatches = matchesWithMessages.slice(startIndex, endIndex);

    // Manual population using Promise.all pattern
    const populatedMatches = await Promise.all(
      paginatedMatches.map(async (match) => {
        const matchObject = match.toObject ? match.toObject() : { ...match };
        const matchId = matchObject._id;
        const itemOwnerId = matchObject.itemOwnerId;
        const itemSwiperId = matchObject.itemSwiperId;
        const itemId = matchObject.itemId;

        // Fetch all related data in parallel
        const [itemOwnerUser, itemSwiperUser, latestMessage, item] = await Promise.all([
          User.findOne({ thingsMatchAccount: itemOwnerId }),
          User.findOne({ thingsMatchAccount: itemSwiperId }),
          Message.findOne({ matchId: matchId }).sort({ createdAt: -1 }),
          Item.findById(itemId)
        ]);

        // Enrich match object with populated data
        matchObject.itemDetails = {
          item: item || "Unknown Item"
        };

        matchObject.itemOwnerDetails = {
          name: itemOwnerUser
            ? `${itemOwnerUser.firstName} ${itemOwnerUser.lastName}`.trim()
            : "Unknown User",
          email: itemOwnerUser?.email || null,
          profilePicture: itemOwnerUser?.profilePicture?.url || null
        };

        matchObject.itemSwiperDetails = {
          name: itemSwiperUser
            ? `${itemSwiperUser.firstName} ${itemSwiperUser.lastName}`.trim()
            : "Unknown User",
          email: itemSwiperUser?.email || null,
          profilePicture: itemSwiperUser?.profilePicture?.url || null
        };

        // Add latest message details if exists
        if (latestMessage) {
          // Populate sender details for the latest message
          const populatedMessage = await populateSenderDetails(latestMessage);
          matchObject.latestMessage = populatedMessage;
        } else {
          matchObject.latestMessage = null;
        }

        matchObject.hasMessages = {
          status: latestMessage ? true : false
        };

        // Indicate user's role in this match (always itemSwiper for this endpoint)
        matchObject.userRole = {
          itemOwner: false,
          itemSwiper: true
        };

        return matchObject;
      })
    );

    return {
      success: true,
      message: 'Chats retrieved successfully',
      data: {
        matches: populatedMatches,
        pagination: {
          page,
          totalPages,
          totalDocuments,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    };
  } catch (error) {
    console.error('Error in getMyChatsAsSwiper:', error);
    return {
      success: false,
      message: 'Error retrieving chats',
      data: null
    };
  }
};

module.exports = {
  createMatchOnSwipeAndSendDefaultMessage,
  confirmMatch,
  updateMatchStatus,
  getUserMatches,
  getMatchById,
  adminGetAllMatches,
  getMatchesForItem,
  endMatch,
  getMyChatsAsSwiper
};
