const User = require('../models/userModel')
const cloudinaryUpload = require('../config/cloudinaryUpload')

const { successResponse, errorResponse } = require('../utility/response')

// update the user's profile
exports.updateProfile = async (req, res) => {
  const updated = await User.findByIdAndUpdate(
    req.user._id,
    {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email
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
