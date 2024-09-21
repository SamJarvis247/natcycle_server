const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const redeemAwardSchema = new mongoose.Schema({
  award: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  redeemedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'processing', 'completed', 'rejected']
  }
})

redeemAwardSchema.plugin(mongoosePaginate)
const RedeemAward = mongoose.model('RedeemAward', redeemAwardSchema)

module.exports = RedeemAward
