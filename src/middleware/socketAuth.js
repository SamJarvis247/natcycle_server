const jwt = require('jsonwebtoken');
const ThingsMatchUser = require('../models/thingsMatch/user.model');

const socketAuthMiddleware = async (socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication error: Token not provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    console.log("🚀 ~ socketAuthMiddleware ~ decoded:", decoded)
    if (decoded.accountType !== 'thingsmatch' || !decoded._id) {
      return next(new Error('Authentication error: Invalid token payload'));
    }


    const thingsMatchUser = await ThingsMatchUser.findById(decoded._id).populate('natcycleId', 'firstName lastName profilePicture');
    console.log("🚀 ~ socketAuthMiddleware ~ thingsMatchUser:", thingsMatchUser)

    if (!thingsMatchUser) {
      return next(new Error('Authentication error: User not found'));
    }

    socket.TMID = thingsMatchUser._id.toString();
    socket.thingsMatchUser = thingsMatchUser;
    next();
  } catch (err) {
    console.error("Socket authentication error:", err.message);
    return next(new Error('Authentication error: Invalid token'));
  }
};

module.exports = socketAuthMiddleware;
