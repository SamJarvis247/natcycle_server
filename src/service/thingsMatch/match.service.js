const Match = require("../../models/thingsMatch/match.model.js");
const Item = require("../../models/thingsMatch/items.model.js");
const itemService = require("./item.service.js");
const messageService = require("./message.service.js"); // Will be created next
const mongoose = require("mongoose");
const User = require("../../models/userModel.js");
const ThingsMatchUser = require("../../models/thingsMatch/user.model.js");

//helper Functions
async function _populateMatchParticipants(match) {
  if (!match) return null;
  const populationPaths = [
    {
      path: 'itemOwnerId', // Ref to ThingsMatchUser model
      populate: {
        path: 'natcycleId', // Ref from ThingsMatchUser to User model
        select: 'firstName lastName profilePicture' // Select specific fields from User
      }
    },
    {
      path: 'itemSwiperId', // Ref to ThingsMatchUser model
      populate: {
        path: 'natcycleId', // Ref from ThingsMatchUser to User model
        select: 'firstName lastName profilePicture'
      }
    },
    {
      path: 'itemId', // Ref to Item model
      select: 'name itemImages category' // Select specific fields from Item
    }
  ];

  const populatedMatch = await match.populate(populationPaths);

  // Helper function to format participant details from the populated ThingsMatchUser object.
  const formatParticipant = (thingsMatchUserInstance) => {
    if (!thingsMatchUserInstance) return null;

    const user = thingsMatchUserInstance.natcycleId;

    if (!user || typeof user !== 'object') {
      return {
        thingsMatchId: thingsMatchUserInstance._id,
        userId: user,
        firstName: null,
        lastName: null,
        name: 'User data incomplete',
        profilePicture: null,
      };
    }

    return {
      thingsMatchId: thingsMatchUserInstance._id,
      userId: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A',
      profilePicture: user.profilePicture?.url || null,
    };
  };

  const finalObject = populatedMatch.toObject({ virtuals: true });

  // Add the formatted participant details to the final object.
  finalObject.itemOwnerDetails = formatParticipant(populatedMatch.itemOwnerId);
  finalObject.itemSwiperDetails = formatParticipant(populatedMatch.itemSwiperId);

  // If itemId is populated, format it as well
  if (populatedMatch.itemId) {
    finalObject.itemDetails = {
      _id: populatedMatch.itemId._id,
      name: populatedMatch.itemId.name,
      itemImages: populatedMatch.itemId.itemImages,
      category: populatedMatch.itemId.category,
    };
  } else {
    finalObject.itemDetails = null;
  }

  // Remove the original populated fields to avoid redundancy
  delete finalObject.itemOwnerId;
  delete finalObject.itemSwiperId;
  delete finalObject.itemId;

  // Return the final object with all necessary details populated
  return finalObject;
}

// Called when an ItemSwiper swipes right and sends a default message
async function createMatchOnSwipeAndSendDefaultMessage(itemId, swiperId, defaultMessageContent) {
  try {
    const item = await itemService.getItemById(itemId);
    if (!item) throw new Error("Item not found.");

    const itemOwnerId = item.userId._id.toString();
    if (itemOwnerId === swiperId.toString()) {
      throw new Error("Cannot show interest in your own item.");
    }

    let existingMatch = await Match.findOne({ itemId, itemOwnerId, itemSwiperId: swiperId });

    if (existingMatch && existingMatch.status !== "unmatched") {
      throw new Error("Interest already registered or match active for this item by you.");
    }

    if (existingMatch && existingMatch.status === "unmatched") {
      existingMatch.status = "pendingInterest";
      existingMatch.lastMessageAt = new Date();
      existingMatch.defaultMessageSent = false;
    } else {
      existingMatch = new Match({
        itemId,
        itemOwnerId,
        itemSwiperId: swiperId,
        status: "pendingInterest",
      });
    }
    await existingMatch.save();
    await itemService.updateItemInterest(itemId, "increment");

    const defaultMsg = await messageService.sendMessage(
      existingMatch._id.toString(),
      swiperId.toString(),
      itemOwnerId,
      defaultMessageContent,
      "default"
    );

    existingMatch.lastMessageAt = defaultMsg.createdAt;
    existingMatch.defaultMessageSent = true;
    await existingMatch.save();

    // const fullyPopulatedMatch = await _populateMatchParticipants(existingMatch);

    return {
      match: existingMatch,
      message: defaultMsg,
      successMessage: "Interest and default message sent successfully."
    };
  } catch (error) {
    console.error("Error creating match on swipe:", error);
    throw new Error(`Failed to create match on swipe: ${error.message}`);
  }
}

async function confirmMatch(matchId, ownerId) {
  try {
    let match = await Match.findById(matchId);
    if (!match) throw new Error("Match not found.");

    if (match.itemOwnerId.toString() !== ownerId.toString()) {
      throw new Error("Only the item owner can confirm this match.");
    }

    let message = "Match already confirmed.";
    if (match.status === "pendingInterest") {
      match.status = "active";
      match.matchedAt = new Date();
      await match.save();
      // TODO: Send notification to swiper that owner has matched (handled by controller via socket).
      message = "Match confirmed. You can now chat.";
    } else if (match.status !== "active") {
      throw new Error(`Cannot confirm match from status: ${match.status}`);
    }

    return { message, match }

  } catch (error) {
    console.error("Error confirming match:", error);
    throw new Error(`Failed to confirm match: ${error.message}`);
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
      status: { $ne: "unmatched" }
    })
      .populate('itemId', 'name itemImages category')
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    const populatedMatches = await Promise.all(
      matches.map(match => _populateMatchParticipants(match))
    );
    return populatedMatches;
  } catch (error) {
    console.error("Error fetching user matches:", error);
    throw new Error("Failed to fetch user matches: " + error.message);
  }
}

async function getMatchById(matchId, requestingUserId) {
  try {
    const match = await Match.findById(matchId)
      .populate('itemId', 'name itemImages category description'); // More item details

    if (!match) {
      return null;
    }
    // Authorization: check if requestingUserId is part of the match
    if (match.itemOwnerId.toString() !== requestingUserId.toString() &&
      match.itemSwiperId.toString() !== requestingUserId.toString()) {
      throw new Error("User not authorized to view this match.");
    }

    return await _populateMatchParticipants(match);
  } catch (error) {
    console.error(`Error fetching match by ID ${matchId}:`, error);
    throw new Error(`Failed to fetch match details: ${error.message}`);
  }
}


//get userCreated items with matches
async function getUserCreatedItemsWithMatches(userId) {
  try {
    const items = await Item.find({ creatorId: userId });
    const itemIds = items.map(item => item._id);
    const matches = await Match.find({
      itemOwnerId: userId,
      status: { $in: ["pendingInterest", "matched"] },
      itemId: { $in: itemIds }
    }).populate("itemId itemOwnerId itemSwiperId");
    console.log(matches.length, "matches found for user:", userId);
    if (matches.length === 0) {
      return {
        message: "No matches found for your created items.",
        items: [],
        matches: []
      };
    }
  } catch (error) {
    console.error("Error fetching user created items with matches:", error);
    throw new Error("Failed to fetch user created items with matches: " + error.message);
  }
}

async function getMatchesForItem(itemId) {
  try {
    const matches = await Match.find({ itemId, status: "matched" })
      .sort({ matchedAt: -1 });

    const populatedMatches = await Promise.all(matches.map(async (match) => {
      const matchObject = match.toObject() ? match.toObject() : { ...match }
      let ID = match.itemOwnerId ? match.itemOwnerId : match.itemOwnerId._id;
      let itemSwiperId = match.itemSwiperId ? match.itemSwiperId : match.itemSwiperId._id;
      //find User
      const allCalls = await Promise.all([User.findOne({ thingsMatchAccount: ID }), User.findOne({ thingsMatchAccount: itemSwiperId })]);

      allCalls[0] ?
        matchObject.itemOwnerId = allCalls[0]._id :
        matchObject.itemOwnerId = null;
      allCalls[1] ?
        matchObject.itemSwiperId = allCalls[1]._id :
        matchObject.itemSwiperId = null;

      return matchObject;
    }));
    return populatedMatches;
  } catch (error) {
    console.error("Error fetching matches for item:", error);
    throw new Error("Failed to fetch matches for item: " + error.message);
  }
}

module.exports = {
  createMatchOnSwipeAndSendDefaultMessage,
  confirmMatch,
  updateMatchStatus,
  getUserMatches,
  getMatchById,
  getUserCreatedItemsWithMatches,
  getMatchesForItem
};
