const DropOffLocation = require("../models/dropOffLocationModel");
const Material = require("../models/materialModel");
const {
  getPrimaryMaterialTypes,
  getSubtypesForPrimaryType,
} = require("../models/enums/materialTypeHierarchy");

// add new drop off location
exports.addDropOffLocation = async (req, res) => {
  const {
    name,
    itemType,
    description,
    address,
    latitude,
    longitude,
    googleMapsUri,
    googleMapId,
    acceptedSubCategories,
  } = req.body;
  console.log(req.body);

  try {
    const existingDropOffLocation = await DropOffLocation.findOne({ name });

    if (existingDropOffLocation) {
      return res
        .status(400)
        .json({ message: "Drop off location already exists" });
    }
    const isVerifiedCategory = getPrimaryMaterialTypes().includes(itemType);
    if (!isVerifiedCategory) {
      return res.status(400).json({ message: "Invalid item type" });
    }
    const isVerifiedSubCategory = getSubtypesForPrimaryType(itemType);
    acceptedSubCategories.forEach((subCategory) => {
      if (!isVerifiedSubCategory.includes(subCategory)) {
        return res.status(400).json({ message: "Invalid sub category" });
      }
    });

    const dropOffLocation = new DropOffLocation({
      name,
      itemType,
      primaryMaterialType: itemType,
      acceptedSubtypes: acceptedSubCategories ? acceptedSubCategories : [],
      description,
      address,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      googleMapsUri,
      googleMapId,
    });

    await dropOffLocation.save();

    res.status(201).json({
      message: "Drop off location added successfully",
      data: dropOffLocation,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// get all drop off locations
exports.getDropOffLocations = async (req, res) => {
  console.log("GOT DROP OFF LOCATIONS");
  const { page = 1, limit = 50, id, itemType } = req.query;

  try {
    const query = {};

    if (itemType) {
      query.primaryMaterialType = itemType;
    }

    if (id) {
      query._id = id;
    }

    console.log(itemType);
    // const dropOffLocations = await DropOffLocation.find(query)
    //   .skip((page - 1) * limit)
    const dropOffLocations = await DropOffLocation.find({
      primaryMaterialType: itemType,
    });
    console.log(
      "🚀 ~ exports.getDropOffLocations= ~ dropOffLocations:",
      dropOffLocations
    );

    res.status(200).json({
      data: dropOffLocations,
      message: "Drop off locations fetched successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//admin get all dropOff locations
exports.adminGetDropOffLocations = async (req, res) => {
  console.log("GOT DROP OFF LOCATIONS FOR ADMIN");
  console.log(req.query);
  const { page = 1, limit = 50, } = req.query;

  try {
    const dropOffLocations = await DropOffLocation.find().skip((page - 1) * limit).limit(limit);
    console.log(
      "🚀 ~ exports.getDropOffLocations= ~ dropOffLocations:",
      dropOffLocations
    );

    res.status(200).json({
      data: dropOffLocations,
      message: "Drop off locations fetched successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// get drop off location by id
exports.getDropOffLocationById = async (req, res) => {
  const { id } = req.params;

  try {
    const dropOffLocation = await DropOffLocation.findById(id);

    if (!dropOffLocation) {
      return res.status(404).json({ message: "Drop off location not found" });
    }

    res.status(200).json({
      data: dropOffLocation,
      message: "Drop off location fetched successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// get nearest drop off locations
exports.getNearestDropOffLocations = async (req, res) => {
  const { latitude, longitude, distance = 10000, itemType } = req.query;
  console.log(req.query);

  if (!latitude || !longitude) {
    return res
      .status(400)
      .json({ message: "Latitude and longitude are required" });
  }

  let query = {};

  if (itemType) {
    query.primaryMaterialType = itemType;
  }

  try {
    if (parseInt(distance) === 0) {
      const dropOffLocations = await DropOffLocation.find(query);

      return res.status(200).json({
        data: dropOffLocations,
        message: "All drop off locations fetched successfully",
      });
    }
    query = {
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: distance,
        },
      },
      primaryMaterialType: itemType ? itemType : { $exists: true },
    };
    if (itemType.toLowerCase() === "others") {
      query = {
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
            $maxDistance: distance,
          },
        },
        primaryMaterialType: {
          $nin: ["food", "plastic"],
        },
      };
    }
    console.log("Query for nearest drop off locations:", query);
    const dropOffLocations = await DropOffLocation.find(query).catch((e) => {
      console.log(e);
    });
    console.log("🚀 ~ exports.getNearestDropOffLocations= ~ dropOffLocations:", dropOffLocations)

    res.status(200).json({
      data: dropOffLocations,
      message: "Nearest drop off locations fetched successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

// delete drop off location
exports.deleteDropOffLocation = async (req, res) => {
  const { id } = req.params;

  try {
    const dropOffLocation = await DropOffLocation.findByIdAndDelete(id);

    if (!dropOffLocation) {
      return res.status(404).json({ message: "Drop off location not found" });
    }

    res.status(200).json({
      message: "Drop off location deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// update drop off location
exports.updateDropOffLocation = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    itemType,
    description,
    address,
    latitude,
    longitude,
    googleMapsUri,
    googleMapId,
  } = req.body;

  try {
    const dropOffLocation = await DropOffLocation.findById(id);

    if (!dropOffLocation) {
      return res.status(404).json({ message: "Drop off location not found" });
    }

    dropOffLocation.itemType = itemType || dropOffLocation.itemType;
    dropOffLocation.name = name || dropOffLocation.name;
    dropOffLocation.description = description || dropOffLocation.description;
    dropOffLocation.address = address || dropOffLocation.address;
    dropOffLocation.location = {
      type: "Point",
      coordinates: [longitude, latitude],
    };
    dropOffLocation.googleMapsUri =
      googleMapsUri || dropOffLocation.googleMapsUri;
    dropOffLocation.googleMapId = googleMapId || dropOffLocation.googleMapId;

    await dropOffLocation.save();

    res.status(200).json({
      message: "Drop off location updated successfully",
      data: dropOffLocation,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDropOffLocationMaterials = async (req, res) => { };
