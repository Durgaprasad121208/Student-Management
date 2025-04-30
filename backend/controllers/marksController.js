const Marks = require('../models/Marks');

// Create new marks entry
exports.createMarks = async (req, res) => {
  try {
    const { studentId, subject, assessmentType, score, maxScore, date, semester, year, section } = req.body;
    if (!['sem1', 'sem2'].includes(semester)) {
      return res.status(400).json({ message: 'Semester must be sem1 or sem2' });
    }
    // Check for existing marks with same keys
    const existing = await Marks.findOne({
      studentId,
      subject,
      assessmentType,
      semester
    });
    if (existing) {
      // Update the existing entry
      existing.score = score;
      existing.maxScore = maxScore;
      existing.date = date;
      await existing.save();
      return res.status(200).json({ message: 'Warning: Existing marks updated for this student, subject, assessment, year, section, and semester.', marks: existing, warning: true });
    }
    const marks = new Marks({ studentId, subject, assessmentType, score, maxScore, date, semester });
    await marks.save();
    res.status(201).json({ message: 'Marks added successfully', marks });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get marks for a student (optionally filter by semester)
exports.getStudentMarks = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { semester } = req.query;
    const filter = { studentId };
    if (semester) {
      filter.semester = semester;
    }
    const marks = await Marks.find(filter);
    res.json(marks);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get marks for the authenticated student
exports.getMyMarks = async (req, res) => {
  try {
    const { semester } = req.query;
    // Try to use studentId from user, fallback to user id
    const studentId = req.user.studentId || req.user.id;
    const filter = { studentId };
    if (semester) {
      filter.semester = semester;
    }
    const marks = await Marks.find(filter);
    res.json(marks);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
