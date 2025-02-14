const multer = require('multer')

const upload = multer({
  storage: multer.diskStorage({}),
  limits: {
    fileSize: 1024 * 1024 * 5
  }
})

module.exports = upload
