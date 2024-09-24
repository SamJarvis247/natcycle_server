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
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  hidden: {
    type: Boolean,
    default: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    type: Object,
    ref: 'Metadata'
  },
  status: {
    type: String,
    default: 'active'
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
