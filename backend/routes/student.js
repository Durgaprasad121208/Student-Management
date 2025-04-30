const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const auth = require('../middleware/auth');

// Student: Get their own profile
router.get('/my', auth('student'), studentController.getMyProfile);

// Admin: CRUD students
router.post('/', auth('admin'), studentController.createStudent);
router.get('/', auth(['admin']), studentController.getStudents);
router.put('/:id', auth('admin'), studentController.updateStudent);
router.delete('/:id', auth('admin'), studentController.deleteStudent);

module.exports = router;
