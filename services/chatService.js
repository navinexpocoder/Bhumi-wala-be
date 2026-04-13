const mongoose = require('mongoose');
const Conversation = require('../models/conversationModel');
const Message = require('../models/messageModel');
const Notification = require('../models/notificationModel');
const Property = require('../models/propertyModel');

const MAX_PAGE_SIZE = 100;
const DEFAULT_CONVERSATION_PAGE_SIZE = 20;
const DEFAULT_MESSAGE_PAGE_SIZE = 50;

const normalizePage = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
};

const normalizeLimit = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.min(parsed, MAX_PAGE_SIZE);
};

const getUserId = (user) => {
  return String(user?._id || user?.id || '');
};

const isParticipant = (conversation, userId) => {
  return conversation.participants.some((participantId) => String(participantId) === String(userId));
};

const mapConversationForUser = (conversation, userId) => {
  const isBuyer = String(conversation.buyerId) === String(userId);
  const unread = isBuyer ? conversation.unreadCount.buyer : conversation.unreadCount.seller;

  return {
    _id: conversation._id,
    propertyId: conversation.propertyId,
    buyerId: conversation.buyerId,
    sellerId: conversation.sellerId,
    participants: conversation.participants,
    lastMessage: conversation.lastMessage,
    lastMessageAt: conversation.lastMessageAt,
    unreadCount: unread,
    unreadCountByRole: conversation.unreadCount,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
};

class ChatService {
  async createOrGetConversation({ propertyId, requester }) {
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      const error = new Error('Invalid propertyId');
      error.statusCode = 400;
      throw error;
    }

    const buyerId = getUserId(requester);
    if (!buyerId) {
      const error = new Error('Invalid authenticated user');
      error.statusCode = 401;
      throw error;
    }
    if (requester?.role !== 'buyer') {
      const error = new Error('Only buyers can initiate property conversations');
      error.statusCode = 403;
      throw error;
    }

    const property = await Property.findById(propertyId).select('sellerId').lean();
    if (!property) {
      const error = new Error('Property not found');
      error.statusCode = 404;
      throw error;
    }

    const sellerId = String(property.sellerId);

    if (sellerId === buyerId) {
      const error = new Error('Seller cannot create a chat with own property as buyer');
      error.statusCode = 400;
      throw error;
    }

    let conversation = await Conversation.findOne({
      propertyId,
      buyerId,
      sellerId,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        propertyId,
        buyerId,
        sellerId,
      });
    }

    return conversation;
  }

  async getUserConversations({ requester, page, limit }) {
    const userId = getUserId(requester);
    const normalizedPage = normalizePage(page);
    const normalizedLimit = normalizeLimit(limit, DEFAULT_CONVERSATION_PAGE_SIZE);
    const skip = (normalizedPage - 1) * normalizedLimit;

    const query = { participants: userId };

    const [conversations, total] = await Promise.all([
      Conversation.find(query)
        .populate('propertyId', 'title price location media status')
        .populate('buyerId', 'name email role')
        .populate('sellerId', 'name email role')
        .sort({ lastMessageAt: -1, updatedAt: -1 })
        .skip(skip)
        .limit(normalizedLimit)
        .lean(),
      Conversation.countDocuments(query),
    ]);

    return {
      conversations: conversations.map((conversation) => mapConversationForUser(conversation, userId)),
      pagination: {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        pages: Math.ceil(total / normalizedLimit),
      },
    };
  }

  async getConversationMessages({ conversationId, requester, page, limit }) {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      const error = new Error('Invalid conversationId');
      error.statusCode = 400;
      throw error;
    }

    const userId = getUserId(requester);
    if (!userId) {
      const error = new Error('Invalid authenticated user');
      error.statusCode = 401;
      throw error;
    }
    const conversation = await Conversation.findById(conversationId).lean();

    if (!conversation) {
      const error = new Error('Conversation not found');
      error.statusCode = 404;
      throw error;
    }

    if (!isParticipant(conversation, userId)) {
      const error = new Error('Not authorized to access this conversation');
      error.statusCode = 403;
      throw error;
    }

    const normalizedPage = normalizePage(page);
    const normalizedLimit = normalizeLimit(limit, DEFAULT_MESSAGE_PAGE_SIZE);
    const skip = (normalizedPage - 1) * normalizedLimit;

    const [messages, total] = await Promise.all([
      Message.find({ conversationId })
        .populate('senderId', 'name email role')
        .populate('receiverId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(normalizedLimit)
        .lean(),
      Message.countDocuments({ conversationId }),
    ]);

    return {
      conversationId,
      messages: messages.reverse(),
      pagination: {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        pages: Math.ceil(total / normalizedLimit),
      },
    };
  }

  async markMessagesAsSeen({ conversationId, requester }) {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      const error = new Error('Invalid conversationId');
      error.statusCode = 400;
      throw error;
    }

    const userId = getUserId(requester);
    if (!userId) {
      const error = new Error('Invalid authenticated user');
      error.statusCode = 401;
      throw error;
    }
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      const error = new Error('Conversation not found');
      error.statusCode = 404;
      throw error;
    }

    if (!isParticipant(conversation, userId)) {
      const error = new Error('Not authorized to update this conversation');
      error.statusCode = 403;
      throw error;
    }

    const unseenFilter = {
      conversationId,
      receiverId: userId,
      seen: false,
    };

    const seenAt = new Date();
    const updateResult = await Message.updateMany(unseenFilter, {
      $set: { seen: true, seenAt },
    });

    if (String(conversation.buyerId) === userId) {
      conversation.unreadCount.buyer = 0;
    } else {
      conversation.unreadCount.seller = 0;
    }

    await conversation.save();

    return {
      conversationId: conversation._id,
      markedCount: updateResult.modifiedCount || 0,
      seenAt,
    };
  }

  async getUserNotifications({ requester, page, limit }) {
    const userId = getUserId(requester);
    if (!userId) {
      const error = new Error('Invalid authenticated user');
      error.statusCode = 401;
      throw error;
    }
    const normalizedPage = normalizePage(page);
    const normalizedLimit = normalizeLimit(limit, DEFAULT_CONVERSATION_PAGE_SIZE);
    const skip = (normalizedPage - 1) * normalizedLimit;

    const query = { userId };

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .populate('referenceId', 'propertyId buyerId sellerId lastMessage lastMessageAt unreadCount')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(normalizedLimit)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId, isRead: false }),
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        pages: Math.ceil(total / normalizedLimit),
      },
    };
  }

  async markNotificationAsRead({ notificationId, requester }) {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      const error = new Error('Invalid notificationId');
      error.statusCode = 400;
      throw error;
    }

    const userId = getUserId(requester);
    if (!userId) {
      const error = new Error('Invalid authenticated user');
      error.statusCode = 401;
      throw error;
    }
    const updated = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
      { new: true }
    ).lean();

    if (!updated) {
      const error = new Error('Notification not found');
      error.statusCode = 404;
      throw error;
    }

    return updated;
  }

  async markAllNotificationsAsRead({ requester }) {
    const userId = getUserId(requester);
    if (!userId) {
      const error = new Error('Invalid authenticated user');
      error.statusCode = 401;
      throw error;
    }
    const readAt = new Date();

    const updateResult = await Notification.updateMany(
      { userId, isRead: false },
      {
        $set: {
          isRead: true,
          readAt,
        },
      }
    );

    return {
      updatedCount: updateResult.modifiedCount || 0,
      readAt,
    };
  }

  async getUnreadSummary({ requester }) {
    const userId = getUserId(requester);
    if (!userId) {
      const error = new Error('Invalid authenticated user');
      error.statusCode = 401;
      throw error;
    }
    const [unreadMessages, unreadNotifications] = await Promise.all([
      Message.countDocuments({ receiverId: userId, seen: false }),
      Notification.countDocuments({ userId, isRead: false }),
    ]);

    return {
      unreadMessages,
      unreadNotifications,
      unreadTotal: unreadMessages + unreadNotifications,
    };
  }
}

module.exports = new ChatService();
