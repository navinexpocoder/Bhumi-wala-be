const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    // ===== 1 BASIC INFO =====
    title: {
      type: String,
      required: [true, "Please provide a property title"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },

    description: {
      type: String,
      required: [true, "Please provide a property description"],
      trim: true,
    },
    propertyType: {
      type: String,
      required: [true, 'Please provide a property type'],
      enum: ['Farmhouse', 'Farmland', 'Agriculture Land', 'Resort', 'Flat', 'House', 'Plot', 'Villa', 'Apartment', 'Commercial', 'Other'],
    },
    listingType: {
      type: String,
      required: [true, 'Please specify listing type'],
      enum: ['sale', 'rent'],
      default: 'sale',
    },

    // ===== 2 PRICING =====
    price: {
      type: Number,
      required: [true, "Please provide a price"],
      min: [0, "Price cannot be negative"],
    },
    negotiable: {
      type: Boolean,
      default: true,
    },
    priceUnit: {
      type: String,
      enum: ['month', 'total'],
      default: 'total',
    },
    securityDeposit: Number,
    pricePerSqft: Number,

    // ===== 3 AREA & SIZE =====
    landSize: {
      type: Number,
      required: false,
    },
    landUnit: {
      type: String,
      enum: ['acre', 'bigha', 'sqft'],
      default: 'acre',
    },
    area: Number,
    areaUnit: {
      type: String,
      enum: ['sqft', 'acre', 'bigha'],
      default: 'sqft',
    },
    bedrooms: Number,
    bathrooms: Number,
    floor: String,
    totalFloors: Number,
    facing: String,

    // ===== 4 LOCATION + MAPS =====
    location: {
      address: { type: String, required: true },
      locality: String,
      city: { type: String, required: true },
      state: String,
      pincode: String,
      coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
      geoJSON: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number] }, // [lng, lat]
      },
      googleMapLink: String,
      distances: {
        cityCenter: Number,
        highway: Number,
        railwayStation: Number,
        airport: Number,
      },
    },

    // ===== 5 SOIL & FARMING INTELLIGENCE =====
    soilAndFarming: {
      soilType: String,
      soilQualityIndex: { type: Number, min: 1, max: 10 },
      soilReportAvailable: { type: Boolean, default: false },
      cropSuitability: [String],
      farmingPercentage: Number,
      rainfallData: {
        annualRainfall: Number,
        irrigationSupport: Boolean,
      },
    },

    // ===== 6 WATER RESOURCES =====
    waterResources: {
      borewellAvailable: Boolean,
      borewellDepth: Number,
      nearbyWaterSources: [String],
      waterAvailability: { type: String, enum: ['High', 'Medium', 'Low'] },
      irrigationSystem: Boolean,
      waterCertificateAvailable: Boolean,
    },

    // ===== 7 INFRASTRUCTURE =====
    infrastructure: {
      electricityAvailable: Boolean,
      roadAccess: Boolean,
      roadType: { type: String, enum: ['kachha', 'pakka', 'highway'] },
      fencing: Boolean,
      gated: Boolean,
      nearbyFacilities: {
        schools: [String],
        hospitals: [String],
        markets: [String],
        roads: [String],
      },
    },

    // ===== 8 LEGAL & DOCUMENTS =====
    legal: {
      landRegistryAvailable: Boolean,
      ownershipDocuments: Boolean,
      encumbranceFree: Boolean,
      landUseType: { type: String, enum: ['Agricultural', 'Residential', 'Commercial'] },
      soilReportDocument: String,
      registryDocument: String,
      ownershipProof: String,
      waterCertificate: String,
    },

    // ===== 9 FEATURES =====
    features: {
      constructionAllowed: Boolean,
      farmhouseBuilt: Boolean,
      parking: Boolean,
      security: Boolean,
      powerBackup: Boolean,
    },

    // ===== 10 MEDIA =====
    media: {
      images: [String],
      videos: [String],
      droneView: [String],
      mapScreenshot: String,
    },

    // ===== 11 DEALER INFO =====
    dealer: {
      name: String,
      phone: String,
      type: { type: String, enum: ['Owner', 'Agent', 'Builder'] },
      verified: { type: Boolean, default: false },
    },

    // ===== 12 TOPOGRAPHY =====
    topography: {
      slope: { type: String, enum: ['flat', 'slight', 'hilly'] },
      elevation: Number,
    },

    // ===== 13 CLIMATE RISK =====
    climateRisk: {
      floodRisk: Boolean,
      droughtRisk: Boolean,
    },

    // ===== 14 CONNECTIVITY SCORE =====
    connectivityScore: { type: Number, min: 1, max: 10 },

    // ===== 15 INVESTMENT INSIGHTS =====
    investment: {
      expectedROI: Number,
      appreciationRate: Number,
    },

    // ===== 16 ANALYTICS =====
    analytics: {
      views: { type: Number, default: 0 },
      saves: { type: Number, default: 0 },
      contactClicks: { type: Number, default: 0 },
    },
    availabilityStatus: {
      type: String,
      enum: ['Available', 'Deactivated', 'Sold', 'Pending'],
      default: 'Available',
    },

    // ===== 17 STATUS & META =====
    status: {
      featured: { type: Boolean, default: false },
      verified: { type: Boolean, default: false },
      isActive: { type: Boolean, default: true },
      postedAt: { type: Date, default: Date.now },
      approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected', 'sold'], default: 'pending' },
    },

    // ===== REFERENCES =====
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",

      required: [true, "Please provide a seller ID"],
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: Date,
    rejectionReason: String,
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectedAt: Date,

    // ===== SHORT DESCRIPTION (for card view) =====
    shortDescription: String,

    // ===== LEGACY / COMPATIBILITY =====
    address: String, // deprecated: use location.address
    images: [String], // deprecated: use media.images
  },

  { timestamps: true }
);

// Create geospatial index for efficient location queries
// Note: Using geoJSON sub-document for 2dsphere support
propertySchema.index({ 'location.geoJSON': '2dsphere' });

// Text search index
propertySchema.index({ title: 'text', description: 'text', 'location.city': 'text' });

// Performance Indexes
propertySchema.index({ sellerId: 1 });
propertySchema.index({ 'status.approvalStatus': 1 });
propertySchema.index({ propertyType: 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ 'location.city': 1 });
propertySchema.index({ 'status.featured': 1 });
propertySchema.index({ 'status.verified': 1 });
propertySchema.index({ createdAt: -1 });

// Pre-save middleware to auto-populate shortDescription if not provided
propertySchema.pre('save', function (next) {
  if (!this.shortDescription && this.description) {
    this.shortDescription = this.description.substring(0, 150) + '...';
  }
  next();
});

module.exports = mongoose.model('Property', propertySchema);
