const mongoose = require('mongoose');

const AnalyticsModelSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ["find", "findOne", "findById", "paginate", "countDocuments", "aggregate"]
  },
  model: {
    type: String,
    required: true
  },
  query: {
    type: String,
    required: true
  },
  executionTime: {
    type: Number,
    required: true
  },
  indexUsed: {
    type: Boolean,
    required: false
  },
  executionStats: {
    type: Object,
    required: false
  },
}, {
  timestamps: true,
  toJSON: {
    virtuals: false,
    versionKey: false,
    transform: (doc, ret) => {
      delete ret._id;
      return ret;
    }
  },
}
);

//Indexes
AnalyticsModelSchema.index({ type: 1, model: 1, createdAt: -1 });
AnalyticsModelSchema.index({ model: 1, createdAt: -1 });
AnalyticsModelSchema.index({ query: 1, createdAt: -1 });
AnalyticsModelSchema.index({ executionTime: -1 });
AnalyticsModelSchema.index({ timestamp: -1 });


const AnalyticsModel = mongoose.model('Analytics', AnalyticsModelSchema);

module.exports = AnalyticsModel;
