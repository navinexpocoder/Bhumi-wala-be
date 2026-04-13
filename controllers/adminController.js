const Property = require('../models/propertyModel');
const User = require('../models/userModel');
const ResponseFormatter = require('../utils/responseFormatter');
const { validatePropertyStatus } = require('../utils/validation');
const { PROPERTY_STATUS } = require('../utils/constants');

// @desc    Approve or reject property
// @route   PUT /api/admin/property/:id/approve
// @access  Private (Admin only)
exports.approveProperty = async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status
    if (!status || !Object.values(PROPERTY_STATUS).includes(status)) {
      return ResponseFormatter.validationError(res, `Valid status required. Use: ${Object.values(PROPERTY_STATUS).join(', ')}`);
    }

    const property = await Property.findById(req.params.id);

    if (!property) {
      return ResponseFormatter.notFound(res, 'Property not found');
    }

    property.status = status;
    await property.save();
    await property.populate('sellerId', 'name email');

    return ResponseFormatter.success(res, `Property status updated to ${status}`, property);
  } catch (error) {
    console.error('Approve property error:', error);
    if (error.name === 'CastError') {
      return ResponseFormatter.validationError(res, 'Invalid property ID');
    }
    return ResponseFormatter.error(res, 'Failed to update property status', error.message);
  }
};

// @desc    Get all users and sellers
// @route   GET /api/admin/users
// @access  Private (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;

    const query = {};
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(query);

    return ResponseFormatter.paginated(res, 'Users retrieved successfully', users, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('Get all users error:', error);
    return ResponseFormatter.error(res, 'Failed to fetch users', error.message);
  }
};

// @desc    Get all properties (including pending)
// @route   GET /api/admin/properties
// @access  Private (Admin only)
exports.getAllProperties = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const properties = await Property.find(query)
      .populate('sellerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Property.countDocuments(query);

    return ResponseFormatter.paginated(res, 'Properties retrieved successfully', properties, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('Get all properties error:', error);
    return ResponseFormatter.error(res, 'Failed to fetch properties', error.message);
  }
};

// @desc    Create user (Super Admin only)
// @route   POST /api/admin/users
// @access  Private (Admin only)
exports.createUser = async (req, res) => {
  try {
    const { userId, name, email, password, age, contact, details, role } = req.body;

    // Validation - required fields
    if (!name || !email || !password) {
      return ResponseFormatter.validationError(res, 'Name, email, and password are required');
    }

    // Check if email already exists
    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return ResponseFormatter.conflict(res, 'Email already exists');
    }

    // Check if userId already exists (if provided)
    if (userId) {
      const userIdExists = await User.findOne({ userId });
      if (userIdExists) {
        return ResponseFormatter.conflict(res, 'User ID already exists');
      }
    }

    // Validate role if provided
    if (role && !['admin', 'seller', 'user', 'agent'].includes(role)) {
      return ResponseFormatter.validationError(res, 'Invalid role. Must be admin, seller, user, or agent');
    }

    // Validate age if provided
    if (age !== undefined && (age < 1 || age > 150)) {
      return ResponseFormatter.validationError(res, 'Age must be between 1 and 150');
    }

    // Create user
    const user = await User.create({
      userId,
      name,
      email: email.toLowerCase(),
      password,
      age,
      contact,
      details,
      role: role || 'user',
    });

    const userResponse = await User.findById(user._id).select('-password');

    return ResponseFormatter.created(res, 'User created successfully', userResponse);
  } catch (error) {
    console.error('Create user error:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return ResponseFormatter.conflict(res, `${field} already exists`);
    }

    return ResponseFormatter.error(res, 'Failed to create user', error.message);
  }
};

// @desc    Update user (Super Admin only)
// @route   PUT /api/admin/users/:id
// @access  Private (Admin only)
exports.updateUser = async (req, res) => {
  try {
    const { userId, name, email, password, age, contact, details, role } = req.body;
    const userIdParam = req.params.id;

    const user = await User.findById(userIdParam);

    if (!user) {
      return ResponseFormatter.notFound(res, 'User not found');
    }

    // Check if email is being changed and already exists
    if (email && email.toLowerCase() !== user.email) {
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return ResponseFormatter.conflict(res, 'Email already exists');
      }
      user.email = email.toLowerCase();
    }

    // Check if userId is being changed and already exists
    if (userId && userId !== user.userId) {
      const userIdExists = await User.findOne({ userId });
      if (userIdExists) {
        return ResponseFormatter.conflict(res, 'User ID already exists');
      }
      user.userId = userId;
    }

    // Update fields
    if (name) user.name = name;
    if (password) user.password = password; // Will be hashed by pre-save hook
    if (age !== undefined) {
      if (age < 1 || age > 150) {
        return ResponseFormatter.validationError(res, 'Age must be between 1 and 150');
      }
      user.age = age;
    }
    if (contact !== undefined) user.contact = contact;
    if (details !== undefined) user.details = details;
    if (role && ['admin', 'seller', 'user', 'agent'].includes(role)) {
      user.role = role;
    }

    await user.save();
    const updatedUser = await User.findById(user._id).select('-password');

    return ResponseFormatter.success(res, 'User updated successfully', updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    
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

// @desc    Delete user (Super Admin only)
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return ResponseFormatter.notFound(res, 'User not found');
    }

    // Prevent deleting yourself (optional)
    if (user._id.toString() === req.user.id) {
      return ResponseFormatter.validationError(res, 'You cannot delete your own account');
    }

    await User.findByIdAndDelete(req.params.id);

    return ResponseFormatter.success(res, 'User deleted successfully');
  } catch (error) {
    console.error('Delete user error:', error);
    
    if (error.name === 'CastError') {
      return ResponseFormatter.validationError(res, 'Invalid user ID');
    }

    return ResponseFormatter.error(res, 'Failed to delete user', error.message);
  }
};

// @desc    Get single user (Super Admin only)
// @route   GET /api/admin/users/:id
// @access  Private (Admin only)
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return ResponseFormatter.notFound(res, 'User not found');
    }

    return ResponseFormatter.success(res, 'User retrieved successfully', user);
  } catch (error) {
    console.error('Get user error:', error);
    
    if (error.name === 'CastError') {
      return ResponseFormatter.validationError(res, 'Invalid user ID');
    }

    return ResponseFormatter.error(res, 'Failed to fetch user', error.message);
  }
};

// @desc    Get active users list
// @route   GET /api/admin/users/active
// @access  Private (Admin only)
exports.getActiveUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;

    const query = {
      isActive: true,
      isBlocked: false,
    };

    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ lastLogin: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(query);

    return ResponseFormatter.paginated(res, 'Active users retrieved successfully', users, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('Get active users error:', error);
    return ResponseFormatter.error(res, 'Failed to fetch active users', error.message);
  }
};

// @desc    Get agent details (sellers)
// @route   GET /api/admin/agents
// @access  Private (Admin only)
exports.getAgents = async (req, res) => {
  try {
    const { isActive, isBlocked, page = 1, limit = 10 } = req.query;

    const query = {
      role: 'seller', // Agents are sellers
    };

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (isBlocked !== undefined) {
      query.isBlocked = isBlocked === 'true';
    }

    const agents = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Get property count for each agent
    const agentsWithStats = await Promise.all(
      agents.map(async (agent) => {
        const propertyCount = await Property.countDocuments({ sellerId: agent._id });
        const approvedCount = await Property.countDocuments({
          sellerId: agent._id,
          status: 'approved',
        });
        const pendingCount = await Property.countDocuments({
          sellerId: agent._id,
          status: 'pending',
        });
        const soldCount = await Property.countDocuments({
          sellerId: agent._id,
          status: 'sold',
        });

        return {
          ...agent.toObject(),
          stats: {
            totalProperties: propertyCount,
            approved: approvedCount,
            pending: pendingCount,
            sold: soldCount,
          },
        };
      })
    );

    const total = await User.countDocuments(query);

    return ResponseFormatter.paginated(res, 'Agents retrieved successfully', agentsWithStats, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('Get agents error:', error);
    return ResponseFormatter.error(res, 'Failed to fetch agents', error.message);
  }
};

// @desc    Get single agent details
// @route   GET /api/admin/agents/:id
// @access  Private (Admin only)
exports.getAgentDetails = async (req, res) => {
  try {
    const agent = await User.findOne({
      _id: req.params.id,
      role: 'seller',
    }).select('-password');

    if (!agent) {
      return ResponseFormatter.notFound(res, 'Agent not found');
    }

    // Get agent's properties
    const properties = await Property.find({ sellerId: agent._id })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get statistics
    const totalProperties = await Property.countDocuments({ sellerId: agent._id });
    const approvedCount = await Property.countDocuments({
      sellerId: agent._id,
      status: 'approved',
    });
    const pendingCount = await Property.countDocuments({
      sellerId: agent._id,
      status: 'pending',
    });
    const soldCount = await Property.countDocuments({
      sellerId: agent._id,
      status: 'sold',
    });

    const agentData = {
      agent: {
        ...agent.toObject(),
      },
      stats: {
        totalProperties,
        approved: approvedCount,
        pending: pendingCount,
        sold: soldCount,
      },
      recentProperties: properties,
    };

    return ResponseFormatter.success(res, 'Agent details retrieved successfully', agentData);
  } catch (error) {
    console.error('Get agent details error:', error);
    
    if (error.name === 'CastError') {
      return ResponseFormatter.validationError(res, 'Invalid agent ID');
    }

    return ResponseFormatter.error(res, 'Failed to fetch agent details', error.message);
  }
};

// @desc    Block/Unblock agent
// @route   PUT /api/admin/agents/:id/block
// @access  Private (Admin only)
exports.blockUnblockAgent = async (req, res) => {
  try {
    const { action } = req.body; // 'block' or 'unblock'

    if (!action || !['block', 'unblock'].includes(action)) {
      return ResponseFormatter.validationError(res, 'Please provide action: "block" or "unblock"');
    }

    const agent = await User.findOne({
      _id: req.params.id,
      role: 'seller',
    });

    if (!agent) {
      return ResponseFormatter.notFound(res, 'Agent not found');
    }

    // Prevent blocking yourself
    if (agent._id.toString() === req.user.id) {
      return ResponseFormatter.validationError(res, 'You cannot block/unblock your own account');
    }

    agent.isBlocked = action === 'block';
    if (action === 'block') {
      agent.isActive = false; // Also deactivate when blocking
    } else {
      agent.isActive = true; // Activate when unblocking
    }

    await agent.save();

    const agentData = {
      id: agent._id,
      name: agent.name,
      email: agent.email,
      isBlocked: agent.isBlocked,
      isActive: agent.isActive,
    };

    return ResponseFormatter.success(
      res, 
      `Agent ${action === 'block' ? 'blocked' : 'unblocked'} successfully`, 
      { agent: agentData }
    );
  } catch (error) {
    console.error('Block/unblock agent error:', error);
    
    if (error.name === 'CastError') {
      return ResponseFormatter.validationError(res, 'Invalid agent ID');
    }

    return ResponseFormatter.error(res, 'Failed to update agent status', error.message);
  }
};

// @desc    Create a new agent
// @route   POST /api/admin/agents
// @access  Private (Admin only)
exports.createAgent = async (req, res) => {
  try {
    const { name, email, password, contact, details, age } = req.body;

    // Validation
    if (!name || !email || !password) {
      return ResponseFormatter.validationError(res, 'Name, email, and password are required');
    }

    // Check if email already exists
    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return ResponseFormatter.conflict(res, 'Email already exists');
    }

    // Validate age if provided
    if (age !== undefined && (age < 1 || age > 150)) {
      return ResponseFormatter.validationError(res, 'Age must be between 1 and 150');
    }

    // Create agent with role 'seller'
    const agent = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      contact,
      details,
      age,
      role: 'seller', // Set role as seller (agent)
      isActive: true,
      isBlocked: false,
    });

    // Get the created agent without password
    const agentResponse = await User.findById(agent._id).select('-password');

    return ResponseFormatter.created(res, 'Agent created successfully', agentResponse);
  } catch (error) {
    console.error('Create agent error:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return ResponseFormatter.conflict(res, `${field} already exists`);
    }

    return ResponseFormatter.error(res, 'Failed to create agent', error.message);
  }
};
