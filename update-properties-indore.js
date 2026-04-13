const mongoose = require('mongoose');
require('dotenv').config();
const Property = require('./models/propertyModel');

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

// Indore, Madhya Pradesh and nearby areas coordinates
const indoreAreaCoordinates = [
  { lat: 22.7196, long: 75.8577, area: 'Indore City Center' },
  { lat: 22.7100, long: 75.8600, area: 'Indore - Palsikar Square' },
  { lat: 22.7250, long: 75.8500, area: 'Indore - Rajwada' },
  { lat: 22.7300, long: 75.8400, area: 'Indore - MG Road' },
  { lat: 22.7400, long: 75.8300, area: 'Indore - South Tukoganj' },
  { lat: 22.7500, long: 75.8200, area: 'Indore - Geeta Bhawan' },
  { lat: 22.7600, long: 75.8100, area: 'Indore - Sudama Nagar' },
  { lat: 22.7700, long: 75.8000, area: 'Indore - Prabhat Pura' },
  { lat: 22.7800, long: 75.7900, area: 'Indore - Khajrana' },
  { lat: 22.7900, long: 75.7800, area: 'Indore - Malwa Nagar' },
  { lat: 22.6500, long: 75.7500, area: 'Pithampur (near Indore)' },
  { lat: 22.6600, long: 75.7600, area: 'Pithampur - Industrial Area' },
  { lat: 22.6700, long: 75.7700, area: 'Pithampur - Residential' },
  { lat: 22.6800, long: 75.7800, area: 'Pithampur - Extension' },
  { lat: 22.5500, long: 75.9000, area: 'Mhow (near Indore)' },
  { lat: 22.5600, long: 75.9100, area: 'Mhow - Main Road' },
  { lat: 22.5700, long: 75.9200, area: 'Mhow - Cantonment' },
  { lat: 22.5800, long: 75.9300, area: 'Mhow - Residential Area' },
  { lat: 22.4500, long: 75.5000, area: 'Dewas (near Indore)' },
  { lat: 22.4600, long: 75.5100, area: 'Dewas - Main Market' },
  { lat: 22.4700, long: 75.5200, area: 'Dewas - Residential' },
  { lat: 22.4800, long: 75.5300, area: 'Dewas - Extension' },
  { lat: 23.1815, long: 75.7769, area: 'Ujjain (nearby)' },
  { lat: 23.1900, long: 75.7850, area: 'Ujjain - City Center' },
  { lat: 23.1700, long: 75.7600, area: 'Ujjain - Residential' },
  { lat: 23.4259, long: 75.0439, area: 'Ratlam (nearby)' },
  { lat: 23.4300, long: 75.0500, area: 'Ratlam - Main Area' },
  { lat: 23.4200, long: 75.0350, area: 'Ratlam - Extension' },
];

// Update properties with Indore area coordinates
const updateProperties = async () => {
  try {
    await connectDB();

    // Get all properties
    const properties = await Property.find({});
    
    if (properties.length === 0) {
      console.log('No properties found in database');
      process.exit(0);
    }

    console.log(`Found ${properties.length} properties to update`);
    console.log('Updating properties with Indore, Madhya Pradesh coordinates...\n');

    let updatedCount = 0;
    let coordinateIndex = 0;

    // Update each property with coordinates from Indore area
    for (const property of properties) {
      const coordData = indoreAreaCoordinates[coordinateIndex % indoreAreaCoordinates.length];
      
      property.location = {
        type: 'Point',
        coordinates: [coordData.long, coordData.lat],
      };
      
      // Update address to reflect Indore area
      property.address = `${coordData.area}, Madhya Pradesh`;
      
      await property.save();
      
      console.log(`✓ Updated: ${property.title}`);
      console.log(`  Location: ${coordData.area}`);
      console.log(`  Coordinates: ${coordData.lat}, ${coordData.long}`);
      console.log(`  Address: ${property.address}\n`);
      
      updatedCount++;
      coordinateIndex++;
    }

    console.log(`\n✅ Successfully updated ${updatedCount} properties!`);
    console.log('\nAll properties now located in Indore, Madhya Pradesh and nearby areas');
    console.log('\nIndore Coordinates:');
    console.log('- Latitude: 22.7196');
    console.log('- Longitude: 75.8577');
    console.log('\nIncluded nearby areas:');
    console.log('- Pithampur (Industrial Area)');
    console.log('- Mhow (Military Cantonment)');
    console.log('- Dewas (Educational Hub)');
    console.log('- Ujjain (Temple City)');
    console.log('- Ratlam (Railway Junction)');

    process.exit(0);
  } catch (error) {
    console.error('Error updating properties:', error.message);
    process.exit(1);
  }
};

// Run the update
updateProperties();
