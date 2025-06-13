const mongoose = require("mongoose");
const { default: materialEnum } = require("./enums/materialType");
const {
  getPrimaryMaterialTypes,
  getSubtypesForPrimaryType,
} = require("./enums/materialTypeHierarchy");

const MaterialSchema = mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: getPrimaryMaterialTypes(),
      index: true,
    },
    subCategory: {
      type: String,
      required: true,
      enum: getSubtypesForPrimaryType(this.category),
    },
    name: {
      type: String,
      required: true,
      trim: true,
    }, // for backward compatibility
    weight: {
      type: Number,
      required: true,
      default: 0,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
    },
    cuValue: {
      type: Number,
      required: true,
      default: 0,
    },
    natPoints: {
      type: Number,
      required: true,
      default: 0,
    },
    image: {
      public_id: {
        type: String,
        required: false,
      },
      url: {
        type: String,
        required: false,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Material = mongoose.model("Material", MaterialSchema);

module.exports = Material;
