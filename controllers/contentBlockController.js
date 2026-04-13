const ContentBlock = require('../models/contentBlockModel');
const ResponseFormatter = require('../utils/responseFormatter');
const logger = require('../config/logger');

/**
 * Create a content block
 * @route POST /api/content-blocks
 * @access Private (Admin)
 */
exports.createContentBlock = async (req, res) => {
  try {
    const { blockType, title, slug, description, content, displaySettings, seoSettings, category, tags } = req.body;

    if (!blockType || !title) {
      return ResponseFormatter.validationError(res, ['Block type and title are required']);
    }

    const contentBlock = await ContentBlock.create({
      blockType,
      title,
      slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
      description,
      content: content || {},
      displaySettings: displaySettings || {},
      seoSettings: seoSettings || {},
      category: category || 'general',
      tags: tags || [],
      createdBy: req.user.id,
    });

    logger.info(`Content block created: ${contentBlock._id}`);
    return ResponseFormatter.created(res, 'Content block created successfully', { contentBlock });
  } catch (error) {
    logger.error('Create content block error:', error);
    ResponseFormatter.serverError(res, 'Error creating content block', error.message);
  }
};

/**
 * Get all content blocks
 * @route GET /api/content-blocks
 * @access Public
 */
exports.getContentBlocks = async (req, res) => {
  try {
    const { blockType, category, skip = 0, limit = 20 } = req.query;
    const query = { isActive: true };

    if (blockType) query.blockType = blockType;
    if (category) query.category = category;

    const blocks = await ContentBlock.find(query)
      .populate('content.imageId', 'cloudinaryUrl altText')
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .sort({ 'displaySettings.order': 1 });

    const total = await ContentBlock.countDocuments(query);

    return ResponseFormatter.success(res, 'Content blocks retrieved', {
      blocks,
      pagination: {
        total,
        skip: parseInt(skip),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error('Get content blocks error:', error);
    ResponseFormatter.serverError(res, 'Error fetching content blocks', error.message);
  }
};

/**
 * Get content block by ID
 * @route GET /api/content-blocks/:id
 * @access Public
 */
exports.getContentBlockById = async (req, res) => {
  try {
    const block = await ContentBlock.findById(req.params.id)
      .populate('content.imageId')
      .populate('createdBy', 'name email');

    if (!block || !block.isActive) {
      return ResponseFormatter.notFound(res, 'Content block not found');
    }

    return ResponseFormatter.success(res, 'Content block retrieved', { block });
  } catch (error) {
    logger.error('Get content block by ID error:', error);
    ResponseFormatter.serverError(res, 'Error fetching content block', error.message);
  }
};

/**
 * Update content block
 * @route PUT /api/content-blocks/:id
 * @access Private (Admin)
 */
exports.updateContentBlock = async (req, res) => {
  try {
    const { title, description, content, displaySettings, seoSettings, tags } = req.body;

    const block = await ContentBlock.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        content,
        displaySettings,
        seoSettings,
        tags,
        updatedBy: req.user.id,
      },
      { new: true, runValidators: true }
    ).populate('content.imageId');

    if (!block) {
      return ResponseFormatter.notFound(res, 'Content block not found');
    }

    logger.info(`Content block updated: ${req.params.id}`);
    return ResponseFormatter.success(res, 'Content block updated successfully', { block });
  } catch (error) {
    logger.error('Update content block error:', error);
    ResponseFormatter.serverError(res, 'Error updating content block', error.message);
  }
};

/**
 * Delete content block
 * @route DELETE /api/content-blocks/:id
 * @access Private (Admin)
 */
exports.deleteContentBlock = async (req, res) => {
  try {
    const block = await ContentBlock.findByIdAndDelete(req.params.id);

    if (!block) {
      return ResponseFormatter.notFound(res, 'Content block not found');
    }

    logger.info(`Content block deleted: ${req.params.id}`);
    return ResponseFormatter.success(res, 'Content block deleted successfully');
  } catch (error) {
    logger.error('Delete content block error:', error);
    ResponseFormatter.serverError(res, 'Error deleting content block', error.message);
  }
};

/**
 * Get content blocks by slug
 * @route GET /api/content-blocks/slug/:slug
 * @access Public
 */
exports.getContentBlockBySlug = async (req, res) => {
  try {
    const block = await ContentBlock.findOne({ slug: req.params.slug, isActive: true })
      .populate('content.imageId');

    if (!block) {
      return ResponseFormatter.notFound(res, 'Content block not found');
    }

    return ResponseFormatter.success(res, 'Content block retrieved', { block });
  } catch (error) {
    logger.error('Get content block by slug error:', error);
    ResponseFormatter.serverError(res, 'Error fetching content block', error.message);
  }
};
