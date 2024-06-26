const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  address: {
    type: String,
    required: true,
    trim: true
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
    required: true,
    trim: true
  },
  hidden: {
    type: Boolean,
    default: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
})

locationSchema.plugin(mongoosePaginate)

const Location = mongoose.model('Location', locationSchema)

module.exports = Location
