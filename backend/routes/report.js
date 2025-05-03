const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');

// Generate a PDF report for a student
router.post('/student', auth(['admin', 'student']), reportController.generateStudentReport);
router.post('/student/:studentId', auth(['admin', 'student']), reportController.generateStudentReport);
router.get('/student', auth(['admin', 'student']), reportController.generateStudentReport);
router.get('/student/:studentId', auth(['admin', 'student']), reportController.generateStudentReport);
router.get('/class', auth(['admin']), reportController.generateClassReport);
// Admin: Get all reports
router.get('/', auth('admin'), reportController.getAllReports);
// Admin: Download report (PDF or CSV)
router.get('/:id/download', auth('admin'), reportController.downloadReport);
router.delete('/:id', auth('admin'), reportController.deleteReport);
// Bulk delete reports (use POST for better compatibility)
router.post('/bulk-delete', auth('admin'), reportController.bulkDeleteReports);

module.exports = router;
