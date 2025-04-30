const Student = require('../models/Student');
const User = require('../models/User');

// Get the authenticated student's profile
exports.getMyProfile = async (req, res) => {
  try {
    const studentId = req.user.studentId || req.user.id;
    const student = await Student.findOne({ userId: studentId }).populate('userId');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Admin: Add a new student (and user)
exports.createStudent = async (req, res) => {
  try {
    const { name, email, password, section, year, rollNo, idNumber, phone, profileData } = req.body;
    // Create user first
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });
    const passwordHash = await require('bcryptjs').hash(password, 10);
    const user = new User({ name, email, passwordHash, role: 'student', profileData });
    await user.save();
    // Create student profile
    const student = new Student({ userId: user._id, section, year, rollNo, idNumber, phone });
    await student.save();
    res.status(201).json({ message: 'Student created', student });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Admin: Get all students (with filters)
exports.getStudents = async (req, res) => {
  try {
    const { section, year, search } = req.query;
    const filter = {};
    if (section) filter.section = section;
    if (year) filter.year = year;
    if (search) filter.$or = [
      { rollNo: { $regex: search, $options: 'i' } },
      { address: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
    const students = await Student.find(filter).populate('userId');
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Admin: Update student
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { section, year, rollNo, idNumber, phone, profileData } = req.body;
    const student = await Student.findByIdAndUpdate(id, { section, year, rollNo, idNumber, phone }, { new: true });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    // Optionally update user profileData
    if (profileData) {
      await User.findByIdAndUpdate(student.userId, { profileData });
    }
    res.json({ message: 'Student updated', student });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Admin: Delete student
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByIdAndDelete(id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    await User.findByIdAndDelete(student.userId);
    res.json({ message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
