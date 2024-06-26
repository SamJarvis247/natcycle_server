const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const badgeSchema = new mongoose.Schema({
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

badgeSchema.plugin(mongoosePaginate)

const Badge = mongoose.model('Badge', badgeSchema)

module.exports = Badge
