const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/userModel');
const Property = require('./models/propertyModel');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/property-selling');
    console.log('MongoDB connected successfully\n');
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const verifyData = async () => {
  try {
    await connectDB();

    // Count users by role
    const adminCount = await User.countDocuments({ role: 'admin' });
    const sellerCount = await User.countDocuments({ role: 'seller' });
    const userCount = await User.countDocuments({ role: 'user' });
    const totalUsers = await User.countDocuments({});

    // Count properties by status
    const approvedCount = await Property.countDocuments({ status: 'approved' });
    const pendingCount = await Property.countDocuments({ status: 'pending' });
    const soldCount = await Property.countDocuments({ status: 'sold' });
    const totalProperties = await Property.countDocuments({});

    // Get property types distribution
    const propertyTypes = await Property.aggregate([
      {
        $group: {
          _id: '$propertyType',
          count: { $sum: 1 },
        },
      },
    ]);

    console.log('=== Database Verification ===\n');
    console.log('📊 Users:');
    console.log(`   Admin: ${adminCount}`);
    console.log(`   Seller: ${sellerCount}`);
    console.log(`   User: ${userCount}`);
    console.log(`   Total: ${totalUsers}\n`);

    console.log('🏠 Properties:');
    console.log(`   Approved: ${approvedCount}`);
    console.log(`   Pending: ${pendingCount}`);
    console.log(`   Sold: ${soldCount}`);
    console.log(`   Total: ${totalProperties}\n`);

    console.log('📋 Property Types:');
    propertyTypes.forEach((type) => {
      console.log(`   ${type._id}: ${type.count}`);
    });

    console.log('\n✅ Database verification complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error verifying database:', error);
    process.exit(1);
  }
};

verifyData();
