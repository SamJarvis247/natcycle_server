const express = require('express')
const router = express.Router()

const notificationController = require('../controllers/notificationController')

const { getNotifications, markAsRead, deleteNotification } = notificationController

const { isAuth, isAdmin } = require('../middleware/authMiddleware')

router.get('/', isAuth, getNotifications)

router.put('/:id', markAsRead)

router.delete('/:id', deleteNotification)

module.exports = router
