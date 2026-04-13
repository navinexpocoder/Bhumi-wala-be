const mongoose = require('mongoose');
const User = require('./models/userModel');
require('dotenv').config();

const revertFieldName = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/property_selling', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✓ Connected to MongoDB');

    // Check if new field exists
    const userCollection = mongoose.connection.collection('users');
    
    // Rename field from useridprof back to userIdProf
    const result = await userCollection.updateMany(
      { useridprof: { $exists: true } },
      { $rename: { useridprof: 'userIdProf' } }
    );

    console.log(`✓ Updated ${result.modifiedCount} documents`);
    console.log(`✓ Field renamed: useridprof → userIdProf`);

    // Verify the migration
    const sampleUser = await User.findOne({ userIdProf: { $exists: true } });
    if (sampleUser) {
      console.log('\n✓ Revert successful! Sample user with userIdProf field:');
      console.log({
        id: sampleUser._id,
        name: sampleUser.name,
        userIdProf: sampleUser.userIdProf,
        verified: sampleUser.verified,
      });
    }

    // Count users with userIdProf
    const countWithField = await User.countDocuments({ userIdProf: { $exists: true, $ne: null } });
    console.log(`\n✓ Total users with userIdProf data: ${countWithField}`);

    console.log('\n✓ Field revert completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Revert failed:', error.message);
    process.exit(1);
  }
};

revertFieldName();
