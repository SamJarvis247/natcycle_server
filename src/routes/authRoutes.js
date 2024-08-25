const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')

const {
  register, login, verifyEmail, logout, resendOtp, changePassword,
  initiatePasswordReset, resetPassword
} =
  authController

const { isAuth } = require('../middleware/authMiddleware')

router.post('/signup', register)

router.post('/signin', login)

router.post('/signout', logout)

router.post('/verify-email', isAuth, verifyEmail)

router.post('/change-password', isAuth, changePassword)

router.get('/request-otp', isAuth, resendOtp)

router.post('/forgot-password', initiatePasswordReset)

router.post('/reset-password', resetPassword)

module.exports = router
