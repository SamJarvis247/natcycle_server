const Rewards = require('../models/awardModel')
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
  const { id, userId } = req.params

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

    if (user.pointsEarned < findReward.pointsRequired) {
      return res.status(400).json({
        message: 'You don not have enough points to get this Reward Item'
      })
    }

    // check if user has already redeemed
    if (user.redeemedRewards.includes(id)) {
      return res.status(400).json({
        message: 'You have already redeemed this reward'
      })
    }

    user.pointsEarned -= findReward.pointsRequired
    user.redeemedRewards.push(id)

    await user.save()
  } catch (error) {
    return res.status(400).json({
      message: 'error in redeeming reward'
    })
  }
}
