const Item = require("../../models/thingsMatch/items.model.js");
const ThingsMatchUser = require("../../models/thingsMatch/user.model.js");
const Swipe = require("../../models/thingsMatch/swipe.model.js");
const RedisService = require("../../service/redis.service.js");
const getCoordinates = require("../../utility/geocode.js");
const cloudinaryUpload = require("../../config/cloudinaryUpload");
const CACHE_KEYS = require("./cacheKeys.js");
const mongoose = require("mongoose");

async function addItem(data, thingsMatchUserId, files) {
  try {
    const { name, description, category, address } = data;
    if (!name || !description || !category || !address) {
      throw new Error("All fields are required");
    }
    const user = await ThingsMatchUser.findById(thingsMatchUserId);
    if (!user) {
      throw new Error("User not found");
    }

    let location;
    try {
      const geoData = await getCoordinates(address);

      location = {
        type: "Point",
        coordinates: [geoData.lng, geoData.lat], // [longitude, latitude]
        address: address,
      };

      console.log(
        `Geocoded address to coordinates: [${geoData.lng}, ${geoData.lat}]`
      );
    } catch (geoError) {
      console.error("Geocoding error:", geoError);
      throw new Error(`Failed to geocode address: ${geoError.message}`);
    }

    // Create the item object
    const item = new Item({
      userId: thingsMatchUserId,
      name,
      description,
      category,
      location,
      itemImages: [],
    });

    // Process uploaded images if any
    if (files && files.length > 0) {
      const imagePromises = files.map(async (file) => {
        try {
          const result = await cloudinaryUpload.image(file.path);
          return {
            public_id: result.public_id,
            url: result.secure_url,
          };
        } catch (error) {
          console.error("Error uploading image to Cloudinary:", error);
          return null;
        }
      });

      const uploadedImages = await Promise.all(imagePromises);
      // Filter out any failed uploads
      item.itemImages = uploadedImages.filter((img) => img !== null);
    }

    await item.save();

    // Cache the individual item
    await RedisService.set(CACHE_KEYS.ITEM_DETAIL(item._id), item);

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
      console.error("Cache invalidation error:", cacheError);
    }

    return {
      message: "Item added successfully",
      item: item.id,
      imagesUploaded: item.itemImages.length,
    };
  } catch (error) {
    console.error("Error adding item:", error);
    throw new Error("Failed to add item");
  }
}

async function getItemsToSwipe(
  thingsMatchUserId,
  notInInterest,
  coordinates,
  maxDistance = 1000000,
  testing
) {
  try {
    let itemsToSwipe = [];
    console.log(testing, "TESTING");

    // Since Redis is disabled, we'll use the same approach as testing mode
    console.log("Redis disabled - using direct database queries");

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

    if (notInInterest === true) {
      // No category filter needed - show all items
    } else if (notInInterest === false) {
      fetchItemQuery.category = { $nin: userInterests };
    }

    if (coordinates && coordinates.length === 2 && !testing) {
      fetchItemQuery["location"] = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [coordinates[0], coordinates[1]], // [longitude, latitude]
          },
          $maxDistance: maxDistance,
        },
      };
    }

    console.log("🚀 ~ getItemsToSwipe ~ fetchItemQuery:", fetchItemQuery);

    const items = await Item.find(fetchItemQuery);
    console.log("🚀 ~ getItemsToSwipe ~ items:", items.length);

    if (!items || items.length === 0) {
      return {
        message: "No items available to swipe",
        items: [],
      };
    }

    // Get user's existing swipes
    const swipes = await Swipe.find({ userId: thingsMatchUserId });

    if (!swipes || swipes.length === 0) {
      console.log("User has no swipes - sending all items.");
      return {
        message: "All items available to swipe, user has no swipes.",
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

    return {
      message: "Items available to swipe (Redis disabled)",
      items: itemsToSwipe,
    };
  } catch (error) {
    console.error("Error in getItemsToSwipe:", error);
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

    // const cachedItem = await RedisService.get(CACHE_KEYS.ITEM_DETAIL(itemId));

    // if (cachedItem) {
    //   console.log(`Retrieved item ${itemId} from cache`);
    //   return {
    //     message: "Item retrieved successfully (from cache)",
    //     item: cachedItem,
    //   };
    // }

    const item = await Item.findById(itemId);

    if (!item) {
      return {
        message: "Item not found",
        item: null,
      };
    }

    // await RedisService.set(CACHE_KEYS.ITEM_DETAIL(itemId), item);

    // console.log(`Cached item ${itemId}`);

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
    // // Try to get item from cache first
    // const cachedItem = await RedisService.get(CACHE_KEYS.ITEM_DETAIL(itemId));
    // let item;

    // if (cachedItem) {
    //   console.log(`Retrieved item ${itemId} from cache for dislike action`);
    //   item = cachedItem;
    // } else {
    //   item = await Item.findById(itemId);
    //   if (item) {
    //     // Cache the item for future use
    //     await RedisService.set(CACHE_KEYS.ITEM_DETAIL(itemId), item);
    //     console.log(`Cached item ${itemId} during dislike action`);
    //   }
    // }

    if (!item) {
      return {
        message: "Item not found",
        item: null,
      };
    }

    // Check if user has already swiped on this item
    // Try to get swipe history from cache
    // const cachedSwipes = await RedisService.get(
    //   CACHE_KEYS.USER_SWIPES(thingsMatchUserId)
    // );
    let userSwipes;

    userSwipes = await Swipe.find({ userId: thingsMatchUserId });

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

    let userInterests;

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
    let item;

    item = await Item.findById(itemId);

    if (!item) {
      return {
        message: "Item not found",
        item: null,
      };
    }

    // Check if user has already swiped on this item
    let userSwipes;

    userSwipes = await Swipe.find({ userId: thingsMatchUserId });

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

    let userInterests;

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

    return message;
  } catch (error) {
    console.error("Error getting created items:", error);
    throw new Error("Failed to get created items");
  }
}

async function updateItem(itemId, data, thingsMatchUserId, files) {
  try {
    // Check if item exists and belongs to the user
    const item = await Item.findById(itemId);
    if (!item) {
      throw new Error("Item not found");
    }

    if (item.userId.toString() !== thingsMatchUserId.toString()) {
      throw new Error("You are not authorized to update this item");
    }

    // Update basic fields if provided
    if (data.name) item.name = data.name;
    if (data.description) item.description = data.description;
    if (data.category) item.category = data.category;

    // Update location if address is provided
    if (data.address) {
      try {
        const geoData = await getCoordinates(data.address);
        item.location = {
          type: "Point",
          coordinates: [geoData.lng, geoData.lat],
          address: data.address,
        };
        console.log(
          `Updated address to coordinates: [${geoData.lng}, ${geoData.lat}]`
        );
      } catch (geoError) {
        console.error("Geocoding error:", geoError);
        throw new Error(`Failed to geocode address: ${geoError.message}`);
      }
    }

    // Process uploaded images if any
    if (files && files.length > 0) {
      const imagePromises = files.map(async (file) => {
        try {
          const result = await cloudinaryUpload.image(file.path);
          return {
            public_id: result.public_id,
            url: result.secure_url,
          };
        } catch (error) {
          console.error("Error uploading image to Cloudinary:", error);
          return null;
        }
      });

      const uploadedImages = await Promise.all(imagePromises);
      // Filter out any failed uploads
      const newImages = uploadedImages.filter((img) => img !== null);

      // Append new images to existing ones
      item.itemImages = [...item.itemImages, ...newImages];
    }

    // Handle image removal if specified
    if (data.removeImages && Array.isArray(data.removeImages)) {
      // Filter out images that should be removed
      item.itemImages = item.itemImages.filter((img) => {
        const shouldRemove = data.removeImages.includes(img.public_id);

        // Delete from Cloudinary if being removed
        if (shouldRemove) {
          try {
            cloudinaryUpload.deleteImage(img.public_id);
          } catch (error) {
            console.error("Error deleting image from Cloudinary:", error);
          }
        }

        return !shouldRemove;
      });
    }

    await item.save();

    // Update cache
    await RedisService.set(CACHE_KEYS.ITEM_DETAIL(item._id), item);
    await RedisService.set(CACHE_KEYS.ITEMS_LAST_UPDATED, Date.now());

    // Clear relevant caches
    await RedisService.del(CACHE_KEYS.USER_AVAILABLE_ITEMS(thingsMatchUserId));
    await RedisService.del(CACHE_KEYS.USER_CACHE_TIMESTAMP(thingsMatchUserId));
    await RedisService.del(CACHE_KEYS.USER_CREATED_ITEMS(thingsMatchUserId));

    console.log(`Item ${item._id} updated and cache flags updated`);

    return {
      message: "Item updated successfully",
      item: item,
    };
  } catch (error) {
    console.error("Error updating item:", error);
    throw new Error(`Failed to update item: ${error.message}`);
  }
}

// Add to module exports
module.exports = {
  addItem,
  getItemsToSwipe,
  getItemById,
  swipeDislike,
  swipeLike,
  getCreatedItems,
  updateItem,
};
