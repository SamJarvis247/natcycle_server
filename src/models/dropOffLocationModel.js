const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const materialEnum = require("./enums/materialType");
const {
  materialTypeHierarchy,
  getPrimaryMaterialTypes,
} = require("./enums/materialTypeHierarchy");

const dropOffLocationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  locationType: {
    type: String,
    required: true,
    enum: ["redeem centre", "collection point", "sewage unit"],
    default: "collection point",
  },
  website: {
    type: String,
    required: false,
  },
  // Primary material type that this location accepts
  primaryMaterialType: {
    type: String,
    required: true,
    enum: getPrimaryMaterialTypes(),
    default: "plastic",
  },
  acceptedSubtypes: [
    {
      type: String,
    },
  ],
  // For backward compatibility
  itemType: {
    type: String,
    required: true,
    enum: materialEnum,
    default: "plastic",
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  googleMapId: {
    type: String,
  },
  googleMapsUri: {
    type: String,
  },
});

dropOffLocationSchema.plugin(mongoosePaginate);

dropOffLocationSchema.index({ location: "2dsphere" });

// Instance method to check if the location accepts a specific material type
dropOffLocationSchema.methods.acceptsMaterialType = function (materialType) {
  const {
    isPrimaryType,
    getPrimaryTypeForSubtype,
    getSubtypesForPrimaryType,
  } = require("./enums/materialTypeHierarchy");

  // If it's our exact itemType, we definitely accept it
  if (this.itemType === materialType) {
    return true;
  }

  // If the provided type is the same as our primary material type, accept it
  if (this.primaryMaterialType === materialType) {
    return true;
  }

  // If we're checking a primary type and it doesn't match our primary type, reject it
  if (
    isPrimaryType(materialType) &&
    materialType !== this.primaryMaterialType
  ) {
    return false;
  }

  // If we're checking a subtype:
  // 1. Get its parent primary type
  const primaryType = getPrimaryTypeForSubtype(materialType);

  // 2. If the subtype's primary doesn't match our primary type, reject it
  if (primaryType !== this.primaryMaterialType) {
    return false;
  }

  // 3. If we have specific accepted subtypes, check if this one is in the list
  if (this.acceptedSubtypes && this.acceptedSubtypes.length > 0) {
    return this.acceptedSubtypes.includes(materialType);
  }

  // 4. If we don't have specific subtypes, we accept all subtypes of our primary
  return true;
};

// Static method to find all locations that accept a specific material type
dropOffLocationSchema.statics.findByAcceptedMaterialType = async function (
  materialType
) {
  const {
    isPrimaryType,
    getPrimaryTypeForSubtype,
  } = require("./enums/materialTypeHierarchy");

  const query = {};

  if (isPrimaryType(materialType)) {
    // If we're looking for a primary type
    query.primaryMaterialType = materialType;
  } else {
    // If we're looking for a subtype
    const primaryType = getPrimaryTypeForSubtype(materialType);

    if (!primaryType) {
      // If we can't determine the primary type, just search for exact match
      query.itemType = materialType;
      return this.find(query);
    }

    query.$or = [
      { itemType: materialType }, // Exact matches
      { primaryMaterialType: primaryType, acceptedSubtypes: { $size: 0 } }, // Locations accepting all subtypes
      { primaryMaterialType: primaryType, acceptedSubtypes: materialType }, // Locations with specific subtype
    ];
  }

  return this.find(query);
};

const DropOffLocation = mongoose.model(
  "DropOffLocation",
  dropOffLocationSchema
);

module.exports = DropOffLocation;
