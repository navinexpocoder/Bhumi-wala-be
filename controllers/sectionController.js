const Section = require('../models/sectionModel');
const ResponseFormatter = require('../utils/responseFormatter');
const logger = require('../config/logger');

/**
 * Create a section
 * @route POST /api/sections
 * @access Private (Admin)
 */
exports.createSection = async (req, res) => {
  try {
    const { sectionName, sectionType, content, styling, displaySettings, isReusable, tags } = req.body;

    if (!sectionName || !sectionType) {
      return ResponseFormatter.validationError(res, ['Section name and type are required']);
    }

    const section = await Section.create({
      sectionName,
      slug: sectionName.toLowerCase().replace(/\s+/g, '-'),
      sectionType,
      content: content || {},
      styling: styling || {},
      displaySettings: displaySettings || {},
      isReusable: isReusable !== undefined ? isReusable : true,
      tags: tags || [],
      createdBy: req.user.id,
    });

    logger.info(`Section created: ${section._id}`);
    return ResponseFormatter.created(res, 'Section created successfully', { section });
  } catch (error) {
    logger.error('Create section error:', error);
    ResponseFormatter.serverError(res, 'Error creating section', error.message);
  }
};

/**
 * Get all sections
 * @route GET /api/sections
 * @access Public
 */
exports.getSections = async (req, res) => {
  try {
    const { sectionType, isReusable, skip = 0, limit = 20 } = req.query;
    const query = { isActive: true };

    if (sectionType) query.sectionType = sectionType;
    if (isReusable !== undefined) query.isReusable = isReusable === 'true';

    const sections = await Section.find(query)
      .populate('content.images.imageId', 'cloudinaryUrl altText')
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .sort({ 'displaySettings.order': 1 });

    const total = await Section.countDocuments(query);

    return ResponseFormatter.success(res, 'Sections retrieved', {
      sections,
      pagination: {
        total,
        skip: parseInt(skip),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error('Get sections error:', error);
    ResponseFormatter.serverError(res, 'Error fetching sections', error.message);
  }
};

/**
 * Get section by ID
 * @route GET /api/sections/:id
 * @access Public
 */
exports.getSectionById = async (req, res) => {
  try {
    const section = await Section.findById(req.params.id)
      .populate('content.images.imageId')
      .populate('createdBy', 'name email');

    if (!section || !section.isActive) {
      return ResponseFormatter.notFound(res, 'Section not found');
    }

    return ResponseFormatter.success(res, 'Section retrieved', { section });
  } catch (error) {
    logger.error('Get section by ID error:', error);
    ResponseFormatter.serverError(res, 'Error fetching section', error.message);
  }
};

/**
 * Get section by slug
 * @route GET /api/sections/slug/:slug
 * @access Public
 */
exports.getSectionBySlug = async (req, res) => {
  try {
    const section = await Section.findOne({ slug: req.params.slug, isActive: true })
      .populate('content.images.imageId');

    if (!section) {
      return ResponseFormatter.notFound(res, 'Section not found');
    }

    return ResponseFormatter.success(res, 'Section retrieved', { section });
  } catch (error) {
    logger.error('Get section by slug error:', error);
    ResponseFormatter.serverError(res, 'Error fetching section', error.message);
  }
};

/**
 * Update section
 * @route PUT /api/sections/:id
 * @access Private (Admin)
 */
exports.updateSection = async (req, res) => {
  try {
    const { sectionName, content, styling, displaySettings, tags, isReusable } = req.body;

    const section = await Section.findByIdAndUpdate(
      req.params.id,
      {
        sectionName,
        content,
        styling,
        displaySettings,
        tags,
        isReusable,
        updatedBy: req.user.id,
      },
      { new: true, runValidators: true }
    ).populate('content.images.imageId');

    if (!section) {
      return ResponseFormatter.notFound(res, 'Section not found');
    }

    logger.info(`Section updated: ${req.params.id}`);
    return ResponseFormatter.success(res, 'Section updated successfully', { section });
  } catch (error) {
    logger.error('Update section error:', error);
    ResponseFormatter.serverError(res, 'Error updating section', error.message);
  }
};

/**
 * Delete section
 * @route DELETE /api/sections/:id
 * @access Private (Admin)
 */
exports.deleteSection = async (req, res) => {
  try {
    const section = await Section.findByIdAndDelete(req.params.id);

    if (!section) {
      return ResponseFormatter.notFound(res, 'Section not found');
    }

    logger.info(`Section deleted: ${req.params.id}`);
    return ResponseFormatter.success(res, 'Section deleted successfully');
  } catch (error) {
    logger.error('Delete section error:', error);
    ResponseFormatter.serverError(res, 'Error deleting section', error.message);
  }
};

/**
 * Get reusable sections only
 * @route GET /api/sections/reusable
 * @access Public
 */
exports.getReusableSections = async (req, res) => {
  try {
    const sections = await Section.find({ isReusable: true, isActive: true })
      .populate('content.images.imageId')
      .sort({ 'displaySettings.order': 1 });

    return ResponseFormatter.success(res, 'Reusable sections retrieved', { sections });
  } catch (error) {
    logger.error('Get reusable sections error:', error);
    ResponseFormatter.serverError(res, 'Error fetching reusable sections', error.message);
  }
};
