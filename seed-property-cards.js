const mongoose = require('mongoose');
require('dotenv').config();
const PropertyPreview = require('./models/propertyPreviewModel');
const PropertyCard = require('./models/propertyCardModel');
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

// Seed property previews and cards
const seedPropertyCards = async () => {
  try {
    await connectDB();

    // Get first seller user
    let seller = await User.findOne({ role: 'seller', verified: 'approve' });
    if (!seller) {
      console.log('No seller found. Creating a test seller...');
      seller = await User.create({
        name: 'Seller - Agriculture',
        email: 'seller-ag@test.com',
        password: 'seller123',
        role: 'seller',
        verified: 'approve',
        isActive: true,
      });
    }

    console.log(`Using seller: ${seller.name} (${seller._id})`);

    // Clear existing data
    console.log('Clearing existing property previews...');
    await PropertyPreview.deleteMany({});
    console.log('Clearing existing property cards...');
    await PropertyCard.deleteMany({});

    // Sample Property Previews (Agriculture/Special Properties)
    const propertyPreviews = [
      {
        title: 'Agricultural Land in Chanderi',
        description: 'Beautiful agricultural land with good soil quality, well, and storage facility. Perfect for farming.',
        propertyType: 'Agriculture Land',
        listingType: 'sale',
        price: 1500000,
        negotiable: true,
        landSize: 5,
        landUnit: 'acre',
        location: {
          address: 'Chanderi, Madhya Pradesh',
          locality: 'Chanderi',
          city: 'Chanderi',
          state: 'Madhya Pradesh',
          pincode: '456545',
          coordinates: {
            lat: 23.8,
            lng: 76.1,
          },
        },
        dealer: {
          name: seller.name,
          phone: '+91-9876543210',
          type: 'Owner',
          verified: true,
          dealerId: seller._id,
        },
        media: {
          images: ['https://images.unsplash.com/photo-1625246333195-78d9c38ad576?w=1200&h=800&fit=crop'],
        },
        sellerId: seller._id,
        status: 'approved',
      },
      {
        title: 'Farmland with Farm House',
        description: 'Spacious farmland with a beautiful farm house, water tank, and equipment storage. Ready for agriculture production.',
        propertyType: 'Farmland',
        listingType: 'sale',
        price: 2500000,
        negotiable: false,
        landSize: 10,
        landUnit: 'bigha',
        location: {
          address: 'Near Dhar, Madhya Pradesh',
          locality: 'Dhar',
          city: 'Dhar',
          state: 'Madhya Pradesh',
          pincode: '454001',
          coordinates: {
            lat: 22.6,
            lng: 75.3,
          },
        },
        dealer: {
          name: seller.name,
          phone: '+91-9876543220',
          type: 'Owner',
          verified: true,
          dealerId: seller._id,
        },
        media: {
          images: ['https://images.unsplash.com/photo-1574943320219-553eb20c72ff?w=1200&h=800&fit=crop'],
        },
        sellerId: seller._id,
        status: 'approved',
      },
      {
        title: 'Luxury Farmhouse with Resort Facilities',
        description: 'Premium farmhouse with resort-like amenities, swimming pool, guest rooms, and beautiful gardens. Ideal for agri-tourism.',
        propertyType: 'Farmhouse',
        listingType: 'rent',
        price: 50000,
        negotiable: true,
        landSize: 3,
        landUnit: 'acre',
        location: {
          address: 'Rau, Indore',
          locality: 'Rau',
          city: 'Indore',
          state: 'Madhya Pradesh',
          pincode: '452020',
          coordinates: {
            lat: 22.5,
            lng: 75.5,
          },
        },
        dealer: {
          name: seller.name,
          phone: '+91-9876543230',
          type: 'Owner',
          verified: true,
          dealerId: seller._id,
        },
        media: {
          images: ['https://images.unsplash.com/photo-1570129477492-45928003facb?w=1200&h=800&fit=crop'],
        },
        sellerId: seller._id,
        status: 'approved',
      },
      {
        title: 'Resort Property with Lake View',
        description: 'Beautiful resort property with lake view, multiple cottages, conference hall, and outdoor activities area. Perfect for hospitality business.',
        propertyType: 'Resort',
        listingType: 'sale',
        price: 5000000,
        negotiable: true,
        landSize: 25,
        landUnit: 'acre',
        location: {
          address: 'Mahakal Hills, Ujjain',
          locality: 'Mahakal Hills',
          city: 'Ujjain',
          state: 'Madhya Pradesh',
          pincode: '456010',
          coordinates: {
            lat: 23.2,
            lng: 75.8,
          },
        },
        dealer: {
          name: seller.name,
          phone: '+91-9876543240',
          type: 'Owner',
          verified: true,
          dealerId: seller._id,
        },
        media: {
          images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=800&fit=crop'],
        },
        sellerId: seller._id,
        status: 'approved',
      },
    ];

    console.log('Creating property previews...');
    const createdPreviews = await PropertyPreview.insertMany(propertyPreviews);
    console.log(`✅ Created ${createdPreviews.length} property previews`);

    // Create Property Cards from previews
    const propertyCards = createdPreviews.map((preview, idx) => ({
      propertyPreviewId: preview._id,
      title: preview.title,
      propertyType: preview.propertyType,
      listingType: preview.listingType,
      city: preview.location.city,
      locality: preview.location.locality,
      address: preview.location.address,
      price: preview.price,
      priceUnit: preview.listingType === 'rent' ? 'month' : 'total',
      area: preview.landSize,
      areaUnit: preview.landUnit,
      coverImage: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&h=800&fit=crop',
      shortDescription: preview.description.substring(0, 300),
      dealerName: seller.name,
      dealerPhone: '+91-9876543210',
      dealerEmail: seller.email,
      dealerType: 'Owner',
      dealerVerified: true,
      dealerId: seller._id,
      sellerId: preview.sellerId,
      status: 'approved',
    }));

    console.log('Creating property cards...');
    const createdCards = await PropertyCard.insertMany(propertyCards);
    console.log(`✅ Created ${createdCards.length} property cards`);

    console.log('\n--- Property Cards Summary ---');
    createdCards.forEach((card, index) => {
      console.log(`${index + 1}. ${card.title} - ₹${card.price.toLocaleString('en-IN')}`);
    });

    console.log('\n✨ Property Cards & Previews seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedPropertyCards();
