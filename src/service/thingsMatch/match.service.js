const Match = require("../../models/thingsMatch/match.model.js");
const Item = require("../../models/thingsMatch/items.model.js");
const Swipe = require("../../models/thingsMatch/swipe.model.js"); // If swipe direction influences match creation
const itemService = require("./item.service.js"); // For item updates
const RedisService = require("../redis.service.js");
const CACHE_KEYS = require("./cacheKeys.js");

async function createMatchOnSwipe(itemId, swiperId, swipeDirection) {
  try {
    if (swipeDirection !== "right") {
      // Only a 'right' swipe can potentially create a match immediately
      // 'left' swipes are just recorded and don't lead to a match from the swiper's side
      return { message: "No match created for left swipe.", match: null };
    }

    const item = await Item.findById(itemId).populate("userId");
    if (!item) {
      throw new Error("Item not found for match creation.");
    }

    const itemOwnerId = item.userId._id.toString();

    if (itemOwnerId === swiperId) {
      throw new Error("Cannot match with your own item.");
    }

    // Check if a match already exists (could be initiated by either party)
    let existingMatch = await Match.findOne({
      itemId,
      $or: [
        { itemOwnerId, interestedUserId: swiperId },
        { itemOwnerId: swiperId, interestedUserId: itemOwnerId }, // Should not happen with current flow but good for robustness
      ],
    });

    if (existingMatch) {
      // Potentially update status if needed, e.g., if one user re-confirms interest
      return {
        message: "Match already exists or pending.",
        match: existingMatch,
      };
    }

    // Create a new match, status will be 'pending' until item owner responds or 'matched' if this swipe completes it.
    // The diagram implies a swipe right leads to sending a message, and then the owner's response leads to 'Matched'.
    // So, a swipe right by 'Item Swiper' should create a 'pendingInterest' or similar status.
    // The 'Matched' status happens after the 'Item Owner' responds to a message.

    const newMatch = new Match({
      itemId,
      itemOwnerId, // User who owns the item
      interestedUserId: swiperId, // User who swiped right
      status: "pendingConfirmation", // Swiper showed interest, owner needs to confirm/chat
      // lastMessageAt will be updated by message service
    });

    await newMatch.save();

    // Update item's interest count
    await itemService.updateItemInterest(itemId, "increment");

    // Cache invalidation/updates for matches
    await RedisService.del(CACHE_KEYS.USER_MATCHES(itemOwnerId));
    await RedisService.del(CACHE_KEYS.USER_MATCHES(swiperId));

    // TODO: Send notification to item owner about the new interest/potential match

    return {
      message: "Interest registered. Pending owner action.",
      match: newMatch,
    };
  } catch (error) {
    console.error("Error creating match on swipe:", error);
    throw new Error("Failed to process swipe for match creation.");
  }
}

async function updateMatchStatus(matchId, newStatus, userId) {
  try {
    const match = await Match.findById(matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    // Authorization: Ensure the user making the change is part of the match
    if (
      match.itemOwnerId.toString() !== userId &&
      match.interestedUserId.toString() !== userId
    ) {
      throw new Error("User not authorized to update this match.");
    }

    // Logic for status transitions, e.g., 'pendingConfirmation' -> 'matched' or 'blocked'
    // 'matched' status is set when item owner responds positively (initiates chat or accepts)
    // 'blocked' status can be set by either user
    match.status = newStatus;
    if (newStatus === "matched") {
      match.matchedAt = new Date();
      // Potentially update item's discoveryStatus to 'faded' or 'hidden' if it's a 1-to-1 match system
      // await itemService.setItemDiscoveryStatus(match.itemId, 'faded', match.itemOwnerId);
    } else if (newStatus === "blocked") {
      // Additional logic for blocking, e.g., prevent further messages
    }

    await match.save();

    // Cache invalidation
    await RedisService.del(CACHE_KEYS.MATCH_DETAIL(matchId));
    await RedisService.del(
      CACHE_KEYS.USER_MATCHES(match.itemOwnerId.toString())
    );
    await RedisService.del(
      CACHE_KEYS.USER_MATCHES(match.interestedUserId.toString())
    );

    // TODO: Send notifications based on status change

    return match;
  } catch (error) {
    console.error("Error updating match status:", error);
    throw new Error("Failed to update match status");
  }
}

async function getUserMatches(userId) {
  try {
    const cacheKey = CACHE_KEYS.USER_MATCHES(userId);
    let matches = await RedisService.get(cacheKey);

    if (matches) {
      return matches;
    }

    matches = await Match.find({
      $or: [{ itemOwnerId: userId }, { interestedUserId: userId }],
      status: { $in: ["pendingConfirmation", "matched"] }, // Or other relevant statuses
    })
      .populate("itemId itemOwnerId interestedUserId")
      .sort({ updatedAt: -1 });

    await RedisService.set(cacheKey, matches, 3600); // Cache for 1 hour

    return matches;
  } catch (error) {
    console.error("Error fetching user matches:", error);
    throw new Error("Failed to fetch user matches");
  }
}

async function getMatchById(matchId) {
  try {
    const cacheKey = CACHE_KEYS.MATCH_DETAIL(matchId);
    let match = await RedisService.get(cacheKey);
    if (match) return match;

    match = await Match.findById(matchId).populate(
      "itemId itemOwnerId interestedUserId"
    );
    if (!match) throw new Error("Match not found");

    await RedisService.set(cacheKey, match, 3600);
    return match;
  } catch (error) {
    console.error(`Error fetching match by ID ${matchId}:`, error);
    throw new Error("Failed to fetch match details");
  }
}

module.exports = {
  createMatchOnSwipe,
  updateMatchStatus,
  getUserMatches,
  getMatchById,
};
