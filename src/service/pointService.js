const User = require('../models/userModel')
const sendNotification = require('../service/notificationService')

// award more than 2 refered users point

exports.awardReferralPoints = async (user) => {
  const referredUsers = await User.find({ referredBy: user._id })

  if (referredUsers.length > 2 && referredUsers.length < 3) {
    user.pointsEarned += 100
    await user.save()

    await sendNotification(
      'Points Awarded',
      'You have been awarded 100 points for referring more than 2 users',
      user._id
    )
  }
}

module.exports = exports.awardPoints
