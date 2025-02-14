const express = require('express')
const router = express.Router()

const authRoutes = require('./authRoutes')
const userRoutes = require('./userRoutes')
const pickUpRoutes = require('./pickupRoutes')
const notificationRoutes = require('./notificationRoutes')
const locationRoutes = require('./locationRoutes')
const badgeRoutes = require('./badgeRoutes')
const rewardRoutes = require('./awardRoutes')
const campaignRoutes = require('./campaignRoutes')
const dropOffLocationRoutes = require('./dropOffLocationRoutes')
const dropOffRoutes = require('./dropOffRoutes')

router.use('/auth', authRoutes)
router.use('/profile', userRoutes)
router.use('/pickup', pickUpRoutes)
router.use('/notifications', notificationRoutes)
router.use('/location', locationRoutes)
router.use('/badges', badgeRoutes)
router.use('/reward', rewardRoutes)
router.use('/campaigns', campaignRoutes)
router.use('/dropOff-location', dropOffLocationRoutes)
router.use('/dropOff', dropOffRoutes)


module.exports = router
