const mongoose = require('mongoose');
require('dotenv').config();
const Property = require('./models/propertyModel');
const User = require('./models/userModel');

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

// Seed sample properties
const seedProperties = async () => {
  try {
    await connectDB();

    // Get first seller user
    let seller = await User.findOne({ role: 'seller', verified: 'approve' });
    if (!seller) {
      console.log('No seller found. Creating a test seller...');
      seller = await User.create({
        name: 'Test Seller',
        email: 'seller@test.com',
        password: 'seller123',
        role: 'seller',
        verified: 'approve',
        isActive: true,
      });
    }

    console.log(`Using seller: ${seller.name} (${seller._id})`);

    // Clear existing properties
    console.log('Clearing existing properties...');
    const deleteResult = await Property.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing properties`);

    // Sample properties around Indore
    const properties = [
      {
        title: 'Beautiful Modern Apartment in Central Indore',
        description: 'Spacious 3-bedroom apartment with modern amenities, parking, and garden area. Located in a prime residential area close to schools and shopping centers.',
        price: 4500000,
        propertyType: 'Apartment',
        address: 'MG Road, Indore',
        locationText: 'Central Indore',
        location: {
          type: 'Point',
          coordinates: [75.8577, 22.7196], // Indore center
        },
        images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop'],
        sellerId: seller._id,
        status: 'approved',
        bedrooms: 3,
        bathrooms: 2,
      },
      {
        title: 'Luxury Villa with Swimming Pool',
        description: 'Premium 4-bedroom villa with modern kitchen, swimming pool, gym, and beautiful garden. Situated in an exclusive gated community.',
        price: 12000000,
        propertyType: 'Resort',
        address: 'Ujjain Road, Indore',
        locationText: 'Luxury Residential Area',
        location: {
          type: 'Point',
          coordinates: [75.9142, 22.7639],
        },
        images: ['https://images.unsplash.com/photo-1512917774080-9b274b3b313a?w=1200&h=800&fit=crop'],
        sellerId: seller._id,
        status: 'approved',
        bedrooms: 4,
        bathrooms: 3,
      },
      {
        title: 'Commercial Space - Prime Location',
        description: 'Ideal commercial space for office or retail business. High foot traffic area, ample parking, and modern infrastructure.',
        price: 3500000,
        propertyType: 'Commercial',
        address: 'AB Road, Indore',
        locationText: 'Business District',
        location: {
          type: 'Point',
          coordinates: [75.8442, 22.7383],
        },
        images: ['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=800&fit=crop'],
        sellerId: seller._id,
        status: 'approved',
        bedrooms: 0,
        bathrooms: 1,
      },
      {
        title: 'Cozy 2-Bedroom Flat Near Market',
        description: 'Well-maintained 2-bedroom apartment close to markets, schools, and public transport. Ready to move in immediately.',
        price: 2500000,
        propertyType: 'Apartment',
        address: 'Ralamandal Area, Indore',
        locationText: 'Residential Zone',
        location: {
          type: 'Point',
          coordinates: [75.8672, 22.7092],
        },
        images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=800&fit=crop'],
        sellerId: seller._id,
        status: 'approved',
        bedrooms: 2,
        bathrooms: 2,
      },
      {
        title: 'Independent House - Spacious Plot',
        description: '5-bedroom independent house with large plot, perfect for a family. Includes servant quarters and modern amenities.',
        price: 8500000,
        propertyType: 'Farmhouse',
        address: 'Khajrana, Indore',
        locationText: 'Prime Residential',
        location: {
          type: 'Point',
          coordinates: [75.8731, 22.6958],
        },
        images: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&h=800&fit=crop'],
        sellerId: seller._id,
        status: 'approved',
        bedrooms: 5,
        bathrooms: 3,
      },
      {
        title: 'Premium Penthouse Apartment',
        description: 'Luxurious penthouse with panoramic city views, modern design, and high-end finishes. Includes parking and gym access.',
        price: 9500000,
        propertyType: 'Apartment',
        address: 'South Indore Hi-Rise Complex',
        locationText: 'Premium Zone',
        location: {
          type: 'Point',
          coordinates: [75.8912, 22.6812],
        },
        images: ['https://images.unsplash.com/photo-1512917774080-9b274b3b313a?w=1200&h=800&fit=crop'],
        sellerId: seller._id,
        status: 'approved',
        bedrooms: 3,
        bathrooms: 3,
      },
      {
        title: 'Plot for Residential Development',
        description: 'Large plot suitable for building a residential complex or individual house. Good connectivity and clear title.',
        price: 5000000,
        propertyType: 'Agriculture Land',
        address: 'Sector 8, Indore',
        locationText: 'Development Area',
        location: {
          type: 'Point',
          coordinates: [75.9156, 22.7112],
        },
        images: ['https://images.unsplash.com/photo-1625246333195-78d9c38ad576?w=1200&h=800&fit=crop'],
        sellerId: seller._id,
        status: 'approved',
        bedrooms: 0,
        bathrooms: 0,
      },
      {
        title: 'Farmhouse with Agricultural Land',
        description: 'Scenic farmhouse on 10 acres of agricultural land. Perfect for retreat or farming business. Fresh water well included.',
        price: 15000000,
        propertyType: 'Farmhouse',
        address: 'Outskirts of Indore',
        locationText: 'Agricultural Zone',
        location: {
          type: 'Point',
          coordinates: [75.7800, 22.5800],
        },
        images: ['https://images.unsplash.com/photo-1570129477492-45928003facb?w=1200&h=800&fit=crop'],
        sellerId: seller._id,
        status: 'approved',
        bedrooms: 3,
        bathrooms: 2,
      },
    ];

    // Create properties
    console.log('Creating sample properties...');
    const createdProperties = await Property.insertMany(properties);
    console.log(`✅ Successfully created ${createdProperties.length} sample properties`);

    // Display summary
    console.log('\n--- Properties Summary ---');
    createdProperties.forEach((prop, index) => {
      console.log(`${index + 1}. ${prop.title} - ₹${prop.price.toLocaleString('en-IN')}`);
    });

    // Check total count
    const totalCount = await Property.countDocuments();
    console.log(`\n📊 Total properties in database: ${totalCount}`);

    // Check approved count
    const approvedCount = await Property.countDocuments({ status: 'approved' });
    console.log(`✅ Approved properties: ${approvedCount}`);

    console.log('\n✨ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  }
};

// Run seeding
seedProperties();
