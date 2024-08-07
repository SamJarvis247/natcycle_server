const PickUp = require('../models/pickUpModel')
const Location = require('../models/locationModel')
const mongoose = require('mongoose')
const sendNotification = require('../service/notificationService')
const User = require('../models/userModel')

// add new pick up
exports.addPickUp = async (req, res) => {
  const { itemType, location, date, timeStart, timeEnd, description } = req.body

  const findLocation = await Location.findById(location)

  if (!findLocation) {
    return res.status(404).json({ message: 'Location not found' })
  }

  try {
    const pickUp = new PickUp({
      location: findLocation._id,
      itemType,
      user: req.user._id,
      scheduledDate: date,
      scheduledTimeStart: timeStart,
      scheduledTimeEnd: timeEnd,
      description
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
  const { page = 1, limit = 10, status } = req.query

  const query = {}
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
  const recyclablesWithPoints = [
    { item: 'Plastic Bottles', points: 10 },
    { item: 'Fabric', points: 5 },
    { item: 'Glass', points: 8 },
    { item: 'Mixed', points: 2 }
  ]

  const pickUpId = req.params.id

  const { itemsCount } = req.body

  if (!mongoose.Types.ObjectId.isValid(pickUpId)) { return res.status(404).send('No pick up with that id') }

  try {
    const pickUp = await PickUp.findById(pickUpId)

    if (!pickUp) {
      return res.status(404).json({ message: 'Pick up not found' })
    }

    if (pickUp.status === 'completed') {
      return res.status(400).json({ message: 'Pick up already completed' })
    }
    // const calculatePoints earned

    // let pointsEarned = 0

    // for (let i = 0; i < itemsCount.length; i++) {
    //   const item = itemsCount[i]
    //   const recyclable = recyclablesWithPoints.find((r) => r.item === item.itemType)
    //   if (recyclable) {
    //     pointsEarned += recyclable.points * item.count
    //   }
    // }

    let pointsEarned = 0

    const recyclable = recyclablesWithPoints.find((r) => r.item === pickUp.itemType)

    console.log('recyclable', recyclable)

    if (recyclable) {
      pointsEarned = recyclable.points * itemsCount
    }

    pickUp.status = 'completed'
    pickUp.completedAt = new Date()
    pickUp.itemsCount = itemsCount

    // add points earned
    pickUp.pointsEarned = pointsEarned

    await pickUp.save()

    // add points to user
    const user = await User.findById(pickUp.user)

    user.pointsEarned += pointsEarned
    user.carbonUnits += pointsEarned

    user.totalItemsCollected += itemsCount

    await user.save()

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
