const Item = require("../../models/thingsMatch/items.model.js");
const ThingsMatchUser = require("../../models/thingsMatch/user.model.js");
const getCoordinates = require("../../utility/geocode.js");
const cloudinaryUpload = require("../../config/cloudinaryUpload");
const mongoose = require("mongoose");
// const User = require("../../models/userModel.js"); // Assuming ThingsMatchUser is primary for this context

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
        coordinates: [geoData.lng, geoData.lat],
        address: address,
      };
    } catch (geoError) {
      console.error("Geocoding error:", geoError);
      throw new Error(`Failed to geocode address: ${geoError.message}`);
    }

    const item = new Item({
      userId: thingsMatchUserId,
      name,
      description,
      category,
      location,
      itemImages: [],
      discoveryStatus: "active",
      interestCount: 0,
    });

    if (files && files.length > 0) {
      const imagePromises = files.map(async (file) => {
        try {
          const result = await cloudinaryUpload.image(file.path);
          return { public_id: result.public_id, url: result.secure_url };
        } catch (error) {
          console.error("Error uploading image to Cloudinary:", error);
          return null;
        }
      });
      item.itemImages = (await Promise.all(imagePromises)).filter(
        (img) => img !== null
      );
    }

    await item.save();
    return {
      message: "Item added successfully",
      item: item.id,
      imagesUploaded: item.itemImages.length,
    };
  } catch (error) {
    console.error("Error adding item:", error);
    throw new Error("Failed to add item: " + error.message);
  }
}

async function getItemsToSwipe(
  thingsMatchUserId,
  coordinates,
  maxDistance = 1000000
) {
  try {
    const user = await ThingsMatchUser.findById(thingsMatchUserId);
    if (!user) {
      return { message: "User not found", items: [] };
    }

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    let fetchItemQuery = {
      userId: { $ne: mongoose.Types.ObjectId(thingsMatchUserId) },
      status: "available",
      discoveryStatus: "active",
      interestCount: { $lt: 10 },
      // createdAt: { $gte: oneMonthAgo },
    };

    if (coordinates && coordinates.length === 2) {
      fetchItemQuery["location"] = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [coordinates[0], coordinates[1]],
          },
          $maxDistance: maxDistance,
        },
      };
    }
    // Removed user.interests logic as per new flow (swiping shows all items meeting criteria)

    const items = await Item.find(fetchItemQuery).populate(
      "userId",
      "name profilePicture"
    );

    if (!items || items.length === 0) {
      return { message: "No items available to swipe", items: [] };
    }

    // Further filtering based on user's past interactions (e.g., already messaged/matched) will be handled by MatchService/MessageService logic when presenting items
    return { items };
  } catch (error) {
    console.error("Error getting items to swipe:", error);
    throw new Error("Failed to get items to swipe: " + error.message);
  }
}

async function updateItemInterest(itemId, action) {
  try {
    const item = await Item.findById(itemId);
    if (!item) throw new Error("Item not found");

    if (action === "increment") {
      item.interestCount += 1;
    } else if (action === "decrement" && item.interestCount > 0) {
      item.interestCount -= 1;
    }

    if (item.interestCount >= 10) {
      item.discoveryStatus = "faded"; // Max interest reached, fade from general discovery
    } else {
      item.discoveryStatus = "active"; // If interest drops below max, make active again
    }

    await item.save();
    return item;
  } catch (error) {
    console.error("Error updating item interest:", error);
    throw new Error("Failed to update item interest: " + error.message);
  }
}

async function setItemDiscoveryStatus(itemId, newStatus, thingsMatchUserId) {
  try {
    const item = await Item.findById(itemId);
    if (!item) throw new Error("Item not found");

    if (item.userId.toString() !== thingsMatchUserId) {
      throw new Error(
        "User not authorized to update this item's discovery status"
      );
    }
    // Valid statuses: 'active', 'faded' (due to interest), 'hidden' (by owner)
    if (!["active", "faded", "hidden"].includes(newStatus)) {
      throw new Error("Invalid discovery status.");
    }

    item.discoveryStatus = newStatus;
    await item.save();
    return item;
  } catch (error) {
    console.error("Error setting item discovery status:", error);
    throw new Error("Failed to set item discovery status: " + error.message);
  }
}

async function deleteItem(itemId, thingsMatchUserId) {
  try {
    const item = await Item.findById(itemId);
    if (!item) {
      throw new Error("Item not found");
    }
    if (item.userId.toString() !== thingsMatchUserId) {
      throw new Error("User not authorized to delete this item");
    }

    // Before deleting the item, consider implications for existing matches and messages.
    // Option 1: Hard delete item and let related matches/messages refer to a non-existent item (might need frontend handling).
    // Option 2: Soft delete item (e.g., set status to 'deleted') and handle related entities.
    // Option 3: Delete item and cascade delete/archive related matches/messages (more complex).
    // For now, implementing hard delete as per basic requirement.
    // TODO: Decide on a strategy for related data (Matches, Messages).
    // For example, find all matches related to this item and update their status or notify users.
    // await Match.updateMany({ itemId }, { status: 'itemDeleted' });

    await Item.findByIdAndDelete(itemId);
    return { message: "Item deleted successfully" };
  } catch (error) {
    console.error("Error deleting item:", error);
    throw new Error("Failed to delete item: " + error.message);
  }
}

module.exports = {
  addItem,
  getItemsToSwipe,
  updateItemInterest,
  setItemDiscoveryStatus,
  deleteItem,
  // getItemById - might be useful, ensure it exists or add if needed
  async getItemById(itemId) {
    // Added for completeness
    try {
      const item = await Item.findById(itemId).populate(
        "userId",
        "name profilePicture"
      );
      if (!item) throw new Error("Item not found");
      return item;
    } catch (error) {
      console.error(`Error fetching item by ID ${itemId}:`, error);
      throw new Error("Failed to fetch item details");
    }
  },
};
