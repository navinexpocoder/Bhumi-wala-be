const chatService = require('../services/chatService');
const ResponseFormatter = require('../utils/responseFormatter');
const logger = require('../config/logger');

const resolveErrorStatus = (error) => error.statusCode || 500;

exports.createOrGetConversation = async (req, res) => {
  try {
    const { propertyId } = req.body;
    if (!propertyId) {
      return ResponseFormatter.validationError(res, ['propertyId is required']);
    }

    const conversation = await chatService.createOrGetConversation({
      propertyId,
      requester: req.user,
    });

    logger.info(`Conversation ready for property ${propertyId}: ${conversation._id}`);
    return ResponseFormatter.success(res, 'Conversation created/fetched successfully', conversation);
  } catch (error) {
    logger.error(`Error create/get conversation: ${error.message}`);
    return ResponseFormatter.error(res, error.message, resolveErrorStatus(error));
  }
};

exports.getUserConversations = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const result = await chatService.getUserConversations({
      requester: req.user,
      page,
      limit,
    });

    logger.info(`Conversations retrieved for user ${req.user._id || req.user.id}`);
    return ResponseFormatter.success(res, 'Conversations retrieved successfully', result);
  } catch (error) {
    logger.error(`Error getting user conversations: ${error.message}`);
    return ResponseFormatter.error(res, error.message, resolveErrorStatus(error));
  }
};

exports.getMessagesByConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page, limit } = req.query;

    const result = await chatService.getConversationMessages({
      conversationId,
      requester: req.user,
      page,
      limit,
    });

    logger.info(`Messages retrieved for conversation ${conversationId}`);
    return ResponseFormatter.success(res, 'Messages retrieved successfully', result);
  } catch (error) {
    logger.error(`Error getting conversation messages: ${error.message}`);
    return ResponseFormatter.error(res, error.message, resolveErrorStatus(error));
  }
};

exports.markMessagesAsSeen = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const result = await chatService.markMessagesAsSeen({
      conversationId,
      requester: req.user,
    });

    logger.info(`Messages marked as seen for conversation ${conversationId}`);
    return ResponseFormatter.success(res, 'Messages marked as seen', result);
  } catch (error) {
    logger.error(`Error marking messages as seen: ${error.message}`);
    return ResponseFormatter.error(res, error.message, resolveErrorStatus(error));
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const result = await chatService.getUserNotifications({
      requester: req.user,
      page,
      limit,
    });

    return ResponseFormatter.success(res, 'Notifications retrieved successfully', result);
  } catch (error) {
    logger.error(`Error getting notifications: ${error.message}`);
    return ResponseFormatter.error(res, error.message, resolveErrorStatus(error));
  }
};

exports.markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const result = await chatService.markNotificationAsRead({
      notificationId,
      requester: req.user,
    });

    return ResponseFormatter.success(res, 'Notification marked as read', result);
  } catch (error) {
    logger.error(`Error marking notification as read: ${error.message}`);
    return ResponseFormatter.error(res, error.message, resolveErrorStatus(error));
  }
};

exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const result = await chatService.markAllNotificationsAsRead({
      requester: req.user,
    });

    return ResponseFormatter.success(res, 'All notifications marked as read', result);
  } catch (error) {
    logger.error(`Error marking all notifications as read: ${error.message}`);
    return ResponseFormatter.error(res, error.message, resolveErrorStatus(error));
  }
};

exports.getUnreadSummary = async (req, res) => {
  try {
    const result = await chatService.getUnreadSummary({
      requester: req.user,
    });

    return ResponseFormatter.success(res, 'Unread summary retrieved', result);
  } catch (error) {
    logger.error(`Error getting unread summary: ${error.message}`);
    return ResponseFormatter.error(res, error.message, resolveErrorStatus(error));
  }
};
