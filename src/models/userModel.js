// const  mongoose from 'mongoose';
const mongoose = require('mongoose')

const UserSchema = mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    profilePicture: {
      public_id: {
        type: String,
        required: false
      },
      url: {
        type: String,
        required: false
      }
    },
    country: {
      type: String,
      required: false,
      trim: true
    },
    isAdmin: {
      type: Boolean,
      required: false,
      default: false
    },
    point: {
      type: Number,
      required: false,
      default: 0
    },
    badges: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Badge'
      }
    ],
    isBlocked: {
      type: Boolean,
      required: false,
      default: false
    },
    otp: {
      type: String,
      required: false
    }
  },
  {
    timestamps: true
  }
)

// module.exports = mongoose.model('User', UserSchema) || mongoose.models.User;
module.exports = mongoose.models.User || mongoose.model('User', UserSchema)
