const DropOff = require("../models/dropOffModel");
const DropOffLocation = require("../models/dropOffLocationModel");
const cloudinaryUpload = require("../config/cloudinaryUpload");
const Campaign = require("../models/campaignModel");
const mongoose = require("mongoose");
const { catchAsync } = require("../utility/catchAsync.js");
const cuCalculationService = require("../service/cuCalculationService");
const User = require("../models/userModel.js");

// add new drop off
exports.addDropOff = async (req, res) => {
  const { location, itemType, itemQuantity, description, campaignId } =
    req.body;

  console.log("REQ BODY", req.body);

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

    // After creating the drop-off, update the user's CU
    let materialCategory = itemType;

    const cu = await cuCalculationService
      .updateUserCU(req.user._id, materialCategory, itemQuantity)
      .then((cu) => {
        let totalCu = cu.newTotalCU;

        //append natpoints
        cuCalculationService.updateUserNatPoints(req.user._id, totalCu);

        return totalCu;
      })
      .catch((err) => {
        console.log(err, "Error in CU Logic");
        return null;
      });
    if (!cu) {
      console.log("NO CU");
    } else {
      console.log("CU updated successfully");
    }

    dropOff.pointsEarned = cu;

    await dropOff.save();
    //update user item count

    // After updating the user's CU
    req.user.cu = req.user.cu + cu;

    // Update the user's item count based on the item type
    const user = await User.findById(req.user._id);
    if (user && user.itemsCount && itemType in user.itemsCount) {
      user.itemsCount[itemType] += itemQuantity;
      await user.save();
      console.log(
        `Updated user's ${itemType} count to ${user.itemsCount[itemType]}`
      );
    }

    res.status(201).json({
      message: "Drop off request added successfully",
      data: dropOff,
    });
  } catch (err) {
    console.log(err);
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
      populate: [
        {
          path: "dropOffLocation",
          select: "name address ",
        },
      ],
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
      populate: [
        {
          path: "user",
          select: "firstName lastName",
        },
        {
          path: "dropOffLocation",
          select: "name address",
        },
      ],
    });

    res.status(200).json({
      data: dropOffs,
      message: "Drop offs fetched successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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

  // res.status(201).json({
  //   status: "success",
  //   data: responseData,
  // });
});

exports.getUserDropOffs = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10 } = req.query;

  // Get all drop offs for the user
  const dropOffs = await DropOff.paginate(
    { user: userId },
    {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: [
        {
          path: "dropOffLocation",
          select: "name address ",
        },
      ],
    }
  );

  res.status(200).json({
    status: "success",
    data: dropOffs,
  });
});

exports.adminApproveDropOff = catchAsync(async (req, res) => {
  const dropOffId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(dropOffId)) {
    return res.status(404).json({ message: "Invalid drop off ID" });
  }

  const dropOff = await DropOff.findById(dropOffId);

  if (!dropOff) {
    return res.status(404).json({ message: "Drop off not found" });
  }

  // Update status to approved
  dropOff.status = "Approved";

  await dropOff.save();

  // // Update user's CU and NatPoints if not already calculated
  // if (!dropOff.pointsEarned) {
  //   const cu = await cuCalculationService
  //     .updateUserCU(dropOff.user, dropOff.itemType, dropOff.itemQuantity)
  //     .then((cu) => {
  //       cuCalculationService.updateUserNatPoints(dropOff.user, cu.newTotalCU);
  //       return cu.newTotalCU;
  //     })
  //     .catch((err) => {
  //       console.log("Error calculating CU:", err);
  //       return null;
  //     });

  //   if (cu) {
  //     dropOff.pointsEarned = cu;
  //     await dropOff.save();
  //   }
  // }

  res.status(200).json({
    status: "success",
    message: "Drop off approved successfully",
    data: dropOff,
  });
});
