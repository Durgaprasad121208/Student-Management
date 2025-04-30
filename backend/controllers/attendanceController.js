const Attendance = require('../models/Attendance');

// Mark attendance for students (bulk or single), ensuring no duplicates for the same student/subject/date
function normalizeDate(dateStr) {
  // Always store as midnight UTC
  const d = new Date(dateStr);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

exports.markAttendance = async (req, res) => {
  try {
    let { studentId, date, status, section, year, semester, subject, records } = req.body;
    if (!['sem1', 'sem2'].includes(semester)) {
      return res.status(400).json({ message: 'Semester must be sem1 or sem2' });
    }
    if (!date || !subject) {
      return res.status(400).json({ message: 'Date and subject are required.' });
    }
    const normalizedDate = normalizeDate(date);
    if (records && Array.isArray(records)) {
      // Bulk attendance
      const results = [];
      for (const r of records) {
        const filter = { studentId: r.studentId, date: normalizedDate, subject };
        const update = {
          status: r.status,
          section,
          year,
          semester,
          subject,
          date: normalizedDate
        };
        const doc = await Attendance.findOneAndUpdate(filter, update, { upsert: true, new: true, setDefaultsOnInsert: true });
        results.push(doc);
      }
      return res.status(201).json({ message: 'Bulk attendance marked/updated', count: results.length });
    } else {
      // Single attendance
      if (!studentId) {
        return res.status(400).json({ message: 'studentId is required' });
      }
      const filter = { studentId, date: normalizedDate, subject };
      const update = { status, section, year, semester, subject, date: normalizedDate };
      const doc = await Attendance.findOneAndUpdate(filter, update, { upsert: true, new: true, setDefaultsOnInsert: true });
      return res.status(201).json({ message: 'Attendance marked/updated', attendance: doc });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get attendance summary for a student per semester (with subject/date filter)
exports.getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { semester, subject, date } = req.query;
    const filter = { studentId };
    if (semester) filter.semester = semester;
    if (subject) filter.subject = subject;
    if (date) filter.date = new Date(date);
    const records = await Attendance.find(filter);
    const presents = records.filter(r => r.status === 'Present').length;
    const total = records.length;
    const percentage = total > 0 ? (presents / total) * 100 : 0;
    res.json({ presents, total, percentage, records });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get attendance summary for the authenticated student (with subject/date filter)
exports.getMyAttendance = async (req, res) => {
  try {
    const { semester, subject, date } = req.query;
    const studentId = req.user.studentId || req.user.id;
    const filter = { studentId };
    if (semester) filter.semester = semester;
    if (subject) filter.subject = subject;
    if (date) filter.date = new Date(date);
    const records = await Attendance.find(filter);
    const presents = records.filter(r => r.status === 'Present').length;
    const total = records.length;
    const percentage = total > 0 ? (presents / total) * 100 : 0;
    res.json({ presents, total, percentage, records });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
