const mongoose = require('mongoose');
const AppNotification = require('../models/appNotificationModel');
const ResponseFormatter = require('../utils/responseFormatter');

const normalizeNotification = (doc) => ({
  id: String(doc._id),
  title: doc.title,
  message: doc.message,
  type: doc.type,
  senderId: doc.senderId ? String(doc.senderId) : null,
  receiverId: doc.receiverId ? String(doc.receiverId) : null,
  propertyId: doc.propertyId ? String(doc.propertyId) : null,
  isRead: Boolean(doc.isRead),
  createdAt: doc.createdAt,
});

const emitNotificationEvent = (req, notification) => {
  const io = req.app.get('io');
  if (!io || !notification?.receiverId) return;
  io.to(`user:${notification.receiverId}`).emit('notification:new', notification);
};

exports.createAndEmitNotification = async (req, payload) => {
  const created = await AppNotification.create({
    title: payload.title,
    message: payload.message,
    type: payload.type,
    senderId: payload.senderId,
    receiverId: payload.receiverId,
    propertyId: payload.propertyId || null,
    isRead: false,
  });
  const notification = normalizeNotification(created);
  emitNotificationEvent(req, notification);
  return notification;
};

exports.createNotification = async (req, res) => {
  try {
    const { title, message, type, receiverId, propertyId } = req.body;
    if (!title || !message || !type || !receiverId) {
      return ResponseFormatter.validationError(res, [
        'title, message, type and receiverId are required',
      ]);
    }

    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return ResponseFormatter.validationError(res, ['receiverId is invalid']);
    }
    if (propertyId && !mongoose.Types.ObjectId.isValid(propertyId)) {
      return ResponseFormatter.validationError(res, ['propertyId is invalid']);
    }

    const notification = await exports.createAndEmitNotification(req, {
      title,
      message,
      type,
      senderId: req.user.id,
      receiverId,
      propertyId,
    });

    return ResponseFormatter.created(res, 'Notification created', notification);
  } catch (error) {
    return ResponseFormatter.serverError(res, 'Failed to create notification', error.message);
  }
};

exports.getNotificationsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (String(req.user.id) !== String(userId) && req.user.role !== 'admin') {
      return ResponseFormatter.forbidden(res, 'Not allowed to access notifications');
    }

    const items = await AppNotification.find({ receiverId: userId })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    const notifications = items.map(normalizeNotification);
    const unreadCount = notifications.filter((item) => !item.isRead).length;

    return ResponseFormatter.success(res, 'Notifications fetched', {
      notifications,
      unreadCount,
    });
  } catch (error) {
    return ResponseFormatter.serverError(res, 'Failed to fetch notifications', error.message);
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await AppNotification.findById(id);
    if (!existing) {
      return ResponseFormatter.notFound(res, 'Notification not found');
    }
    if (String(existing.receiverId) !== String(req.user.id)) {
      return ResponseFormatter.forbidden(res, 'Not allowed to mark this notification');
    }
    if (existing.isRead) {
      return ResponseFormatter.success(res, 'Notification already marked as read', normalizeNotification(existing));
    }

    existing.isRead = true;
    await existing.save();

    const payload = normalizeNotification(existing);
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${payload.receiverId}`).emit('notification:read', { id: payload.id });
    }

    return ResponseFormatter.success(res, 'Notification marked as read', payload);
  } catch (error) {
    return ResponseFormatter.serverError(res, 'Failed to mark notification as read', error.message);
  }
};
