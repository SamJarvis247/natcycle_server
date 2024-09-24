const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const pickUpSchema = new mongoose.Schema({
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    trim: true
  },
  itemType: {
    type: String,
    required: true,
    trim: true,
    default: 'Plastic Bottles'
  },
  items: {
    plastic: {
      type: Number,
      required: false,
      default: 0
    },
    fabric: {
      type: Number,
      required: false,
      default: 0
    },
    glass: {
      type: Number,
      required: false,
      default: 0
    },
    paper: {
      type: Number,
      required: false,
      default: 0
    }
  },
  confirmedItems: {
    plastic: {
      type: Number,
      required: false,
      default: 0
    },
    fabric: {
      type: Number,
      required: false,
      default: 0
    },
    glass: {
      type: Number,
      required: false,
      default: 0
    },
    paper: {
      type: Number,
      required: false,
      default: 0
    }
  },
  description: {
    type: Number,
    required: false
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  scheduledTime: {
    type: String
  },
  scheduledTimeStart: {
    type: String
  },
  scheduledTimeEnd: {
    type: String
  },
  pointsEarned: {
    type: Number,
    required: false,
    default: 0
  },
  itemsCount: {
    type: Number,
    required: false,
    default: 0
  },
  status: {
    type: String,
    required: true,
    trim: true,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  collector: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedAt: {
    type: Date,
    required: false
  },
  completedBy: {
    type: String,
    required: false
  }
}, {
  timestamps: true
})

pickUpSchema.plugin(mongoosePaginate)

const PickUp = mongoose.model('PickUp', pickUpSchema)

module.exports = PickUp
