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
    default: 'bottles'
  },
  description: {
    type: String,
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
  completedAt: {
    type: Date,
    required: false
  }
}, {
  timestamps: true
})

pickUpSchema.plugin(mongoosePaginate)

const PickUp = mongoose.model('PickUp', pickUpSchema)

module.exports = PickUp
