const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

notificationSchema.plugin(mongoosePaginate)

const Notification = mongoose.model('Notification', notificationSchema)

module.exports = Notification
