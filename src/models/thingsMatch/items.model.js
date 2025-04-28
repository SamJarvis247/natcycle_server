const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
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
    enum: ["Shoes", "Electronics", "Books", "Furniture", "Food", "Flowers", "Other"],
    default: "Other",
  },
  location: {
    type: {
      lat: {
        type: Number,
        required: true,
        default: 0,
      },
      lng: {
        type: Number,
        required: true,
        default: 0,
      },
      address: {
        type: String,
        required: true,
        default: "No address provided",
      },
      required: false,
    }
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
    }
  ],
  status: {
    type: String,
    enum: ["available", "matched", "given_away"],
    default: "available",
  },

}, {
  timestamps: true,
});

module.exports = mongoose.model("Item", itemSchema);
