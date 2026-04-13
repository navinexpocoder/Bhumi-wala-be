const PropertyCard = require('../models/propertyCardModel');
const PropertyPreview = require('../models/propertyPreviewModel');

// @desc    Create a property card (usually generated from PropertyPreview)
// @route   POST /api/property-card
// @access  Private (Admin, System)
exports.createPropertyCard = async (req, res) => {
  try {
    const card = await PropertyCard.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Property card created successfully',
      data: card,
    });
  } catch (error) {
    console.error('Create property card error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error creating property card',
    });
  }
};

// @desc    Get all property cards with filters
// @route   GET /api/property-card
// @access  Public
exports.getPropertyCards = async (req, res) => {
  try {
    const {
      propertyType,
      listingType,
      city,
      locality,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      tags,
      sort = '-createdAt',
      page = 1,
      limit = 20,
    } = req.query;

    const query = { isActive: true, approvalStatus: 'approved' };

    // Filters
    if (propertyType) query.propertyType = propertyType;
    if (listingType) query.listingType = listingType;
    if (city) query.city = { $regex: city, $options: 'i' };
    if (locality) query.locality = { $regex: locality, $options: 'i' };

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    if (minArea || maxArea) {
      query.area = {};
      if (minArea) query.area.$gte = parseFloat(minArea);
      if (maxArea) query.area.$lte = parseFloat(maxArea);
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const cards = await PropertyCard.find(query)
      .select(
        'title propertyType listingType city locality price area coverImage tags amenitiesHighlight dealerName dealerType postedTime isFavorite imagesCount'
      )
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);

    const total = await PropertyCard.countDocuments(query);

    res.status(200).json({
      success: true,
      count: cards.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: cards,
    });
  } catch (error) {
    console.error('Get property cards error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching property cards',
    });
  }
};

// @desc    Get single property card
// @route   GET /api/property-card/:id
// @access  Public
exports.getPropertyCardById = async (req, res) => {
  try {
    const card = await PropertyCard.findById(req.params.id);

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Property card not found',
      });
    }

    // Increment clicks if action = click
    if (req.query.action === 'click') {
      card.engagement.clicks += 1;
      await card.save();
    }

    res.status(200).json({
      success: true,
      data: card,
    });
  } catch (error) {
    console.error('Get property card error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching property card',
    });
  }
};

// @desc    Update property card
// @route   PUT /api/property-card/:id
// @access  Private (Admin, Owner)
exports.updatePropertyCard = async (req, res) => {
  try {
    const card = await PropertyCard.findById(req.params.id);

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Property card not found',
      });
    }

    Object.assign(card, req.body);
    await card.save();

    res.status(200).json({
      success: true,
      message: 'Property card updated successfully',
      data: card,
    });
  } catch (error) {
    console.error('Update property card error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error updating property card',
    });
  }
};

// @desc    Delete property card
// @route   DELETE /api/property-card/:id
// @access  Private (Admin)
exports.deletePropertyCard = async (req, res) => {
  try {
    const card = await PropertyCard.findByIdAndDelete(req.params.id);

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Property card not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Property card deleted successfully',
    });
  } catch (error) {
    console.error('Delete property card error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting property card',
    });
  }
};

// @desc    Get featured property cards
// @route   GET /api/property-card/featured
// @access  Public
exports.getFeaturedCards = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const cards = await PropertyCard.find({
      isActive: true,
      approvalStatus: 'approved',
      tags: 'Featured',
    })
      .select('title propertyType city price coverImage tags amenitiesHighlight dealerName postedTime')
      .sort('-createdAt')
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: cards.length,
      data: cards,
    });
  } catch (error) {
    console.error('Get featured cards error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured cards',
    });
  }
};

// @desc    Get new property cards (recently posted)
// @route   GET /api/property-card/new
// @access  Public
exports.getNewCards = async (req, res) => {
  try {
    const { limit = 10, days = 7 } = req.query;

    const dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - parseInt(days));

    const cards = await PropertyCard.find({
      isActive: true,
      approvalStatus: 'approved',
      createdAt: { $gte: dateFilter },
    })
      .select('title propertyType city price coverImage tags amenitiesHighlight dealerName postedTime')
      .sort('-createdAt')
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: cards.length,
      data: cards,
    });
  } catch (error) {
    console.error('Get new cards error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching new cards',
    });
  }
};

// @desc    Get hot deals
// @route   GET /api/property-card/hot-deals
// @access  Public
exports.getHotDeals = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const cards = await PropertyCard.find({
      isActive: true,
      approvalStatus: 'approved',
      tags: 'Hot Deal',
    })
      .select('title propertyType city price coverImage tags amenitiesHighlight dealerName postedTime')
      .sort('-engagement.clicks')
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: cards.length,
      data: cards,
    });
  } catch (error) {
    console.error('Get hot deals error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hot deals',
    });
  }
};

// @desc    Search property cards
// @route   POST /api/property-card/search
// @access  Public
exports.searchPropertyCards = async (req, res) => {
  try {
    const {
      query,
      propertyType,
      listingType,
      minPrice,
      maxPrice,
      page = 1,
      limit = 20,
    } = req.body;

    const searchQuery = { isActive: true, approvalStatus: 'approved' };

    if (query) {
      searchQuery.$or = [
        { title: { $regex: query, $options: 'i' } },
        { shortDescription: { $regex: query, $options: 'i' } },
        { locality: { $regex: query, $options: 'i' } },
        { city: { $regex: query, $options: 'i' } },
      ];
    }

    if (propertyType) searchQuery.propertyType = propertyType;
    if (listingType) searchQuery.listingType = listingType;

    if (minPrice || maxPrice) {
      searchQuery.price = {};
      if (minPrice) searchQuery.price.$gte = parseFloat(minPrice);
      if (maxPrice) searchQuery.price.$lte = parseFloat(maxPrice);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const cards = await PropertyCard.find(searchQuery)
      .select('title propertyType city price coverImage tags dealerName postedTime')
      .limit(parseInt(limit))
      .skip(skip)
      .sort('-createdAt');

    const total = await PropertyCard.countDocuments(searchQuery);

    res.status(200).json({
      success: true,
      count: cards.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: cards,
    });
  } catch (error) {
    console.error('Search property cards error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching property cards',
    });
  }
};

// @desc    Toggle favorite status
// @route   POST /api/property-card/:id/favorite
// @access  Public
exports.toggleFavorite = async (req, res) => {
  try {
    const card = await PropertyCard.findById(req.params.id);

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Property card not found',
      });
    }

    card.isFavorite = !card.isFavorite;
    if (!card.isFavorite) {
      card.engagement.saves = Math.max(0, card.engagement.saves - 1);
    } else {
      card.engagement.saves += 1;
    }

    await card.save();

    res.status(200).json({
      success: true,
      message: card.isFavorite ? 'Added to favorites' : 'Removed from favorites',
      data: {
        isFavorite: card.isFavorite,
        saves: card.engagement.saves,
      },
    });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling favorite',
    });
  }
};

// @desc    Record card engagement (view, save, share)
// @route   POST /api/property-card/:id/engagement/:action
// @access  Public
exports.recordCardEngagement = async (req, res) => {
  try {
    const { id, action } = req.params;
    const card = await PropertyCard.findById(id);

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Property card not found',
      });
    }

    if (action === 'click') {
      card.engagement.clicks += 1;
    } else if (action === 'save') {
      card.engagement.saves += 1;
    } else if (action === 'share') {
      card.engagement.shares += 1;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action',
      });
    }

    await card.save();

    res.status(200).json({
      success: true,
      message: `Engagement recorded - ${action}`,
      data: card.engagement,
    });
  } catch (error) {
    console.error('Record engagement error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording engagement',
    });
  }
};

// @desc    Mark card as seen
// @route   POST /api/property-card/:id/seen
// @access  Public
exports.markCardAsSeen = async (req, res) => {
  try {
    const card = await PropertyCard.findById(req.params.id);

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Property card not found',
      });
    }

    card.isSeen = true;
    await card.save();

    res.status(200).json({
      success: true,
      message: 'Card marked as seen',
      data: { isSeen: card.isSeen },
    });
  } catch (error) {
    console.error('Mark as seen error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking card as seen',
    });
  }
};

// @desc    Get trending property cards
// @route   GET /api/property-card/trending
// @access  Public
exports.getTrendingCards = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const cards = await PropertyCard.find({
      isActive: true,
      approvalStatus: 'approved',
    })
      .select('title propertyType city price coverImage tags dealerName engagement')
      .sort('-engagement.clicks')
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: cards.length,
      data: cards,
    });
  } catch (error) {
    console.error('Get trending cards error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trending cards',
    });
  }
};
