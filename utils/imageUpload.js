const cloudinary = require('../config/cloudinary');
const logger = require('../config/logger');

/**
 * Upload image to Cloudinary
 * @param {Buffer} fileBuffer - Image file buffer
 * @param {String} folder - Cloudinary folder path
 * @param {String} publicId - Public ID for the image
 * @returns {Promise<Object>} Upload result with URL and metadata
 */
const uploadImage = async (fileBuffer, folder, publicId) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'auto',
        quality: 'auto',
        fetch_format: 'auto',
        transformation: [
          { width: 1200, height: 800, crop: 'fill', gravity: 'auto' },
          { quality: 'auto' },
          { fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete image from Cloudinary
 * @param {String} publicId - Public ID of the image
 * @returns {Promise<Object>} Delete result
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    logger.info(`Image deleted: ${publicId}`);
    return result;
  } catch (error) {
    logger.error('Cloudinary delete error:', error);
    throw error;
  }
};

/**
 * Generate Cloudinary URL with transformations
 * @param {String} publicId - Public ID of the image
 * @param {Object} options - Transformation options
 * @returns {String} Cloudinary URL
 */
const generateImageUrl = (publicId, options = {}) => {
  const defaultOptions = {
    width: 400,
    height: 300,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    fetch_format: 'auto',
  };

  const finalOptions = { ...defaultOptions, ...options };

  return cloudinary.url(publicId, finalOptions);
};

module.exports = {
  uploadImage,
  deleteImage,
  generateImageUrl,
};
