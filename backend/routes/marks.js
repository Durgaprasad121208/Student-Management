const express = require('express');
const router = express.Router();
const marksController = require('../controllers/marksController');
const auth = require('../middleware/auth');

// Create marks (Admin only)
router.post('/', auth('admin'), marksController.createMarks);
// Get marks for a student (Admin or Student)
router.get('/:studentId', auth(['admin', 'student']), marksController.getStudentMarks);
// Student: Get their own marks
router.get('/my', auth('student'), marksController.getMyMarks);

module.exports = router;
