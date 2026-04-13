const Property = require('../models/propertyModel');
const Lead = require('../models/leadModel');
const User = require('../models/userModel');
const { createAndEmitNotification } = require('./notificationController');
const ResponseFormatter = require('../utils/responseFormatter');
const {
  validateCoordinates,
  validatePrice,
  validatePropertyType,
  validateRadius,
  validatePagination,
  validatePriceRange,
} = require('../utils/validation');
const {
  calculateDistance,
  calculatePagination,
  buildSortObject,
  buildFilterQuery,
  buildGeoQuery,
  formatGeoJSON,
  addDistanceToItems,
  isResourceOwner,
  parseBooleanInput,
} = require('../utils/helpers');
const { SELLER_ROLES, PROPERTY_STATUS } = require('../utils/constants');

const sanitizeNestedObject = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined && v !== 'undefined')
  );
};

const ensurePlainObject = (value) => {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
};

const sanitizeStringArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === 'string' && item.trim() !== '' && item.trim().toLowerCase() !== 'undefined')
    .map((item) => item.trim());
};

const normalizeAvailabilityStatus = (value) => {
  const normalized = (value ?? '').toString().trim().toLowerCase();
  if (normalized === 'deactivated' || normalized === 'inactive') return 'Deactivated';
  if (normalized === 'sold' || normalized === 'unavailable') return 'Sold';
  if (normalized === 'pending') return 'Pending';
  return 'Available';
};

const normalizeObjectIdField = (value, { allowNull = true } = {}) => {
  if (value === undefined) return value;
  if (value === null) return allowNull ? null : value;
  if (typeof value === 'string') {
    const normalized = value.trim();
    if (!normalized || normalized.toLowerCase() === 'undefined' || normalized.toLowerCase() === 'null') {
      return allowNull ? null : value;
    }
    return normalized;
  }
  return value;
};

// @desc    Create a new property (PropertyPreview schema)
// @route   POST /api/properties
// @access  Private (Agent, Seller, Admin)
exports.createProperty = async (req, res) => {
  try {
    // Authorization check
    if (!SELLER_ROLES.includes(req.user.role)) {
      return ResponseFormatter.forbidden(res, `User role '${req.user.role}' is not authorized to create properties`);
    }

    // Validate required fields
    const { title, description, price, propertyType, listingType } = req.body;
    const errors = [];

    if (!title) errors.push('Title is required');
    if (!description) errors.push('Description is required');
    if (price === undefined || price === null) errors.push('Price is required');
    if (!propertyType) errors.push('Property type is required');
    if (!listingType) errors.push('Listing type is required');

    if (errors.length > 0) {
      return ResponseFormatter.validationError(res, errors);
    }

    // Validate property type
    const typeValidation = validatePropertyType(propertyType);
    if (!typeValidation.isValid) {
      return ResponseFormatter.validationError(res, typeValidation.error);
    }

    // Validate price
    const priceValidation = validatePrice(price);
    if (!priceValidation.isValid) {
      return ResponseFormatter.validationError(res, priceValidation.error);
    }

    // Build property object from comprehensive PropertyPreview schema
    const propertyData = {
      // ===== Basic Info =====
      title: title.trim(),
      description: description.trim(),
      shortDescription: req.body.shortDescription?.trim() || description.trim().substring(0, 150) + '...',
      propertyType,
      listingType,

      // ===== Pricing =====
      price: priceValidation.price,
      negotiable: parseBooleanInput(req.body.negotiable, true),
      priceUnit: req.body.priceUnit || 'total',
      securityDeposit: req.body.securityDeposit || undefined,
      pricePerSqft: req.body.pricePerSqft || undefined,

      // ===== Area & Size =====
      landSize: req.body.landSize || undefined,
      landUnit: req.body.landUnit || 'acre',
      area: req.body.area || undefined,
      areaUnit: req.body.areaUnit || 'sqft',
      bedrooms: req.body.bedrooms || undefined,
      bathrooms: req.body.bathrooms || undefined,
      floor: req.body.floor || undefined,
      totalFloors: req.body.totalFloors || undefined,
      facing: req.body.facing || undefined,

      // ===== Location (Address) =====
      address: req.body.address || req.body.location?.address || '',
      locality: req.body.locality || req.body.location?.locality || '',
      city: req.body.city || req.body.location?.city || '',
      state: req.body.state || req.body.location?.state || '',
      pincode: req.body.pincode || req.body.location?.pincode || '',

      // ===== Coordinates & Geolocation (matches propertyModel.location) =====
      location: (() => {
        const rawLng =
          req.body.location?.coordinates?.lng ??
          req.body.location?.coordinates?.[0] ??
          req.body.longitude ??
          0;
        const rawLat =
          req.body.location?.coordinates?.lat ??
          req.body.location?.coordinates?.[1] ??
          req.body.latitude ??
          0;
        const lng = Number(rawLng);
        const lat = Number(rawLat);
        const safeLng = Number.isFinite(lng) ? lng : 0;
        const safeLat = Number.isFinite(lat) ? lat : 0;
        const addr = (req.body.location?.address || req.body.address || '').trim() || 'Address not provided';
        const cityVal = (req.body.location?.city || req.body.city || '').trim() || 'Unknown';
        return {
          address: addr,
          locality: req.body.locality || req.body.location?.locality || '',
          city: cityVal,
          state: req.body.state || req.body.location?.state || '',
          pincode: req.body.pincode || req.body.location?.pincode || '',
          coordinates: { lat: safeLat, lng: safeLng },
          geoJSON: {
            type: 'Point',
            coordinates: [safeLng, safeLat],
          },
          googleMapLink: req.body.location?.googleMapLink || req.body.googleMapLink || '',
          distances: {
            cityCenter: req.body.location?.distances?.cityCenter || 0,
            highway: req.body.location?.distances?.highway || 0,
            railwayStation: req.body.location?.distances?.railwayStation || 0,
            airport: req.body.location?.distances?.airport || 0,
          },
        };
      })(),

      // ===== Soil & Farming =====
      soilAndFarming: {
        soilType: req.body.soilAndFarming?.soilType || '',
        soilQualityIndex: req.body.soilAndFarming?.soilQualityIndex || 5,
        soilReportAvailable: req.body.soilAndFarming?.soilReportAvailable || false,
        cropSuitability: req.body.soilAndFarming?.cropSuitability || [],
        farmingPercentage: req.body.soilAndFarming?.farmingPercentage || 0,
        rainfallData: {
          annualRainfall: req.body.soilAndFarming?.rainfallData?.annualRainfall || 0,
          irrigationSupport: req.body.soilAndFarming?.rainfallData?.irrigationSupport || false,
        },
      },

      // ===== Water Resources =====
      waterResources: {
        borewellAvailable: req.body.waterResources?.borewellAvailable || false,
        borewellDepth: req.body.waterResources?.borewellDepth || 0,
        nearbyWaterSources: req.body.waterResources?.nearbyWaterSources || [],
        waterAvailability: req.body.waterResources?.waterAvailability || 'Medium',
        irrigationSystem: parseBooleanInput(req.body.waterResources?.irrigationSystem, false),
        waterCertificateAvailable: parseBooleanInput(
          req.body.waterResources?.waterCertificateAvailable,
          false
        ),
      },

      // ===== Infrastructure =====
      infrastructure: {
        electricityAvailable: req.body.infrastructure?.electricityAvailable || false,
        roadAccess: req.body.infrastructure?.roadAccess || false,
        roadType: req.body.infrastructure?.roadType || 'kachha',
        fencing: req.body.infrastructure?.fencing || false,
        gated: req.body.infrastructure?.gated || false,
        nearbyFacilities: {
          schools: req.body.infrastructure?.nearbyFacilities?.schools || [],
          hospitals: req.body.infrastructure?.nearbyFacilities?.hospitals || [],
          markets: req.body.infrastructure?.nearbyFacilities?.markets || [],
          roads: req.body.infrastructure?.nearbyFacilities?.roads || [],
        },
      },

      // ===== Legal Documentation =====
      legal: {
        landRegistryAvailable: req.body.legal?.landRegistryAvailable || false,
        ownershipDocuments: req.body.legal?.ownershipDocuments || false,
        encumbranceFree: req.body.legal?.encumbranceFree || false,
        landUseType: req.body.legal?.landUseType || 'Agricultural',
        documentUrls: {
          soilReport: req.body.legal?.documentUrls?.soilReport || '',
          registry: req.body.legal?.documentUrls?.registry || '',
          ownership: req.body.legal?.documentUrls?.ownership || '',
          waterCertificate: req.body.legal?.documentUrls?.waterCertificate || '',
        },
      },

      // ===== Features & Amenities =====
      features: {
        constructionAllowed: req.body.features?.constructionAllowed || false,
        farmhouseBuilt: req.body.features?.farmhouseBuilt || false,
        parking: req.body.features?.parking || false,
        security: req.body.features?.security || false,
        powerBackup: req.body.features?.powerBackup || false,
      },

      // ===== Media =====
      media: {
        images: req.body.media?.images || req.body.images || [],
        videos: req.body.media?.videos || [],
        droneView: req.body.media?.droneView || [],
        mapScreenshot: req.body.media?.mapScreenshot || '',
      },

      // ===== Dealer Information =====
      dealer: {
        name: req.body.dealer?.name || req.body.dealerName || '',
        phone: req.body.dealer?.phone || req.body.dealerPhone || '',
        type: req.body.dealer?.type || 'Owner',
        verified: req.body.dealer?.verified || false,
      },

      // ===== Topography =====
      topography: {
        slope: req.body.topography?.slope || 'flat',
        elevation: req.body.topography?.elevation || 0,
      },

      // ===== Climate Risk (schema: Boolean) =====
      climateRisk: {
        floodRisk: parseBooleanInput(req.body.climateRisk?.floodRisk, false),
        droughtRisk: parseBooleanInput(req.body.climateRisk?.droughtRisk, false),
      },

      // ===== Connectivity Score =====
      connectivityScore: req.body.connectivityScore || 5,

      // ===== Investment Metrics =====
      investment: {
        expectedROI: req.body.investment?.expectedROI || 0,
        appreciationRate: req.body.investment?.appreciationRate || 0,
      },

      // ===== Analytics =====
      analytics: {
        views: req.body.analytics?.views || 0,
        saves: req.body.analytics?.saves || 0,
        contactClicks: req.body.analytics?.contactClicks || 0,
      },
      availabilityStatus: normalizeAvailabilityStatus(
        req.body.availabilityStatus ??
          (parseBooleanInput(req.body.status?.isActive, true) ? 'Available' : 'Deactivated')
      ),

      // ===== Status & Publishing =====
      status: {
        featured: parseBooleanInput(req.body.status?.featured, false),
        verified: parseBooleanInput(req.body.status?.verified, false),
        isActive: parseBooleanInput(req.body.status?.isActive, true),
        postedAt: req.body.status?.postedAt || new Date(),
        approvalStatus: req.body.status?.approvalStatus || 'pending',
      },

      // ===== Seller Reference =====
      sellerId: req.user.id,
    };

    // Validate coordinates if provided (propertyModel uses coordinates.lat / .lng + geoJSON)
    const locCoords = propertyData.location.coordinates;
    if (locCoords.lat !== 0 && locCoords.lng !== 0) {
      const coordValidation = validateCoordinates(locCoords.lat, locCoords.lng);
      if (!coordValidation.isValid) {
        return ResponseFormatter.validationError(res, [coordValidation.error]);
      }
      propertyData.location.coordinates = {
        lat: coordValidation.latitude,
        lng: coordValidation.longitude,
      };
      propertyData.location.geoJSON = {
        type: 'Point',
        coordinates: [coordValidation.longitude, coordValidation.latitude],
      };
    }

    // Create property
    const property = await Property.create(propertyData);

    // Populate seller info
    await property.populate('sellerId', 'name email phone');

    const admins = await User.find({ role: 'admin' }).select('_id').lean();
    await Promise.all(
      admins.map((admin) =>
        createAndEmitNotification(req, {
          title: 'New property submitted',
          message: `${property.title || 'A property'} was added by ${req.user.name || 'seller'}.`,
          type: 'property',
          senderId: req.user.id,
          receiverId: admin._id,
          propertyId: property._id,
        })
      )
    );

    return ResponseFormatter.created(res, 'Property created successfully', property);
  } catch (error) {
    console.error('Create property error:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((e) => e.message);
      return ResponseFormatter.validationError(res, validationErrors);
    }
    ResponseFormatter.serverError(res, 'Error creating property', error.message);
  }
};

// @desc    Get all properties with filters and distance search
// @route   GET /api/properties
// @access  Public
exports.getProperties = async (req, res) => {
  try {
    const { latitude, longitude, radius, minPrice, maxPrice, propertyType, status, sort, page, limit } = req.query;

    // Validate pagination
    const paginationValidation = validatePagination(page, limit);
    if (!paginationValidation.isValid) {
      return ResponseFormatter.validationError(res, paginationValidation.error);
    }

    // Build base query with filters
    const query = {};

    // Status filter - default to approved for non-admins
    if (status) {
      query['status.approvalStatus'] = status;
    } else if (req.user?.role !== 'admin') {
      query['status.approvalStatus'] = PROPERTY_STATUS.APPROVED;
    }

    // Property type filter
    if (propertyType) {
      const typeValidation = validatePropertyType(propertyType);
      if (!typeValidation.isValid) {
        return ResponseFormatter.validationError(res, typeValidation.error);
      }
      query.propertyType = propertyType;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      const priceValidation = validatePriceRange(minPrice || 0, maxPrice || 999999999);
      if (!priceValidation.isValid) {
        return ResponseFormatter.validationError(res, priceValidation.error);
      }
      query.price = {};
      if (minPrice) query.price.$gte = priceValidation.minPrice;
      if (maxPrice) query.price.$lte = priceValidation.maxPrice;
    }

    let properties;
    let total;

    // Handle geospatial queries if coordinates provided
    if (latitude && longitude) {
      const coordValidation = validateCoordinates(latitude, longitude);
      if (!coordValidation.isValid) {
        return ResponseFormatter.validationError(res, coordValidation.error);
      }

      const { latitude: lat, longitude: long } = coordValidation;

      // Handle radius-based search
      if (radius) {
        const radiusValidation = validateRadius(radius);
        if (!radiusValidation.isValid) {
          return ResponseFormatter.validationError(res, radiusValidation.error);
        }

        const geoQuery = buildGeoQuery(lat, long, radiusValidation.radiusInMeters, query);
        properties = await Property.find(geoQuery)
          .populate('sellerId', 'name email')
          .limit(paginationValidation.limit * 3);

        total = await Property.countDocuments(geoQuery);
      } else {
        // Search without radius - get all and calculate distance
        const sortOption = buildSortObject(sort);
        properties = await Property.find(query)
          .populate('sellerId', 'name email')
          .sort(sortOption)
          .limit(paginationValidation.limit * (sort === 'nearest' ? 5 : 1))
          .skip((paginationValidation.page - 1) * paginationValidation.limit);

        total = await Property.countDocuments(query);
      }

      // Add distance information
      properties = addDistanceToItems(properties, lat, long);

      // Apply sorting with distance
      if (sort === 'nearest') {
        properties.sort((a, b) => a.distance - b.distance);
      } else {
        const sortOption = buildSortObject(sort);
        properties.sort((a, b) => {
          if (sortOption.price) return sortOption.price === 1 ? a.price - b.price : b.price - a.price;
          return sortOption.createdAt === 1 ? a.createdAt - b.createdAt : b.createdAt - a.createdAt;
        });
      }

      // Re-apply pagination after sorting
      const { skip } = calculatePagination(paginationValidation.page, paginationValidation.limit);
      properties = properties.slice(skip, skip + paginationValidation.limit);
    } else {
      // Regular query without geospatial
      const sortOption = buildSortObject(sort);
      const { skip } = calculatePagination(paginationValidation.page, paginationValidation.limit);

      properties = await Property.find(query)
        .populate("sellerId", "name email")
        .sort(sortOption)
        .limit(paginationValidation.limit)
        .skip(skip);

      total = await Property.countDocuments(query);
    }

    return ResponseFormatter.paginated(
      res,
      'Properties retrieved successfully',
      properties,
      total,
      paginationValidation.page,
      paginationValidation.limit
    );
  } catch (error) {
    console.error('Get properties error:', error);
    ResponseFormatter.serverError(res, 'Error fetching properties', error.message);
  }
};

// @desc    Get single property by ID
// @route   GET /api/properties/:id
// @access  Public
exports.getProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate('sellerId', 'name email contact');

    if (!property) {
      return ResponseFormatter.notFound(res, 'Property not found');
    }

    const sellerOwnerId = property.sellerId?._id ?? property.sellerId;

    // Check access - non-admins can only see approved properties or their own
    if (property.status.approvalStatus !== PROPERTY_STATUS.APPROVED && req.user?.role !== 'admin') {
      if (!isResourceOwner(req.user?.id, sellerOwnerId)) {
        return ResponseFormatter.forbidden(res, 'Property not available');
      }
    }
    if (
      (property.availabilityStatus ?? '').toString().toLowerCase() === 'deactivated' &&
      req.user?.role !== 'admin' &&
      !isResourceOwner(req.user?.id, sellerOwnerId)
    ) {
      return ResponseFormatter.forbidden(res, 'Property not available');
    }
    if (
      property.status?.isActive === false &&
      req.user?.role !== 'admin' &&
      !isResourceOwner(req.user?.id, sellerOwnerId)
    ) {
      return ResponseFormatter.forbidden(res, 'Property not available');
    }

    return ResponseFormatter.success(res, 'Property retrieved successfully', property);
  } catch (error) {
    console.error('Get property error:', error);
    if (error.name === 'CastError') {
      return ResponseFormatter.validationError(res, 'Invalid property ID');
    }
    ResponseFormatter.serverError(res, 'Error fetching property', error.message);
  }
};

// @desc    Update property (PropertyPreview schema)
// @route   PUT /api/properties/:id
// @access  Private (Seller - own only, Admin/Agent - any)
exports.updateProperty = async (req, res) => {
  try {
    let property = await Property.findById(req.params.id);

    if (!property) {
      return ResponseFormatter.notFound(res, 'Property not found');
    }

    // Authorization check - sellers can only update their own properties
    if (req.user.role === 'seller' && !isResourceOwner(req.user.id, property.sellerId)) {
      return ResponseFormatter.forbidden(res, 'You can only update your own properties');
    }

    // Update Basic Info
    if (req.body.title) property.title = req.body.title.trim();
    if (req.body.description) property.description = req.body.description.trim();
    if (req.body.shortDescription) property.shortDescription = req.body.shortDescription.trim();
    if (req.body.propertyType) {
      const typeValidation = validatePropertyType(req.body.propertyType);
      if (!typeValidation.isValid) {
        return ResponseFormatter.validationError(res, typeValidation.error);
      }
      property.propertyType = req.body.propertyType;
    }
    if (req.body.listingType) property.listingType = req.body.listingType;

    // Update Pricing
    if (req.body.price !== undefined) {
      const priceValidation = validatePrice(req.body.price);
      if (!priceValidation.isValid) {
        return ResponseFormatter.validationError(res, priceValidation.error);
      }
      property.price = priceValidation.price;
    }
    if (req.body.negotiable !== undefined) {
      property.negotiable = parseBooleanInput(req.body.negotiable, property.negotiable);
    }
    if (req.body.priceUnit) property.priceUnit = req.body.priceUnit;
    if (req.body.securityDeposit !== undefined) property.securityDeposit = req.body.securityDeposit;
    if (req.body.pricePerSqft !== undefined) property.pricePerSqft = req.body.pricePerSqft;

    // Update Area
    if (req.body.landSize !== undefined) property.landSize = req.body.landSize;
    if (req.body.landUnit) property.landUnit = req.body.landUnit;
    if (req.body.area !== undefined) property.area = req.body.area;
    if (req.body.areaUnit) property.areaUnit = req.body.areaUnit;
    if (req.body.bedrooms !== undefined) property.bedrooms = req.body.bedrooms;
    if (req.body.bathrooms !== undefined) property.bathrooms = req.body.bathrooms;
    if (req.body.floor !== undefined) property.floor = req.body.floor;
    if (req.body.totalFloors !== undefined) property.totalFloors = req.body.totalFloors;
    if (req.body.facing) property.facing = req.body.facing;

    // Update Location/Address
    if (req.body.address) property.address = req.body.address.trim();
    if (req.body.locality) property.locality = req.body.locality;
    if (req.body.city) property.city = req.body.city;
    if (req.body.state) property.state = req.body.state;
    if (req.body.pincode) property.pincode = req.body.pincode;

    // Update Geolocation
    if (req.body.location?.coordinates || (req.body.latitude !== undefined && req.body.longitude !== undefined)) {
      const lat =
        req.body.location?.coordinates?.lat ??
        req.body.location?.coordinates?.[1] ??
        req.body.latitude;
      const long =
        req.body.location?.coordinates?.lng ??
        req.body.location?.coordinates?.[0] ??
        req.body.longitude;

      if (lat !== undefined && long !== undefined) {
        const coordValidation = validateCoordinates(lat, long);
        if (!coordValidation.isValid) {
          return ResponseFormatter.validationError(res, [coordValidation.error]);
        }
        property.location.coordinates = {
          lat: coordValidation.latitude,
          lng: coordValidation.longitude,
        };
        property.location.geoJSON = {
          type: 'Point',
          coordinates: [coordValidation.longitude, coordValidation.latitude],
        };
      }
    }

    if (req.body.location?.address) property.location.address = req.body.location.address;
    if (req.body.location?.googleMapLink) property.location.googleMapLink = req.body.location.googleMapLink;
    if (req.body.location?.distances) {
      property.location.distances = { ...property.location.distances, ...req.body.location.distances };
    }

    // Update Soil & Farming
    if (req.body.soilAndFarming) {
      const nextSoil = sanitizeNestedObject(req.body.soilAndFarming);
      if (
        Object.prototype.hasOwnProperty.call(nextSoil, 'rainfallData') &&
        (!nextSoil.rainfallData || typeof nextSoil.rainfallData !== 'object')
      ) {
        delete nextSoil.rainfallData;
      }
      property.soilAndFarming = { ...property.soilAndFarming, ...nextSoil };
    }

    // Update Water Resources
    if (req.body.waterResources) {
      const nextWaterResources = sanitizeNestedObject(req.body.waterResources);
      property.waterResources = { ...property.waterResources, ...nextWaterResources };
      if (nextWaterResources.irrigationSystem !== undefined) {
        property.waterResources.irrigationSystem = parseBooleanInput(
          nextWaterResources.irrigationSystem,
          property.waterResources.irrigationSystem
        );
      }
      if (nextWaterResources.waterCertificateAvailable !== undefined) {
        property.waterResources.waterCertificateAvailable = parseBooleanInput(
          nextWaterResources.waterCertificateAvailable,
          property.waterResources.waterCertificateAvailable
        );
      }
    }

    // Update Infrastructure
    if (req.body.infrastructure) {
      const nextInfrastructure = sanitizeNestedObject(req.body.infrastructure);
      const existingNearbyFacilities = ensurePlainObject(property.get('infrastructure.nearbyFacilities'));
      const incomingNearbyFacilities = ensurePlainObject(nextInfrastructure.nearbyFacilities);
      const normalizedNearbyFacilities = {
        schools: sanitizeStringArray(
          incomingNearbyFacilities.schools !== undefined
            ? incomingNearbyFacilities.schools
            : existingNearbyFacilities.schools
        ),
        hospitals: sanitizeStringArray(
          incomingNearbyFacilities.hospitals !== undefined
            ? incomingNearbyFacilities.hospitals
            : existingNearbyFacilities.hospitals
        ),
        markets: sanitizeStringArray(
          incomingNearbyFacilities.markets !== undefined
            ? incomingNearbyFacilities.markets
            : existingNearbyFacilities.markets
        ),
        roads: sanitizeStringArray(
          incomingNearbyFacilities.roads !== undefined
            ? incomingNearbyFacilities.roads
            : existingNearbyFacilities.roads
        ),
      };
      if (nextInfrastructure.electricityAvailable !== undefined) {
        property.set('infrastructure.electricityAvailable', nextInfrastructure.electricityAvailable);
      }
      if (nextInfrastructure.roadAccess !== undefined) {
        property.set('infrastructure.roadAccess', nextInfrastructure.roadAccess);
      }
      if (nextInfrastructure.roadType !== undefined) {
        property.set('infrastructure.roadType', nextInfrastructure.roadType);
      }
      if (nextInfrastructure.fencing !== undefined) {
        property.set('infrastructure.fencing', nextInfrastructure.fencing);
      }
      if (nextInfrastructure.gated !== undefined) {
        property.set('infrastructure.gated', nextInfrastructure.gated);
      }
      property.set('infrastructure.nearbyFacilities', normalizedNearbyFacilities);
    }

    // Update Legal
    if (req.body.legal) {
      const nextLegal = sanitizeNestedObject(req.body.legal);
      property.legal = { ...property.legal, ...nextLegal };
    }

    // Update Features
    if (req.body.features) {
      const nextFeatures = sanitizeNestedObject(req.body.features);
      property.features = { ...property.features, ...nextFeatures };
    }

    // Update Media
    if (req.body.media || req.body.images) {
      const newMedia = sanitizeNestedObject(req.body.media || {});
      if (req.body.images) newMedia.images = req.body.images;
      property.media = { ...property.media, ...newMedia };
    }

    // Update Dealer
    if (req.body.dealer) {
      const nextDealer = sanitizeNestedObject(req.body.dealer);
      property.dealer = { ...property.dealer, ...nextDealer };
    }

    // Update Topography
    if (req.body.topography) {
      const nextTopography = sanitizeNestedObject(req.body.topography);
      property.topography = { ...property.topography, ...nextTopography };
    }

    // Update Climate Risk
    if (req.body.climateRisk) {
      const nextClimateRisk = sanitizeNestedObject(req.body.climateRisk);
      property.climateRisk = { ...property.climateRisk, ...nextClimateRisk };
      if (nextClimateRisk.floodRisk !== undefined) {
        property.climateRisk.floodRisk = parseBooleanInput(
          nextClimateRisk.floodRisk,
          property.climateRisk.floodRisk
        );
      }
      if (nextClimateRisk.droughtRisk !== undefined) {
        property.climateRisk.droughtRisk = parseBooleanInput(
          nextClimateRisk.droughtRisk,
          property.climateRisk.droughtRisk
        );
      }
    }

    // Update Connectivity Score
    if (req.body.connectivityScore !== undefined) property.connectivityScore = req.body.connectivityScore;

    // Update Investment Metrics
    if (req.body.investment) {
      const nextInvestment = sanitizeNestedObject(req.body.investment);
      property.investment = { ...property.investment, ...nextInvestment };
    }

    // Update Analytics (usually only for admins/system)
    if (req.body.analytics && req.user.role === 'admin') {
      property.analytics = { ...property.analytics, ...req.body.analytics };
    }
    if (req.body.availabilityStatus !== undefined) {
      const nextAvailabilityStatus = normalizeAvailabilityStatus(req.body.availabilityStatus);
      property.availabilityStatus = nextAvailabilityStatus;
      if (nextAvailabilityStatus === 'Deactivated') {
        property.status.isActive = false;
      } else if (nextAvailabilityStatus === 'Available') {
        property.status.isActive = true;
      }
    }

    // Update Status (only admins can change approval status)
    if (req.body.status) {
      const nextStatus = sanitizeNestedObject(req.body.status);
      if (req.user.role === 'admin') {
        property.status = { ...property.status, ...nextStatus };
      } else {
        // Non-admins can only update featured flag, but resets approval to pending
        if (nextStatus.featured !== undefined) {
          property.status.featured = parseBooleanInput(
            nextStatus.featured,
            property.status.featured
          );
        }
        // Reset to pending if seller updates an approved property
        if (property.status.approvalStatus === 'approved') {
          property.status.approvalStatus = 'pending';
        }
      }
    } else if (
      req.user.role === 'seller' &&
      property.status.approvalStatus === 'approved' &&
      req.body.availabilityStatus === undefined
    ) {
      // Reset to pending if seller modifies an approved property
      property.status.approvalStatus = 'pending';
    }

    // Defensive cleanup for legacy bad ObjectId-like values in existing docs.
    property.approvedBy = normalizeObjectIdField(property.approvedBy, { allowNull: true });
    property.rejectedBy = normalizeObjectIdField(property.rejectedBy, { allowNull: true });
    const finalNearbyFacilities = ensurePlainObject(property.get('infrastructure.nearbyFacilities'));
    property.set('infrastructure.nearbyFacilities', {
      schools: sanitizeStringArray(finalNearbyFacilities.schools),
      hospitals: sanitizeStringArray(finalNearbyFacilities.hospitals),
      markets: sanitizeStringArray(finalNearbyFacilities.markets),
      roads: sanitizeStringArray(finalNearbyFacilities.roads),
    });

    await property.save();
    await property.populate('sellerId', 'name email phone');

    return ResponseFormatter.success(res, 'Property updated successfully', property);
  } catch (error) {
    console.error('Update property error:', error);
    if (error.name === 'CastError') {
      return ResponseFormatter.validationError(res, 'Invalid property ID');
    }
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((e) => e.message);
      return ResponseFormatter.validationError(res, validationErrors);
    }
    ResponseFormatter.serverError(res, 'Error updating property', error.message);
  }
};

// @desc    Delete property
// @route   DELETE /api/properties/:id
// @access  Private (Seller - own only, Admin/Agent - any)
exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return ResponseFormatter.notFound(res, 'Property not found');
    }

    // Authorization check - sellers can only delete their own properties
    if (req.user.role === 'seller' && !isResourceOwner(req.user.id, property.sellerId)) {
      return ResponseFormatter.forbidden(res, 'You can only delete your own properties');
    }

    await Property.findByIdAndDelete(req.params.id);

    return ResponseFormatter.success(res, 'Property deleted successfully');
  } catch (error) {
    console.error('Delete property error:', error);
    if (error.name === 'CastError') {
      return ResponseFormatter.validationError(res, 'Invalid property ID');
    }
    ResponseFormatter.serverError(res, 'Error deleting property', error.message);
  }
};

// @desc    Get seller's own properties
// @route   GET /api/properties/my-properties/list
// @access  Private (Seller, Agent, Admin)
exports.getMyProperties = async (req, res) => {
  try {
    const properties = await Property.find({ sellerId: req.user.id })
      .populate("sellerId", "name email")
      .sort({ createdAt: -1 });

    return ResponseFormatter.success(res, 'Your properties retrieved successfully', {
      count: properties.length,
      properties,
    });
  } catch (error) {
    console.error('Get my properties error:', error);
    ResponseFormatter.serverError(res, 'Error fetching your properties', error.message);
  }
};

// @desc    Get seller leads (buyers who viewed seller properties)
// @route   GET /api/properties/my-leads/list
// @access  Private (Seller, Agent, Admin)
exports.getMyLeads = async (req, res) => {
  try {
    const leads = await Lead.find({ sellerId: req.user.id }).sort({ lastViewedAt: -1, createdAt: -1 });

    return ResponseFormatter.success(res, 'Your leads retrieved successfully', {
      count: leads.length,
      leads,
    });
  } catch (error) {
    console.error('Get my leads error:', error);
    ResponseFormatter.serverError(res, 'Error fetching your leads', error.message);
  }
};

// @desc    Get all buyers for seller lead management
// @route   GET /api/properties/buyers/list
// @access  Private (Seller, Agent, Admin)
exports.getBuyerUsers = async (req, res) => {
  try {
    const buyers = await User.find({
      role: { $in: ['buyer', 'user'] },
    })
      .select('name email contact details verified isActive lastLogin createdAt')
      .sort({ createdAt: -1 });

    return ResponseFormatter.success(res, 'Buyers retrieved successfully', {
      count: buyers.length,
      buyers,
    });
  } catch (error) {
    console.error('Get buyers error:', error);
    ResponseFormatter.serverError(res, 'Error fetching buyers', error.message);
  }
};

// @desc    View property and create/update lead
// @route   GET /api/properties/:id/view
// @access  Private (Authenticated users only)
exports.viewProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate('sellerId', 'name email contact');

    if (!property) {
      return ResponseFormatter.notFound(res, 'Property not found');
    }

    // Check access - non-admins can only see approved properties or their own
    if (property.status.approvalStatus !== PROPERTY_STATUS.APPROVED && req.user?.role !== 'admin') {
      if (!isResourceOwner(req.user?.id, property.sellerId._id)) {
        return ResponseFormatter.forbidden(res, 'Property not available');
      }
    }

    // Create or update lead record
    const existingLead = await Lead.findOne({
      userId: req.user.id,
      propertyId: property._id,
    });

    if (existingLead) {
      // Update existing lead
      existingLead.viewCount += 1;
      existingLead.lastViewedAt = new Date();
      existingLead.userDetails = {
        name: req.user.name,
        email: req.user.email,
        contact: req.user.contact,
        role: req.user.role,
      };
      await existingLead.save();
    } else {
      // Create new lead
      await Lead.create({
        userId: req.user.id,
        propertyId: property._id,
        sellerId: property.sellerId._id,
        propertyDetails: {
          title: property.title,
          description: property.description,
          price: property.price,
          propertyType: property.propertyType,
          address: property.address,
          location: property.location,
        },
        userDetails: {
          name: req.user.name,
          email: req.user.email,
          contact: req.user.contact,
          role: req.user.role,
        },
        viewCount: 1,
        lastViewedAt: new Date(),
      });
    }

    return ResponseFormatter.success(res, 'Property viewed successfully', property);
  } catch (error) {
    console.error('View property error:', error);
    if (error.name === 'CastError') {
      return ResponseFormatter.validationError(res, 'Invalid property ID');
    }
    ResponseFormatter.serverError(res, 'Error viewing property', error.message);
  }
};

// @desc    Get all pending properties (Admin only)
// @route   GET /api/properties/admin/pending
// @access  Private (Admin only)
exports.getPendingProperties = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;

    const paginationValidation = validatePagination(page, limit);
    if (!paginationValidation.isValid) {
      return ResponseFormatter.validationError(res, paginationValidation.error);
    }

    const { skip } = calculatePagination(paginationValidation.page, paginationValidation.limit);
    const sortOption = buildSortObject(sort);

    const properties = await Property.find({ status: PROPERTY_STATUS.PENDING })
      .populate('sellerId', 'name email contact')
      .sort(sortOption)
      .limit(paginationValidation.limit)
      .skip(skip);

    const total = await Property.countDocuments({ status: PROPERTY_STATUS.PENDING });

    return ResponseFormatter.paginated(
      res,
      'Pending properties retrieved successfully',
      properties,
      total,
      paginationValidation.page,
      paginationValidation.limit
    );
  } catch (error) {
    console.error('Get pending properties error:', error);
    ResponseFormatter.serverError(res, 'Error fetching pending properties', error.message);
  }
};

// @desc    Get all properties with admin view (Admin only)
// @route   GET /api/properties/admin/all
// @access  Private (Admin only)
exports.getAllPropertiesAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, propertyType, sort = '-createdAt' } = req.query;

    const paginationValidation = validatePagination(page, limit);
    if (!paginationValidation.isValid) {
      return ResponseFormatter.validationError(res, paginationValidation.error);
    }

    // Build query
    const query = {};
    if (status) query.status = status;
    if (propertyType) query.propertyType = propertyType;

    const { skip } = calculatePagination(paginationValidation.page, paginationValidation.limit);
    const sortOption = buildSortObject(sort);

    const properties = await Property.find(query)
      .populate('sellerId', 'name email contact')
      .sort(sortOption)
      .limit(paginationValidation.limit)
      .skip(skip);

    const total = await Property.countDocuments(query);

    return ResponseFormatter.paginated(
      res,
      'All properties retrieved successfully',
      properties,
      total,
      paginationValidation.page,
      paginationValidation.limit
    );
  } catch (error) {
    console.error('Get all properties admin error:', error);
    ResponseFormatter.serverError(res, 'Error fetching properties', error.message);
  }
};

// @desc    Approve property (Admin only)
// @route   PUT /api/properties/:id/approve
// @access  Private (Admin only)
exports.approveProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return ResponseFormatter.notFound(res, 'Property not found');
    }

    if (property.status.approvalStatus === PROPERTY_STATUS.APPROVED) {
      return ResponseFormatter.validationError(res, ['Property is already approved']);
    }

    property.status.approvalStatus = PROPERTY_STATUS.APPROVED;
    property.approvedAt = new Date();
    property.approvedBy = req.user.id;

    await property.save();
    await property.populate('sellerId', 'name email');

    return ResponseFormatter.success(res, 'Property approved successfully', property);
  } catch (error) {
    console.error('Approve property error:', error);
    if (error.name === 'CastError') {
      return ResponseFormatter.validationError(res, 'Invalid property ID');
    }
    ResponseFormatter.serverError(res, 'Error approving property', error.message);
  }
};

// @desc    Reject property (Admin only)
// @route   PUT /api/properties/:id/reject
// @access  Private (Admin only)
exports.rejectProperty = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return ResponseFormatter.validationError(res, ['Rejection reason is required']);
    }

    const property = await Property.findById(req.params.id);

    if (!property) {
      return ResponseFormatter.notFound(res, 'Property not found');
    }

    if (property.status.approvalStatus === PROPERTY_STATUS.SOLD) {
      return ResponseFormatter.validationError(res, ['Cannot reject a sold property']);
    }

    property.status.approvalStatus = PROPERTY_STATUS.PENDING;
    property.rejectionReason = reason;
    property.rejectedAt = new Date();
    property.rejectedBy = req.user.id;

    await property.save();
    await property.populate('sellerId', 'name email');

    return ResponseFormatter.success(res, 'Property rejected successfully', property);
  } catch (error) {
    console.error('Reject property error:', error);
    if (error.name === 'CastError') {
      return ResponseFormatter.validationError(res, 'Invalid property ID');
    }
    ResponseFormatter.serverError(res, 'Error rejecting property', error.message);
  }
};

// @desc    Get nearby properties based on user's location
// @route   GET /api/properties/nearby
// @access  Public
exports.getNearbyProperties = async (req, res) => {
  try {
    const { latitude, longitude, radius = 5, minPrice, maxPrice, propertyType, limit = 20 } = req.query;

    // Validate coordinates
    if (!latitude || !longitude) {
      return ResponseFormatter.validationError(res, ['Latitude and longitude are required']);
    }

    const coordValidation = validateCoordinates(latitude, longitude);
    if (!coordValidation.isValid) {
      return ResponseFormatter.validationError(res, [coordValidation.error]);
    }

    // Validate radius
    const radiusValidation = validateRadius(radius);
    if (!radiusValidation.isValid) {
      return ResponseFormatter.validationError(res, [radiusValidation.error]);
    }

    const { latitude: lat, longitude: long } = coordValidation;
    const radiusInMeters = radiusValidation.radiusInMeters;

    // Build base query - only approved properties
    let query = {
      'status.approvalStatus': PROPERTY_STATUS.APPROVED,
    };

    // Add geospatial filter
    query.location = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [long, lat],
        },
        $maxDistance: radiusInMeters,
      },
    };

    // Add price filter if provided
    if (minPrice || maxPrice) {
      const priceValidation = validatePriceRange(minPrice || 0, maxPrice || 999999999);
      if (!priceValidation.isValid) {
        return ResponseFormatter.validationError(res, [priceValidation.error]);
      }
      query.price = {};
      if (minPrice) query.price.$gte = priceValidation.minPrice;
      if (maxPrice) query.price.$lte = priceValidation.maxPrice;
    }

    // Add property type filter if provided
    if (propertyType) {
      const typeValidation = validatePropertyType(propertyType);
      if (!typeValidation.isValid) {
        return ResponseFormatter.validationError(res, [typeValidation.error]);
      }
      query.propertyType = propertyType;
    }

    // Execute query with geospatial ordering
    let properties = await Property.find(query)
      .populate('sellerId', 'name email phone')
      .limit(parseInt(limit) || 20);

    // Calculate distance for each property
    properties = addDistanceToItems(properties, lat, long);

    // Sort by distance
    properties.sort((a, b) => a.distance - b.distance);

    // Format response
    const response = properties.map((property) => ({
      _id: property._id,
      title: property.title,
      propertyType: property.propertyType,
      price: property.price,
      address: property.address,
      city: property.city,
      location: {
        coordinates: property.location.coordinates,
        lat: property.location.coordinates[1],
        lng: property.location.coordinates[0],
      },
      distance: property.distance, // Distance in km
      images: property.media?.images || [],
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      area: property.area,
      areaUnit: property.areaUnit,
      shortDescription: property.shortDescription,
      dealer: property.dealer,
      createdAt: property.createdAt,
      sellerId: property.sellerId,
    }));

    return ResponseFormatter.success(res, 'Nearby properties retrieved successfully', {
      count: response.length,
      userLocation: { latitude: lat, longitude: long },
      radius: radiusValidation.radiusInKm,
      properties: response,
    });
  } catch (error) {
    console.error('Get nearby properties error:', error);
    ResponseFormatter.serverError(res, 'Error fetching nearby properties', error.message);
  }
};


/* ======================================
   ADMIN - GET PENDING PROPERTIES
====================================== */

exports.getPendingProperties = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const properties = await Property.find({
      status: "pending",
    })

      .populate("sellerId", "name email contact")

      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: properties.length,
      data: properties,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ======================================
   ADMIN - APPROVE PROPERTY
====================================== */

exports.approveProperty = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    if (!property.status || typeof property.status !== "object") {
      property.status = {};
    }
    property.status.approvalStatus = "approved";
    property.approvedAt = new Date();
    property.approvedBy = req.user.id;

    await property.save();

    await property.populate("sellerId", "name email contact");
    await createAndEmitNotification(req, {
      title: 'Property approved',
      message: `${property.title || 'Your property'} has been approved by admin.`,
      type: 'approval',
      senderId: req.user.id,
      receiverId: property.sellerId?._id || property.sellerId,
      propertyId: property._id,
    });

    res.status(200).json({
      success: true,
      message: "Property approved",
      data: property,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ======================================
   ADMIN - REJECT PROPERTY
====================================== */

exports.rejectProperty = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    if (!property.status || typeof property.status !== "object") {
      property.status = {};
    }
    property.status.approvalStatus = "rejected";
    property.rejectedAt = new Date();
    property.rejectedBy = req.user.id;
    property.rejectionReason = req.body?.reason || "Rejected by admin";

    await property.save();

    await property.populate("sellerId", "name email contact");
    await createAndEmitNotification(req, {
      title: 'Property rejected',
      message: `${property.title || 'Your property'} was rejected by admin.`,
      type: 'rejection',
      senderId: req.user.id,
      receiverId: property.sellerId?._id || property.sellerId,
      propertyId: property._id,
    });

    res.status(200).json({
      success: true,
      message: "Property rejected",
      data: property,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ======================================
   ADMIN - GET ALL PROPERTIES
====================================== */

exports.getAllPropertiesAdmin = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const properties = await Property.find()

      .populate("sellerId", "name email contact")

      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: properties.length,
      data: properties,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
