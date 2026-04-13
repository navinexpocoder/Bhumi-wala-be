const MediaAsset = require('../models/mediaAssetModel');
const { uploadImage, deleteImage, generateImageUrl } = require('../utils/imageUpload');
const ResponseFormatter = require('../utils/responseFormatter');
const logger = require('../config/logger');
const fs = require('fs');

/**
 * Upload media asset
 * @route POST /api/media/upload
 * @access Private (Admin/Moderator)
 */
exports.uploadMedia = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return ResponseFormatter.validationError(res, ['No file provided']);
    }

    const file = req.files.file;
    const { tag, altText, name, description } = req.body;

    // Validate file type
    const allowedTypes =
      process.env.ALLOWED_UPLOAD_TYPES?.split(',').map((t) => t.trim()).filter(Boolean) || [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
      ];
    if (!allowedTypes.includes(file.mimetype)) {
      return ResponseFormatter.validationError(res, ['File type not allowed']);
    }

    // Validate file size
    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10485760;
    if (file.size > maxSize) {
      return ResponseFormatter.validationError(res, ['File size exceeds maximum limit']);
    }

    // Read file from temp location (express-fileupload stores it on disk with useTempFiles: true)
    let fileBuffer;
    if (file.tempFilePath) {
      logger.info(`Reading file from temp path: ${file.tempFilePath}`);
      fileBuffer = fs.readFileSync(file.tempFilePath);
      logger.info(`File buffer size: ${fileBuffer.length} bytes`);
      
      if (fileBuffer.length === 0) {
        throw new Error('Temp file is empty - upload may have failed');
      }
    } else if (file.data) {
      logger.info('Using file.data (in-memory buffer)');
      fileBuffer = file.data;
    } else {
      throw new Error('No file data available');
    }

    // Validate buffer before uploading
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error('File buffer is empty');
    }

    logger.info(`Uploading file to Cloudinary: ${file.name} (${fileBuffer.length} bytes)`);
    
    // Upload to Cloudinary
    const uploadResult = await uploadImage(
      fileBuffer,
      `bhumi-website/${tag || 'other'}`,
      `${Date.now()}-${file.name.split('.')[0]}`
    );

    // Save metadata to database
    const mediaAsset = await MediaAsset.create({
      name: name || file.name,
      description: description || '',
      fileName: file.name,
      mimeType: file.mimetype,
      size: file.size,
      cloudinaryPublicId: uploadResult.public_id,
      cloudinaryUrl: uploadResult.secure_url,
      altText: altText || name || file.name,
      tag: tag || 'other',
      uploadedBy: req.user.id,
    });

    logger.info(`Media uploaded: ${uploadResult.public_id}`);

    // Clean up temp file
    if (file.tempFilePath) {
      fs.unlinkSync(file.tempFilePath);
    }

    return ResponseFormatter.created(res, 'Media uploaded successfully', {
      mediaAsset,
      url: uploadResult.secure_url,
      width: uploadResult.width,
      height: uploadResult.height,
    });
  } catch (error) {
    // Clean up temp file on error
    if (req.files?.file?.tempFilePath) {
      try {
        fs.unlinkSync(req.files.file.tempFilePath);
      } catch (cleanupError) {
        logger.warn('Failed to clean up temp file:', cleanupError);
      }
    }
    logger.error('Media upload error:', error);
    ResponseFormatter.serverError(res, 'Error uploading media', error.message);
  }
};

/**
 * Get all media assets
 * @route GET /api/media
 * @access Public
 */
exports.getMediaAssets = async (req, res) => {
  try {
    const { tag, skip = 0, limit = 20 } = req.query;
    const query = { isActive: true };

    if (tag) query.tag = tag;

    const mediaAssets = await MediaAsset.find(query)
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await MediaAsset.countDocuments(query);

    return ResponseFormatter.success(res, 'Media assets retrieved', {
      mediaAssets,
      pagination: {
        total,
        skip: parseInt(skip),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error('Get media error:', error);
    ResponseFormatter.serverError(res, 'Error fetching media assets', error.message);
  }
};

/**
 * Get media asset by ID
 * @route GET /api/media/:id
 * @access Public
 */
exports.getMediaAssetById = async (req, res) => {
  try {
    const mediaAsset = await MediaAsset.findById(req.params.id);

    if (!mediaAsset) {
      return ResponseFormatter.notFound(res, 'Media asset not found');
    }

    return ResponseFormatter.success(res, 'Media asset retrieved', { mediaAsset });
  } catch (error) {
    logger.error('Get media by ID error:', error);
    ResponseFormatter.serverError(res, 'Error fetching media asset', error.message);
  }
};

/**
 * Delete media asset
 * @route DELETE /api/media/:id
 * @access Private (Admin)
 */
exports.deleteMedia = async (req, res) => {
  try {
    const mediaAsset = await MediaAsset.findById(req.params.id);

    if (!mediaAsset) {
      return ResponseFormatter.notFound(res, 'Media asset not found');
    }

    // Delete from Cloudinary
    await deleteImage(mediaAsset.cloudinaryPublicId);

    // Delete from database
    await MediaAsset.findByIdAndDelete(req.params.id);

    logger.info(`Media deleted: ${mediaAsset.cloudinaryPublicId}`);

    return ResponseFormatter.success(res, 'Media asset deleted successfully');
  } catch (error) {
    logger.error('Delete media error:', error);
    ResponseFormatter.serverError(res, 'Error deleting media asset', error.message);
  }
};

/**
 * Update media asset metadata
 * @route PUT /api/media/:id
 * @access Private (Admin)
 */
exports.updateMedia = async (req, res) => {
  try {
    const { name, description, altText, tag } = req.body;

    const mediaAsset = await MediaAsset.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        altText,
        tag,
        updatedBy: req.user.id,
      },
      { new: true, runValidators: true }
    );

    if (!mediaAsset) {
      return ResponseFormatter.notFound(res, 'Media asset not found');
    }

    return ResponseFormatter.success(res, 'Media asset updated successfully', { mediaAsset });
  } catch (error) {
    logger.error('Update media error:', error);
    ResponseFormatter.serverError(res, 'Error updating media asset', error.message);
  }
};
