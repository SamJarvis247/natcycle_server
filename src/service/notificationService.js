const Notification = require('../models/notificationModel')

const sendNotification = async (title, message, user) => {
  try {
    const notification = new Notification({
      title,
      message,
      user
    })

    await notification.save()
  } catch (error) {
    console.log('error creating notification:', error.message)
  }
}

module.exports = sendNotification
