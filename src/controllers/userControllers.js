const User = require('../models/userModel')
const cloudinaryUpload = require('../config/cloudinaryUpload')
const mongoose = require('mongoose')
const { successResponse, errorResponse } = require('../utility/response')

// update the user's profile
exports.updateProfile = async (req, res) => {
  const updated = await User.findByIdAndUpdate(
    req.user._id,
    {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      impactMeasurement: req.body.impactMeasurement
    },
    { new: true }
  )
  const { password, ...otherDetails } = updated._doc

  try {
    return successResponse(res, otherDetails, 'User Profile Updated Successfully')
  } catch (err) {
    console.log('Error: ', err)
    return errorResponse(res, err)
  }
}

// update user profile picture
exports.updateProfilePicture = async (req, res) => {
  const fileStr = req.body.image
  const user = await User.findById(req.user._id)
  if (!user) return res.status(400).send('User not found')

  const profilePicture = user.profilePicture
  if (!profilePicture) return res.status(400).send('profilePicture not found')

  try {
    const result = await cloudinaryUpload.image(fileStr)
    if (!result) return res.status(400).send('Error uploading image')

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      {
        profilePicture: {
          public_id: result.public_id,
          url: result.secure_url
        }
      },
      { new: true }
    )

    const { password, ...otherDetails } = updated._doc
    return res.status(200).json({
      message: 'User Profile Picture Updated Successfully',
      data: otherDetails
    })
  } catch (err) {
    console.log('Error: ', err)
    res.status(400).json(err)
  }
}

// get current logged user profile
exports.getMe = async (req, res) => {
  const user = req.user
  if (!user) return res.status(400).send('User not found')

  const { password, ...userDetails } = user._doc

  try {
    return res.status(200).json({
      message: 'User Profile Fetched Successfully',
      data: userDetails
    })
  } catch (err) {
    console.log('Error: ', err)
    res.status(400).json(err)
  }
}

// admin routes
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('firstName lastName email phone location createdAt')
    return res.status(200).json({
      message: 'Users Fetched Successfully',
      data: users
    })
  } catch (err) {
    console.log('Error: ', err)
    res.status(400).json(err)
  }
}

// get user by id
exports.getUserById = async (req, res) => {
  const userId = req.params.id

  if (!mongoose.Types.ObjectId.isValid(userId)) { return res.status(404).send('No user with that id') }

  try {
    const user = await User.findById(userId)
    return res.status(200).json({
      message: 'User Fetched Successfully',
      data: user
    })
  } catch (err) {
    console.log('Error: ', err)
    res.status(400).json(err)
  }
}

// get user by email

exports.getUserByEmail = async (req, res) => {
  const email = req.params.email

  try {
    const user = await User.findOne({ email })
    return res.status(200).json({
      message: 'User Fetched Successfully',
      data: user
    })
  } catch (err) {
    console.log('Error: ', err)
    res.status(400).json(err)
  }
}

exports.deleteUser = async (req, res) => {
  const userId = req.params.id

  if (!mongoose.Types.ObjectId.isValid(userId)) { return res.status(404).send('No user with that id') }

  try {
    await User.findByIdAndDelete(userId)

    res.status(200).json({
      status: 'success',
      message: 'User Deleted Successfully'
    })
  } catch (error) {
    res.status(500).json(error)
  }
}

// disable user account
exports.disableUser = async (req, res) => {
  const userId = req.params.id

  if (!mongoose.Types.ObjectId.isValid(userId)) { return res.status(404).send('No user with that id') }

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { isBlocked: true },
      { new: true }
    )

    res.status(200).json({
      status: 'success',
      message: 'User Account Disabled Successfully',
      data: user
    })
  } catch (error) {
    res.status(500).json(error)
  }
}

// enable user account
exports.enableUser = async (req, res) => {
  const userId = req.params.id

  if (!mongoose.Types.ObjectId.isValid(userId)) { return res.status(404).send('No user with that id') }

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { isBlocked: false },
      { new: true }
    )

    res.status(200).json({
      status: 'success',
      message: 'User Account Enabled Successfully',
      data: user
    })
  } catch (error) {
    res.status(500).json(error)
  }
}
