const express = require('express')
const router = express.Router()
const userControllers = require('../controllers/userControllers')

const {
  updateProfile, updateProfilePicture, getMe, getUserBadges,
  getAllUsers,
  getUserById, disableUser, enableUser, getReferrals
} = userControllers

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

module.exports = router
