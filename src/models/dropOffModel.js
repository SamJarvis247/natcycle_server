const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const { default: materialEnum } = require("./enums/materialType");
const {
  getSubtypesForPrimaryType,
  getPrimaryMaterialTypes,
} = require("./enums/materialTypeHierarchy");

const dropOffSchema = new mongoose.Schema(
  {
    dropOffLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DropOffLocation",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    itemType: {
      type: String,
      required: true,
      enum: getPrimaryMaterialTypes(),
    },
    dropOffQuantity: [
      {
        materialType: {
          type: String,
          enum: getSubtypesForPrimaryType(this.itemType),
        },
        units: {
          type: Number,
        },
      },
    ],
    itemQuantity: {
      type: Number,
    },
    receipt: {
      public_id: {
        type: String,
        required: false,
      },
      url: {
        type: String,
        required: false,
      },
    },
    description: {
      type: String,
      trim: true,
    },
    pointsEarned: {
      type: Number,
      required: false,
      default: 0,
    },
    collector: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      required: true,
      enum: ["Pending", "Approved"],
      default: "Pending",
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
    },
  },
  {
    timestamps: true,
  }
);

dropOffSchema.plugin(mongoosePaginate);

const DropOff = mongoose.model("DropOff", dropOffSchema);

module.exports = DropOff;
