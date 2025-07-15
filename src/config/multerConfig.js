const multer = require('multer')

const upload = multer({
  storage: multer.diskStorage({}),
  limits: {
    fileSize: 1024 * 1024 * 15  // Increased to 15MB to accommodate video files
  },
  fileFilter: (req, file, callback) => {
    // Accept images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      callback(null, true);
    } else {
      callback(new Error('Only image and video files are allowed'));
    }
  }
})

module.exports = upload
