const express = require('express')
const router = express.Router()
const userControllers = require('../controllers/userControllers')

const { updateProfile, updateProfilePicture, getMe } = userControllers

const { isAuth } = require('../middleware/authMiddleware')

router.put('/', isAuth, updateProfile)

router.put('/image', isAuth, updateProfilePicture)

router.get('/', isAuth, getMe)

module.exports = router
