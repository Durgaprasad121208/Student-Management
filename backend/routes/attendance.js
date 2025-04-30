const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const auth = require('../middleware/auth');

// Mark attendance (Admin only)
router.post('/', auth('admin'), attendanceController.markAttendance);
// Get attendance summary for a student
router.get('/:studentId', auth(['admin', 'student']), attendanceController.getStudentAttendance);
// Student: Get their own attendance
router.get('/my', auth('student'), attendanceController.getMyAttendance);

module.exports = router;
