const mongoose = require('mongoose');

const contentBlockSchema = new mongoose.Schema(
  {
    blockType: {
      type: String,
      enum: ['hero', 'card', 'section', 'text', 'image', 'slider', 'grid', 'testimonial', 'faq', 'custom'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true,
    },
    description: String,
    
    // Content data (flexible structure)
    content: {
      heading: String,
      subheading: String,
      text: String,
      buttonText: String,
      buttonUrl: String,
      imageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MediaAsset',
      },
      items: [mongoose.Schema.Types.Mixed], // For grids, sliders, etc.
      backgroundColor: { type: String, default: '#ffffff' },
      textColor: { type: String, default: '#000000' },
      layout: { type: String, enum: ['left', 'right', 'center', 'grid'], default: 'center' },
    },

    // Display settings
    displaySettings: {
      isVisible: { type: Boolean, default: true },
      order: { type: Number, default: 0 },
      responsiveSettings: {
        hiddenOn: [{ type: String, enum: ['mobile', 'tablet', 'desktop'] }],
        columnsCounts: {
          mobile: { type: Number, default: 1 },
          tablet: { type: Number, default: 2 },
          desktop: { type: Number, default: 3 },
        },
      },
    },

    // SEO
    seoSettings: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
    },
    // Metadata
    category: {
      type: String,
      default: 'general',
    },
    tags: [String],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for faster queries
contentBlockSchema.index({ blockType: 1, isActive: 1 });
contentBlockSchema.index({ slug: 1 });
contentBlockSchema.index({ category: 1 });

module.exports = mongoose.model('ContentBlock', contentBlockSchema);
