const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const dropOffLocationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  itemType: {
    type: String,
    required: true,
    default: 'plastic'
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  googleMapId: {
    type: String
  },
  googleMapsUri: {
    type: String
  }
})

dropOffLocationSchema.plugin(mongoosePaginate)

dropOffLocationSchema.index({ location: '2dsphere' })

const DropOffLocation = mongoose.model('DropOffLocation', dropOffLocationSchema)

module.exports = DropOffLocation
