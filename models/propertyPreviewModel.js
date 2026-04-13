const mongoose = require('mongoose');

const propertyPreviewSchema = new mongoose.Schema(
  {
    // 1️⃣ Basic Info
    title: {
      type: String,
      required: [true, 'Please provide a property title'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a property description'],
      trim: true,
    },
    propertyType: {
      type: String,
      required: [true, 'Please specify property type'],
      enum: ['Farmhouse', 'Farmland', 'Agriculture Land', 'Resort'],
    },
    listingType: {
      type: String,
      required: [true, 'Please specify listing type'],
      enum: ['sale', 'rent'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: [0, 'Price cannot be negative'],
    },
    negotiable: {
      type: Boolean,
      default: false,
    },
    landSize: {
      type: Number,
      required: [true, 'Please provide land size'],
      min: [0, 'Land size cannot be negative'],
    },
    landUnit: {
      type: String,
      required: [true, 'Please specify land unit'],
      enum: ['acre', 'bigha', 'sqft'],
    },

    // 2️⃣ Location + Maps
    location: {
      address: {
        type: String,
        required: [true, 'Please provide address'],
        trim: true,
      },
      locality: {
        type: String,
        required: [true, 'Please provide locality'],
        trim: true,
      },
      city: {
        type: String,
        required: [true, 'Please provide city'],
        trim: true,
      },
      state: {
        type: String,
        required: [true, 'Please provide state'],
        trim: true,
      },
      pincode: {
        type: String,
        required: [true, 'Please provide pincode'],
        match: [/^[0-9]{6}$/, 'Pincode must be 6 digits'],
      },
      coordinates: {
        lat: {
          type: Number,
          required: [true, 'Please provide latitude'],
          min: [-90, 'Invalid latitude'],
          max: [90, 'Invalid latitude'],
        },
        lng: {
          type: Number,
          required: [true, 'Please provide longitude'],
          min: [-180, 'Invalid longitude'],
          max: [180, 'Invalid longitude'],
        },
      },
      googleMapLink: {
        type: String,
        validate: {
          validator: function (v) {
            return /^https?:\/\/(www\.)?google\.com\/maps/.test(v) || v === '';
          },
          message: 'Invalid Google Maps link',
        },
      },
      distances: {
        cityCenter: {
          type: Number,
          default: 0,
          min: [0, 'Distance cannot be negative'],
        },
        highway: {
          type: Number,
          default: 0,
          min: [0, 'Distance cannot be negative'],
        },
        railwayStation: {
          type: Number,
          default: null,
        },
        airport: {
          type: Number,
          default: null,
        },
      },
    },

    // 3️⃣ Soil & Farming Intelligence
    soilAndFarming: {
      soilType: {
        type: String,
        trim: true,
        default: '',
      },
      soilQualityIndex: {
        type: Number,
        min: [1, 'Quality index must be between 1-10'],
        max: [10, 'Quality index must be between 1-10'],
        default: 5,
      },
      soilReportAvailable: {
        type: Boolean,
        default: false,
      },
      cropSuitability: {
        type: [String],
        default: [],
      },
      farmingPercentage: {
        type: Number,
        min: [0, 'Percentage cannot be negative'],
        max: [100, 'Percentage cannot exceed 100'],
        default: 0,
      },
      rainfallData: {
        annualRainfall: {
          type: Number,
          default: 0,
          min: [0, 'Rainfall cannot be negative'],
        },
        irrigationSupport: {
          type: Boolean,
          default: false,
        },
      },
    },

    // 4️⃣ Water Resources
    waterResources: {
      borewellAvailable: {
        type: Boolean,
        default: false,
      },
      borewellDepth: {
        type: Number,
        default: null,
        min: [0, 'Depth cannot be negative'],
      },
      nearbyWaterSources: {
        type: [String],
        default: [],
      },
      waterAvailability: {
        type: String,
        enum: ['High', 'Medium', 'Low'],
        default: 'Medium',
      },
      irrigationSystem: {
        type: Boolean,
        default: false,
      },
      waterCertificateAvailable: {
        type: Boolean,
        default: false,
      },
    },

    // 5️⃣ Infrastructure
    infrastructure: {
      electricityAvailable: {
        type: Boolean,
        default: false,
      },
      roadAccess: {
        type: Boolean,
        default: false,
      },
      roadType: {
        type: String,
        enum: ['kachha', 'pakka', 'highway'],
        default: 'kachha',
      },
      fencing: {
        type: Boolean,
        default: false,
      },
      gated: {
        type: Boolean,
        default: false,
      },
      nearbyFacilities: {
        schools: {
          type: [String],
          default: [],
        },
        hospitals: {
          type: [String],
          default: [],
        },
        markets: {
          type: [String],
          default: [],
        },
        roads: {
          type: [String],
          default: [],
        },
      },
    },

    // 6️⃣ Legal & Documents
    legal: {
      landRegistryAvailable: {
        type: Boolean,
        default: false,
      },
      ownershipDocuments: {
        type: Boolean,
        default: false,
      },
      encumbranceFree: {
        type: Boolean,
        default: false,
      },
      landUseType: {
        type: String,
        enum: ['Agricultural', 'Residential', 'Commercial'],
        default: 'Agricultural',
      },
      soilReportDocument: {
        type: String,
        default: null,
      },
      registryDocument: {
        type: String,
        default: null,
      },
      ownershipProof: {
        type: String,
        default: null,
      },
      waterCertificate: {
        type: String,
        default: null,
      },
    },

    // 7️⃣ Features
    features: {
      constructionAllowed: {
        type: Boolean,
        default: false,
      },
      farmhouseBuilt: {
        type: Boolean,
        default: false,
      },
      parking: {
        type: Boolean,
        default: false,
      },
      security: {
        type: Boolean,
        default: false,
      },
      powerBackup: {
        type: Boolean,
        default: false,
      },
    },

    // 8️⃣ Media
    media: {
      images: {
        type: [String],
        default: [],
      },
      videos: {
        type: [String],
        default: [],
      },
      droneView: {
        type: [String],
        default: [],
      },
      mapScreenshot: {
        type: String,
        default: null,
      },
    },

    // 9️⃣ Dealer Info
    dealer: {
      name: {
        type: String,
        required: [true, 'Please provide dealer name'],
        trim: true,
      },
      phone: {
        type: String,
        required: [true, 'Please provide dealer phone'],
        match: [/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, 'Invalid phone number'],
      },
      type: {
        type: String,
        enum: ['Owner', 'Agent', 'Builder'],
        default: 'Owner',
      },
      verified: {
        type: Boolean,
        default: false,
      },
      dealerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
    },

    // 🔟 Analytics
    analytics: {
      views: {
        type: Number,
        default: 0,
        min: [0, 'Views cannot be negative'],
      },
      saves: {
        type: Number,
        default: 0,
        min: [0, 'Saves cannot be negative'],
      },
      contactClicks: {
        type: Number,
        default: 0,
        min: [0, 'Contact clicks cannot be negative'],
      },
    },

    // 1️⃣1️⃣ Status
    status: {
      featured: {
        type: Boolean,
        default: false,
      },
      verified: {
        type: Boolean,
        default: false,
      },
      isActive: {
        type: Boolean,
        default: true,
      },
      postedAt: {
        type: Date,
        default: Date.now,
      },
      approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
      },
    },

    // 🔥 EXTRA (Advanced Features)

    // Topography
    topography: {
      slope: {
        type: String,
        enum: ['flat', 'slight', 'hilly'],
        default: 'flat',
      },
      elevation: {
        type: Number,
        default: null,
        min: [0, 'Elevation cannot be negative'],
      },
    },

    // Climate Risk
    climateRisk: {
      floodRisk: {
        type: Boolean,
        default: false,
      },
      droughtRisk: {
        type: Boolean,
        default: false,
      },
    },

    // Connectivity Score
    connectivityScore: {
      type: Number,
      min: [1, 'Score must be between 1-10'],
      max: [10, 'Score must be between 1-10'],
      default: 5,
    },

    // Investment Insights
    investment: {
      expectedROI: {
        type: Number,
        default: null,
      },
      appreciationRate: {
        type: Number,
        default: null,
      },
    },
  },
  { timestamps: true }
);

// Index for location-based queries
propertyPreviewSchema.index({ 'location.coordinates': '2dsphere' });
propertyPreviewSchema.index({ 'location.city': 1 });
propertyPreviewSchema.index({ 'location.locality': 1 });
propertyPreviewSchema.index({ propertyType: 1 });
propertyPreviewSchema.index({ listingType: 1 });
propertyPreviewSchema.index({ 'status.isActive': 1 });
propertyPreviewSchema.index({ 'status.approvalStatus': 1 });

module.exports = mongoose.model('PropertyPreview', propertyPreviewSchema);
