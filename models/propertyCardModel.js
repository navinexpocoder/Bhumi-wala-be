const mongoose = require('mongoose');

const propertyCardSchema = new mongoose.Schema(
  {
    // Reference to PropertyPreview
    propertyPreviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PropertyPreview',
      required: [true, 'Property preview reference is required'],
    },

    // Basic Info
    title: {
      type: String,
      required: [true, 'Please provide a property title'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    propertyType: {
      type: String,
      required: [true, 'Please specify property type'],
      enum: ['Farmhouse', 'Farmland', 'Agriculture Land', 'Resort'],
    },
    listingType: {
      type: String,
      required: [true, 'Please specify listing type'],
      enum: ['rent', 'sale'],
    },

    // Location
    city: {
      type: String,
      required: [true, 'Please provide city'],
      trim: true,
    },
    locality: {
      type: String,
      required: [true, 'Please provide locality'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Please provide address'],
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters'],
    },

    // Pricing
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: [0, 'Price cannot be negative'],
    },
    priceUnit: {
      type: String,
      enum: ['month', 'total'],
      default: 'total',
    },
    securityDeposit: {
      type: Number,
      default: null,
      min: [0, 'Security deposit cannot be negative'],
    },
    pricePerSqft: {
      type: Number,
      default: null,
      min: [0, 'Price per sqft cannot be negative'],
    },

    // Area & Config
    area: {
      type: Number,
      required: [true, 'Please provide area'],
      min: [0, 'Area cannot be negative'],
    },
    areaUnit: {
      type: String,
      required: [true, 'Please specify area unit'],
      enum: ['sqft', 'acre', 'bigha'],
    },
    bedrooms: {
      type: Number,
      default: null,
      min: [0, 'Bedrooms cannot be negative'],
    },
    bathrooms: {
      type: Number,
      default: null,
      min: [0, 'Bathrooms cannot be negative'],
    },

    // Media
    coverImage: {
      type: String,
      required: [true, 'Please provide cover image'],
    },
    imagesCount: {
      type: Number,
      default: 1,
      min: [1, 'Must have at least one image'],
    },

    // Highlights
    tags: {
      type: [String],
      default: [],
      enum: ['Verified', 'Featured', 'New', 'Hot Deal', 'Premium', 'Urgent'],
    },
    amenitiesHighlight: {
      type: [String],
      default: [],
      enum: [
        'Lift',
        'Parking',
        'Water',
        'Electricity',
        'Fencing',
        'Gated',
        'Security',
        'Furniture',
      ],
    },

    // Property Meta
    floor: {
      type: String,
      default: null,
    },
    totalFloors: {
      type: Number,
      default: null,
      min: [1, 'Must have at least one floor'],
    },
    facing: {
      type: String,
      default: null,
      enum: ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West', null],
    },

    // Description Short
    shortDescription: {
      type: String,
      required: [true, 'Please provide short description'],
      maxlength: [300, 'Short description cannot exceed 300 characters'],
      trim: true,
    },

    // Dealer Info
    dealerName: {
      type: String,
      required: [true, 'Please provide dealer name'],
      trim: true,
    },
    dealerType: {
      type: String,
      enum: ['Owner', 'Agent', 'Builder'],
      default: 'Owner',
    },
    dealerPhone: {
      type: String,
      default: null,
      match: [/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, 'Invalid phone number'],
    },
    dealerVerified: {
      type: Boolean,
      default: false,
    },
    postedTime: {
      type: Date,
      default: Date.now,
    },

    // Actions (for frontend state)
    isFavorite: {
      type: Boolean,
      default: false,
    },
    isSeen: {
      type: Boolean,
      default: false,
    },

    // Engagement metrics
    engagement: {
      clicks: {
        type: Number,
        default: 0,
        min: [0, 'Clicks cannot be negative'],
      },
      saves: {
        type: Number,
        default: 0,
        min: [0, 'Saves cannot be negative'],
      },
      shares: {
        type: Number,
        default: 0,
        min: [0, 'Shares cannot be negative'],
      },
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Index for faster queries
propertyCardSchema.index({ city: 1, locality: 1 });
propertyCardSchema.index({ propertyType: 1 });
propertyCardSchema.index({ listingType: 1 });
propertyCardSchema.index({ isActive: 1 });
propertyCardSchema.index({ approvalStatus: 1 });
propertyCardSchema.index({ 'tags': 1 });
propertyCardSchema.index({ createdAt: -1 });

module.exports = mongoose.model('PropertyCard', propertyCardSchema);
