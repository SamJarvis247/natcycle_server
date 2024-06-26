const Notification = require('../models/notificationModel')
const mongoose = require('mongoose')

// get all notifications
exports.getNotifications = async (req, res) => {
  const { page = 1, limit = 10 } = req.query

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { createdAt: -1 }
  }

  const query = {
    user: req.user._id
  }

  try {
    const notifications = await Notification.paginate(query, options)

    res.status(200).json({
      data: notifications,
      count: notifications.length
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// mark notification as read
exports.markAsRead = async (req, res) => {
  const { id } = req.params

  try {
    const notification = await Notification.findById(id)

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' })
    }

    if (notification.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    notification.read = true

    await notification.save()

    res.status(200).json({
      message: 'Notification marked as read successfully',
      data: notification
    })
  } catch (error) {
    res.status(500).json(error)
  }
}

// delete notification
exports.deleteNotification = async (req, res) => {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).send('No notification with that id')
  }

  try {
    const notification = await Notification.findById(id)

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' })
    }

    await notification.remove()

    res.status(200).json({
      message: 'Notification deleted successfully',
      data: notification
    })
  } catch (error) {
    res.status(500).json(error)
  }
}
