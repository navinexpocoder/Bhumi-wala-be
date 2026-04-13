const mongoose = require('mongoose');
const User = require('./models/userModel');
require('dotenv').config();

const verifyUserRole = async () => {
  try {
    // Connect to MongoDB
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/property-selling',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    console.log('✓ Connected to MongoDB\n');

    // Get all users with role distribution
    const allUsers = await User.find().select('name email role');
    
    console.log('📋 All Users in Database:');
    console.log('═══════════════════════════════════════\n');
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}\n`);
    });

    // Get role statistics
    const roleStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    console.log('\n📊 Role Distribution:');
    console.log('═══════════════════════════════════════');
    roleStats.forEach((stat) => {
      console.log(`${stat._id || 'undefined'}: ${stat.count}`);
    });

    // Check for "user" role
    const userRoleCount = await User.countDocuments({ role: 'user' });
    if (userRoleCount > 0) {
      console.log(`\n⚠️  WARNING: Found ${userRoleCount} users with role "user"`);
      console.log('Running migration to update them...\n');
      
      // Update all users with 'user' role to 'buyer'
      const result = await User.updateMany(
        { role: 'user' },
        { $set: { role: 'buyer' } }
      );
      
      console.log(`✓ Updated ${result.modifiedCount} users from "user" to "buyer"`);
      
      // Verify the update
      const updatedRoleStats = await User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]);

      console.log('\n📊 Updated Role Distribution:');
      console.log('═══════════════════════════════════════');
      updatedRoleStats.forEach((stat) => {
        console.log(`${stat._id || 'undefined'}: ${stat.count}`);
      });
    } else {
      console.log('\n✅ All users already have correct roles (no "user" role found)');
    }

    console.log('\n');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
};

verifyUserRole();
