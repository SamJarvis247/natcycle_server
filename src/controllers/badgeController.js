const Badge = require('../models/badgeModel')
const User = require('../models/userModel')
const cloudinaryUpload = require('../config/cloudinaryUpload')

// add new badge
exports.addBadge = async (req, res) => {
  const { name, description } = req.body

  try {
    // check if name already exists
    const badgeExists = await Badge.findOne({ name })

    if (badgeExists) {
      return res.status(400).json({ message: 'Badge name already exists' })
    }

    const fileStr = req.body.image
    const result = await cloudinaryUpload.image(fileStr)

    const badge = new Badge({
      name,
      description,
      user: req.user._id,
      image: {
        public_id: result.public_id,
        url: result.secure_url
      }
    })

    await badge.save()

    res.status(201).json({
      message: 'Badge added successfully',
      data: badge
    })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// get all badges
exports.getBadges = async (req, res) => {
  try {
    const badges = await Badge.find({
      user: req.user._id
    }).sort({ createdAt: -1 })

    res.status(200).json({
      data: badges,
      message: 'Badges fetched successfully'
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// delete badge
exports.deleteBadge = async (req, res) => {
  try {
    const badge = await Badge.findById(badgeId)

    if (!badge) {
      return res.status(404).json({ message: 'Badge not found' })
    }

    await badge.delete()

    res.status(200).json({
      message: 'Badge deleted successfully'
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.updateBadge = async (req, res) => {
  const { name, description } = req.body

  try {
    const badge = await Badge.findById(badgeId)

    if (!badge) {
      return res.status(404).json({ message: 'Badge not found' })
    }

    badge.name = name
    badge.description = description

    if (req.body.image) {
      const fileStr = req.body.image
      const result = await cloudinaryUpload.image(fileStr)

      badge.image = {
        public_id: result.public_id,
        url: result.secure_url
      }
    }

    await badge.save()

    res.status(200).json({
      message: 'Badge updated successfully',
      data: badge
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// add badge to user first check if user already has badge
exports.addBadgeToUser = async (req, res) => {
  const { badgeId, userId } = req.params

  try {
    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const badge = await Badge.findById(badgeId)

    if (!badge) {
      return res.status(404).json({ message: 'Badge not found' })
    }

    // check if user already has badge
    const hasBadge = user.badges.includes(badgeId)

    if (hasBadge) {
      return res.status(400).json({ message: 'User already has badge' })
    }

    user.badges.push(badgeId)

    await user.save()

    res.status(200).json({
      message: 'Badge added to user successfully'
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// remove badge from user
exports.removeBadgeFromUser = async (req, res) => {
  const { badgeId, userId } = req.params

  try {
    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const badge = await Badge.findById(badgeId)

    if (!badge) {
      return res.status(404).json({ message: 'Badge not found' })
    }

    // check if user already has badge
    const hasBadge = user.badges.includes(badgeId)

    if (!hasBadge) {
      return res.status(400).json({ message: 'User does not have badge' })
    }

    user.badges = user.badges.filter(badge => badge !== badgeId)

    await user.save()

    res.status(200).json({
      message: 'Badge removed from user successfully'
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// get all badges for a user
exports.getUserBadges = async (req, res) => {
  const { userId } = req.params

  try {
    const user = await User.findById(userId).populate('badges')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.status(200).json({
      data: user.badges,
      message: 'User badges fetched successfully'
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
