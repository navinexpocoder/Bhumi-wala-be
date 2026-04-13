const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'propertyId is required'],
      index: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'buyerId is required'],
      index: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'sellerId is required'],
      index: true,
    },
    participants: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    lastMessage: {
      type: String,
      trim: true,
      default: '',
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
    unreadCount: {
      buyer: {
        type: Number,
        default: 0,
        min: 0,
      },
      seller: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.pre('validate', function (next) {
  if (this.buyerId && this.sellerId && this.buyerId.toString() === this.sellerId.toString()) {
    return next(new Error('buyerId and sellerId must be different users'));
  }

  if (this.buyerId && this.sellerId) {
    this.participants = [this.buyerId, this.sellerId];
  }

  return next();
});

conversationSchema.index(
  { propertyId: 1, buyerId: 1, sellerId: 1 },
  { unique: true, name: 'uniq_property_buyer_seller_conversation' }
);
conversationSchema.index({ participants: 1, lastMessageAt: -1 });
conversationSchema.index({ buyerId: 1, lastMessageAt: -1 });
conversationSchema.index({ sellerId: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
