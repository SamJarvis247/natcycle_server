const PickUp = require('../models/pickUpModel')
const Location = require('../models/locationModel')
const mongoose = require('mongoose')
const sendNotification = require('../service/notificationService')
const User = require('../models/userModel')
const Campaign = require('../models/campaignModel')

// add new pick up
exports.addPickUp = async (req, res) => {
  const { location, itemType, date, description, campaignId } = req.body

  const findLocation = await Location.findById(location)

  if (!findLocation) {
    return res.status(404).json({ message: 'Location not found' })
  }

  try {
    let campaign
    if (campaignId) {
      campaign = await Campaign.findById(campaignId)

      if (!campaign) {
        return res.status(404).json({
          message: 'Campaign not found'
        })
      }
    }

    const pickUp = new PickUp({
      location: findLocation._id,
      itemType,
      user: req.user._id,
      scheduledDate: date,
      description,
      campaign: campaignId ? campaign._id : null
    })

    await pickUp.save()

    res.status(201).json({
      message: 'Pick up request added successfully',
      data: pickUp
    })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// get pick up by id
exports.getPickUpById = async (req, res) => {
  const pickUpId = req.params.id

  if (!mongoose.Types.ObjectId.isValid(pickUpId)) { return res.status(404).send('No pick up with that id') }

  try {
    const pickUp = await PickUp.findById(pickUpId)
      .populate('user')
      .populate('location')
      .populate('collector')
      .populate('campaign')

    if (!pickUp) {
      return res.status(404).json({ message: 'Pick up not found' })
    }

    res.status(200).json({
      data: pickUp
    })
  } catch (error) {
    console.log(error)
    res.status(500).json(error)
  }
}

// get all pick ups
exports.getPickUps = async (req, res) => {
  const { page = 1, limit = 10, status, date } = req.query

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { createdAt: -1 },
    populate: 'location'
  }

  const query = {
    user: req.user._id
  }

  if (status) {
    query.status = status
  }

  if (date) {
    query.scheduledDate = date
  }

  // get only pick ups that are not cancelled
  query.status = { $ne: 'cancelled' }

  try {
    const pickUps = await PickUp.paginate(query, options)

    res.status(200).json({
      data: pickUps,
      count: pickUps.length
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// cancel pick up
exports.cancelPickUp = async (req, res) => {
  const pickUpId = req.params.id

  if (!mongoose.Types.ObjectId.isValid(pickUpId)) { return res.status(404).send('No pick up with that id') }

  try {
    const pickUp = await PickUp.findById(pickUpId)

    if (!pickUp) {
      return res.status(404).json({ message: 'Pick up not found' })
    }

    pickUp.status = 'cancelled'

    await pickUp.save()

    res.status(200).json({
      message: 'Pick up cancelled successfully',
      data: pickUp
    })
  } catch (error) {
    res.status(500).json(error)
  }
}

exports.adminGetPickUps = async (req, res) => {
  const { page = 1, limit = 10, status, userId } = req.query

  const query = {}

  if (userId) {
    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    query.user = user._id
  }

  if (status) {
    query.status = status
  }

  const sort = {}
  if (req.query.sort === 'newest') {
    sort.createdAt = -1
  } else if (req.query.sort === 'oldest') {
    sort.createdAt = 1
  } else {
    sort.createdAt = -1
  }

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { createdAt: -1 },
    populate: 'location user'
  }

  try {
    const pickUps = await PickUp.paginate(query, options)

    res.status(200).json({
      data: pickUps,
      count: pickUps.length
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// mark pick up as completed and add pointsEarned
exports.completePickUp = async (req, res) => {
  const pickUpId = req.params.id

  const { items } = req.body

  if (!mongoose.Types.ObjectId.isValid(pickUpId)) { return res.status(404).send('No pick up with that id') }

  try {
    const pickUp = await PickUp.findById(pickUpId)

    if (!pickUp) {
      return res.status(404).json({ message: 'Pick up not found' })
    }

    if (pickUp.status === 'completed') {
      return res.status(400).json({ message: 'Pick up already completed' })
    }

    const user = await User.findById(pickUp.user)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    let pointsEarned = 0

    if (pickUp.items.paper) {
      pointsEarned += pickUp.items.paper * 15
      user.itemsCount.paper += pickUp.items.paper
    }

    if (pickUp.items.plastic) {
      pointsEarned += pickUp.items.plastic * 10
      user.itemsCount.plastic += pickUp.items.plastic
    }

    if (pickUp.items.fabric) {
      pointsEarned += pickUp.items.fabric * 5
      user.itemsCount.fabric += pickUp.items.fabric
    }

    if (pickUp.items.glass) {
      pointsEarned += pickUp.items.glass * 8
      user.itemsCount.glass += pickUp.items.glass
    }

    console.log('____pointsEarned____', pointsEarned)

    pickUp.status = 'completed'
    pickUp.completedAt = new Date()

    pickUp.pointsEarned = pointsEarned

    pickUp.collector = req.user._id

    pickUp.completedBy = req.user.email

    pickUp.confirmedItems = items

    await pickUp.save()

    user.pointsEarned += pointsEarned
    user.carbonUnits += pointsEarned

    await user.save()

    // check for campaign and add to campaign goal

    if (pickUp.campaign) {
      const campaign = await Campaign.findById(pickUp.campaign)

      if (campaign) {
        // campaign.progress += pointsEarned
        // add the item count to the campaign

        if (pickUp.items.paper) {
          campaign.progress += pickUp.items.paper
        }

        if (pickUp.items.plastic) {
          campaign.progress += pickUp.items.plastic
        }

        if (pickUp.items.fabric) {
          campaign.progress += pickUp.items.fabric
        }

        if (pickUp.items.glass) {
          campaign.progress += pickUp.items.glass
        }

        await campaign.save()
      }
    }

    await sendNotification(
      'Pick up completed',
      `Your pick up request has been completed. You have earned ${pointsEarned} points`,
      pickUp.user
    )

    res.status(200).json({
      message: 'Pick up completed successfully',
      data: pickUp
    })
  } catch (error) {
    console.log(error)
    res.status(500).json(error)
  }
}

// delete pick up
exports.deletePickUp = async (req, res) => {
  const pickUpId = req.params.id

  if (!mongoose.Types.ObjectId.isValid(pickUpId)) { return res.status(404).send('No pick up with that id') }

  try {
    const pickUp = await PickUp.findById(pickUpId)

    if (!pickUp) {
      return res.status(404).json({ message: 'Pick up not found' })
    }

    await pickUp.remove()

    res.status(200).json({
      message: 'Pick up deleted successfully',
      data: pickUp
    })
  } catch (error) {
    res.status(500).json(error)
  }
}
