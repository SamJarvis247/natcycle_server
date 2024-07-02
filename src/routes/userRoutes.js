const express = require('express')
const router = express.Router()
const userControllers = require('../controllers/userControllers')

const {
  updateProfile, updateProfilePicture, getMe,
  getAllUsers,
  getUserById, disableUser, enableUser
} = userControllers

const { isAuth } = require('../middleware/authMiddleware')

router.put('/', isAuth, updateProfile)

router.put('/image', isAuth, updateProfilePicture)

router.get('/', isAuth, getMe)

// admin routes
router.get('/all', isAuth, getAllUsers)

router.get('/:id', isAuth, getUserById)

router.put('/disable/:id', isAuth, disableUser)

router.put('/enable/:id', isAuth, enableUser)

module.exports = router
