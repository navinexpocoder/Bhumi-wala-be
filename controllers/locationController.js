const Location = require('../models/locationModel');
const ResponseFormatter = require('../utils/responseFormatter');
const { validateCoordinates } = require('../utils/validation');

// @desc    Get all locations
// @route   GET /api/locations
// @access  Public
exports.getLocations = async (req, res) => {
  try {
    const { state, name, lat1, long1, lat2, long2, page = 1, limit = 50 } = req.query;

    // Build query
    const query = {};

    // State filter
    if (state) {
      query.state = { $regex: state, $options: 'i' };
    }

    // Name filter
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }

    let locations;
    let total;

    // Bounding-box geospatial query (if two coordinate pairs provided)
    if (lat1 && long1 && lat2 && long2) {
      const aLat = parseFloat(lat1);
      const aLong = parseFloat(long1);
      const bLat = parseFloat(lat2);
      const bLong = parseFloat(long2);

      if (isNaN(aLat) || isNaN(aLong) || isNaN(bLat) || isNaN(bLong)) {
        return ResponseFormatter.validationError(res, 'Invalid lat1/long1/lat2/long2 values');
      }

      // Validate ranges
      const latMin = Math.max(-90, Math.min(aLat, bLat));
      const latMax = Math.min(90, Math.max(aLat, bLat));
      const longMin = Math.max(-180, Math.min(aLong, bLong));
      const longMax = Math.min(180, Math.max(aLong, bLong));

      // Build GeoJSON Polygon for the rectangle (counter-clockwise, closed)
      const polygon = [
        [longMin, latMin],
        [longMax, latMin],
        [longMax, latMax],
        [longMin, latMax],
        [longMin, latMin],
      ];

      const geoQuery = {
        location: {
          $geoWithin: {
            $geometry: {
              type: 'Polygon',
              coordinates: [polygon],
            },
          },
        },
      };

      const combinedQuery = { ...query, ...geoQuery };

      locations = await Location.find(combinedQuery)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      total = await Location.countDocuments(combinedQuery);
    } else {
      // Regular query without distance
      locations = await Location.find(query)
        .sort({ name: 1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      total = await Location.countDocuments(query);
    }

    return ResponseFormatter.paginated(res, 'Locations retrieved successfully', locations, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('Get locations error:', error);
    return ResponseFormatter.error(res, 'Failed to fetch locations', error.message);
  }
};

// @desc    Get single location by ID
// @route   GET /api/locations/:id
// @access  Public
exports.getLocation = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);

    if (!location) {
      return ResponseFormatter.notFound(res, 'Location not found');
    }

    return ResponseFormatter.success(res, 'Location retrieved successfully', location);
  } catch (error) {
    console.error('Get location error:', error);
    if (error.name === 'CastError') {
      return ResponseFormatter.validationError(res, 'Invalid location ID');
    }
    return ResponseFormatter.error(res, 'Failed to fetch location', error.message);
  }
};

// @desc    Create location
// @route   POST /api/locations
// @access  Private (Admin)
exports.createLocation = async (req, res) => {
  try {
    const { name, state, latitude, longitude } = req.body;

    // Validation
    if (!name || !state || latitude === undefined || longitude === undefined) {
      return ResponseFormatter.validationError(res, 'Name, state, latitude, and longitude are required');
    }

    // Validate coordinates
    const coordValidation = validateCoordinates(latitude, longitude);
    if (!coordValidation.isValid) {
      return ResponseFormatter.validationError(res, coordValidation.error);
    }

    const lat = parseFloat(latitude);
    const long = parseFloat(longitude);

    // Check if location already exists
    const existingLocation = await Location.findOne({
      name: name.trim(),
      state: state.trim(),
    });

    if (existingLocation) {
      return ResponseFormatter.conflict(res, 'Location already exists with this name and state');
    }

    // Create location
    const location = await Location.create({
      name: name.trim(),
      state: state.trim(),
      latitude: lat,
      longitude: long,
      location: {
        type: 'Point',
        coordinates: [long, lat],
      },
    });

    return ResponseFormatter.created(res, 'Location created successfully', location);
  } catch (error) {
    console.error('Create location error:', error);
    
    if (error.code === 11000) {
      return ResponseFormatter.conflict(res, 'Location already exists with this name and state');
    }

    return ResponseFormatter.error(res, 'Failed to create location', error.message);
  }
};

// @desc    Update location
// @route   PUT /api/locations/:id
// @access  Private (Admin)
exports.updateLocation = async (req, res) => {
  try {
    const { name, state, latitude, longitude } = req.body;

    let location = await Location.findById(req.params.id);

    if (!location) {
      return ResponseFormatter.notFound(res, 'Location not found');
    }

    // Update fields
    if (name) location.name = name.trim();
    if (state) location.state = state.trim();

    // Update location if coordinates provided
    if (latitude !== undefined && longitude !== undefined) {
      const coordValidation = validateCoordinates(latitude, longitude);
      if (!coordValidation.isValid) {
        return ResponseFormatter.validationError(res, coordValidation.error);
      }

      const lat = parseFloat(latitude);
      const long = parseFloat(longitude);

      location.latitude = lat;
      location.longitude = long;
      location.location = {
        type: 'Point',
        coordinates: [long, lat],
      };
    }

    await location.save();

    return ResponseFormatter.success(res, 'Location updated successfully', location);
  } catch (error) {
    console.error('Update location error:', error);
    
    if (error.name === 'CastError') {
      return ResponseFormatter.validationError(res, 'Invalid location ID');
    }

    if (error.code === 11000) {
      return ResponseFormatter.conflict(res, 'Location already exists with this name and state');
    }

    return ResponseFormatter.error(res, 'Failed to update location', error.message);
  }
};

// @desc    Delete location
// @route   DELETE /api/locations/:id
// @access  Private (Admin)
exports.deleteLocation = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);

    if (!location) {
      return ResponseFormatter.notFound(res, 'Location not found');
    }

    await Location.findByIdAndDelete(req.params.id);

    return ResponseFormatter.success(res, 'Location deleted successfully');
  } catch (error) {
    console.error('Delete location error:', error);
    if (error.name === 'CastError') {
      return ResponseFormatter.validationError(res, 'Invalid location ID');
    }
    return ResponseFormatter.error(res, 'Failed to delete location', error.message);
  }
};

// @desc    Get locations by state
// @route   GET /api/locations/state/:state
// @access  Public
exports.getLocationsByState = async (req, res) => {
  try {
    const { state } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const locations = await Location.find({
      state: { $regex: state, $options: 'i' },
    })
      .sort({ name: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Location.countDocuments({
      state: { $regex: state, $options: 'i' },
    });

    return ResponseFormatter.paginated(res, 'Locations retrieved successfully', locations, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('Get locations by state error:', error);
    return ResponseFormatter.error(res, 'Failed to fetch locations', error.message);
  }
};

// @desc    Search locations by name
// @route   GET /api/locations/search/:name
// @access  Public
exports.searchLocations = async (req, res) => {
  try {
    const { name } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const locations = await Location.find({
      name: { $regex: name, $options: 'i' },
    })
      .sort({ name: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Location.countDocuments({
      name: { $regex: name, $options: 'i' },
    });

    return ResponseFormatter.paginated(res, 'Locations retrieved successfully', locations, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('Search locations error:', error);
    return ResponseFormatter.error(res, 'Failed to search locations', error.message);
  }
};

// @desc    Get current user's latitude and longitude
// @route   GET /api/locations/current/coordinates
// @access  Public
exports.getCurrentCoordinates = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return ResponseFormatter.validationError(res, 'Latitude and longitude are required');
    }

    // Validate coordinates
    const coordValidation = validateCoordinates(latitude, longitude);
    if (!coordValidation.isValid) {
      return ResponseFormatter.validationError(res, coordValidation.error);
    }

    const lat = parseFloat(latitude);
    const long = parseFloat(longitude);

    return ResponseFormatter.success(res, 'Current coordinates retrieved successfully', {
      latitude: lat,
      longitude: long,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get coordinates error:', error);
    return ResponseFormatter.error(res, 'Failed to retrieve coordinates', error.message);
  }
};

// @desc    Get current user's location based on IP address
// @route   GET /api/locations/my-location
// @access  Public
exports.getMyLocation = async (req, res) => {
  try {
    const https = require('https');

    // Get client IP address
    let clientIP =
      req.headers['x-forwarded-for'] ||
      req.headers['x-real-ip'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.ip;

    // Handle IPv6 localhost
    if (clientIP === '::1' || clientIP === '127.0.0.1') {
      clientIP = '8.8.8.8'; // Use a default public IP for testing
    }

    // Remove IPv6 prefix if exists
    if (clientIP.includes(':')) {
      clientIP = clientIP.split(':').pop();
    }

    // Fetch location data from IP Geolocation API
    return new Promise((resolve, reject) => {
      https.get(`https://ipapi.co/${clientIP}/json/`, (response) => {
        let data = '';

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          try {
            const locationData = JSON.parse(data);

            if (!locationData.latitude || !locationData.longitude) {
              return ResponseFormatter.validationError(res, 'Unable to determine location coordinates');
            }

            return ResponseFormatter.success(res, 'Current location retrieved successfully', {
              ip: clientIP,
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              city: locationData.city || 'Unknown',
              region: locationData.region || 'Unknown',
              country: locationData.country_name || 'Unknown',
              timezone: locationData.timezone || 'Unknown',
              timestamp: new Date().toISOString(),
            });
          } catch (error) {
            return ResponseFormatter.error(res, 'Failed to parse location data', error.message);
          }
        });
      }).on('error', (error) => {
        return ResponseFormatter.error(res, 'Failed to retrieve location', error.message);
      });
    });
  } catch (error) {
    console.error('Get location error:', error);
    return ResponseFormatter.error(res, 'Failed to retrieve location', error.message);
  }
};
