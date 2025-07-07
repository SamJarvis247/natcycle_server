const mongoose = require("mongoose");

const thingsMatchUserAccount = mongoose.Schema({
  natcycleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    unique: true,
    sparse: false,
    required: false,
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: false,
      default: "Point",
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: false,
      default: [0, 0],
    },
    address: {
      type: String,
      required: false,
      default: "",
    },
  },
  createdItems: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
      },
    ],
    required: false,
  },
  tags: {
    type: [String],
    required: false,
  },
  interests: {
    type: [String],
    required: false,
    enum: [
      "Books",
      "Clothing",
      "Electronics",
      "Food",
      "Furniture",
      "Hobbies",
      "Home Goods",
      "Jewelry",
      "Other",
      "Sports",
      "Toys",
      "Travel",
      "Vehicles",
    ],
    default: [],
  },
  monthlyGoal: {
    type: Number,
    required: false,
  },
  itemsShared: {
    type: Number,
    required: false,
  },
  environmentalImpact: {
    type: Number,
    required: false,
  },
  fcmTokens: [
    {
      token: {
        type: String,
        required: true
      },
      deviceId: {
        type: String,
        required: false
      },
      platform: {
        type: String,
        enum: ['ios', 'android', 'web'],
        required: false
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      lastUsed: {
        type: Date,
        default: Date.now
      }
    }
  ]
});

// Add geospatial index for location field
thingsMatchUserAccount.index({ location: "2dsphere" });

// Function to drop all indexes for ThingsMatchUser
// const dropAllIndexes = async () => {
//   try {
//     if (mongoose.connection.collections.thingsmatchusers) {
//       await mongoose.connection.collections.thingsmatchusers.dropIndexes();
//       console.log('All indexes for ThingsMatchUser collection have been dropped');
//     } else {
//       console.log('ThingsMatchUser collection does not exist yet');
//     }
//   } catch (error) {
//     console.error('Error dropping indexes:', error);
//   }
// }
// mongoose.connection.once('open', dropAllIndexes);

const ThingsMatchUser =
  mongoose.models.ThingsMatchUser ||
  mongoose.model("ThingsMatchUser", thingsMatchUserAccount);

module.exports = ThingsMatchUser;
