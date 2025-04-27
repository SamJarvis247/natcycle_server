const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { generateOtp } = require("../utility/core");
const {
  sendEmailConfirmationOtp,
  sendWelcomeEmail,
} = require("../service/emailService");
const crypto = require("crypto");
const awardReferralPoints = require("../service/pointService");
// Register
exports.register = async (req, res) => {
  try {
    console.log(req.body);
    const emailExists = await User.findOne({ email: req.body.email });
    if (emailExists) return res.status(400).send("Email already exists");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const newReferralId = crypto.randomBytes(3).toString("hex").toUpperCase();

    let referredBy;

    if (req.body.referralId) {
      referredBy = await User.findOne({ referralId: req.body.referralId });

      console.log("____referredBy____", referredBy);

      if (!referredBy) {
        return res.status(400).json({
          status: false,
          message: "Invalid referral code",
        });
      }
    }

    const otp = generateOtp();

    console.log("____otp____", otp);

    // Create a new user
    const user = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: hashedPassword,
      isEmailVerified: false,
      referralId: newReferralId,
      otp,
    });

    console.log("____referredBy____", referredBy);

    if (referredBy) {
      user.referredBy = referredBy._id;
      await awardReferralPoints(referredBy);
    }

    await user.save();

    // await sendWelcomeEmail(user.email, user.firstName)

    // await sendEmailConfirmationOtp(user.email, User.firstName, user.otp)

    const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET);

    return res.status(200).json({
      message: "User registered successfully",
      token,
    });
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
};

// Login
exports.login = async (req, res) => {
  // Check if email exists
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).send("Email does not exist");

  // remove password from user object
  const { password, ...otherDetails } = user._doc;

  // Check if password is correct
  const validPass = await bcrypt.compare(req.body.password, user.password);
  if (!validPass) return res.status(400).send("Incorrect password");

  // Create and assign a token
  const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET);

  res
    .cookie("natcycle", token, {
      maxAge: 50000 * 60 * 24,
      // httpOnly: true,
      sameSite: "lax",
      // secure: true
    })
    .status(200)
    .json({
      message: "Logged in successfully",
      token,
      user: otherDetails,
      status: 200,
    });
};

// receive otp and verify
exports.verifyEmail = async (req, res) => {
  const { otp } = req.body;

  if (!otp) {
    return res.status(400).json({
      status: false,
      message: "Email and OTP are required",
    });
  }

  const user = req.user;

  if (user.isEmailVerified) {
    return res.status(400).json({
      status: false,
      message: "Email has already been verified",
    });
  }

  if (!user.otp) {
    return res.status(400).json({
      status: false,
      message: "OTP has not been generated",
    });
  }

  if (user.otp !== otp) {
    return res.status(400).json({
      status: false,
      message: "Invalid OTP",
    });
  }

  try {
    const updatedUser = await User.findOneAndUpdate(
      user._id,
      { isEmailVerified: true, otp: "" },
      { new: true }
    );

    res.status(200).json({
      status: true,
      data: updatedUser,
      message: "Email verified successfully",
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "Email could not be verified",
    });
  }
};

// resend otp
exports.resendOtp = async (req, res) => {
  const user = req.user;

  if (user.isEmailVerified) {
    return res.status(400).json({
      status: false,
      message: "Email has already been verified",
    });
  }

  const otp = generateOtp();

  console.log("____otp____", otp);

  try {
    await User.findOneAndUpdate({ _id: user._id }, { otp }, { new: true });

    await sendEmailConfirmationOtp(user.email, user.firstName, otp);

    res.status(200).json({
      status: true,
      message: "OTP sent successfully",
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "OTP could not be sent",
    });
  }
};

// Logout
exports.logout = async (req, res) => {
  res.clearCookie("natcycle");
  res.cookie("natcycle", "", {
    maxAge: "1",
    expires: new Date(Date.now() - 86400),
  });
  res.status(200).json({
    message: "Logged out successfully",
  });
};

// change password with old password and new password
exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({
      status: false,
      message: "Old password and new password are required",
    });
  }

  const user = await User.findOne({ _id: req.user._id });
  if (!user) {
    return res.status(400).json({
      status: false,
      message: "User does not exist",
    });
  }

  const isValid = await bcrypt.compare(oldPassword, user.password);
  if (!isValid) {
    return res.status(400).json({
      status: false,
      message: "Invalid old password",
    });
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(newPassword, salt);

  try {
    await User.findOneAndUpdate(
      { _id: user._id },
      { password: hash },
      { new: true }
    );

    res.status(200).json({
      status: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "Password could not be changed",
    });
  }
};

// reset password
// initiate password reset using otp
exports.initiatePasswordReset = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      status: false,
      message: "Email is required",
    });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({
      status: false,
      message: "User does not exist",
    });
  }

  const otp = generateOtp();

  console.log("____otp____", otp);

  try {
    await User.findOneAndUpdate({ _id: user._id }, { otp }, { new: true });

    await sendEmailConfirmationOtp(user.email, user.firstName, otp);

    res.status(200).json({
      status: true,
      message: "OTP sent successfully",
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "OTP could not be sent",
    });
  }
};

exports.resetPassword = async (req, res) => {
  // get otp and new password  and email
  const { otp, newPassword, email } = req.body;

  if (!otp || !newPassword || !email) {
    return res.status(400).json({
      status: false,
      message: "OTP, email and new password are required",
    });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({
      status: false,
      message: "User does not exist",
    });
  }

  if (!user.otp) {
    return res.status(400).json({
      status: false,
      message: "OTP has not been generated",
    });
  }

  if (user.otp !== otp) {
    return res.status(400).json({
      status: false,
      message: "Invalid OTP",
    });
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(newPassword, salt);

  try {
    await User.findOneAndUpdate(
      { _id: user._id },
      { password: hash, otp: "" },
      { new: true }
    );

    res.status(200).json({
      status: true,
      message: "Password reset successfully",
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "Password could not be reset",
    });
  }
};
