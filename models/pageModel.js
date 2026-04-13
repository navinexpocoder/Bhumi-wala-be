const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema(
  {
    pageName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    pageType: {
      type: String,
      enum: ['home', 'about', 'services', 'listings', 'contact', 'blog', 'custom'],
      default: 'custom',
    },
    description: String,

    // Hero section
    heroSection: {
      title: String,
      subtitle: String,
      backgroundImageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MediaAsset',
      },
      buttonText: String,
      buttonUrl: String,
      isVisible: { type: Boolean, default: true },
    },

    // Content blocks
    contentBlocks: [
      {
        blockId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'ContentBlock',
        },
        order: Number,
      },
    ],

    // Layout configuration
    layoutConfig: {
      theme: { type: String, default: 'default' },
      layout: { type: String, enum: ['single', 'two-column', 'three-column'], default: 'single' },
      maxWidth: { type: String, default: '1200px' },
      padding: { type: String, default: '20px' },
    },

    // SEO
    seoSettings: {
      metaTitle: String,
      metaDescription: String,
      metaKeywords: [String],
      ogImage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MediaAsset',
      },
      canonicalUrl: String,
    },

    // Publishing
    publishStatus: {
      type: String,
      enum: ['draft', 'published', 'scheduled', 'archived'],
      default: 'draft',
    },
    scheduledFor: Date,

    // Metadata
    tags: [String],
    category: String,
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

    // Analytics
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes
pageSchema.index({ slug: 1 });
pageSchema.index({ publishStatus: 1 });
pageSchema.index({ pageType: 1 });

// Pre-save to auto-generate slug from pageName
pageSchema.pre('save', function (next) {
  if (this.isModified('pageName') && !this.slug) {
    this.slug = this.pageName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
  next();
});

module.exports = mongoose.model('Page', pageSchema);
