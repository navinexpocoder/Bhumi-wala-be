const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Property = require('./models/propertyModel');
const User = require('./models/userModel');

// Sample property data using new PropertyPreview schema
const sampleProperties = [
  {
    // ===== INDORE FARMHOUSE =====
    title: 'Premium Farmhouse Near Indore City',
    description: 'Stunning 2-acre farmhouse property with modern construction, perfect for weekend getaway or investment. Located on highway with full infrastructure including electricity, water, and irrigation system. Great for agricultural activities or construction-allowed farmhouse development.',
    shortDescription: 'Premium 2-acre farmhouse with modern construction near Indore highway, fully developed...',
    propertyType: 'Farmhouse',
    listingType: 'sale',

    // Pricing
    price: 2500000,
    negotiable: true,
    priceUnit: 'total',
    securityDeposit: 250000,
    pricePerSqft: 1250,

    // Area
    landSize: 2,
    landUnit: 'acre',
    area: 87120,
    areaUnit: 'sqft',
    bedrooms: 3,
    bathrooms: 2,
    floor: 1,
    totalFloors: 1,
    facing: 'North',

    // Location
    location: {
      address: 'Highway Road, 25 KM from Indore City Center',
      locality: 'Indore Bypass',
      city: 'Indore',
      state: 'Madhya Pradesh',
      pincode: '452001',
      coordinates: {
        lat: 22.7196,
        lng: 75.8577,
      },
      geoJSON: {
        type: 'Point',
        coordinates: [75.8577, 22.7196],
      },
      googleMapLink: 'https://maps.google.com/?q=22.7196,75.8577',
      distances: {
        cityCenter: 25,
        highway: 1,
        railwayStation: 20,
        airport: 40,
      },
    },

    // Soil & Farming
    soilAndFarming: {
      soilType: 'Black Soil',
      soilQualityIndex: 8,
      soilReportAvailable: true,
      cropSuitability: ['Wheat', 'Soybean', 'Cotton', 'Chickpea'],
      farmingPercentage: 60,
      rainfallData: {
        annualRainfall: 890,
        irrigationSupport: true,
      },
    },

    // Water Resources
    waterResources: {
      borewellAvailable: true,
      borewellDepth: 120,
      nearbyWaterSources: ['Government Water Canal', 'Indian River'],
      waterAvailability: 'High',
      irrigationSystem: true,
      waterCertificateAvailable: true,
    },

    // Infrastructure
    infrastructure: {
      electricityAvailable: true,
      roadAccess: true,
      roadType: 'pakka',
      fencing: true,
      gated: false,
      nearbyFacilities: {
        schools: ['Central School - 2 KM', 'Vidya Vihar - 3 KM'],
        hospitals: ['City Hospital - 8 KM', 'Nursing Home - 4 KM'],
        markets: ['Agricultural Market - 5 KM', 'Wholesale Market - 6 KM'],
        roads: ['Highway NH-3 - Adjacent', 'Bypass Road - 2 KM'],
      },
    },

    // Legal
    legal: {
      landRegistryAvailable: true,
      ownershipDocuments: true,
      encumbranceFree: true,
      landUseType: 'Agricultural',
      documentUrls: {
        soilReport: 'https://cloud.example.com/docs/soil-report-001.pdf',
        registry: 'https://cloud.example.com/docs/registry-001.pdf',
        ownership: 'https://cloud.example.com/docs/ownership-001.pdf',
        waterCertificate: 'https://cloud.example.com/docs/water-cert-001.pdf',
      },
    },

    // Features
    features: {
      constructionAllowed: true,
      farmhouseBuilt: true,
      parking: true,
      security: true,
      powerBackup: true,
    },

    // Media
    media: {
      images: [
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&h=800&fit=crop',
        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&h=800&fit=crop',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop',
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=800&fit=crop',
      ],
      videos: ['https://example.com/video1.mp4'],
      droneView: ['https://example.com/drone-footage.mp4'],
      mapScreenshot: 'https://via.placeholder.com/400x300?text=Map+View',
    },

    // Top-level images for backward compatibility
    images: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&h=800&fit=crop',
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&h=800&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop',
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=800&fit=crop',
    ],

    // Dealer
    dealer: {
      name: 'Rajesh Kumar',
      phone: '+91-9876543210',
      type: 'Agent',
      verified: true,
    },

    // Topography
    topography: {
      slope: 'slight',
      elevation: 556,
    },

    // Climate Risk
    climateRisk: {
      floodRisk: false,
      droughtRisk: false,
    },

    // Connectivity Score
    connectivityScore: 8,

    // Investment
    investment: {
      expectedROI: 12,
      appreciationRate: 8,
    },

    // Analytics
    analytics: {
      views: 245,
      saves: 18,
      contactClicks: 12,
    },

    // Status
    status: {
      featured: true,
      verified: true,
      isActive: true,
      postedAt: new Date('2024-01-15'),
      approvalStatus: 'approved',
    },
  },

  {
    // ===== AGRICULTURAL LAND MAHARASHTRA =====
    title: 'Fertile Agricultural Land in Pimpalgaon',
    description: 'Large 5-acre agricultural land with excellent soil quality suitable for crop cultivation and dairy farming. Located near Pimpalgaon with direct access to government canal irrigation. Modern farming equipment parking available.',
    shortDescription: '5-acre fertile agricultural land with canal irrigation in Pimpalgaon, excellent crop...',
    propertyType: 'Agriculture Land',
    listingType: 'sale',

    // Pricing
    price: 3500000,
    negotiable: true,
    priceUnit: 'total',
    pricePerSqft: 875,

    // Area
    landSize: 5,
    landUnit: 'acre',
    area: 217800,
    areaUnit: 'sqft',

    // Location
    location: {
      address: 'Village Pimpalgaon, District Nashik',
      locality: 'Pimpalgaon',
      city: 'Nashik',
      state: 'Maharashtra',
      pincode: '422306',
      coordinates: {
        lat: 19.997,
        lng: 75.3135,
      },
      geoJSON: {
        type: 'Point',
        coordinates: [75.3135, 19.997],
      },
      googleMapLink: 'https://maps.google.com/?q=19.997,75.3135',
      distances: {
        cityCenter: 18,
        highway: 3,
        railwayStation: 12,
        airport: 45,
      },
    },

    // Soil & Farming
    soilAndFarming: {
      soilType: 'Loamy Soil',
      soilQualityIndex: 9,
      soilReportAvailable: true,
      cropSuitability: ['Sugarcane', 'Cotton', 'Jowar', 'Pomegranate'],
      farmingPercentage: 100,
      rainfallData: {
        annualRainfall: 750,
        irrigationSupport: true,
      },
    },

    // Water Resources
    waterResources: {
      borewellAvailable: true,
      borewellDepth: 150,
      nearbyWaterSources: ['Government Canal - Adjacent', 'Godavari River - 8 KM'],
      waterAvailability: 'High',
      irrigationSystem: true,
      waterCertificateAvailable: true,
    },

    // Infrastructure
    infrastructure: {
      electricityAvailable: true,
      roadAccess: true,
      roadType: 'pakka',
      fencing: true,
      gated: true,
      nearbyFacilities: {
        schools: ['Government School - 2 KM'],
        hospitals: ['Primary Health Center - 3 KM'],
        markets: ['Mandi Market - 5 KM'],
        roads: ['Village Road - Adjacent'],
      },
    },

    // Legal
    legal: {
      landRegistryAvailable: true,
      ownershipDocuments: true,
      encumbranceFree: true,
      landUseType: 'Agricultural',
      documentUrls: {
        registry: 'https://cloud.example.com/docs/registry-002.pdf',
        ownership: 'https://cloud.example.com/docs/ownership-002.pdf',
      },
    },

    // Features
    features: {
      constructionAllowed: false,
      farmhouseBuilt: false,
      parking: true,
      security: true,
      powerBackup: false,
    },

    // Media
    media: {
      images: [
        'https://via.placeholder.com/800x600?text=Agricultural+Land',
        'https://via.placeholder.com/800x600?text=Irrigation+Canal',
        'https://via.placeholder.com/800x600?text=Crop+Field',
      ],
      videos: [],
      droneView: ['https://example.com/drone-ag-land.mp4'],
      mapScreenshot: 'https://via.placeholder.com/400x300?text=Land+Map',
    },

    // Dealer
    dealer: {
      name: 'Ramakrishnan',
      phone: '+91-9876543211',
      type: 'Owner',
      verified: true,
    },

    // Topography
    topography: {
      slope: 'flat',
      elevation: 450,
    },

    // Climate Risk
    climateRisk: {
      floodRisk: true,
      droughtRisk: false,
    },

    // Connectivity Score
    connectivityScore: 7,

    // Investment
    investment: {
      expectedROI: 15,
      appreciationRate: 10,
    },

    // Analytics
    analytics: {
      views: 312,
      saves: 24,
      contactClicks: 15,
    },

    // Status
    status: {
      featured: true,
      verified: true,
      isActive: true,
      postedAt: new Date('2024-01-20'),
      approvalStatus: 'approved',
    },
  },

  {
    // ===== RESORT PROPERTY GUJRAT =====
    title: 'Luxury Resort Property with Water Features',
    description: '3-acre resort property with lake view featuring existing swimming pool, restaurant facility, and accommodation units. Perfect for hospitality business or luxury residential development. Owned by experienced resort operator.',
    shortDescription: '3-acre luxury resort with lake view, pool, and restaurant near Gujarat city...',
    propertyType: 'Resort',
    listingType: 'sale',

    // Pricing
    price: 7500000,
    negotiable: true,
    priceUnit: 'total',
    pricePerSqft: 1875,

    // Area
    landSize: 3,
    landUnit: 'acre',
    area: 130680,
    areaUnit: 'sqft',
    bedrooms: 8,
    bathrooms: 6,
    floor: 3,
    totalFloors: 3,
    facing: 'South',

    // Location
    location: {
      address: 'Lake View Road, Village Umbergaon',
      locality: 'Umbergaon',
      city: 'Vadodara',
      state: 'Gujarat',
      pincode: '391440',
      coordinates: {
        lat: 22.3072,
        lng: 73.1997,
      },
      geoJSON: {
        type: 'Point',
        coordinates: [73.1997, 22.3072],
      },
      googleMapLink: 'https://maps.google.com/?q=22.3072,73.1997',
      distances: {
        cityCenter: 35,
        highway: 5,
        railwayStation: 20,
        airport: 25,
      },
    },

    // Soil & Farming (N/A for resort)
    soilAndFarming: {
      soilQualityIndex: 5,
      farmingPercentage: 0,
    },

    // Water Resources
    waterResources: {
      borewellAvailable: true,
      borewellDepth: 180,
      nearbyWaterSources: ['Lake - Adjacent'],
      waterAvailability: 'High',
      irrigationSystem: true,
      waterCertificateAvailable: true,
    },

    // Infrastructure
    infrastructure: {
      electricityAvailable: true,
      roadAccess: true,
      roadType: 'pakka',
      fencing: true,
      gated: true,
      nearbyFacilities: {
        schools: ['International School - 15 KM'],
        hospitals: ['Multi-Specialty Hospital - 10 KM'],
        markets: ['Shopping Mall - 20 KM'],
        roads: ['Highway - 5 KM'],
      },
    },

    // Legal
    legal: {
      landRegistryAvailable: true,
      ownershipDocuments: true,
      encumbranceFree: true,
      landUseType: 'Commercial',
      documentUrls: {
        registry: 'https://cloud.example.com/docs/registry-003.pdf',
        ownership: 'https://cloud.example.com/docs/ownership-003.pdf',
      },
    },

    // Features
    features: {
      constructionAllowed: true,
      farmhouseBuilt: false,
      parking: true,
      security: true,
      powerBackup: true,
    },

    // Media
    media: {
      images: [
        'https://via.placeholder.com/800x600?text=Resort+Overview',
        'https://via.placeholder.com/800x600?text=Swimming+Pool',
        'https://via.placeholder.com/800x600?text=Restaurant+Area',
        'https://via.placeholder.com/800x600?text=Lake+View',
      ],
      videos: ['https://example.com/resort-video.mp4'],
      droneView: ['https://example.com/drone-resort.mp4'],
      mapScreenshot: 'https://via.placeholder.com/400x300?text=Resort+Map',
    },

    // Dealer
    dealer: {
      name: 'Vikram Estates',
      phone: '+91-9876543212',
      type: 'Builder',
      verified: true,
    },

    // Topography
    topography: {
      slope: 'slight',
      elevation: 480,
    },

    // Climate Risk
    climateRisk: {
      floodRisk: false,
      droughtRisk: false,
    },

    // Connectivity Score
    connectivityScore: 9,

    // Investment
    investment: {
      expectedROI: 18,
      appreciationRate: 12,
    },

    // Analytics
    analytics: {
      views: 456,
      saves: 38,
      contactClicks: 28,
    },

    // Status
    status: {
      featured: true,
      verified: true,
      isActive: true,
      postedAt: new Date('2024-01-10'),
      approvalStatus: 'approved',
    },
  },

  {
    // ===== FARM LAND RAJASTHAN =====
    title: 'Desert Estate Farmland with Development Potential',
    description: 'Sprawling 10-acre farmland in Rajasthan with potential for agricultural operations, farm stays, or commercial development. Located on main road with excellent connectivity. Suitable for investors and farmers.',
    shortDescription: '10-acre farmland in Rajasthan with development potential on main road...',
    propertyType: 'Farmland',
    listingType: 'sale',

    // Pricing
    price: 4200000,
    negotiable: true,
    priceUnit: 'total',
    pricePerSqft: 420,

    // Area
    landSize: 10,
    landUnit: 'acre',
    area: 435600,
    areaUnit: 'sqft',

    // Location
    location: {
      address: 'Main Road towards Pushkar',
      locality: 'Ajmer Rural',
      city: 'Ajmer',
      state: 'Rajasthan',
      pincode: '305001',
      coordinates: {
        lat: 26.1324,
        lng: 74.6399,
      },
      geoJSON: {
        type: 'Point',
        coordinates: [74.6399, 26.1324],
      },
      googleMapLink: 'https://maps.google.com/?q=26.1324,74.6399',
      distances: {
        cityCenter: 22,
        highway: 2,
        railwayStation: 8,
        airport: 140,
      },
    },

    // Soil & Farming
    soilAndFarming: {
      soilType: 'Desert Soil',
      soilQualityIndex: 6,
      soilReportAvailable: false,
      cropSuitability: ['Bajra', 'Mustard', 'Gram'],
      farmingPercentage: 100,
      rainfallData: {
        annualRainfall: 450,
        irrigationSupport: false,
      },
    },

    // Water Resources
    waterResources: {
      borewellAvailable: true,
      borewellDepth: 250,
      nearbyWaterSources: ['Government Well - 2 KM'],
      waterAvailability: 'Medium',
      irrigationSystem: false,
      waterCertificateAvailable: false,
    },

    // Infrastructure
    infrastructure: {
      electricityAvailable: true,
      roadAccess: true,
      roadType: 'kachha',
      fencing: false,
      gated: false,
      nearbyFacilities: {
        schools: ['Government School - 5 KM'],
        hospitals: ['Primary Health Center - 8 KM'],
        markets: ['Weekly Market - 3 KM'],
        roads: ['Main Road - Adjacent'],
      },
    },

    // Legal
    legal: {
      landRegistryAvailable: true,
      ownershipDocuments: true,
      encumbranceFree: true,
      landUseType: 'Agricultural',
      documentUrls: {
        registry: 'https://cloud.example.com/docs/registry-004.pdf',
      },
    },

    // Features
    features: {
      constructionAllowed: false,
      farmhouseBuilt: false,
      parking: false,
      security: false,
      powerBackup: false,
    },

    // Media
    media: {
      images: [
        'https://via.placeholder.com/800x600?text=Farmland+Desert',
        'https://via.placeholder.com/800x600?text=Main+Road+View',
      ],
      videos: [],
      droneView: [],
      mapScreenshot: 'https://via.placeholder.com/400x300?text=Land+Map',
    },

    // Dealer
    dealer: {
      name: 'Local Farmer Co-operative',
      phone: '+91-9876543213',
      type: 'Owner',
      verified: false,
    },

    // Topography
    topography: {
      slope: 'flat',
      elevation: 580,
    },

    // Climate Risk
    climateRisk: {
      floodRisk: false,
      droughtRisk: true,
    },

    // Connectivity Score
    connectivityScore: 6,

    // Investment
    investment: {
      expectedROI: 8,
      appreciationRate: 6,
    },

    // Analytics
    analytics: {
      views: 178,
      saves: 12,
      contactClicks: 8,
    },

    // Status
    status: {
      featured: false,
      verified: false,
      isActive: true,
      postedAt: new Date('2024-02-01'),
      approvalStatus: 'pending',
    },
  },
];

async function seedProperties() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/property-selling');
    console.log('✅ Connected to MongoDB');

    // Drop all indexes to ensure clean state
    try {
      await Property.collection.dropIndexes();
      console.log('🔄 Dropped all existing indexes');
    } catch (err) {
      // Ignore error if no indexes exist
      if (!err.message.includes('index not found')) {
        console.warn('⚠️  Warning dropping indexes:', err.message);
      }
    }

    // Clear existing properties
    await Property.deleteMany({});
    console.log('🗑️  Cleared existing properties');

    // Get first user to use as seller
    let seller = await User.findOne();
    
    // If no seller exists, create one
    if (!seller) {
      console.log('👤 Creating default seller user...');
      seller = await User.create({
        name: 'Default Seller',
        email: 'seller@example.com',
        password: 'seller123',
        role: 'seller',
        isActive: true,
        verified: 'approve'
      });
      console.log(`✅ Created seller: ${seller.email}`);
    }

    console.log(`👤 Using seller: ${seller.email}`);

    // Create properties ONE BY ONE using .create() instead of .insertMany()
    // This triggers Mongoose middleware and validation
    const createdProperties = [];
    for (const propData of sampleProperties) {
      try {
        const property = await Property.create({
          ...propData,
          sellerId: seller._id,
        });
        createdProperties.push(property);
        console.log(`✅ Created: ${property.title}`);
      } catch (err) {
        console.error(`❌ Error creating "${propData.title}":`, err.message);
      }
    }

    console.log(`\n✨ Successfully created ${createdProperties.length} properties`);

    // Display summary
    console.log('\n📋 Created Properties:');
    createdProperties.forEach((prop, index) => {
      console.log(`  ${index + 1}. ${prop.title} (${prop.location?.city || 'N/A'}) - ₹${prop.price}`);
    });

  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run seed
seedProperties();
