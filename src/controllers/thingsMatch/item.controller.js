const itemService = require("../../service/thingsMatch/item.service");
const { catchAsync } = require("../../utility/catchAsync.js");
const AppError = require("../../utility/appError");

//add Item Service
const addItem = catchAsync(async (req, res, next) => {
  if (!req.thingsMatchUser || !req.TMID) {
    return next(new AppError("User not authenticated for ThingsMatch", 401));
  }
  const result = await itemService.addItem(req.body, req.TMID, req.files);
  res.status(201).json({
    status: "success",
    data: result,
  });
});

const getItemsToSwipe = catchAsync(async (req, res, next) => {
  if (!req.thingsMatchUser || !req.TMID) {
    return next(new AppError("User not authenticated for ThingsMatch", 401));
  }

  const coordinates =
    req.query.longitude && req.query.latitude
      ? [parseFloat(req.query.longitude), parseFloat(req.query.latitude)]
      : null;
  const maxDistance = req.query.maxDistance
    ? parseInt(req.query.maxDistance, 10)
    : undefined;

  const result = await itemService.getItemsToSwipe(
    req.TMID,
    coordinates,
    maxDistance
  );
  res.status(200).json({
    status: "success",
    data: result,
  });
});

const getItemById = catchAsync(async (req, res, next) => {
  const item = await itemService.getItemById(req.params.itemId);
  if (!item) {
    return next(new AppError("No item found with that ID", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      item,
    },
  });
});

const updateItemDiscoveryStatus = catchAsync(async (req, res, next) => {
  if (!req.thingsMatchUser || !req.TMID) {
    return next(new AppError("User not authenticated for ThingsMatch", 401));
  }
  const { status } = req.body;
  if (!status) {
    return next(new AppError("New discovery status is required", 400));
  }
  const item = await itemService.setItemDiscoveryStatus(
    req.params.itemId,
    status,
    req.user.thingsMatchId
  );
  res.status(200).json({
    status: "success",
    data: {
      item,
    },
  });
});

const deleteItem = catchAsync(async (req, res, next) => {
  if (!req.thingsMatchUser || !req.TMID) {
    return next(new AppError("User not authenticated for ThingsMatch", 401));
  }
  await itemService.deleteItem(req.params.itemId, req.TMID);
  res.status(204).json({
    status: "success",
    data: null,
  });
});

const updateItem = catchAsync(async (req, res, next) => {
  if (!req.TMID) {
    return next(new AppError("User not authenticated for ThingsMatch", 401));
  }
  const item = await itemService.updateItem(
    req.params.itemId,
    req.body,
    req.TMID,
    req.files
  );
  res.status(200).json({
    status: "success",
    data: {
      item,
    },
  });
});

const getCreatedItems = catchAsync(async (req, res, next) => {
  if (!req.thingsMatchUser || !req.TMID) {
    return next(new AppError("User not authenticated for ThingsMatch", 401));
  }
  const items = await itemService.getCreatedItems(req.TMID);
  res.status(200).json({
    status: "success",
    results: items.length,
    data: {
      items,
    },
  });
});

//ADMIN
const adminGetAllItems = catchAsync(async (req, res, next) => {
  const items = await itemService.adminGetAllItems();
  res.status(200).json({
    status: "success",
    results: items.length,
    data: {
      items,
    },
  });
});

module.exports = {
  addItem,
  getItemsToSwipe,
  getItemById,
  updateItemDiscoveryStatus,
  deleteItem,
  updateItem,
  getCreatedItems,
  adminGetAllItems,
};
