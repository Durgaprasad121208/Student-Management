const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

// Get all notifications (admin)
router.get('/', auth('admin'), notificationController.getNotifications);
// Get notifications for a specific student
router.get('/:studentId', auth(['admin', 'student']), notificationController.getNotificationsForStudent);
// Create/send notification (admin)
router.post('/', auth('admin'), notificationController.createNotification);
// Delete notification (admin)
router.delete('/:id', auth('admin'), notificationController.deleteNotification);

module.exports = router;
