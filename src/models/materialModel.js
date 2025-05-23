const mongoose = require("mongoose");

const MaterialSchema = mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: [
        "plastic",
        "glass",
        "paper",
        "metal",
        "food",
        "organic",
        "fabric",
        "eWaste",
      ],
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    weight: {
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
