const mongoose = require('mongoose');
const Message = require('../models/messageModel');
const Conversation = require('../models/conversationModel');
const logger = require('../config/logger');

const toIdString = (value) => String(value);

class MessageService {
  async sendMessage({ conversationId, senderId, message, messageType = 'text' }) {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      const error = new Error('Invalid conversationId');
      error.code = 'BAD_REQUEST';
      throw error;
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      const error = new Error('Message text is required');
      error.code = 'BAD_REQUEST';
      throw error;
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      const error = new Error('Conversation not found');
      error.code = 'NOT_FOUND';
      throw error;
    }

    const senderAsString = toIdString(senderId);
    const participants = conversation.participants.map(toIdString);
    if (!participants.includes(senderAsString)) {
      const error = new Error('Not authorized for this conversation');
      error.code = 'FORBIDDEN';
      throw error;
    }

    const receiverId = participants.find((id) => id !== senderAsString);
    if (!receiverId) {
      const error = new Error('Conversation receiver not found');
      error.code = 'UNPROCESSABLE_ENTITY';
      throw error;
    }

    const createdMessage = await Message.create({
      conversationId,
      senderId: senderAsString,
      receiverId,
      message: message.trim(),
      messageType,
      seen: false,
    });

    conversation.lastMessage = createdMessage.message;
    conversation.lastMessageAt = createdMessage.createdAt;

    if (toIdString(conversation.buyerId) === receiverId) {
      conversation.unreadCount.buyer += 1;
    } else {
      conversation.unreadCount.seller += 1;
    }

    await conversation.save();
    await conversation.populate('propertyId', 'title');

    const populatedMessage = await Message.findById(createdMessage._id)
      .populate('senderId', 'name email role')
      .populate('receiverId', 'name email role')
      .lean();

    logger.info(`Message created in conversation ${conversationId}`);
    return {
      message: populatedMessage,
      conversation,
      receiverId,
    };
  }

  async markAsRead(conversationId, userId) {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      const error = new Error('Invalid conversationId');
      error.code = 'BAD_REQUEST';
      throw error;
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      const error = new Error('Conversation not found');
      error.code = 'NOT_FOUND';
      throw error;
    }

    const userAsString = toIdString(userId);
    const participants = conversation.participants.map(toIdString);
    if (!participants.includes(userAsString)) {
      const error = new Error('Not authorized for this conversation');
      error.code = 'FORBIDDEN';
      throw error;
    }

    const result = await Message.updateMany(
      {
        conversationId,
        receiverId: userAsString,
        seen: false,
      },
      {
        $set: { seen: true, seenAt: new Date() },
      }
    );

    if (toIdString(conversation.buyerId) === userAsString) {
      conversation.unreadCount.buyer = 0;
    } else {
      conversation.unreadCount.seller = 0;
    }
    await conversation.save();

    return result.modifiedCount || 0;
  }

  async getTotalUnreadCountForUser(userId) {
    const userAsString = toIdString(userId);
    const conversations = await Conversation.find({ participants: userAsString }).lean();

    return conversations.reduce((acc, conversation) => {
      if (toIdString(conversation.buyerId) === userAsString) {
        return acc + (conversation.unreadCount?.buyer || 0);
      }
      if (toIdString(conversation.sellerId) === userAsString) {
        return acc + (conversation.unreadCount?.seller || 0);
      }
      return acc;
    }, 0);
  }

  shouldSendOfflineEmail({ conversation, receiverId, previousUnreadMessageAt }) {
    const firstUnread = toIdString(conversation.buyerId) === receiverId
      ? conversation.unreadCount.buyer === 1
      : conversation.unreadCount.seller === 1;
    if (firstUnread) {
      return true;
    }

    if (!previousUnreadMessageAt) {
      return false;
    }

    const inactivityMinutes = Number.parseInt(
      process.env.CHAT_OFFLINE_EMAIL_INACTIVITY_MINUTES || '30',
      10
    );
    const thresholdMs = Math.max(inactivityMinutes, 1) * 60 * 1000;
    return Date.now() - previousUnreadMessageAt.getTime() >= thresholdMs;
  }
}

module.exports = new MessageService();
