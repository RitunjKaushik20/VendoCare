// Cloudinary Configuration
const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('Cloudinary configured:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'set' : 'not set',
  api_key: process.env.CLOUDINARY_API_KEY ? 'set' : 'not set',
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'set' : 'not set',
});

const uploadConfig = {
  folder: 'vendocare',
  resource_type: 'auto',
  allowed_formats: ['pdf', 'jpg', 'jpeg', 'png'],
  max_file_size: 10000000, 
  
};

const uploadToCloudinary = async (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const mimeType = options.mimeType || 'application/pdf'
    const dataUrl = `data:${mimeType};base64,${fileBuffer.toString('base64')}`
    
    const isPdf = mimeType === 'application/pdf'
    const resourceType = isPdf ? 'raw' : 'auto'
    
    const uploadOptions = {
      folder: options.folder || 'vendocare',
      resource_type: resourceType,
      timeout: 60000,
      access_mode: 'public'
    };
    
    cloudinary.uploader.upload(
      dataUrl,
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error)
          reject(error)
        } else {
          console.log('Cloudinary upload success:', result.secure_url)
          resolve(result)
        }
      }
    )
  })
};

const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

module.exports = { cloudinary, uploadConfig, uploadToCloudinary, deleteFromCloudinary };
