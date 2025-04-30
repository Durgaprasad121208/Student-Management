const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

// Get all notifications (admin)
router.get('/', auth('admin'), notificationController.getNotifications);
// Get notifications for the authenticated student
router.get('/my', auth('student'), notificationController.getMyNotifications);
// Create/send notification (admin)
router.post('/', auth('admin'), notificationController.createNotification);
// Delete notification (admin)
router.delete('/:id', auth('admin'), notificationController.deleteNotification);
// Mark notification as read (student)
router.patch('/read/:id', auth('student'), notificationController.markAsRead);
// Mark all notifications as read (student)
router.patch('/read-all', auth('student'), notificationController.markAllAsRead);

module.exports = router;
