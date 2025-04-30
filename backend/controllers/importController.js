const Student = require('../models/Student');
const User = require('../models/User');
const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');
const fs = require('fs');

// Bulk import students from Excel
exports.importStudents = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);
    let created = 0, skipped = 0;
    for (const row of rows) {
      const { name, email, password, section, year, rollNo, address, phone } = row;
      if (!name || !email || !password || !section || !year || !rollNo) { skipped++; continue; }
      const existing = await User.findOne({ email });
      if (existing) { skipped++; continue; }
      const passwordHash = await bcrypt.hash(password, 10);
      const user = new User({ name, email, passwordHash, role: 'student' });
      await user.save();
      const student = new Student({ userId: user._id, section, year, rollNo, address, phone });
      await student.save();
      created++;
    }
    fs.unlinkSync(req.file.path);
    res.json({ message: `Import complete: ${created} created, ${skipped} skipped.` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
