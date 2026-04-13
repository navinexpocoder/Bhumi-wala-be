const mongoose = require('mongoose');

const uiConfigSchema = new mongoose.Schema(
  {
    configKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    configValue: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['menu', 'theme', 'layout', 'feature', 'other'],
      default: 'other',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UIConfig', uiConfigSchema);
