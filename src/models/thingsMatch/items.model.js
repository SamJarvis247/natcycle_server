const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ThingsMatchUser",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      default: "Untitled Item",
    },
    description: {
      type: String,
      required: true,
      trim: true,
      default: "No description provided",
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Shoes",
        "Electronics",
        "Books",
        "Furniture",
        "Food",
        "Flowers",
        "Other",
      ],
      default: "Other",
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        default: [0, 0],
      },
      address: {
        type: String,
        required: true,
        default: "No address provided",
      },
    },
    itemImages: [
      {
        public_id: {
          type: String,
          required: false,
        },
        url: {
          type: String,
          required: false,
        },
      },
    ],
    status: {
      type: String,
      enum: ["available", "matched", "given_away"],
      default: "available",
    },
    discoveryStatus: {
      type: String,
      enum: ["visible", "hidden_temporarily", "faded_out"],
      default: "visible",
      index: true,
    },
    interestCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Add geospatial index for location field
itemSchema.index({ location: "2dsphere" }, { background: true });

// Force index creation on model compilation
const Item = mongoose.model("Item", itemSchema);

// Ensure indexes are created
Item.createIndexes().catch((err) => {
  console.error("Error creating geospatial index:", err);
});

module.exports = Item;
