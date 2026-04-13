const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  createNotification,
  getNotificationsByUser,
  markNotificationRead,
} = require('../controllers/notificationController');

router.use(verifyToken);
router.post('/', createNotification);
router.get('/:userId', getNotificationsByUser);
router.patch('/:id/read', markNotificationRead);

module.exports = router;
