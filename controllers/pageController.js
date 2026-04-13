const Page = require('../models/pageModel');
const ContentBlock = require('../models/contentBlockModel');
const ResponseFormatter = require('../utils/responseFormatter');
const logger = require('../config/logger');

/**
 * Create a page
 * @route POST /api/pages
 * @access Private (Admin)
 */
exports.createPage = async (req, res) => {
  try {
    const { pageName, pageType, description, heroSection, contentBlocks, seoSettings, layoutConfig } = req.body;

    if (!pageName) {
      return ResponseFormatter.validationError(res, ['Page name is required']);
    }

    const page = await Page.create({
      pageName,
      pageType: pageType || 'custom',
      description,
      heroSection: heroSection || {},
      contentBlocks: contentBlocks || [],
      seoSettings: seoSettings || {},
      layoutConfig: layoutConfig || {},
      createdBy: req.user.id,
      publishStatus: 'draft',
    });

    logger.info(`Page created: ${page._id}`);
    return ResponseFormatter.created(res, 'Page created successfully', { page });
  } catch (error) {
    logger.error('Create page error:', error);
    ResponseFormatter.serverError(res, 'Error creating page', error.message);
  }
};

/**
 * Get all pages
 * @route GET /api/pages
 * @access Public (filters by publishStatus)
 */
exports.getPages = async (req, res) => {
  try {
    const { pageType, status = 'published', skip = 0, limit = 20 } = req.query;
    const query = { publishStatus: status };

    if (pageType) query.pageType = pageType;

    const pages = await Page.find(query)
      .populate('contentBlocks.blockId')
      .populate('heroSection.backgroundImageId', 'cloudinaryUrl altText')
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Page.countDocuments(query);

    return ResponseFormatter.success(res, 'Pages retrieved', {
      pages,
      pagination: {
        total,
        skip: parseInt(skip),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error('Get pages error:', error);
    ResponseFormatter.serverError(res, 'Error fetching pages', error.message);
  }
};

/**
 * Get page by slug
 * @route GET /api/pages/slug/:slug
 * @access Public
 */
exports.getPageBySlug = async (req, res) => {
  try {
    const page = await Page.findOne({ slug: req.params.slug, publishStatus: 'published' })
      .populate({
        path: 'contentBlocks.blockId',
        select: 'blockType title content displaySettings',
      })
      .populate('heroSection.backgroundImageId', 'cloudinaryUrl altText');

    if (!page) {
      return ResponseFormatter.notFound(res, 'Page not found');
    }

    // Increment view count
    page.viewCount += 1;
    await page.save();

    return ResponseFormatter.success(res, 'Page retrieved', { page });
  } catch (error) {
    logger.error('Get page by slug error:', error);
    ResponseFormatter.serverError(res, 'Error fetching page', error.message);
  }
};

/**
 * Get page by ID
 * @route GET /api/pages/:id
 * @access Private (Admin - for editing)
 */
exports.getPageById = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id)
      .populate({
        path: 'contentBlocks.blockId',
      })
      .populate('heroSection.backgroundImageId')
      .populate('createdBy', 'name email');

    if (!page) {
      return ResponseFormatter.notFound(res, 'Page not found');
    }

    return ResponseFormatter.success(res, 'Page retrieved', { page });
  } catch (error) {
    logger.error('Get page by ID error:', error);
    ResponseFormatter.serverError(res, 'Error fetching page', error.message);
  }
};

/**
 * Update page
 * @route PUT /api/pages/:id
 * @access Private (Admin)
 */
exports.updatePage = async (req, res) => {
  try {
    const { description, heroSection, contentBlocks, seoSettings, layoutConfig, tags } = req.body;

    const page = await Page.findByIdAndUpdate(
      req.params.id,
      {
        description,
        heroSection,
        contentBlocks,
        seoSettings,
        layoutConfig,
        tags,
        updatedBy: req.user.id,
      },
      { new: true, runValidators: true }
    ).populate('contentBlocks.blockId');

    if (!page) {
      return ResponseFormatter.notFound(res, 'Page not found');
    }

    logger.info(`Page updated: ${req.params.id}`);
    return ResponseFormatter.success(res, 'Page updated successfully', { page });
  } catch (error) {
    logger.error('Update page error:', error);
    ResponseFormatter.serverError(res, 'Error updating page', error.message);
  }
};

/**
 * Publish page
 * @route PATCH /api/pages/:id/publish
 * @access Private (Admin)
 */
exports.publishPage = async (req, res) => {
  try {
    const page = await Page.findByIdAndUpdate(
      req.params.id,
      {
        publishStatus: 'published',
        updatedBy: req.user.id,
      },
      { new: true }
    );

    if (!page) {
      return ResponseFormatter.notFound(res, 'Page not found');
    }

    logger.info(`Page published: ${req.params.id}`);
    return ResponseFormatter.success(res, 'Page published successfully', { page });
  } catch (error) {
    logger.error('Publish page error:', error);
    ResponseFormatter.serverError(res, 'Error publishing page', error.message);
  }
};

/**
 * Delete page
 * @route DELETE /api/pages/:id
 * @access Private (Admin)
 */
exports.deletePage = async (req, res) => {
  try {
    const page = await Page.findByIdAndDelete(req.params.id);

    if (!page) {
      return ResponseFormatter.notFound(res, 'Page not found');
    }

    logger.info(`Page deleted: ${req.params.id}`);
    return ResponseFormatter.success(res, 'Page deleted successfully');
  } catch (error) {
    logger.error('Delete page error:', error);
    ResponseFormatter.serverError(res, 'Error deleting page', error.message);
  }
};

/**
 * Add content block to page
 * @route POST /api/pages/:id/blocks
 * @access Private (Admin)
 */
exports.addContentBlockToPage = async (req, res) => {
  try {
    const { blockId, order } = req.body;

    if (!blockId) {
      return ResponseFormatter.validationError(res, ['Block ID is required']);
    }

    // Verify block exists
    const block = await ContentBlock.findById(blockId);
    if (!block) {
      return ResponseFormatter.notFound(res, 'Content block not found');
    }

    const page = await Page.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          contentBlocks: {
            blockId,
            order: order || page.contentBlocks.length,
          },
        },
      },
      { new: true }
    ).populate('contentBlocks.blockId');

    if (!page) {
      return ResponseFormatter.notFound(res, 'Page not found');
    }

    logger.info(`Content block added to page: ${req.params.id}`);
    return ResponseFormatter.success(res, 'Content block added to page', { page });
  } catch (error) {
    logger.error('Add block to page error:', error);
    ResponseFormatter.serverError(res, 'Error adding content block', error.message);
  }
};
