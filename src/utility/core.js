exports.removePassword = (user) => {
  const { password, ...otherDetails } = user._doc
  return otherDetails
}

exports.getServerBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.SERVER_BASE_URL
  } else {
    return 'http://localhost:5000'
  }
}

exports.generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000)
}
