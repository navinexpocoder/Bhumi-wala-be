const User = require('../models/userModel');
const ResponseFormatter = require('../utils/responseFormatter');
const { validateCoordinates } = require('../utils/validation');

// Get users near a location by latitude and longitude
const getNearbyUsers = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 5000 } = req.query;

    // Validate inputs
    if (!latitude || !longitude) {
      return ResponseFormatter.validationError(res, 'Latitude and longitude are required');
    }

    // Validate coordinates
    const coordValidation = validateCoordinates(latitude, longitude);
    if (!coordValidation.isValid) {
      return ResponseFormatter.validationError(res, coordValidation.error);
    }

    const distance = parseInt(maxDistance) || 5000;

    // Query users near the given location
    const nearbyUsers = await User.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: distance,
        },
      },
    }).select('-location.type');

    return ResponseFormatter.success(res, 'Nearby users retrieved successfully', nearbyUsers, { count: nearbyUsers.length });
  } catch (error) {
    console.error('Error fetching nearby users:', error);
    return ResponseFormatter.error(res, 'Failed to fetch nearby users', error.message);
  }
};

// Add a new user with location
const addUser = async (req, res) => {
  try {
    const { name, email, phone, latitude, longitude, address } = req.body;

    // Validate required fields
    if (!name || !email || latitude === undefined || longitude === undefined) {
      return ResponseFormatter.validationError(res, 'Name, email, latitude, and longitude are required');
    }

    // Validate coordinates
    const coordValidation = validateCoordinates(latitude, longitude);
    if (!coordValidation.isValid) {
      return ResponseFormatter.validationError(res, coordValidation.error);
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return ResponseFormatter.conflict(res, 'Email already exists');
    }

    // Create new user with location
    const newUser = new User({
      name,
      email,
      phone,
      address,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
    });

    await newUser.save();

    return ResponseFormatter.created(res, 'User added successfully', newUser);
  } catch (error) {
    console.error('Error adding user:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return ResponseFormatter.conflict(res, `${field} already exists`);
    }

    return ResponseFormatter.error(res, 'Failed to add user', error.message);
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const users = await User.find()
      .select('-password')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments();

    return ResponseFormatter.paginated(res, 'Users retrieved successfully', users, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return ResponseFormatter.error(res, 'Failed to fetch users', error.message);
  }
};

// Delete a user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return ResponseFormatter.notFound(res, 'User not found');
    }

    return ResponseFormatter.success(res, 'User deleted successfully');
  } catch (error) {
    console.error('Error deleting user:', error);
    
    if (error.name === 'CastError') {
      return ResponseFormatter.validationError(res, 'Invalid user ID');
    }

    return ResponseFormatter.error(res, 'Failed to delete user', error.message);
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return ResponseFormatter.notFound(res, 'User not found');
    }
    return ResponseFormatter.success(res, 'User retrieved successfully', user);
  } catch (error) {
    console.error('Error fetching user:', error);
    
    if (error.name === 'CastError') {
      return ResponseFormatter.validationError(res, 'Invalid user ID');
    }

    return ResponseFormatter.error(res, 'Failed to fetch user', error.message);
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const { name, email, contact, age, details, userIdProf, verified } = req.body;
    const userId = req.params.id;

    // Validate age if provided
    if (age !== undefined && (age < 1 || age > 150)) {
      return ResponseFormatter.validationError(res, 'Age must be between 1 and 150');
    }

    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (contact) updateData.contact = contact;
    if (age !== undefined) updateData.age = age;
    if (details) updateData.details = details;
    if (userIdProf !== undefined) updateData.userIdProf = userIdProf;

    // Only admin can update verified status
    if (verified && req.user && req.user.role === 'admin') {
      updateData.verified = verified;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return ResponseFormatter.notFound(res, 'User not found');
    }

    return ResponseFormatter.success(res, 'User updated successfully', user);
  } catch (error) {
    console.error('Error updating user:', error);
    
    if (error.name === 'CastError') {
      return ResponseFormatter.validationError(res, 'Invalid user ID');
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return ResponseFormatter.conflict(res, `${field} already exists`);
    }

    return ResponseFormatter.error(res, 'Failed to update user', error.message);
  }
};

module.exports = {
  getNearbyUsers,
  addUser,
  getAllUsers,
  deleteUser,
  getUserById,
  updateUserProfile,
};
