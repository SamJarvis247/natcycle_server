const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

// award that can be gotten with points
const awardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  pointsRequired: {
    type: Number,
    required: true
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
  },
  sponsorName: {
    type: String,
    required: false
  },
  sponsorLink: {
    type: String,
    required: false
  }
})

awardSchema.plugin(mongoosePaginate)
const Award = mongoose.model('Award', awardSchema)

module.exports = Award
