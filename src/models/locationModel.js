const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  latitude: {
    type: Number,
    required: false
  },
  longitude: {
    type: Number,
    required: false
  },
  state: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: false
  },
  hidden: {
    type: Boolean,
    default: false
  },
  country: {
    type: String
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    type: Object,
    ref: 'Metadata'
  }
})

locationSchema.plugin(mongoosePaginate)

const Location = mongoose.model('Location', locationSchema)

module.exports = Location
