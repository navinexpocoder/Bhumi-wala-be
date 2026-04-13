const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { sanitizeRequestBody } = require('../middleware/requestValidation');
const chatController = require('../controllers/chatController');

/**
 * Chat routes (protected by JWT)
 */

/**
 * POST /api/chat/conversations
 * Create or get conversation by propertyId for current buyer
 * Body: { propertyId }
 */
router.post(
  '/conversations',
  verifyToken,
  sanitizeRequestBody,
  chatController.createOrGetConversation
);

/**
 * GET /api/chat/conversations
 * Get current user's conversations
 * Query: { page?, limit? }
 */
router.get('/conversations', verifyToken, chatController.getUserConversations);

/**
 * GET /api/chat/conversations/:conversationId/messages
 * Get messages for a conversation
 * Query: { page?, limit? }
 */
router.get('/conversations/:conversationId/messages', verifyToken, chatController.getMessagesByConversation);

/**
 * PATCH /api/chat/conversations/:conversationId/seen
 * Mark messages as seen by current user
 */
router.patch(
  '/conversations/:conversationId/seen',
  verifyToken,
  chatController.markMessagesAsSeen
);

/**
 * GET /api/chat/notifications
 * List current user notifications
 */
router.get('/notifications', verifyToken, chatController.getNotifications);

/**
 * PATCH /api/chat/notifications/:notificationId/read
 * Mark one notification as read
 */
router.patch(
  '/notifications/:notificationId/read',
  verifyToken,
  chatController.markNotificationAsRead
);

/**
 * PATCH /api/chat/notifications/read-all
 * Mark all notifications as read
 */
router.patch(
  '/notifications/read-all',
  verifyToken,
  chatController.markAllNotificationsAsRead
);

/**
 * GET /api/chat/unread-summary
 * Returns unread messages + notifications count
 */
router.get('/unread-summary', verifyToken, chatController.getUnreadSummary);

module.exports = router;
