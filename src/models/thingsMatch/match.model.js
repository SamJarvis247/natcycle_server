const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    itemOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ThingsMatchUser",
      required: true,
      index: true,
    },
    itemSwiperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ThingsMatchUser",
      required: true,
      index: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        "active",
        "unmatched",
        "pendingInterest",
        "blocked",
        "owner_blocked_swiper",
        "swiper_blocked_owner",
        "completed_by_owner",
        "completed_by_swiper",
        "archived",
      ],
      default: "active",
    },
    matchedAt: {
      type: Date,
      default: null,
    },
    // You might want to store the ID of the chat document if you create a separate chat model per match
    // chatId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'Chat',
    // },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly find a match between two users for a specific item
matchSchema.index(
  { itemOwnerId: 1, itemSwiperId: 1, itemId: 1 },
  { unique: true }
);
matchSchema.index(
  { itemSwiperId: 1, itemOwnerId: 1, itemId: 1 },
  { unique: true }
);

module.exports = mongoose.model("Match", matchSchema);
