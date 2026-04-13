const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Property = require('./models/propertyModel');
const User = require('./models/userModel');

// Generate 50 varied properties
const generateProperties = () => {
  const cities = ['Indore', 'Nashik', 'Vadodara', 'Ajmer', 'Jaipur', 'Udaipur', 'Surat', 'Pune', 'Mumbai', 'Ahmedabad'];
  const states = ['Madhya Pradesh', 'Maharashtra', 'Gujarat', 'Rajasthan', 'Karnataka'];
  const propertyTypes = ['Farmhouse', 'Farmland', 'Agriculture Land', 'Resort', 'Plot', 'Villa', 'House'];
  const soilTypes = ['Black Soil', 'Loamy Soil', 'Clay Soil', 'Sandy Soil', 'Red Soil'];
  const crops = [['Wheat', 'Cotton', 'Chickpea'], ['Sugarcane', 'Jowar', 'Pomegranate'], ['Rice', 'Maize', 'Soybeans']];
  
  const properties = [];
  
  for (let i = 1; i <= 50; i++) {
    const city = cities[Math.floor(Math.random() * cities.length)];
    const state = states[Math.floor(Math.random() * states.length)];
    const propType = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
    const price = Math.floor(Math.random() * (1000000 - 500000)) + 500000;
    const area = Math.floor(Math.random() * (500000 - 10000)) + 10000;
    const lat = 20 + Math.random() * 10;
    const lng = 70 + Math.random() * 10;
    
    properties.push({
      title: `${propType} Property #${i} in ${city}`,
      description: `Beautiful ${propType.toLowerCase()} property located in ${city}, ${state}. This property features excellent infrastructure, modern amenities, and great connectivity. Perfect for investment or residential purposes. Property ID: ${i}. Area: ${area} sqft. Well maintained and ready for possession.`,
      shortDescription: `${propType} in ${city} - ${area} sqft - ₹${price}`,
      propertyType: propType,
      listingType: Math.random() > 0.7 ? 'rent' : 'sale',
      price: price,
      negotiable: Math.random() > 0.3,
      priceUnit: 'total',
      securityDeposit: Math.floor(price * 0.1),
      pricePerSqft: Math.floor(price / area * 100) / 100,
      landSize: Math.floor(area / 43560),
      landUnit: 'acre',
      area: area,
      areaUnit: 'sqft',
      bedrooms: Math.floor(Math.random() * 5) + 1,
      bathrooms: Math.floor(Math.random() * 4) + 1,
      floor: Math.floor(Math.random() * 10) + 1,
      totalFloors: Math.floor(Math.random() * 15) + 5,
      facing: ['North', 'South', 'East', 'West'][Math.floor(Math.random() * 4)],

      // Location with proper GeoJSON format
      location: {
        address: `${i} ${city} Road, Near ${['Highway', 'Market', 'Station', 'School'][Math.floor(Math.random() * 4)]}`,
        locality: `${city} ${['North', 'South', 'East', 'West'][Math.floor(Math.random() * 4)]}`,
        city: city,
        state: state,
        pincode: String(100000 + Math.floor(Math.random() * 900000)).substring(0, 6),
        coordinates: {
          lat: parseFloat(lat.toFixed(4)),
          lng: parseFloat(lng.toFixed(4)),
        },
        geoJSON: {
          type: 'Point',
          coordinates: [parseFloat(lng.toFixed(4)), parseFloat(lat.toFixed(4))],
        },
        googleMapLink: `https://maps.google.com/?q=${lat},${lng}`,
        distances: {
          cityCenter: Math.floor(Math.random() * 50),
          highway: Math.floor(Math.random() * 20),
          railwayStation: Math.floor(Math.random() * 30),
          airport: Math.floor(Math.random() * 100),
        },
      },

      // Soil & Farming
      soilAndFarming: {
        soilType: soilTypes[Math.floor(Math.random() * soilTypes.length)],
        soilQualityIndex: Math.floor(Math.random() * 9) + 1,
        soilReportAvailable: Math.random() > 0.5,
        cropSuitability: crops[Math.floor(Math.random() * crops.length)],
        farmingPercentage: Math.floor(Math.random() * 100),
        rainfallData: {
          annualRainfall: Math.floor(Math.random() * 1000) + 600,
          irrigationSupport: Math.random() > 0.3,
        },
      },

      // Water Resources
      waterResources: {
        borewellAvailable: Math.random() > 0.3,
        borewellDepth: Math.floor(Math.random() * 200) + 50,
        nearbyWaterSources: [
          `Water Source ${Math.floor(Math.random() * 5) + 1}`,
          `Canal ${Math.floor(Math.random() * 3) + 1}`,
        ],
        waterAvailability: ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)],
        irrigationSystem: Math.random() > 0.4,
        waterCertificateAvailable: Math.random() > 0.5,
      },

      // Infrastructure
      infrastructure: {
        electricityAvailable: Math.random() > 0.1,
        roadAccess: Math.random() > 0.2,
        roadType: ['kachha', 'pakka', 'highway'][Math.floor(Math.random() * 3)],
        fencing: Math.random() > 0.3,
        gated: Math.random() > 0.5,
        nearbyFacilities: {
          schools: [
            `School ${Math.floor(Math.random() * 5)} KM away`,
            `College ${Math.floor(Math.random() * 10)} KM away`,
          ],
          hospitals: [
            `Hospital ${Math.floor(Math.random() * 15)} KM away`,
            `Clinic ${Math.floor(Math.random() * 5)} KM away`,
          ],
          markets: [
            `Market ${Math.floor(Math.random() * 10)} KM away`,
            `Mall ${Math.floor(Math.random() * 20)} KM away`,
          ],
          roads: [
            `Highway ${Math.floor(Math.random() * 3)} KM away`,
            `Main Road Adjacent`,
          ],
        },
      },

      // Legal
      legal: {
        landRegistryAvailable: Math.random() > 0.2,
        ownershipDocuments: Math.random() > 0.1,
        encumbranceFree: Math.random() > 0.3,
        landUseType: ['Agricultural', 'Residential', 'Commercial'][Math.floor(Math.random() * 3)],
      },

      // Features
      features: {
        constructionAllowed: Math.random() > 0.3,
        farmhouseBuilt: Math.random() > 0.5,
        parking: Math.random() > 0.2,
        security: Math.random() > 0.3,
        powerBackup: Math.random() > 0.4,
      },

      // Media
      media: {
        images: [
          `https://via.placeholder.com/800x600?text=Property+${i}+Image+1`,
          `https://via.placeholder.com/800x600?text=Property+${i}+Image+2`,
          `https://via.placeholder.com/800x600?text=Property+${i}+Image+3`,
        ],
        videos: [
          `https://example.com/property-${i}-video.mp4`,
        ],
        droneView: [
          `https://example.com/property-${i}-drone.mp4`,
        ],
        mapScreenshot: `https://via.placeholder.com/400x300?text=Map+Property+${i}`,
      },

      // Dealer
      dealer: {
        name: `Agent ${Math.floor(Math.random() * 100) + 1}`,
        phone: `+91-${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        type: ['Owner', 'Agent', 'Builder'][Math.floor(Math.random() * 3)],
        verified: Math.random() > 0.5,
      },

      // Topography
      topography: {
        slope: ['flat', 'slight', 'hilly'][Math.floor(Math.random() * 3)],
        elevation: Math.floor(Math.random() * 1000) + 100,
      },

      // Climate Risk
      climateRisk: {
        floodRisk: Math.random() > 0.7,
        droughtRisk: Math.random() > 0.6,
      },

      // Connectivity Score
      connectivityScore: Math.floor(Math.random() * 9) + 1,

      // Investment
      investment: {
        expectedROI: Math.floor(Math.random() * 30) + 5,
        appreciationRate: Math.floor(Math.random() * 15) + 5,
      },

      // Analytics
      analytics: {
        views: Math.floor(Math.random() * 1000),
        saves: Math.floor(Math.random() * 100),
        contactClicks: Math.floor(Math.random() * 50),
      },

      // Status
      status: {
        featured: i <= 5, // Make first 5 featured
        verified: Math.random() > 0.3,
        isActive: true,
        postedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        approvalStatus: 'approved',
      },
    });
  }
  
  return properties;
};

async function seedProperties() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/property-selling');
    console.log('✅ Connected to MongoDB');

    // Drop all indexes
    try {
      await Property.collection.dropIndexes();
      console.log('🔄 Dropped all existing indexes');
    } catch (err) {
      if (!err.message.includes('index not found')) {
        console.warn('⚠️  Warning:', err.message);
      }
    }

    // Clear existing properties
    await Property.deleteMany({});
    console.log('🗑️  Cleared existing properties');

    // Get or create seller
    let seller = await User.findOne();
    if (!seller) {
      seller = await User.create({
        name: 'Default Seller',
        email: 'seller@example.com',
        password: 'seller123',
        role: 'seller',
        isActive: true,
        verified: 'approve'
      });
      console.log('✅ Created default seller');
    }
    console.log(`👤 Using seller: ${seller.email}`);

    // Generate and insert 50 properties
    const propertiesToInsert = generateProperties();
    const propertiesWithSeller = propertiesToInsert.map(prop => ({
      ...prop,
      sellerId: seller._id,
    }));

    console.log(`\n📦 Inserting ${propertiesWithSeller.length} properties...`);
    
    const createdProperties = [];
    for (const propData of propertiesWithSeller) {
      try {
        const property = await Property.create(propData);
        createdProperties.push(property);
      } catch (err) {
        console.error(`❌ Error creating property: ${err.message}`);
      }
    }

    console.log(`\n✨ Successfully created ${createdProperties.length} properties`);

    // Display summary
    console.log('\n📊 Properties by Type:');
    const typeCount = {};
    createdProperties.forEach(prop => {
      typeCount[prop.propertyType] = (typeCount[prop.propertyType] || 0) + 1;
    });
    Object.entries(typeCount).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

    console.log('\n📍 Properties by City:');
    const cityCount = {};
    createdProperties.forEach(prop => {
      cityCount[prop.location.city] = (cityCount[prop.location.city] || 0) + 1;
    });
    Object.entries(cityCount).forEach(([city, count]) => {
      console.log(`  ${city}: ${count}`);
    });

    console.log('\n✅ Test these endpoints:');
    console.log('  GET http://localhost:5000/api/properties?page=1&limit=10');
    console.log('  GET http://localhost:5000/api/properties?page=2&limit=10');
    console.log('  GET http://localhost:5000/api/properties?city=Indore');
    console.log('  GET http://localhost:5000/api/properties?propertyType=Farmhouse');

  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

seedProperties();
