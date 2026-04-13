const mongoose = require('mongoose');

const mediaAssetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    fileName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
      enum: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
    },
    size: {
      type: Number,
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
      required: true,
      unique: true,
    },
    cloudinaryUrl: {
      type: String,
      required: true,
    },
    altText: {
      type: String,
      default: '',
    },
    tag: {
      type: String,
      enum: ['hero', 'property', 'user', 'logo', 'banner', 'icon', 'other'],
      default: 'other',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MediaAsset', mediaAssetSchema);
