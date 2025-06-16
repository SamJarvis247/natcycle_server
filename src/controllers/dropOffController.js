const DropOff = require("../models/dropOffModel");
const DropOffLocation = require("../models/dropOffLocationModel");
const cloudinaryUpload = require("../config/cloudinaryUpload");
const Campaign = require("../models/campaignModel");
const mongoose = require("mongoose");
const { catchAsync } = require("../utility/catchAsync.js");
const cuCalculationService = require("../service/cuCalculationService");
const User = require("../models/userModel.js");
const Material = require("../models/materialModel.js");
const {
  getPrimaryTypeForSubtype,
  getPrimaryMaterialTypes,
} = require("../models/enums/materialTypeHierarchy.js");

// add new drop off
exports.addDropOff = async (req, res) => {
  const { location, itemType, dropOffQuantity, description, campaignId } =
    req.body;

  // Validate primary itemType
  const isVerifiedPrimaryCategory = getPrimaryMaterialTypes().includes(itemType);
  if (!isVerifiedPrimaryCategory) {
    return res
      .status(400)
      .json({ message: `Invalid primary item type: ${itemType}` });
  }

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

    // Ensure dropOffQuantity is parsed correctly if it's a string
    let mainQuantity;
    try {
      mainQuantity = typeof dropOffQuantity === 'string' ? JSON.parse(dropOffQuantity) : dropOffQuantity;
      if (!Array.isArray(mainQuantity)) {
        throw new Error("dropOffQuantity must be an array.");
      }
    } catch (parseError) {
      console.error("Error parsing dropOffQuantity:", parseError);
      return res.status(400).json({ message: "Invalid format for dropOffQuantity. Expected an array of items." });
    }


    const totalItemUnits = mainQuantity.reduce((acc, curr) => {
      return acc + (curr.units || 0); // Ensure units exist and are numbers
    }, 0);

    const dropOff = new DropOff({
      dropOffLocation: findDropOffLocation._id,
      user: req.user._id,
      itemType,
      dropOffQuantity: mainQuantity, // Array of { materialType (subtype), units }
      itemQuantity: totalItemUnits,
      description,
      campaign: campaignId ? campaign._id : null,
    });

    if (req.file) {
      const result = await cloudinaryUpload.image(req.file.path);
      if (!result) return res.status(400).send("Error uploading image");
      dropOff.receipt = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    }

    let calculatedTotalCUforDropOff = 0;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found for CU calculation." });
    }


    for (const item of mainQuantity) {
      console.log("Processing item for CU calculation: 😊", item);
      if (typeof item.units !== 'number' || item.units <= 0) {
        console.warn(`Skipping item due to invalid units:`, item);
        continue;
      }
      if (!item.materialType) {
        console.warn(`Skipping item due to missing materialType (subtype):`, item);
        continue;
      }

      try {
        const cuResult = await cuCalculationService.updateUserCU(
          user._id,
          itemType,
          item.units,
          item.materialType
        );

        if (cuResult && typeof cuResult.addedCU === 'number') {
          calculatedTotalCUforDropOff += cuResult.addedCU;
          console.log(`CU added for ${item.materialType}: ${cuResult.addedCU}`);
          console.log(`User's new total CU: ${cuResult.newTotalCU}`);
        } else {
          console.warn(`Failed to get CU result or addedCU for item:`, item, cuResult);
        }
      } catch (cuError) {
        console.error(`Error updating CU for item ${item.materialType}:`, cuError.message);
      }
    }

    console.log("Final Total CU calculated for this dropOff:", calculatedTotalCUforDropOff);
    dropOff.pointsEarned = calculatedTotalCUforDropOff;

    console.log("DropOff object before saving: ", dropOff);
    await dropOff.save();

    res.status(201).json({
      message: "Drop off request added successfully",
      data: dropOff,
    });
  } catch (err) {
    console.error("Error in addDropOff:", err); // Log the actual error object
    res.status(400).json({ message: err.message || "An unexpected error occurred." });
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

  // Get all drop offs for the user
  const dropOffs = await DropOff.find({
    user: userId,
  });
  const populateDropOffLocation = await Promise.all(
    dropOffs.map(async (dropOff) => {
      const dropOffObject = dropOff.toObject() ? dropOff.toObject() : dropOff;
      const dropOffLocation = await DropOffLocation.findById(
        dropOffObject.dropOffLocation.toString()
      ).catch((err) => {
        console.log("Error finding drop off location:", err);
        return null;
      });

      if (dropOffLocation) {
        dropOffObject.dropOffLocation = dropOffLocation;
      }

      return dropOffObject;
    })
  );

  res.status(200).json({
    status: "success",
    data: populateDropOffLocation,
  });
});

exports.adminApproveDropOff = catchAsync(async (req, res) => {
  console.log("GOT HERE");
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

  await dropOff.save().catch((err) => {
    console.log("Error updating drop off:", err);
    return res.status(500).json({ message: "Error updating drop off" });
  });

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
