const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2');
const {
  materialTypeHierarchy,
  getPrimaryMaterialTypes,
} = require('./enums/materialTypeHierarchy');

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  organizationName: {
    type: String,
    required: false,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  locations: [{
    simpleDropoffLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SimpleDropOffLocation',
      required: false
    },
    dropoffLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DropOffLocation',
      required: false
    },
    customLocation: {
      type: {
        type: String,
        enum: ['Point'],
        required: false
      },
      coordinates: {
        type: [Number],
        required: false
      },
      name: {
        type: String,
        required: false
      },
      address: {
        type: String,
        required: false
      }
    }
  }],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  isIndefinite: {
    type: Boolean,
    default: false
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  //deprecated(we dont use a certain User for campaigns)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  contributors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'completed', 'cancelled']
  },
  materialTypes: [{
    type: String,
    enum: getPrimaryMaterialTypes(),
  }],
  goal: {
    type: Number
  },
  progress: {
    type: Number,
    default: 0
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
  // Campaigns can be associated with a drop-off location
  // This is optional, as some campaigns may not have a specific drop-off location
  dropOffLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DropOffLocation'
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
    transform: (doc, ret) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
})

campaignSchema.plugin(mongoosePaginate)

// Add indexes for the new locations array structure
campaignSchema.index({ 'locations.customLocation': '2dsphere' });
campaignSchema.index({ status: 1 });
campaignSchema.index({ endDate: 1 });
campaignSchema.index({ createdAt: -1 });

const Campaign = mongoose.model('Campaign', campaignSchema)

module.exports = Campaign
