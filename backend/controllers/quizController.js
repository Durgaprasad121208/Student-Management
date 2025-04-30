const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Student = require('../models/Student');

// Admin: Update a quiz
exports.updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subject, section, year, semester, questions, deadline, isActive } = req.body;
    const update = { title, subject, section, year, semester, questions, deadline };
    if (typeof isActive !== 'undefined') update.isActive = isActive;
    const quiz = await Quiz.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.json({ message: 'Quiz updated', quiz });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Admin: Delete a quiz
exports.deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findByIdAndDelete(id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.json({ message: 'Quiz deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Admin: Create a quiz
exports.createQuiz = async (req, res) => {
  try {
    const { title, subject, section, year, semester, questions, deadline } = req.body;
    const quiz = new Quiz({
      title,
      subject,
      section,
      year,
      semester,
      questions,
      createdBy: req.user.id,
      deadline
    });
    await quiz.save();
    res.status(201).json({ message: 'Quiz created', quiz });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all quizzes for a section/year/semester/subject
exports.getQuizzes = async (req, res) => {
  try {
    const { section, year, semester, subject, isActive } = req.query;
    const filter = {};
    if (section) filter.section = section;
    if (year) filter.year = year;
    if (semester) filter.semester = semester;
    if (subject) filter.subject = subject;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    const quizzes = await Quiz.find(filter);
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Student: Submit quiz attempt
exports.submitQuiz = async (req, res) => {
  try {
    const { quizId, answers } = req.body;
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    // Evaluate score
    let score = 0;
    quiz.questions.forEach((q, idx) => {
      const ans = answers.find(a => String(a.questionId) === String(q._id));
      if (ans && ans.selectedOption === q.correctOption) {
        score += q.marks;
      }
    });
    const attempt = new QuizAttempt({
      quizId,
      studentId: req.user.id,
      answers,
      score,
      evaluated: true
    });
    await attempt.save();
    res.status(201).json({ message: 'Quiz submitted', score });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get a student's quiz attempts
exports.getStudentAttempts = async (req, res) => {
  try {
    const { quizId } = req.query;
    const studentId = req.user.studentId || req.user.id;
    const filter = { studentId };
    if (quizId) filter.quizId = quizId;
    const attempts = await QuizAttempt.find(filter);
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get available quizzes for the authenticated student
exports.getAvailableQuizzes = async (req, res) => {
  try {
    // Fetch the student's profile to get section/year/semester
    const studentId = req.user.studentId || req.user.id;
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student profile not found' });
    const filter = {
      section: student.section,
      year: student.year,
      semester: student.semester,
      isActive: true
    };
    const quizzes = await Quiz.find(filter);
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
