const Item = require("../../models/thingsMatch/items.model.js");
const ThingsMatchUser = require("../../models/thingsMatch/user.model.js");
const Swipe = require("../../models/thingsMatch/swipe.model.js");
const RedisService = require("../../service/redis.service.js");
const CACHE_KEYS = require("./cacheKeys.js");
const mongoose = require("mongoose");

async function addItem(data, thingsMatchUserId) {
  try {
    const { name, description, category, location } = data;
    if (!name || !description || !category || !location) {
      throw new Error("All fields are required");
    }
    const user = await ThingsMatchUser.findById(thingsMatchUserId);
    if (!user) {
      throw new Error("User not found");
    }

    const item = new Item({
      userId: thingsMatchUserId,
      name,
      description,
      category,
      location,
    });
    await item.save();

    // Cache the individual item
    await RedisService.set(CACHE_KEYS.ITEM_DETAIL(item._id), item);

    // Invalidate all user item caches using pattern matching
    try {
      await RedisService.set(CACHE_KEYS.ITEMS_LAST_UPDATED, Date.now());

      // Clear the creator's own cache specifically
      await RedisService.del(
        CACHE_KEYS.USER_AVAILABLE_ITEMS(thingsMatchUserId)
      );
      await RedisService.del(
        CACHE_KEYS.USER_CACHE_TIMESTAMP(thingsMatchUserId)
      );

      console.log(`Item ${item._id} added and cache flags updated`);
    } catch (cacheError) {
      // Log but don't fail the operation if cache update fails
      console.error("Cache invalidation error:", cacheError);
    }

    return {
      message: "Item added successfully",
      item: item.id,
    };
  } catch (error) {
    console.error("Error adding item:", error);
    throw new Error("Failed to add item");
  }
}

async function getItemsToSwipe(thingsMatchUserId, notInInterest) {
  try {
    let itemsToSwipe = [];

    const lastUpdated = await RedisService.get(CACHE_KEYS.ITEMS_LAST_UPDATED);
    const userCacheTimestamp = await RedisService.get(
      CACHE_KEYS.USER_CACHE_TIMESTAMP(thingsMatchUserId)
    );

    // Try to get items from cache first
    const cachedItems = await RedisService.get(
      CACHE_KEYS.USER_AVAILABLE_ITEMS(thingsMatchUserId)
    );

    // If we have cached items but they might be stale, check timestamp
    if (cachedItems && cachedItems.length > 0) {
      // If no timestamp for this user's cache or it's older than last update, invalidate cache
      if (
        !userCacheTimestamp ||
        (lastUpdated && parseInt(lastUpdated) > parseInt(userCacheTimestamp))
      ) {
        console.log(
          `Cache for user ${thingsMatchUserId} is stale, refreshing data...`
        );
        await RedisService.del(
          CACHE_KEYS.USER_AVAILABLE_ITEMS(thingsMatchUserId)
        );
      } else {
        console.log(
          `Retrieved ${cachedItems.length} items from cache for user ${thingsMatchUserId}`
        );
        return {
          message: "Items available to swipe (from cache)",
          items: cachedItems,
        };
      }
    }

    // If no valid cached items, proceed with database queries
    // Find all available items not created by the current user
    const today = new Date();
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const user = await ThingsMatchUser.findById(thingsMatchUserId);
    if (!user) {
      return {
        message: "User not found",
        items: [],
      };
    }
    const userInterests = user.interests;
    console.log(userInterests, "userInterests");

    let fetchItemQuery = {
      userId: { $ne: thingsMatchUserId.toString() },
      status: "available",
      createdAt: { $gte: oneMonthAgo },
    };

    // Add category filters based on notInInterest parameter
    if (notInInterest === true) {
      // No category filter needed - show all items
    } else if (notInInterest === false) {
      fetchItemQuery.category = { $nin: userInterests };
    }

    console.log("🚀 ~ getItemsToSwipe ~ fetchItemQuery:", fetchItemQuery);

    const items = await Item.find(fetchItemQuery);
    console.log("🚀 ~ getItemsToSwipe ~ items:", items);

    if (!items || items.length === 0) {
      return {
        message: "No items available to swipe",
        items: [],
      };
    }

    // Get user's existing swipes
    const swipes = await Swipe.find({ userId: thingsMatchUserId });

    if (!swipes || swipes.length === 0) {
      const now = Date.now();
      await RedisService.set(
        CACHE_KEYS.USER_AVAILABLE_ITEMS(thingsMatchUserId),
        items,
        3600
      );
      await RedisService.set(
        CACHE_KEYS.USER_CACHE_TIMESTAMP(thingsMatchUserId),
        now,
        3600
      );

      console.log(
        `Cached ${items.length} items for new user ${thingsMatchUserId}`
      );

      return {
        message: "All items available to swipe",
        items: items,
      };
    }

    const swipedItemIds = new Set(
      swipes.map((swipe) => swipe.itemId.toString())
    );

    itemsToSwipe = items.filter(
      (item) => !swipedItemIds.has(item._id.toString())
    );

    if (itemsToSwipe.length === 0) {
      return {
        message: "You've seen all available items",
        items: [],
      };
    }

    const now = Date.now();
    await RedisService.set(
      CACHE_KEYS.USER_AVAILABLE_ITEMS(thingsMatchUserId),
      itemsToSwipe,
      3600
    );
    await RedisService.set(
      CACHE_KEYS.USER_CACHE_TIMESTAMP(thingsMatchUserId),
      now,
      3600
    );

    console.log(
      `Cached ${itemsToSwipe.length} filtered items for user ${thingsMatchUserId}`
    );

    return {
      message: "Items available to swipe",
      items: itemsToSwipe,
    };
  } catch (error) {
    console.error("Error getting items to swipe:", error);
    throw new Error("Failed to get items to swipe");
  }
}

async function getItemById(itemId) {
  try {
    // Log the incoming ID for debugging
    console.log(`Attempting to get item with ID: ${itemId}`);

    // Check if ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      console.log(`Invalid ObjectId format: ${itemId}`);
      return {
        message: "Invalid item ID format",
        item: null,
      };
    }

    const cachedItem = await RedisService.get(CACHE_KEYS.ITEM_DETAIL(itemId));

    if (cachedItem) {
      console.log(`Retrieved item ${itemId} from cache`);
      return {
        message: "Item retrieved successfully (from cache)",
        item: cachedItem,
      };
    }

    const item = await Item.findById(itemId);

    if (!item) {
      return {
        message: "Item not found",
        item: null,
      };
    }

    await RedisService.set(CACHE_KEYS.ITEM_DETAIL(itemId), item);

    console.log(`Cached item ${itemId}`);

    return {
      message: "Item retrieved successfully",
      item: item,
    };
  } catch (error) {
    console.log(error, "Error in getting Item");
    throw new Error(`Failed to get item: ${error.message}`);
  }
}

//swipe functions
async function swipeDislike(itemId, thingsMatchUserId) {
  try {
    // Try to get item from cache first
    const cachedItem = await RedisService.get(CACHE_KEYS.ITEM_DETAIL(itemId));
    let item;

    if (cachedItem) {
      console.log(`Retrieved item ${itemId} from cache for dislike action`);
      item = cachedItem;
    } else {
      item = await Item.findById(itemId);
      if (item) {
        // Cache the item for future use
        await RedisService.set(CACHE_KEYS.ITEM_DETAIL(itemId), item);
        console.log(`Cached item ${itemId} during dislike action`);
      }
    }

    if (!item) {
      return {
        message: "Item not found",
        item: null,
      };
    }

    // Check if user has already swiped on this item
    // Try to get swipe history from cache
    const cachedSwipes = await RedisService.get(
      CACHE_KEYS.USER_SWIPES(thingsMatchUserId)
    );
    let userSwipes;

    if (cachedSwipes) {
      console.log(
        `Retrieved swipe history for user ${thingsMatchUserId} from cache`
      );
      userSwipes = cachedSwipes;
    } else {
      userSwipes = await Swipe.find({ userId: thingsMatchUserId });
      // Cache the user's swipe history
      await RedisService.set(
        CACHE_KEYS.USER_SWIPES(thingsMatchUserId),
        userSwipes
      );
      console.log(`Cached swipe history for user ${thingsMatchUserId}`);
    }

    if (
      userSwipes &&
      userSwipes.some((swipe) => swipe.itemId.toString() === itemId.toString())
    ) {
      return {
        message: "Item has already been swiped by the user",
        item: null,
      };
    }

    //check if item in users interest
    const itemCategory = item.category;

    // Try to get user from cache or database
    const cachedUser = await RedisService.get(
      CACHE_KEYS.USER_PROFILE(thingsMatchUserId)
    );
    let userInterests;

    if (cachedUser) {
      console.log(`Retrieved user ${thingsMatchUserId} from cache`);
      userInterests = cachedUser.interests;
    } else {
      const user = await ThingsMatchUser.findById(thingsMatchUserId).select(
        "interests"
      );
      if (!user) {
        return {
          message: "User not found",
          item: null,
        };
      }
      userInterests = user.interests;
      // Cache the user profile
      await RedisService.set(CACHE_KEYS.USER_PROFILE(thingsMatchUserId), user);
      console.log(`Cached user ${thingsMatchUserId} profile`);
    }

    const returnMessage = {};
    if (!userInterests.includes(itemCategory)) {
      returnMessage.concern = `This item is not in your interests, do you want to add this category:${itemCategory} to your interests?`;
    }

    //make a swipe of Pass
    const swapObject = {
      userId: thingsMatchUserId,
      itemId: itemId,
      action: "dislike",
    };
    const swipe = new Swipe(swapObject);
    await swipe.save();

    // Update swipe cache
    if (cachedSwipes) {
      cachedSwipes.push(swipe);
      await RedisService.set(
        CACHE_KEYS.USER_SWIPES(thingsMatchUserId),
        cachedSwipes
      );
      console.log(`Updated swipe cache for user ${thingsMatchUserId}`);
    } else {
      await RedisService.del(CACHE_KEYS.USER_SWIPES(thingsMatchUserId));
    }

    // Invalidate the items to swipe cache since available items have changed
    await RedisService.del(CACHE_KEYS.USER_AVAILABLE_ITEMS(thingsMatchUserId));
    await RedisService.set(CACHE_KEYS.ITEMS_LAST_UPDATED, Date.now());
    console.log(
      `Invalidated items to swipe cache for user ${thingsMatchUserId} after dislike`
    );

    return {
      message: "Item swiped successfully as Dislike.",
      item: item,
    };
  } catch (error) {
    console.log(error, "Error in swiping Item");
    throw new Error("Failed to swipe item");
  }
}

async function swipeLike(itemId, thingsMatchUserId) {
  try {
    // Try to get item from cache first
    const cachedItem = await RedisService.get(CACHE_KEYS.ITEM_DETAIL(itemId));
    let item;

    if (cachedItem) {
      console.log(`Retrieved item ${itemId} from cache for like action`);
      item = cachedItem;
    } else {
      item = await Item.findById(itemId);
      if (item) {
        // Cache the item for future use
        await RedisService.set(CACHE_KEYS.ITEM_DETAIL(itemId), item);
        console.log(`Cached item ${itemId} during like action`);
      }
    }

    if (!item) {
      return {
        message: "Item not found",
        item: null,
      };
    }

    // Check if user has already swiped on this item
    // Try to get swipe history from cache
    const cachedSwipes = await RedisService.get(
      CACHE_KEYS.USER_SWIPES(thingsMatchUserId)
    );
    let userSwipes;

    if (cachedSwipes) {
      console.log(
        `Retrieved swipe history for user ${thingsMatchUserId} from cache`
      );
      userSwipes = cachedSwipes;
    } else {
      userSwipes = await Swipe.find({ userId: thingsMatchUserId });
      // Cache the user's swipe history
      await RedisService.set(
        CACHE_KEYS.USER_SWIPES(thingsMatchUserId),
        userSwipes
      );
      console.log(`Cached swipe history for user ${thingsMatchUserId}`);
    }

    if (
      userSwipes &&
      userSwipes.some((swipe) => swipe.itemId.toString() === itemId.toString())
    ) {
      return {
        message: "Item has already been swiped by the user",
        item: null,
      };
    }

    //check if item in users interest
    const itemCategory = item.category;

    // Try to get user from cache or database
    const cachedUser = await RedisService.get(
      CACHE_KEYS.USER_PROFILE(thingsMatchUserId)
    );
    let userInterests;

    if (cachedUser) {
      console.log(`Retrieved user ${thingsMatchUserId} from cache`);
      userInterests = cachedUser.interests;
    } else {
      const user = await ThingsMatchUser.findById(thingsMatchUserId).select(
        "interests"
      );
      if (!user) {
        return {
          message: "User not found",
          item: null,
        };
      }
      userInterests = user.interests;
      // Cache the user profile
      await RedisService.set(CACHE_KEYS.USER_PROFILE(thingsMatchUserId), user);
      console.log(`Cached user ${thingsMatchUserId} profile`);
    }

    let returnMessage = {};
    if (!userInterests.includes(itemCategory)) {
      returnMessage.concern = `This item is not in your interests, do you want to add this category:${itemCategory} to your interests?`;
    }

    //make a swipe of Like
    const swapObject = {
      userId: thingsMatchUserId,
      itemId: itemId,
      action: "like",
    };
    const swipe = new Swipe(swapObject);
    await swipe.save();

    // Update swipe cache
    if (cachedSwipes) {
      cachedSwipes.push(swipe);
      await RedisService.set(
        CACHE_KEYS.USER_SWIPES(thingsMatchUserId),
        cachedSwipes
      );
      console.log(`Updated swipe cache for user ${thingsMatchUserId}`);
    } else {
      await RedisService.del(CACHE_KEYS.USER_SWIPES(thingsMatchUserId));
    }

    // Update liked items cache
    const cachedLikedItems = await RedisService.get(
      CACHE_KEYS.USER_LIKED_ITEMS(thingsMatchUserId)
    );
    if (cachedLikedItems) {
      cachedLikedItems.push(item);
      await RedisService.set(
        CACHE_KEYS.USER_LIKED_ITEMS(thingsMatchUserId),
        cachedLikedItems
      );
    } else {
      await RedisService.set(CACHE_KEYS.USER_LIKED_ITEMS(thingsMatchUserId), [
        item,
      ]);
    }

    // Invalidate the items to swipe cache since available items have changed
    await RedisService.del(CACHE_KEYS.USER_AVAILABLE_ITEMS(thingsMatchUserId));
    await RedisService.set(CACHE_KEYS.ITEMS_LAST_UPDATED, Date.now());
    console.log(
      `Invalidated items to swipe cache for user ${thingsMatchUserId} after like`
    );

    returnMessage.message = "Item swiped successfully";
    returnMessage.item = item.id;
    returnMessage.swipedUser = thingsMatchUserId;
    returnMessage.itemCreator = item.userId;
    returnMessage.initialMessage = "I am interested in this item";

    return returnMessage;
  } catch (error) {
    console.log(error, "Error in swiping Item");
    throw new Error("Failed to swipe item");
  }
}

//get all created Items and Like Swipes
async function getCreatedItems(thingsMatchUserId) {
  try {
    // Try to get created items from cache first
    const cacheKey = CACHE_KEYS.USER_CREATED_ITEMS(thingsMatchUserId);
    const cachedItems = await RedisService.get(cacheKey);

    if (cachedItems) {
      console.log(
        `Retrieved created items for user ${thingsMatchUserId} from cache`
      );
      return cachedItems;
    }

    // If not in cache, fetch from database
    const createdItems = await Item.find({
      userId: thingsMatchUserId.toString(),
    });
    console.log(
      `Retrieved created items for user ${thingsMatchUserId} from database`
    );
    let likedItems = [];
    let createdItemsIds = [];

    if (!createdItems || createdItems.length === 0) {
      return {
        message: "No items created by the user",
        items: [],
      };
    }
    createdItemsIds = createdItems.map((item) => item._id);

    const likedSwipes = await Swipe.find({
      itemId: { $in: createdItemsIds },
      action: "like",
    });

    let message = {
      message: "Items created by the user and liked by others",
      items: createdItems,
      likedItems: likedSwipes.length > 0 ? likedSwipes : [],
    };

    // Cache the result for future requests
    await RedisService.set(cacheKey, message, 3600); // Cache for 1 hour
    console.log(`Cached created items for user ${thingsMatchUserId}`);

    return message;
  } catch (error) {
    console.error("Error getting created items:", error);
    throw new Error("Failed to get created items");
  }
}

module.exports = {
  addItem,
  getItemsToSwipe,
  getItemById,
  swipeDislike,
  swipeLike,
  getCreatedItems,
};
