const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Student = require('../models/Student');

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
    const quizId = req.body.quizId || req.params.id;
    const { answers } = req.body;
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    quiz.questions.forEach((q, idx) => {
      const ans = answers.find(a => String(a.questionId) === String(q._id));
      if (ans && ans.selectedOption === q.correctOption) {
        score += q.marks;
        correctCount++;
      } else if (ans) {
        incorrectCount++;
      }
    });
    const totalMarks = quiz.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    // Prevent duplicate attempts
    const studentId = req.user.studentId || req.user.id;
    const existingAttempt = await QuizAttempt.findOne({ quizId, studentId });
    if (existingAttempt) {
      return res.status(400).json({ message: 'You have already submitted this quiz.' });
    }
    const attempt = new QuizAttempt({
      quizId,
      studentId,
      answers,
      score,
      evaluated: true
    });
    await attempt.save();
    res.status(201).json({ 
      message: 'Quiz submitted', 
      score, 
      totalMarks, 
      correctCount, 
      incorrectCount,
      attemptId: attempt._id
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get a student's quiz attempts
exports.getStudentAttempts = async (req, res) => {
  try {
    const studentId = req.user.studentId || req.user.id;
    const { quizId } = req.query;
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
    const studentId = req.user.studentId || req.user.id;
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student profile not found' });
    const filter = {
      section: student.section,
      year: normalizeYear(student.year),
      semester: normalizeSemester(student.semester),
      isActive: true
    };
    const quizzes = await Quiz.find(filter);
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Student: Get all quizzes for their section/year/semester/subject with status
exports.getAllQuizzesWithStatus = async (req, res) => {
  try {
    // Support both /:studentId and /me endpoints
    let studentId = req.params.studentId;
    if (!studentId || studentId === 'me') {
      studentId = req.user.studentId || req.user.id;
    }
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student profile not found' });
    const filter = {
      section: normalizeSection(student.section),
      year: normalizeYear(student.year)
    };
    const semester = normalizeSemester(student.semester);
    if (semester) filter.semester = semester;
    const quizzes = await Quiz.find(filter).lean();
    const attempts = await QuizAttempt.find({ studentId }).lean();
    const attemptMap = {};
    attempts.forEach(a => { attemptMap[String(a.quizId)] = a; });
    const now = new Date();
    const quizzesWithStatus = quizzes.map(q => {
      const attempt = attemptMap[String(q._id)];
      let status = 'Available';
      if (attempt) {
        status = 'Attempted';
      } else if (q.deadline && new Date(q.deadline) < now) {
        status = 'Missed';
      }
      return {
        ...q,
        status,
        attempt: attempt || null
      };
    });
    res.json(quizzesWithStatus);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Student: Get quiz review data (questions + submitted answers + correctness)
exports.getQuizReview = async (req, res) => {
  try {
    const quizId = req.params.quizId || req.query.quizId;
    const studentId = req.user.studentId || req.user.id;
    const quiz = await Quiz.findById(quizId).lean();
    const attempt = await QuizAttempt.findOne({ quizId, studentId }).lean();
    if (!quiz || !attempt) return res.status(404).json({ message: 'Not found' });
    // Map answers for quick lookup
    const answerMap = {};
    (attempt.answers || []).forEach(a => { answerMap[String(a.questionId)] = a.selectedOption; });
    const questions = quiz.questions.map(q => ({
  ...q,
  text: q.text || q.questionText || '',
  submittedOption: answerMap[String(q._id)] ?? null,
  isCorrect: answerMap[String(q._id)] === q.correctOption
}));
    res.json({
      quizId: quiz._id,
      title: quiz.title,
      questions,
      score: attempt.score,
      totalMarks: questions.reduce((sum, q) => sum + (q.marks || 1), 0),
      correctCount: questions.filter(q => q.isCorrect).length,
      incorrectCount: questions.filter(q => q.submittedOption !== null && !q.isCorrect).length
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Helpers
function normalizeYear(year) {
  if (typeof year === 'string') {
    // Accept 'E-1', 'E-2', 'E-3', 'E-4' or 'E1', 'E2', etc.
    if (/^E-\d$/.test(year)) return 'E' + year[2]; // 'E-1' => 'E1'
    if (/^E\d$/.test(year)) return year; // 'E1', 'E2', etc.
  }
  return year;
}

function normalizeSection(section) {
  // Ensure section is in format 'CSE-01', 'CSE-02', etc.
  if (!section) return section;
  const match = section.match(/cse[-_ ]?(\d+)/i);
  if (match) {
    return `CSE-${match[1].padStart(2, '0')}`;
  }
  return section;
}

function normalizeSemester(sem) {
  if (sem === 'sem1' || sem === '1') return 'sem1';
  if (sem === 'sem2' || sem === '2') return 'sem2';
  return sem;
}
