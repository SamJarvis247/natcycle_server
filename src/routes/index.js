const express = require('express')
const router = express.Router()

const authRoutes = require('./authRoutes')
const userRoutes = require('./userRoutes')
const pickUpRoutes = require('./pickupRoutes')
const notificationRoutes = require('./notificationRoutes')
const locationRoutes = require('./locationRoutes')

router.use('/auth', authRoutes)
router.use('/profile', userRoutes)
router.use('/pickup', pickUpRoutes)
router.use('/notifications', notificationRoutes)
router.use('/location', locationRoutes)

module.exports = router
