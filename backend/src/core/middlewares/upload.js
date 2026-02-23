
const multer = require('multer');
const path = require('path');
const { uploadToCloudinary } = require('../config/cloudinary');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPEG, and PNG are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, 
  },
});


const uploadToCloud = (folder = 'vendocare') => {
  return async (req, res, next) => {
    if (!req.file) {
      return next();
    }
    try {
      const result = await uploadToCloudinary(req.file.buffer, folder);
      req.fileUrl = result.url;
      req.filePublicId = result.publicId;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { upload, uploadToCloud };
