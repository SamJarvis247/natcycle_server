const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  endDate: {
    type: Date
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'completed', 'cancelled']
  },
  material: {
    type: String
  },
  goal: {
    type: Number
  },
  progress: {
    type: Number,
    default: 0
  },
  image: {
    public_id: {
      type: String,
      required: false
    },
    url: {
      type: String,
      required: false
    }
  }
})

campaignSchema.plugin(mongoosePaginate)

const Campaign = mongoose.model('Campaign', campaignSchema)

module.exports = Campaign
