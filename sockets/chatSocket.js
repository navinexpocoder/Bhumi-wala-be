const messageService = require('../services/messageService');
const emailService = require('../services/emailService');
const Notification = require('../models/notificationModel');
const Message = require('../models/messageModel');
const Conversation = require('../models/conversationModel');
const logger = require('../config/logger');

module.exports = (io) => {
  const onlineUsers = new Map();

  const addUserSocket = (userId, socketId) => {
    const existing = onlineUsers.get(userId) || new Set();
    existing.add(socketId);
    onlineUsers.set(userId, existing);
  };

  const removeUserSocket = (userId, socketId) => {
    const existing = onlineUsers.get(userId);
    if (!existing) return;
    existing.delete(socketId);
    if (existing.size === 0) {
      onlineUsers.delete(userId);
    }
  };

  const isUserOnline = (userId) => {
    return Boolean(onlineUsers.get(userId)?.size);
  };

  const emitToUser = (userId, eventName, payload) => {
    io.to(`user:${userId}`).emit(eventName, payload);
  };

  const emitTotalUnreadCount = async (userId) => {
    try {
      const totalUnreadCount = await messageService.getTotalUnreadCountForUser(userId);
      emitToUser(userId, 'chat:unread-count', { count: totalUnreadCount });
    } catch (error) {
      logger.error(`Failed to emit unread count for ${userId}: ${error.message}`);
    }
  };

  io.on('connection', (socket) => {
    const userId = String(socket.user?.id || '');
    if (!userId) {
      socket.disconnect(true);
      return;
    }

    socket.join(`user:${userId}`);
    addUserSocket(userId, socket.id);
    logger.info(`User connected for chat: ${userId} (${socket.id})`);

    emitTotalUnreadCount(userId);

    socket.on('conversation:join', async (conversationId) => {
      try {
        if (!conversationId) {
          socket.emit('error', { message: 'conversationId is required' });
          return;
        }
        const conversation = await Conversation.findById(conversationId).lean();
        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        if (!conversation.participants.some((id) => String(id) === userId)) {
          socket.emit('error', { message: 'Not authorized to join this conversation' });
          return;
        }

        const room = `conversation:${conversationId}`;
        socket.join(room);
        socket.to(room).emit('user:online', { userId, conversationId, timestamp: new Date() });
      } catch (error) {
        logger.error(`Failed to join conversation room: ${error.message}`);
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('conversation:leave', (conversationId) => {
      const room = `conversation:${conversationId}`;
      socket.leave(room);
      socket.to(room).emit('user:offline', { userId, conversationId, timestamp: new Date() });
    });

    const handleSendMessage = async (payload = {}) => {
      try {
        const conversationId = payload.conversationId;
        const messageText = payload.message || payload.content?.text;
        const messageType = payload.messageType || payload.content?.type || 'text';
        if (!conversationId || !messageText) {
          socket.emit('error', { message: 'conversationId and message are required' });
          return;
        }

        const {
          message,
          conversation,
          receiverId,
        } = await messageService.sendMessage({
          conversationId,
          senderId: userId,
          message: messageText,
          messageType,
        });

        const notification = await Notification.create({
          userId: receiverId,
          type: 'message',
          title: `New message from ${message.senderId?.name || 'a user'}`,
          referenceId: conversation._id,
          isRead: false,
        });

        const receiverOnline = isUserOnline(receiverId);
        const room = `conversation:${conversationId}`;

        io.to(room).emit('message:new', {
          message,
          conversationId,
          timestamp: new Date(),
        });

        emitToUser(receiverId, 'receiveMessage', {
          message,
          conversationId,
        });

        emitToUser(receiverId, 'newNotification', {
          notification,
          conversationId,
        });

        socket.emit('message:sent', {
          messageId: message._id,
          status: 'sent',
          timestamp: new Date(),
        });

        await Promise.all([
          emitTotalUnreadCount(receiverId),
          emitTotalUnreadCount(userId),
        ]);

        if (!receiverOnline) {
          const previousUnreadMessage = await Message.findOne({
            conversationId,
            receiverId,
            seen: false,
            _id: { $ne: message._id },
          })
            .sort({ createdAt: -1 })
            .lean();

          const shouldEmail = messageService.shouldSendOfflineEmail({
            conversation,
            receiverId,
            previousUnreadMessageAt: previousUnreadMessage?.createdAt || null,
          });

          if (shouldEmail) {
            await emailService.sendOfflineMessageNotification({
              receiverEmail: message.receiverId?.email,
              receiverName: message.receiverId?.name,
              senderName: message.senderId?.name,
              propertyTitle: conversation.propertyId?.title,
              previewMessage: message.message,
            });
          }
        }

        logger.info(`Realtime message delivered (${message._id})`);
      } catch (error) {
        logger.error(`sendMessage failed: ${error.message}`);
        socket.emit('error', { message: error.message, code: error.code || 'SERVER_ERROR' });
      }
    };

    socket.on('sendMessage', handleSendMessage);
    socket.on('message:send', handleSendMessage);

    socket.on('message:typing', ({ conversationId, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit('user:typing', {
        userId,
        conversationId,
        isTyping: Boolean(isTyping),
        timestamp: new Date(),
      });
    });

    socket.on('message:markRead', async (conversationId) => {
      try {
        if (!conversationId) {
          socket.emit('error', { message: 'conversationId is required' });
          return;
        }
        const readCount = await messageService.markAsRead(conversationId, userId);
        io.to(`conversation:${conversationId}`).emit('messages:read', {
          userId,
          readCount,
          conversationId,
          timestamp: new Date(),
        });
        await emitTotalUnreadCount(userId);
      } catch (error) {
        logger.error(`message:markRead failed: ${error.message}`);
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('chat:get-unread-count', () => {
      emitTotalUnreadCount(userId);
    });

    socket.on('disconnect', () => {
      removeUserSocket(userId, socket.id);
      logger.info(`User disconnected from chat: ${userId} (${socket.id})`);
    });
  });
};

