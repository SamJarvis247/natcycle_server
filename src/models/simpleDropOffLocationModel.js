const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const {
  materialTypeHierarchy,
  getPrimaryMaterialTypes,
} = require('./enums/materialTypeHierarchy');

const simpleDropOffLocationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
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
  address: {
    type: String,
    required: false,
    trim: true
  },
  bulkMaterialTypes: [
    {
      type: String,
      enum: getPrimaryMaterialTypes(),
    }
  ],
  acceptedSubtypes: [
    {
      type: String,
    }
  ],
  organizationName: {
    type: String,
    required: false,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  verificationRequired: {
    type: Boolean,
    default: false
  },
  maxItemsPerDropOff: {
    type: Number,
    default: 20
  },
  operatingHours: {
    type: String,
    required: false,
    trim: true
  },
  contactNumber: {
    type: String,
    required: false,
    trim: true
  },
  lastVerified: {
    type: Date,
    default: Date.now
  },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

simpleDropOffLocationSchema.plugin(mongoosePaginate);

simpleDropOffLocationSchema.index({ location: '2dsphere' });

const SimpleDropOffLocation = mongoose.model(
  'SimpleDropOffLocation',
  simpleDropOffLocationSchema
);

module.exports = SimpleDropOffLocation;
