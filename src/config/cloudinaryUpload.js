require('dotenv').config()
const cloudinary = require('cloudinary').v2

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

const options = {
  overwrite: true,
  invalidate: true,
  folder: 'natcycle'
}

exports.image = (image) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(image, options, (err, result) => {
      if (err) {
        console.log(err, "Error uploading image to Cloudinary")
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}

const videoOptions = {
  resource_type: 'video',
  overwrite: true,
  invalidate: true,
  folder: 'natcycle_videos'
}

exports.audio = (video) => {
  // must be base 64
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(video, videoOptions, (err, result) => {
      if (err) {
        console.log(err, "Error uploading audio to Cloudinary")
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}

exports.video = (video) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(video, videoOptions, (err, result) => {
      if (err) {
        console.log(err, "Error uploading video to Cloudinary")
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}

// delete image from cloudinary
exports.deleteImage = (publicId) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (err, result) => {
      if (err) {
        console.log(err)
        reject(err)
      } else {
        resolve(result)
      }
    }).then(r => console.log(r))
  })
}
