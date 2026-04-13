const mongoose = require('mongoose');

const appNotificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'title is required'],
      trim: true,
      maxlength: [200, 'title cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'message is required'],
      trim: true,
      maxlength: [500, 'message cannot exceed 500 characters'],
    },
    type: {
      type: String,
      enum: ['cart', 'property', 'approval', 'rejection'],
      required: [true, 'type is required'],
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'senderId is required'],
      index: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'receiverId is required'],
      index: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      default: null,
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

appNotificationSchema.index({ receiverId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('AppNotification', appNotificationSchema);
