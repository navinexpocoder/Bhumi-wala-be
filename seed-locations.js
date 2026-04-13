const mongoose = require('mongoose');
require('dotenv').config();
const Location = require('./models/locationModel');
const fs = require('fs');
const path = require('path');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/property-selling');
    console.log('MongoDB connected successfully');
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Seed locations from JSON file
const seedLocations = async () => {
  try {
    await connectDB();

    // Read JSON file
    const jsonPath = path.join(__dirname, 'lat-long-details.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf8');
    const locations = JSON.parse(jsonData);

    console.log(`Found ${locations.length} locations in JSON file`);

    // Clear existing locations
    console.log('Clearing existing locations...');
    await Location.deleteMany({});
    console.log('Existing locations cleared');

    // Process and insert locations
    console.log('Creating locations...');
    const locationDocs = locations.map((loc) => {
      const lat = parseFloat(loc.lat);
      const lon = parseFloat(loc.lon);

      // Validate coordinates
      if (isNaN(lat) || isNaN(lon)) {
        console.warn(`Invalid coordinates for ${loc.name}, ${loc.state}: lat=${loc.lat}, lon=${loc.lon}`);
        return null;
      }

      return {
        name: loc.name.trim(),
        state: loc.state.trim(),
        latitude: lat,
        longitude: lon,
        location: {
          type: 'Point',
          coordinates: [lon, lat], // GeoJSON format: [longitude, latitude]
        },
      };
    }).filter(loc => loc !== null); // Remove invalid entries

    // Insert locations
    const createdLocations = await Location.insertMany(locationDocs, { ordered: false });
    console.log(`${createdLocations.length} locations created successfully`);

    // Summary
    console.log('\n=== Seeding Summary ===');
    console.log(`Total locations: ${createdLocations.length}`);
    
    // Count by state
    const stateCount = await Location.aggregate([
      {
        $group: {
          _id: '$state',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    console.log('\nTop 10 states by location count:');
    stateCount.slice(0, 10).forEach((state) => {
      console.log(`  ${state._id}: ${state.count} locations`);
    });

    console.log('\n✅ Locations seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding locations:', error);
    
    // Handle duplicate key errors gracefully
    if (error.code === 11000) {
      console.log('Some locations already exist. Continuing...');
      const count = await Location.countDocuments();
      console.log(`Total locations in database: ${count}`);
    }
    
    process.exit(1);
  }
};

// Run seed
seedLocations();
