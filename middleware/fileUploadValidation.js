const logger = require('../config/logger');

/**
 * Middleware to validate uploaded files
 * Checks: file exists, file type, file size
 */
const validateFileUpload = (req, res, next) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided',
      });
    }

    const file = req.files.file;
    const allowedTypes = (process.env.ALLOWED_UPLOAD_TYPES || '').split(',');
    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10485760;

    // Validate file type
    if (!allowedTypes.includes(file.mimetype)) {
      logger.warn(`Invalid file type attempted: ${file.mimetype}`);
      return res.status(400).json({
        success: false,
        message: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      });
    }

    // Validate file size
    if (file.size > maxSize) {
      logger.warn(`File size exceeds limit: ${file.size}`);
      return res.status(400).json({
        success: false,
        message: `File size exceeds maximum limit of ${maxSize / 1024 / 1024}MB`,
      });
    }

    // Validate file extension
    const ext = file.name.split('.').pop().toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    if (!allowedExtensions.includes(ext)) {
      return res.status(400).json({
        success: false,
        message: `File extension not allowed. Allowed: ${allowedExtensions.join(', ')}`,
      });
    }

    logger.info(`File validation passed: ${file.name} (${file.size} bytes)`);
    next();
  } catch (error) {
    logger.error('File validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating file',
    });
  }
};

/**
 * Sanitize uploaded file name
 * Removes special characters and spaces
 */
const sanitizeFileName = (fileName) => {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

/**
 * Generate unique public ID for Cloudinary
 */
const generateCloudinaryPublicId = (fileName, folder) => {
  const sanitized = sanitizeFileName(fileName.split('.')[0]);
  const timestamp = Date.now();
  return `${folder}/${timestamp}-${sanitized}`;
};

module.exports = {
  validateFileUpload,
  sanitizeFileName,
  generateCloudinaryPublicId,
};
