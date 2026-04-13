const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a user ID'],
      index: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Please provide a property ID'],
      index: true,
    },
    // Store property details at time of view
    propertyDetails: {
      title: String,
      description: String,
      price: Number,
      propertyType: String,
      address: String,
      location: {
        type: {
          type: String,
          enum: ['Point'],
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
        },
      },
    },
    // Store user details at time of view
    userDetails: {
      name: String,
      email: String,
      contact: String,
      role: String,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    viewCount: {
      type: Number,
      default: 1,
    },
    lastViewedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['viewed', 'interested', 'contacted', 'uninterested'],
      default: 'viewed',
    },
  },
  { timestamps: true }
);

// Index for efficient queries
leadSchema.index({ userId: 1, propertyId: 1 }, { unique: true });
leadSchema.index({ userId: 1, createdAt: -1 });
leadSchema.index({ propertyId: 1, createdAt: -1 });
leadSchema.index({ sellerId: 1, createdAt: -1 });
leadSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Lead', leadSchema);
