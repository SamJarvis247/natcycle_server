const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ThingsMatchUser",
      required: true,
      index: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ThingsMatchUser",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
    isDefaultMsg: {
      type: Boolean,
      default: false,
    },
    readByReceiver: {
      type: Boolean,
      default: false,
    },
    deliveredToReceiverAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // createdAt will be the send time
  }
);

messageSchema.index({ matchId: 1, createdAt: -1 }); // For fetching messages in a match, sorted by time

module.exports = mongoose.model("Message", messageSchema);
