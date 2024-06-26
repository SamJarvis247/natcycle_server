const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const collectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  items: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
    },
  ],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
})

collectionSchema.plugin(mongoosePaginate)

const Collection = mongoose.model('Collection', collectionSchema)

module.exports = Collection
