const PropertyPreview = require('../models/propertyPreviewModel');

// @desc    Create a new property preview
// @route   POST /api/property-preview
// @access  Private (Seller, Agent, Admin)
exports.createPropertyPreview = async (req, res) => {
  try {
    const propertyData = {
      ...req.body,
      dealer: {
        ...req.body.dealer,
        dealerId: req.user?.id || null,
      },
    };

    const property = await PropertyPreview.create(propertyData);

    res.status(201).json({
      success: true,
      message: 'Property preview created successfully',
      data: property,
    });
  } catch (error) {
    console.error('Create property preview error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error creating property preview',
      errors: error.errors || {},
    });
  }
};

// @desc    Get all property previews with filters
// @route   GET /api/property-preview
// @access  Public
exports.getPropertyPreviews = async (req, res) => {
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
      featured,
      verified,
      sort = '-createdAt',
      page = 1,
      limit = 10,
    } = req.query;

    const query = { 'status.isActive': true, 'status.approvalStatus': 'approved' };

    // Filters
    if (propertyType) query.propertyType = propertyType;
    if (listingType) query.listingType = listingType;
    if (city) query['location.city'] = { $regex: city, $options: 'i' };
    if (locality) query['location.locality'] = { $regex: locality, $options: 'i' };

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    if (minArea || maxArea) {
      query.landSize = {};
      if (minArea) query.landSize.$gte = parseFloat(minArea);
      if (maxArea) query.landSize.$lte = parseFloat(maxArea);
    }

    if (featured === 'true') query['status.featured'] = true;
    if (verified === 'true') query['status.verified'] = true;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const properties = await PropertyPreview.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);

    const total = await PropertyPreview.countDocuments(query);

    res.status(200).json({
      success: true,
      count: properties.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: properties,
    });
  } catch (error) {
    console.error('Get property previews error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching property previews',
    });
  }
};

// @desc    Get single property preview by ID
// @route   GET /api/property-preview/:id
// @access  Public
exports.getPropertyPreviewById = async (req, res) => {
  try {
    const property = await PropertyPreview.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property preview not found',
      });
    }

    // Increment views
    property.analytics.views += 1;
    await property.save();

    res.status(200).json({
      success: true,
      data: property,
    });
  } catch (error) {
    console.error('Get property preview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching property preview',
    });
  }
};

// @desc    Update property preview
// @route   PUT /api/property-preview/:id
// @access  Private (Owner, Admin)
exports.updatePropertyPreview = async (req, res) => {
  try {
    const property = await PropertyPreview.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property preview not found',
      });
    }

    // Check authorization
    if (
      req.user?.id !== property.dealer.dealerId?.toString() &&
      req.user?.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this property',
      });
    }

    Object.assign(property, req.body);
    await property.save();

    res.status(200).json({
      success: true,
      message: 'Property preview updated successfully',
      data: property,
    });
  } catch (error) {
    console.error('Update property preview error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error updating property preview',
    });
  }
};

// @desc    Delete property preview
// @route   DELETE /api/property-preview/:id
// @access  Private (Owner, Admin)
exports.deletePropertyPreview = async (req, res) => {
  try {
    const property = await PropertyPreview.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property preview not found',
      });
    }

    // Check authorization
    if (
      req.user?.id !== property.dealer.dealerId?.toString() &&
      req.user?.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this property',
      });
    }

    await PropertyPreview.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Property preview deleted successfully',
    });
  } catch (error) {
    console.error('Delete property preview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting property preview',
    });
  }
};

// @desc    Get properties by location (nearby)
// @route   GET /api/property-preview/nearby
// @access  Public
exports.getNearbyProperties = async (req, res) => {
  try {
    const { lat, lng, distance = 10, limit = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    const properties = await PropertyPreview.find({
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseFloat(distance) * 1000, // Convert km to meters
        },
      },
      'status.isActive': true,
      'status.approvalStatus': 'approved',
    }).limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: properties.length,
      data: properties,
    });
  } catch (error) {
    console.error('Get nearby properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching nearby properties',
    });
  }
};

// @desc    Get featured properties
// @route   GET /api/property-preview/featured
// @access  Public
exports.getFeaturedProperties = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const properties = await PropertyPreview.find({
      'status.featured': true,
      'status.isActive': true,
      'status.approvalStatus': 'approved',
    })
      .sort('-createdAt')
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: properties.length,
      data: properties,
    });
  } catch (error) {
    console.error('Get featured properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured properties',
    });
  }
};

// @desc    Record analytics (view, save, contact click)
// @route   POST /api/property-preview/:id/analytics/:action
// @access  Public
exports.recordAnalyticsAction = async (req, res) => {
  try {
    const { id, action } = req.params;
    const property = await PropertyPreview.findById(id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property preview not found',
      });
    }

    if (action === 'view') {
      property.analytics.views += 1;
    } else if (action === 'save') {
      property.analytics.saves += 1;
    } else if (action === 'contact_click') {
      property.analytics.contactClicks += 1;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action',
      });
    }

    await property.save();

    res.status(200).json({
      success: true,
      message: `Analytics recorded - ${action}`,
      data: property.analytics,
    });
  } catch (error) {
    console.error('Record analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording analytics',
    });
  }
};

// @desc    Search properties by multiple criteria
// @route   POST /api/property-preview/search
// @access  Public
exports.searchProperties = async (req, res) => {
  try {
    const {
      query,
      propertyType,
      listingType,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      soilQuality,
      waterAvailability,
      page = 1,
      limit = 10,
    } = req.body;

    const searchQuery = { 'status.isActive': true, 'status.approvalStatus': 'approved' };

    // Text search
    if (query) {
      searchQuery.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { 'location.address': { $regex: query, $options: 'i' } },
        { 'location.city': { $regex: query, $options: 'i' } },
        { 'location.locality': { $regex: query, $options: 'i' } },
      ];
    }

    if (propertyType) searchQuery.propertyType = propertyType;
    if (listingType) searchQuery.listingType = listingType;

    if (minPrice || maxPrice) {
      searchQuery.price = {};
      if (minPrice) searchQuery.price.$gte = parseFloat(minPrice);
      if (maxPrice) searchQuery.price.$lte = parseFloat(maxPrice);
    }

    if (minArea || maxArea) {
      searchQuery.landSize = {};
      if (minArea) searchQuery.landSize.$gte = parseFloat(minArea);
      if (maxArea) searchQuery.landSize.$lte = parseFloat(maxArea);
    }

    if (soilQuality) {
      searchQuery['soilAndFarming.soilQualityIndex'] = { $gte: parseInt(soilQuality) };
    }

    if (waterAvailability) {
      searchQuery['waterResources.waterAvailability'] = waterAvailability;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const properties = await PropertyPreview.find(searchQuery)
      .limit(parseInt(limit))
      .skip(skip)
      .sort('-createdAt');

    const total = await PropertyPreview.countDocuments(searchQuery);

    res.status(200).json({
      success: true,
      count: properties.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: properties,
    });
  } catch (error) {
    console.error('Search properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching properties',
    });
  }
};

// @desc    Get my properties (Seller/Agent)
// @route   GET /api/property-preview/my-properties
// @access  Private
exports.getMyProperties = async (req, res) => {
  try {
    const properties = await PropertyPreview.find({
      'dealer.dealerId': req.user?.id,
    }).sort('-createdAt');

    res.status(200).json({
      success: true,
      count: properties.length,
      data: properties,
    });
  } catch (error) {
    console.error('Get my properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your properties',
    });
  }
};

// @desc    Get property statistics
// @route   GET /api/property-preview/stats
// @access  Public
exports.getPropertyStats = async (req, res) => {
  try {
    const stats = await PropertyPreview.aggregate([
      {
        $match: {
          'status.isActive': true,
          'status.approvalStatus': 'approved',
        },
      },
      {
        $group: {
          _id: '$propertyType',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          avgArea: { $avg: '$landSize' },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get property stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching property statistics',
    });
  }
};
