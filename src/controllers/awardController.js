const Rewards = require('../models/awardModel')
const RedeemAward = require('../models/redeemAwardModel')
const cloudinaryUpload = require('../config/cloudinaryUpload')
const User = require('../models/userModel')

exports.addAward = async (req, res) => {
  const { name, description, pointsRequired, sponsorName, sponsorLink } = req.body

  try {
    const findAward = await Rewards.findOne({ name })

    if (findAward) {
      return res.status(400).json({ message: 'Award with name already exists' })
    }

    const fileStr = req.body.image
    const result = await cloudinaryUpload.image(fileStr)

    const newAward = new Rewards({
      name,
      description,
      image: {
        public_id: result.public_id,
        url: result.secure_url
      },
      pointsRequired,
      sponsorName,
      sponsorLink: sponsorLink || ''
    })

    await newAward.save()

    return res.status(201).json({
      message: 'Award added successfully',
      data: newAward
    })
  } catch (err) {
    return res.status(400).json({ message: err.message })
  }
}

exports.getAwards = async (req, res) => {
  try {
    const awards = await Rewards.find().sort({ createdAt: -1 })

    return res.status(200).json({
      data: awards,
      message: 'Awards fetched successfully'
    })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

// update award
exports.updateAward = async (req, res) => {
  const { id } = req.params
  const { name, description, pointsRequired } = req.body

  try {
    const award = await Rewards.findById(id)

    if (!award) {
      return res.status(404).json({
        message: 'Award not found'
      })
    }

    let image

    if (req.body.image) {
      const imageUpload = await cloudinaryUpload.image(req.body.image)

      if (imageUpload) {
        image = {
          public_id: imageUpload.public_id,
          url: imageUpload.secure_url
        }
      }
    }

    award.name = name
    award.description = description
    award.pointsRequired = pointsRequired
    if (image) award.image = image

    await award.save()

    return res.status(200).json({
      message: 'Award updated successfully',
      data: award
    })
  } catch (err) {
    return res.status(400).json({ message: err.message })
  }
}

exports.deleteAward = async (req, res) => {
  const { id } = req.params

  if (!id) return res.status(400).json({ message: 'an id must be included' })

  try {
    await Rewards.findByIdAndDelete(id)

    return res.status(200).json({
      message: 'successfully deleted the award'
    })
  } catch (error) {
    console.log(error)
    return res.status(400).json({
      message: 'error in deleting award'
    })
  }
}

exports.userRedeemRewardWithPoints = async (req, res) => {
  const userId = req.user._id
  const { id } = req.params

  try {
    const findReward = await Rewards.findById(id)
    if (!findReward) {
      return res.status(404).json({
        message: 'reward could not be found'
      })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        message: 'User with Id does  not exist'
      })
    }

    // // make sure user has not redeemed the reward
    // if (user.redeemedRewards.includes(id)) {
    //   return res.status(400).json({
    //     message: 'You have already redeemed this reward'
    //   })
    // }

    console.log(user.pointsEarned, findReward.pointsRequired)

    if (user.pointsEarned < findReward.pointsRequired) {
      return res.status(400).json({
        message: 'You don not have enough points to get this Reward Item'
      })
    }

    // check if user has already redeemed
    const redeemedAward = await RedeemAward.findOne({
      userId,
      awardId: id
    })

    if (redeemedAward) {
      return res.status(400).json({
        message: 'You have already redeemed a reward'
      })
    }

    const newRedeemAward = new RedeemAward({
      award: id,
      user: userId
    })

    await newRedeemAward.save()

    user.pointsEarned -= findReward.pointsRequired
    user.redeemedRewards.push(id)

    await user.save()
  } catch (error) {
    return res.status(400).json({
      message: error.message
    })
  }
}

exports.getUserRewards = async (req, res) => {
  const userId = req.user._id

  try {
    const userRewards = await RedeemAward.find({ user: userId })

    const awardsId = userRewards.map(reward => reward.award)

    const userRewardsData = await Rewards.find({ _id: { $in: awardsId } })

    userRewards.forEach((reward, index) => {
      const award = userRewardsData.find(data => data._id.toString() === reward.award.toString())
      userRewards[index] = {
        ...reward._doc,
        status: reward.status,
        ...award._doc
      }
    })

    console.log(userRewards)

    return res.status(200).json({
      data: userRewards,
      message: 'User rewards fetched successfully'
    })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

exports.adminUpdateRedeemStatus = async (req, res) => {
  const { id, status } = req.params

  console.log(id, status)

  try {
    const redeemAward = await RedeemAward.findById(id)

    if (!redeemAward) {
      return res.status(404).json({
        message: 'Redeem award not found'
      })
    }

    redeemAward.status = status

    await redeemAward.save()

    return res.status(200).json({
      message: 'Redeem award status updated successfully',
      data: redeemAward
    })
  } catch (err) {
    return res.status(400).json({ message: err.message })
  }
}

exports.adminGetRedeemAwards = async (req, res) => {
  try {
    const redeemAwards = await RedeemAward.find()
    // .populate('award')
    // .populate('user')

    const awardsId = redeemAwards.map(reward => reward.award)
    const userIds = redeemAwards.map(reward => reward.user)

    const userRewardsData = await Rewards.find({ _id: { $in: awardsId } })
    const userData = await User.find({ _id: { $in: userIds } })

    redeemAwards.forEach((reward, index) => {
      const award = userRewardsData.find(data => data._id.toString() === reward.award.toString())
      const user = userData.find(data => data._id.toString() === reward.user.toString())
      redeemAwards[index] = {
        status: reward.status,
        ...award._doc,
        ...reward._doc,
        // user: user._doc only first name and last name and id
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName
        }
      }
    })

    return res.status(200).json({
      data: redeemAwards,
      message: 'Redeem awards fetched successfully'
    })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}
