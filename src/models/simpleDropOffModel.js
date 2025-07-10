const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const { getPrimaryMaterialTypes } = require('./enums/materialTypeHierarchy');

const simpleDropOffModelSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  simpleDropOffLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SimpleDropOffLocation',
    required: true,
  },
  materialType: {
    type: String,
    required: true,
    enum: getPrimaryMaterialTypes(),
    default: 'plastic',
  },
  quantity: {
    type: Number,
    required: false,
  },
  proofPicture: {
    public_id: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  },
  cuEarned: {
    type: Number,
    required: false,
    default: 0,
  },
  rejectionReason: {
    type: String,
    required: false,
    trim: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  gpsCoordinates: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})

simpleDropOffModelSchema.plugin(mongoosePaginate);
simpleDropOffModelSchema.index({ gpsCordinates: '2dsphere' });

const SimpleDropOff = mongoose.model('SimpleDropOff', simpleDropOffModelSchema);

module.exports = SimpleDropOff;
