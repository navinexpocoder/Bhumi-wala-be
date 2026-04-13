const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
      index: true,
    },
    type: {
      type: String,
      enum: ['message'],
      default: 'message',
      required: true,
    },
    title: {
      type: String,
      trim: true,
      required: [true, 'title is required'],
      maxlength: [200, 'title cannot exceed 200 characters'],
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: [true, 'referenceId is required'],
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, referenceId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
