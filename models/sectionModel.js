const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema(
  {
    sectionName: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
      unique: true,
      trim: true,
    },
    sectionType: {
      type: String,
      enum: ['hero', 'testimonial', 'features', 'pricing', 'faq', 'gallery', 'team', 'cta', 'stats', 'custom'],
      required: true,
    },
    description: String,

    // Section content
    content: {
      title: String,
      subtitle: String,
      description: String,
      items: [mongoose.Schema.Types.Mixed], // Testimonials, features, pricing cards, etc.
      images: [
        {
          imageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MediaAsset',
          },
          caption: String,
          order: Number,
        },
      ],
      cta: {
        text: String,
        url: String,
        target: { type: String, default: '_self' },
      },
    },

    // Styling
    styling: {
      backgroundColor: { type: String, default: '#ffffff' },
      textColor: { type: String, default: '#000000' },
      accentColor: { type: String, default: '#007bff' },
      borderRadius: { type: String, default: '0px' },
      padding: { type: String, default: '40px 20px' },
      customCSS: String,
    },

    // Display
    displaySettings: {
      isVisible: { type: Boolean, default: true },
      order: { type: Number, default: 0 },
      showBorder: { type: Boolean, default: false },
      showShadow: { type: Boolean, default: false },
    },

    // Reusability
    isReusable: { type: Boolean, default: true },
    usedInPages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Page',
      },
    ],

    // Metadata
    tags: [String],
    meta: mongoose.Schema.Types.Mixed,
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

// Indexes
sectionSchema.index({ slug: 1 });
sectionSchema.index({ sectionType: 1, isActive: 1 });
sectionSchema.index({ isReusable: 1 });

module.exports = mongoose.model('Section', sectionSchema);
