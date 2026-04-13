const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: [true, 'conversationId is required'],
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
    message: {
      type: String,
      trim: true,
      required: [true, 'message is required'],
      maxlength: [5000, 'message cannot exceed 5000 characters'],
    },
    messageType: {
      type: String,
      enum: ['text'],
      default: 'text',
    },
    seen: {
      type: Boolean,
      default: false,
      index: true,
    },
    seenAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, seen: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
