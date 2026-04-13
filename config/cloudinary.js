const cloudinary = require('cloudinary').v2;
const logger = require('./logger');

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const hasCloudinaryConfig = Boolean(cloudName && apiKey && apiSecret);

if (hasCloudinaryConfig) {
  // Configure Cloudinary only when all required env vars are present.
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  // Verify Cloudinary connection on startup.
  cloudinary.api.resources({ max_results: 1 })
    .then(() => {
      logger.info('✅ Cloudinary connected successfully');
    })
    .catch((err) => {
      logger.error('❌ Cloudinary connection failed:', err);
    });
} else {
  logger.warn('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to enable media uploads.');
}

module.exports = cloudinary;
