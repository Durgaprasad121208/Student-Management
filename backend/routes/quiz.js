const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const auth = require('../middleware/auth');

// Admin: Create quiz
router.post('/', auth('admin'), quizController.createQuiz);
// Admin: Update quiz
router.put('/:id', auth('admin'), quizController.updateQuiz);
// Admin: Delete quiz
router.delete('/:id', auth('admin'), quizController.deleteQuiz);
// Get all quizzes (filter by section/year/semester/subject)
router.get('/', auth(['admin', 'student']), quizController.getQuizzes);
// Student: Submit quiz attempt
router.post('/submit', auth('student'), quizController.submitQuiz);
// Student: Get their quiz attempts
router.get('/attempts', auth('student'), quizController.getStudentAttempts);
// Student: Get available quizzes
router.get('/available', auth('student'), quizController.getAvailableQuizzes);

module.exports = router;
