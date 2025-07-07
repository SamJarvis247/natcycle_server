const express = require('express')
const router = express.Router()
const userControllers = require('../controllers/userControllers')
const fcmController = require('../controllers/fcmController')
const {
  validateFCMTokenRegistration,
  validateFCMTokenRemoval,
  validateTestNotification
} = require('../validation/fcmValidation')

const {
  updateProfile, updateProfilePicture, getMe, getUserBadges,
  getAllUsers,
  getUserById, disableUser, enableUser, getReferrals
} = userControllers

const {
  registerFCMToken,
  removeFCMToken,
  getFCMTokens,
  sendTestNotification
} = fcmController

const { isAuth } = require('../middleware/authMiddleware')

router.put('/', isAuth, updateProfile)

router.put('/image', isAuth, updateProfilePicture)

router.get('/', isAuth, getMe)

router.get('/badges', isAuth, getUserBadges)

// admin routes
router.get('/all', isAuth, getAllUsers)

router.get('/:id', isAuth, getUserById)

router.put('/disable/:id', isAuth, disableUser)

router.put('/enable/:id', isAuth, enableUser)

router.get('/referrals/:id', isAuth, getReferrals)

// FCM Token Management Routes
router.post('/fcm-token', isAuth, validateFCMTokenRegistration, registerFCMToken)
router.delete('/fcm-token', isAuth, validateFCMTokenRemoval, removeFCMToken)
router.get('/fcm-tokens', isAuth, getFCMTokens)
router.post('/test-notification', isAuth, validateTestNotification, sendTestNotification)

module.exports = router
