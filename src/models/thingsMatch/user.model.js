const mongoose = require('mongoose');


const thingsMatchUserAccount = mongoose.Schema({
  natcycleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    unique: true,
    sparse: false,
    required: false
  },
  location: {
    type: String,
    required: false
  },
  tags: {
    type: [String],
    required: false
  },
  interests: {
    type: [String],
    required: false
  },
  monthlyGoal: {
    type: Number,
    required: false
  },
  itemsShared: {
    type: Number,
    required: false
  },
  environmentalImpact: {
    type: Number,
    required: false
  },
})

// Function to drop all indexes for ThingsMatchUser
// const dropAllIndexes = async () => {
//   try {
//     if (mongoose.connection.collections.thingsmatchusers) {
//       await mongoose.connection.collections.thingsmatchusers.dropIndexes();
//       console.log('All indexes for ThingsMatchUser collection have been dropped');
//     } else {
//       console.log('ThingsMatchUser collection does not exist yet');
//     }
//   } catch (error) {
//     console.error('Error dropping indexes:', error);
//   }
// }
// mongoose.connection.once('open', dropAllIndexes);



const ThingsMatchUser = mongoose.models.ThingsMatchUser || mongoose.model('ThingsMatchUser', thingsMatchUserAccount);

module.exports = ThingsMatchUser;
