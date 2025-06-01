const Item = require("../../models/thingsMatch/items.model.js");
const ThingsMatchUser = require("../../models/thingsMatch/user.model.js");
const getCoordinates = require("../../utility/geocode.js");
const cloudinaryUpload = require("../../config/cloudinaryUpload");
const mongoose = require("mongoose");
const User = require("../../models/userModel.js");
const Match = require("../../models/thingsMatch/match.model.js");

async function addItem(data, thingsMatchUserId, files) {
  try {
    const { name, description, category, address } = data;
    if (!name || !description || !category || !address) {
      throw new Error("All fields are required");
    }
    if (!files || files.length === 0) {
      throw new Error("At least one image is required");
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
      discoveryStatus: "visible",
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
      discoveryStatus: "visible",
      interestCount: { $lt: 10 },
      // createdAt: { $gte: oneMonthAgo },
    };

    // if (coordinates && coordinates.length === 2) {
    //   fetchItemQuery["location"] = {
    //     $near: {
    //       $geometry: {
    //         type: "Point",
    //         coordinates: [coordinates[0], coordinates[1]],
    //       },
    //       $maxDistance: maxDistance,
    //     },
    //   };
    // }
    // Removed user.interests logic as per new flow (swiping shows all items meeting criteria)

    let items = await Item.find(fetchItemQuery)
    console.log("🚀 ~ items:", items.length)

    if (!items || items.length === 0) {
      //run query again but with a different way
      fetchItemQuery = {
        userId: { $ne: mongoose.Types.ObjectId(thingsMatchUserId) },
      };
      items = await Item.find(fetchItemQuery)
        .sort({ createdAt: -1 });
      if (!items || items.length === 0) {
        return { message: "No items found", items: [] };
      }
      console.log("Fallback items found:", items.length);
      return items;
    }

    const populatedItems = await Promise.all(items.map(async (item) => {
      const itemObject = item.toObject ? item.toObject() : { ...item };
      let ID = itemObject.userId;
      const NatUser = await User.findOne({ thingsMatchAccount: ID });

      if (NatUser) {
        itemObject.userDetails = {
          name: `${NatUser.firstName} ${NatUser.lastName}`,
          email: NatUser.email,
          profilePicture: NatUser.profilePicture?.url || null,
        };
      } else {
        itemObject.userDetails = {
          name: "Unknown User",
          email: null,
          profilePicture: null,
        };
      }
      return itemObject;
    }));

    return { items: populatedItems };
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
      item.discoveryStatus = "visible";
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

async function getCreatedItems(thingsMatchUserId) {
  try {
    const items = await Item.find({ userId: thingsMatchUserId });
    console.log(items.length, "items found for user:", thingsMatchUserId);
    const populatedItems = await Promise.all(items.map(async (item) => {
      const itemObject = item.toObject ? item.toObject() : { ...item };
      let ID = itemObject.userId;
      //check the matches Database
      const hasInterests = await Match.find({
        itemOwnerId: ID,
        itemId: itemObject._id
      });
      if (hasInterests.length) {
        itemObject.hasInterests = {
          interest: hasInterests.map(match => match._id),
          status: hasInterests.length > 0
        };
      }
      return itemObject;
    }));

    return { items: populatedItems };
  } catch (error) {
    console.error("Error fetching created items:", error);
    throw new Error("Failed to fetch created items: " + error.message);
  }
}

async function getItemById(itemId) {
  try {
    const item = await Item.findById(itemId);
    if (!item) throw new Error("Item not found");

    const itemObject = item.toObject();
    const ID = itemObject.userId;
    const NatUser = await User.findOne({ thingsMatchAccount: ID });

    if (NatUser) {
      itemObject.creatorDetails = {
        name: `${NatUser.firstName} ${NatUser.lastName}`,
        email: NatUser.email,
        profilePicture: NatUser.profilePicture?.url || null,
      };
    } else {
      itemObject.creatorDetails = {
        name: "Unknown User",
        email: null,
        profilePicture: null,
      };
    }

    return itemObject;
  } catch (error) {
    console.error(`Error fetching item by ID ${itemId}:`, error);
    throw new Error("Failed to fetch item details");
  }
}

async function updateItem(itemId, data, thingsMatchUserId, files) {
  try {
    const item = await Item.findById(itemId);
    if (!item) {
      throw new Error("Item not found");
    }
    if (item.userId.toString() !== thingsMatchUserId.toString()) {
      throw new Error("User not authorized to update this item");
    }
    const [name, description, category, address] = [data.name, data.description, data.category, data.address];
    // if (!name || !description || !category || !address) {
    //   throw new Error("All fields are required");
    // }
    let location;
    if (address) {
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
    }

    name ? item.name = name : null;
    description ? item.description = description : null;
    category ? item.category = category : null;
    address ? item.location = location : null;
    item.userId = thingsMatchUserId;
    item.discoveryStatus = "visible";
    item.interestCount = 0;
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
      message: "Item updated successfully",
      item: item.id,
      imagesUploaded: item.itemImages.length,
    };
  }
  catch (error) {
    console.error("Error updating item:", error);
    throw new Error("Failed to update item: " + error.message);
  }
}

module.exports = {
  addItem,
  updateItem,
  getItemsToSwipe,
  updateItemInterest,
  setItemDiscoveryStatus,
  deleteItem,
  getCreatedItems,
  getItemById
};
