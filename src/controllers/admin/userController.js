const User = require('../../models/userModel')
const mongoose = require('mongoose')
// admin endpoint to get all users\

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('firstName lastName email phone location')
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

// admin update user.account with savings, checkings, number
exports.updateUserAccount = async (req, res) => {
  const userId = req.params.id

  const { savings, checking, number } = req.body

  if (!mongoose.Types.ObjectId.isValid(userId)) { return res.status(404).send('No user with that id') }

  try {
    const user = await User.findById(userId)

    user.account = {
      number: number || user.account.number,
      savings: savings || user.account.savings,
      checking: checking || user.account.checking
    }

    await user.save()

    res.status(200).json({
      status: 'success',
      message: 'User Account Updated Successfully',
      data: user
    })
  } catch (error) {
    res.status(500).json(error)
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
