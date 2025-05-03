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
// Get quiz attempts for a specific student
router.get('/attempts/:studentId', auth(['admin', 'student']), quizController.getStudentAttempts);
// Get available quizzes for a specific student
router.get('/available/:studentId', auth(['admin', 'student']), quizController.getAvailableQuizzes);

module.exports = router;
