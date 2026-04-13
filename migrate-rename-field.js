const mongoose = require('mongoose');
const User = require('./models/userModel');
require('dotenv').config();

const migrateFieldName = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/property_selling', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✓ Connected to MongoDB');

    // Check if old field exists
    const userCollection = mongoose.connection.collection('users');
    
    // Rename field from userIdProf to useridprof
    const result = await userCollection.updateMany(
      { userIdProf: { $exists: true } },
      { $rename: { userIdProf: 'useridprof' } }
    );

    console.log(`✓ Updated ${result.modifiedCount} documents`);
    console.log(`✓ Field renamed: userIdProf → useridprof`);

    // Verify the migration
    const sampleUser = await User.findOne({ useridprof: { $exists: true } });
    if (sampleUser) {
      console.log('\n✓ Migration successful! Sample user with useridprof field:');
      console.log({
        id: sampleUser._id,
        name: sampleUser.name,
        useridprof: sampleUser.useridprof,
        verified: sampleUser.verified,
      });
    }

    // Count users with useridprof
    const countWithField = await User.countDocuments({ useridprof: { $exists: true, $ne: null } });
    console.log(`\n✓ Total users with useridprof data: ${countWithField}`);

    console.log('\n✓ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  }
};

migrateFieldName();
