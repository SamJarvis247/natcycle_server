const DropOff = require("../models/dropOffModel");
const DropOffLocation = require("../models/dropOffLocationModel");
const cloudinaryUpload = require("../config/cloudinaryUpload");
const Campaign = require("../models/campaignModel");
const mongoose = require("mongoose");
const { catchAsync } = require("../utility/catchAsync.js");
const cuCalculationService = require("../service/cuCalculationService");

// add new drop off
exports.addDropOff = async (req, res) => {
  const { location, itemType, itemQuantity, description, campaignId } =
    req.body;

  const findDropOffLocation = await DropOffLocation.findById(location);

  if (!findDropOffLocation) {
    return res.status(404).json({ message: "Drop off location not found" });
  }

  try {
    let campaign;
    if (campaignId) {
      campaign = await Campaign.findById(campaignId);

      if (!campaign) {
        return res.status(404).json({
          message: "Campaign not found",
        });
      }
    }

    const dropOff = new DropOff({
      dropOffLocation: findDropOffLocation._id,
      user: req.user._id,
      itemType,
      itemQuantity,
      description,
      campaign: campaignId ? campaign._id : null,
    });

    if (req.file) {
      // const fileStr = req.file.buffer.toString('base64')
      const result = await cloudinaryUpload.image(req.file.path);

      if (!result) return res.status(400).send("Error uploading image");

      dropOff.receipt = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    }

    await dropOff.save();

    res.status(201).json({
      message: "Drop off request added successfully",
      data: dropOff,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// get all drop offs
exports.getDropOffs = async (req, res) => {
  const { page = 1, limit = 10, id, userId } = req.query;

  try {
    const query = {};

    if (id) {
      query._id = id;
    }

    if (userId) {
      query.userId = userId;
    }

    const dropOffs = await DropOff.paginate(query, {
      page,
      limit,
      sort: { createdAt: -1 },
    });

    res.status(200).json({
      data: dropOffs,
      message: "Drop offs fetched successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// get drop off by id
exports.getDropOffById = async (req, res) => {
  const dropOffId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(dropOffId)) {
    return res.status(404).send("No drop off with that id");
  }

  try {
    const dropOff = await DropOff.findById(dropOffId)
      .populate("dropOffLocation")
      .populate("user");

    if (!dropOff) {
      return res.status(404).json({ message: "Drop off not found" });
    }

    res.status(200).json({
      data: dropOff,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

// update drop off status
exports.updateDropOffStatus = async (req, res) => {
  const dropOffId = req.params.id;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(dropOffId)) {
    return res.status(404).send("No drop off with that id");
  }

  try {
    const dropOff = await DropOff.findById(dropOffId);

    if (!dropOff) {
      return res.status(404).json({ message: "Drop off not found" });
    }

    dropOff.status = status;
    await dropOff.save();

    res.status(200).json({
      message: "Drop off status updated successfully",
      data: dropOff,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.adminGetDropOffs = async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  try {
    const query = {};

    if (status) {
      query.status = status;
    }

    const dropOffs = await DropOff.paginate(query, {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: ["user", "dropOffLocation"],
    });

    res.status(200).json({
      data: dropOffs,
      message: "Drop offs fetched successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update the createDropOff function to calculate CU
exports.createDropOff = catchAsync(async (req, res) => {
  const { location, itemType, description, campaignId } = req.body;

  const findDropOffLocation = await DropOffLocation.findById(location);

  if (!findDropOffLocation) {
    return res.status(404).json({ message: "Drop off location not found" });
  }

  try {
    let campaign;
    if (campaignId) {
      campaign = await Campaign.findById(campaignId);

      if (!campaign) {
        return res.status(404).json({
          message: "Campaign not found",
        });
      }
    }

    const dropOff = new DropOff({
      dropOffLocation: findDropOffLocation._id,
      user: req.user._id,
      itemType,
      description,
      campaign: campaignId ? campaign._id : null,
    });

    if (req.file) {
      // const fileStr = req.file.buffer.toString('base64')
      const result = await cloudinaryUpload.image(req.file.path);

      if (!result) return res.status(400).send("Error uploading image");

      dropOff.image = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    }

    await dropOff.save();

    res.status(201).json({
      message: "Drop off request added successfully",
      data: dropOff,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }

  // After creating the drop-off, update the user's CU
  if (newDropOff) {
    try {
      // Calculate and update CU for each material type in the drop-off
      const cuUpdates = await Promise.all(
        Object.entries(newDropOff.items).map(async ([category, quantity]) => {
          if (quantity > 0) {
            return cuCalculationService.updateUserCU(
              req.user._id,
              category,
              quantity
            );
          }
          return null;
        })
      );

      // Filter out null results and get total CU added
      const validCuUpdates = cuUpdates.filter((update) => update !== null);
      const totalCUAdded = validCuUpdates.reduce(
        (sum, update) => sum + update.addedCU,
        0
      );

      // Include CU information in the response
      responseData.cuAdded = totalCUAdded;
      responseData.newTotalCU =
        validCuUpdates.length > 0
          ? validCuUpdates[validCuUpdates.length - 1].newTotalCU
          : req.user.carbonUnits;
    } catch (error) {
      console.error("Error calculating CU for drop-off:", error);
      // Continue with the response even if CU calculation fails
    }
  }

  res.status(201).json({
    status: "success",
    data: responseData,
  });
});
