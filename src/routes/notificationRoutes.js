const express = require('express')
const router = express.Router()

const notificationController = require('../controllers/notificationController')

const { getNotifications, markAsRead, deleteNotification } = notificationController

router.get('/', getNotifications)

router.put('/:id', markAsRead)

router.delete('/:id', deleteNotification)

module.exports = router
