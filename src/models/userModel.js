// Import mongoose using CommonJS syntax
const mongoose = require('mongoose')

// glass, plastic, paper, metal, organic, e-waste, hazardous
const ItemsCountSchema = mongoose.Schema(
  {
    glass: {
      type: Number,
      required: true,
      default: 0
    },
    plastic: {
      type: Number,
      required: true,
      default: 0
    },
    fabric: {
      type: Number,
      required: true,
      default: 0
    },
    paper: {
      type: Number,
      required: true,
      default: 0
    },
    metal: {
      type: Number,
      required: true,
      default: 0
    },
    organic: {
      type: Number,
      required: true,
      default: 0
    },
    eWaste: {
      type: Number,
      required: true,
      default: 0
    }
  },
  {
    timestamps: true
  }
)


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
    phoneNumber: {
      type: String,
      required: false,
      trim: true
    },
    isEmailVerified: {
      type: Boolean,
      required: false,
      default: false
    },
    thingsMatchAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ThingsMatchUser',
      required: false,
    },
    isAdmin: {
      type: Boolean,
      required: false,
      default: false
    },
    pointsEarned: {
      type: Number,
      required: false,
      default: 0
    },
    carbonUnits: {
      type: Number,
      required: false,
      default: 0
    },
    totalItemsCollected: {
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
    impactMeasurement: {
      type: String,
      required: true,
      default: 'Birds'
    },
    otp: {
      type: String,
      required: false
    },
    referralId: {
      type: String,
      required: false,
      default: ''
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    itemsCount: {
      type: ItemsCountSchema,
      required: false,
      default: {
        glass: 0,
        plastic: 0,
        fabric: 0,
        paper: 0,
        metal: 0,
        organic: 0,
        eWaste: 0
      }
    },
    redeemedRewards: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reward',
        default: []
      }
    ]
  },
  {
    timestamps: true
  }
)



UserSchema.methods.toJSON = function () {
  const user = this
  const userObject = user.toObject()

  delete userObject.password

  return userObject
}



const User = mongoose.models.User || mongoose.model('User', UserSchema);


module.exports = User 
