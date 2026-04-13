const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema(
  {
    configKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    configValues: [
      {
        value: {
          type: String,
          required: true,
        },
        label: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          default: '',
        },
      },
    ],
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['role', 'propertyType', 'status', 'constraint', 'other'],
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

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
