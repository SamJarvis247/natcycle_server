const { catchAsync } = require("../../utility/catchAsync.js");
const { errorResponse, successResponse } = require("../../utility/response.js");

// service
const itemService = require("../../service/thingsMatch/item.service.js");

// Add a new item
// Add a new item
const addItem = catchAsync(async (req, res) => {
  try {
    const thingsMatchUserId = req.TMID;
    // Pass both the request body and files to the service
    const result = await itemService.addItem(
      req.body,
      thingsMatchUserId,
      req.files
    );

    return successResponse(res, result);
  } catch (error) {
    console.log("Error in addItem controller:", error);
    if (error instanceof Error) {
      return errorResponse(res, error.message);
    }
  }
});

// Get items available to swipe
const getItemsToSwipe = catchAsync(async (req, res) => {
  try {
    const thingsMatchUserId = req.TMID;
    const { longitude, latitude, distance, notInInterest } = req.query;
    console.log(req.query);

    // Convert query parameters
    const parsedNotInInterest = notInInterest === "true";
    const coordinates =
      longitude && latitude
        ? [parseFloat(longitude), parseFloat(latitude)]
        : null;
    const maxDistance = distance ? parseInt(distance) : 10000;

    const result = await itemService.getItemsToSwipe(
      thingsMatchUserId,
      parsedNotInInterest,
      coordinates,
      maxDistance
    );

    return successResponse(res, result);
  } catch (error) {
    console.log("Error in getItemsToSwipe controller:", error);
    if (error instanceof Error) {
      return errorResponse(res, error.message);
    }
  }
});

// Get a specific item by ID
const getItemById = catchAsync(async (req, res) => {
  try {
    const { itemId } = req.params;

    if (!itemId) {
      return errorResponse(res, "Item ID is required");
    }

    const result = await itemService.getItemById(itemId);

    return successResponse(res, result);
  } catch (error) {
    console.log("Error in getItemById controller:", error);
    if (error instanceof Error) {
      return errorResponse(res, error.message);
    }
  }
});

// Swipe like on an item
const swipeLike = catchAsync(async (req, res) => {
  try {
    const { itemId } = req.params;
    const thingsMatchUserId = req.TMID;

    if (!itemId) {
      return errorResponse(res, "Item ID is required");
    }

    const result = await itemService.swipeLike(itemId, thingsMatchUserId);

    return successResponse(res, result);
  } catch (error) {
    console.log("Error in swipeLike controller:", error);
    if (error instanceof Error) {
      return errorResponse(res, error.message);
    }
  }
});

// Swipe dislike on an item
const swipeDislike = catchAsync(async (req, res) => {
  try {
    const { itemId } = req.params;
    const thingsMatchUserId = req.TMID;

    if (!itemId) {
      return errorResponse(res, "Item ID is required");
    }

    const result = await itemService.swipeDislike(itemId, thingsMatchUserId);

    return successResponse(res, result);
  } catch (error) {
    console.log("Error in swipeDislike controller:", error);
    if (error instanceof Error) {
      return errorResponse(res, error.message);
    }
  }
});

// Get items created by the user
const getCreatedItems = catchAsync(async (req, res) => {
  try {
    const thingsMatchUserId = req.TMID;
    const result = await itemService.getCreatedItems(thingsMatchUserId);

    return successResponse(res, result);
  } catch (error) {
    console.log("Error in getCreatedItems controller:", error);
    if (error instanceof Error) {
      return errorResponse(res, error.message);
    }
  }
});

// Update an existing item
const updateItem = catchAsync(async (req, res) => {
  try {
    const { itemId } = req.params;
    const thingsMatchUserId = req.TMID;

    if (!itemId) {
      return errorResponse(res, "Item ID is required");
    }

    const result = await itemService.updateItem(
      itemId,
      req.body,
      thingsMatchUserId,
      req.files
    );

    return successResponse(res, result);
  } catch (error) {
    console.log("Error in updateItem controller:", error);
    if (error instanceof Error) {
      return errorResponse(res, error.message);
    }
  }
});

// Update the module exports
module.exports = {
  addItem,
  getItemsToSwipe,
  getItemById,
  swipeLike,
  swipeDislike,
  getCreatedItems,
  updateItem,
};
