const mongoose = require('mongoose');
const User = require('./models/userModel');
const Property = require('./models/propertyModel');
const Location = require('./models/locationModel');
const Lead = require('./models/leadModel');
require('dotenv').config();

const migrateDB = async () => {
  try {
    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/property-selling');
    console.log('MongoDB connected successfully');

    // Create indexes for User model
    console.log('Creating User indexes...');
    await User.collection.createIndex({ userId: 1 }, { unique: true, sparse: true });
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ isActive: 1 });
    await User.collection.createIndex({ isBlocked: 1 });
    await User.collection.createIndex({ verified: 1 });
    await User.collection.createIndex({ createdAt: -1 });
    console.log('✓ User indexes created');

    // Create indexes for Property model
    console.log('Creating Property indexes...');
    await Property.collection.createIndex({ location: '2dsphere' });
    await Property.collection.createIndex({ sellerId: 1 });
    await Property.collection.createIndex({ status: 1 });
    await Property.collection.createIndex({ propertyType: 1 });
    await Property.collection.createIndex({ price: 1 });
    await Property.collection.createIndex({ createdAt: -1 });
    console.log('✓ Property indexes created');

    // Create indexes for Location model
    console.log('Creating Location indexes...');
    await Location.collection.createIndex({ location: '2dsphere' });
    await Location.collection.createIndex({ name: 1 }, { sparse: true });
    await Location.collection.createIndex({ state: 1 }, { sparse: true });
    await Location.collection.createIndex({ name: 1, state: 1 }, { unique: true });
    await Location.collection.createIndex({ createdAt: -1 });
    console.log('✓ Location indexes created');

    // Create indexes for Lead model
    console.log('Creating Lead indexes...');
    await Lead.collection.createIndex({ userId: 1, propertyId: 1 }, { unique: true });
    await Lead.collection.createIndex({ userId: 1, createdAt: -1 });
    await Lead.collection.createIndex({ propertyId: 1, createdAt: -1 });
    await Lead.collection.createIndex({ sellerId: 1, createdAt: -1 });
    await Lead.collection.createIndex({ createdAt: -1 });
    console.log('✓ Lead indexes created');

    console.log('\n✅ Database migration completed successfully!');
    console.log('All tables and indexes have been created/updated according to models.');
    console.log('\nNew Fields:');
    console.log('  - User.id: Stores user ID document (image URL, base64, or string)');
    console.log('  - User.verified: Stores verification status (pending, approve, reject)');
    console.log('  - Lead: New table for tracking property views with user and property details');
    console.log('\nSupported User Roles:');
    console.log('  - admin (superadmin): Full control over all properties and users');
    console.log('  - agent: Can add, update, delete all properties');
    console.log('  - seller: Can add, update, delete only their own properties');
    console.log('  - user: Can only view properties');

    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error.message);
    process.exit(1);
  }
};

migrateDB();
