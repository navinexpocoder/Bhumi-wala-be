const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const PropertyCard = require('./models/propertyCardModel');
const PropertyPreview = require('./models/propertyPreviewModel');
const Property = require('./models/propertyModel');

async function seedPropertyCardsAndPreviews() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/property-selling');
    console.log('✅ Connected to MongoDB');

    // Get existing properties to link with cards and previews
    const properties = await Property.find().limit(3);
    
    if (properties.length === 0) {
      console.error('❌ No properties found. Please seed properties first.');
      process.exit(1);
    }

    console.log(`📦 Found ${properties.length} properties to link`);

    // Clear existing cards and previews
    await PropertyCard.deleteMany({});
    await PropertyPreview.deleteMany({});
    console.log('🗑️  Cleared existing cards and previews');

    // Step 1: Create Property Previews first (needed for PropertyCards)
    const previewData = properties.map((prop) => ({
      title: prop.title,
      description: prop.description,
      propertyType: prop.propertyType,
      listingType: prop.listingType,
      price: prop.price,
      negotiable: prop.negotiable || false,
      landSize: prop.landSize || 1,
      landUnit: prop.landUnit || 'acre',
      location: {
        address: prop.location.address,
        locality: prop.location.locality,
        city: prop.location.city,
        state: prop.location.state || 'Unknown',
        pincode: prop.location.pincode || '000000',
        coordinates: {
          lat: prop.location.coordinates?.lat || 0,
          lng: prop.location.coordinates?.lng || 0,
        },
      },
      bedrooms: prop.bedrooms || 0,
      bathrooms: prop.bathrooms || 0,
      area: prop.area || 1000,
      images: prop.media?.images || ['https://via.placeholder.com/400x300'],
      dealer: {
        name: prop.dealer?.name || 'Admin Dealer',
        phone: prop.dealer?.phone || '+919876543210',
        type: prop.dealer?.type || 'Agent',
        verified: true,
      },
      status: {
        featured: false,
        verified: prop.status?.verified || false,
        isActive: true,
        approvalStatus: 'approved',
        postedAt: new Date(),
      },
      views: Math.floor(Math.random() * 1000),
      saves: Math.floor(Math.random() * 100),
      contactClicks: Math.floor(Math.random() * 50),
    }));

    const createdPreviews = await PropertyPreview.insertMany(previewData);
    console.log(`✅ Created ${createdPreviews.length} property previews`);

    // Step 2: Create Property Cards that reference the previews
    const cardData = createdPreviews.map((preview, index) => ({
      propertyPreviewId: preview._id,
      title: preview.title,
      propertyType: preview.propertyType,
      listingType: preview.listingType,
      city: preview.location.city,
      locality: preview.location.locality,
      address: preview.location.address,
      price: preview.price,
      pricePerSqft: (preview.area && preview.area > 0) ? (preview.price / preview.area) : 1000,
      area: preview.area || 1000, // Required field
      areaUnit: 'sqft',
      bedrooms: preview.bedrooms || 0,
      bathrooms: preview.bathrooms || 0,
      coverImage: (preview.images && preview.images.length > 0) ? preview.images[0] : 'https://via.placeholder.com/400x300',
      imagesCount: (preview.images && Array.isArray(preview.images)) ? preview.images.length : 1,
      shortDescription: preview.title || 'Property card for ' + preview.title,
      dealerName: 'Admin Dealer',
      dealerType: 'Agent',
      dealerPhone: '+919876543210',
      dealerVerified: true,
      tags: index === 0 ? ['Featured', 'Verified'] : ['New', 'Verified'],
      amenitiesHighlight: ['Parking', 'Water', 'Electricity'],
      isActive: true,
      approvalStatus: 'approved',
      engagement: {
        clicks: Math.floor(Math.random() * 500),
        saves: Math.floor(Math.random() * 50),
        shares: Math.floor(Math.random() * 10),
      },
    }));

    const createdCards = await PropertyCard.insertMany(cardData);
    console.log(`✅ Created ${createdCards.length} property cards`);

    // Display summary
    console.log('\n📋 Seeding Summary:');
    console.log(`  ✅ Property Previews: ${createdPreviews.length}`);
    console.log(`  ✅ Property Cards: ${createdCards.length}`);
    console.log('\n🎉 All data seeded successfully!');

    console.log('\n📌 Test these endpoints:');
    console.log('  GET http://localhost:5000/api/property-cards');
    console.log('  GET http://localhost:5000/api/property-previews');
    console.log('  GET http://localhost:5000/api/property-cards/featured');
    console.log('  GET http://localhost:5000/api/property-previews/featured');

  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

seedPropertyCardsAndPreviews();
