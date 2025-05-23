const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const dropOffSchema = new mongoose.Schema(
  {
    dropOffLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DropOffLocation",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    itemType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      required: true,
    },
    itemQuantity: {
      type: Number,
      required: true,
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
