const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');

// Generate a PDF report for a student
router.get('/student', auth(['admin', 'student']), reportController.generateStudentReport);
router.get('/class', auth(['admin']), reportController.generateClassReport);
// Student: Get their own reports
router.get('/my', auth('student'), reportController.getMyReports);
// Admin: Get all reports
router.get('/', auth('admin'), reportController.getAllReports);
// Admin: Download report (PDF or CSV)
router.get('/:id/download', auth('admin'), reportController.downloadReport);
router.delete('/:id', auth('admin'), reportController.deleteReport);

module.exports = router;
