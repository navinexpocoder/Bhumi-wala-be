const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a city name'],
      trim: true,
      index: true, // Index for faster searches
    },
    state: {
      type: String,
      required: [true, 'Please provide a state name'],
      trim: true,
      index: true, // Index for faster state-based queries
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        validate: {
          validator: function (coords) {
            return (
              coords.length === 2 &&
              coords[0] >= -180 &&
              coords[0] <= 180 &&
              coords[1] >= -90 &&
              coords[1] <= 90
            );
          },
          message: 'Invalid coordinates. Must be [longitude, latitude]',
        },
      },
    },
    latitude: {
      type: Number,
      required: true,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90'],
    },
    longitude: {
      type: Number,
      required: true,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180'],
    },
  },
  { timestamps: true }
);

// Create geospatial index for efficient location queries
locationSchema.index({ location: '2dsphere' });

// Compound index for name and state searches
locationSchema.index({ name: 1, state: 1 });

// Ensure unique combination of name and state
locationSchema.index({ name: 1, state: 1 }, { unique: true });

module.exports = mongoose.model('Location', locationSchema);
