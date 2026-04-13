const mongoose = require('mongoose');

const dynamicConfigSchema = new mongoose.Schema(
  {
    configKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    configType: {
      type: String,
      enum: ['theme', 'feature', 'seo', 'email', 'payment', 'storage', 'analytics', 'notification', 'other'],
      default: 'other',
    },
    configValue: mongoose.Schema.Types.Mixed,
    description: String,

    // Theme configuration
    theme: {
      primaryColor: String,
      secondaryColor: String,
      accentColor: String,
      darkMode: Boolean,
      fontFamily: {
        heading: { type: String, default: 'Arial' },
        body: { type: String, default: 'Arial' },
      },
      fontSize: {
        small: { type: String, default: '12px' },
        medium: { type: String, default: '14px' },
        large: { type: String, default: '16px' },
        xl: { type: String, default: '20px' },
      },
    },

    // Feature flags
    features: {
      enableBlog: { type: Boolean, default: true },
      enableTestimonials: { type: Boolean, default: true },
      enableNewsLetter: { type: Boolean, default: true },
      enableSocialSharing: { type: Boolean, default: true },
      enableChat: { type: Boolean, default: false },
      maintenanceMode: { type: Boolean, default: false },
    },

    // API Configuration
    apiConfig: {
      rateLimit: { type: Number, default: 100 },
      cacheTTL: { type: Number, default: 3600 },
      enableCORS: { type: Boolean, default: true },
    },

    // Email Configuration
    emailConfig: {
      fromEmail: String,
      fromName: String,
      smtpHost: String,
      smtpPort: Number,
      replyTo: String,
    },

    // Brand Information
    brand: {
      name: String,
      logo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MediaAsset',
      },
      favicon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MediaAsset',
      },
      description: String,
      tagline: String,
      website: String,
    },

    // SEO Configuration
    seoConfig: {
      siteName: String,
      siteDescription: String,
      defaultMetaKeywords: [String],
      socialMedia: {
        facebook: String,
        twitter: String,
        instagram: String,
        linkedin: String,
      },
    },

    // Metadata
    isActive: { type: Boolean, default: true },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Index for faster lookups
dynamicConfigSchema.index({ configKey: 1 });
dynamicConfigSchema.index({ configType: 1 });

module.exports = mongoose.model('DynamicConfig', dynamicConfigSchema);
