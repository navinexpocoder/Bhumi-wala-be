const mongoose = require('mongoose');
const User = require('./models/userModel');
require('dotenv').config();

const migrateUserToBuyer = async () => {
  try {
    // Connect to MongoDB
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/property-selling',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    console.log('✓ Connected to MongoDB');

    // Get count of users with 'user' role before migration
    const countBefore = await User.countDocuments({ role: 'user' });
    console.log(`\n📊 Statistics before migration:`);
    console.log(`   Users with 'user' role: ${countBefore}`);

    // Get all roles count
    const roleStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    console.log('\n   Current role distribution:');
    roleStats.forEach((stat) => {
      console.log(`   - ${stat._id || 'undefined'}: ${stat.count}`);
    });

    // Update all users with 'user' role to 'buyer'
    const result = await User.updateMany(
      { role: 'user' },
      { $set: { role: 'buyer' } }
    );

    console.log(`\n✓ Migration completed!`);
    console.log(`   Modified records: ${result.modifiedCount}`);
    console.log(`   Matched records: ${result.matchedCount}`);

    // Get count after migration
    const countAfter = await User.countDocuments({ role: 'buyer' });
    const countUserAfter = await User.countDocuments({ role: 'user' });

    console.log(`\n📊 Statistics after migration:`);
    console.log(`   Users with 'buyer' role: ${countAfter}`);
    console.log(`   Users with 'user' role: ${countUserAfter}`);

    // Get updated role distribution
    const updatedRoleStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    console.log('\n   Updated role distribution:');
    updatedRoleStats.forEach((stat) => {
      console.log(`   - ${stat._id || 'undefined'}: ${stat.count}`);
    });

    // Get sample user to verify
    const sampleUser = await User.findOne({ role: 'buyer' });
    if (sampleUser) {
      console.log('\n✓ Sample updated user:');
      console.log({
        id: sampleUser._id,
        name: sampleUser.name,
        email: sampleUser.email,
        role: sampleUser.role,
      });
    }

    console.log('\n✅ Migration successful! All "user" roles have been changed to "buyer".\n');

    process.exit(0);
  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
};

// Run migration
migrateUserToBuyer();
