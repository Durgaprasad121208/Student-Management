
const Student = require('../models/Student');
const User = require('../models/User');
const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const Attendance = require('../models/Attendance');

// Bulk import students from Excel
exports.importStudents = async (req, res) => {
  console.log('📁 Received file for import...'); // Loading start

  try {
    if (!req.file) {
      console.log('⚠️ No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    let created = 0;
    let skipped = 0;
    const errors = [];
let updated = 0;
const dryRunCreate = [];
const dryRunUpdate = [];
const dryRunNoChange = [];
const notifications = [];


    console.log(`📄 Processing ${rows.length} rows from Excel...`);

    for (const [index, row] of rows.entries()) {
      try {
        const {
          Email: email,
          Password: password,
          Section: section,
          Year: year,
          'Roll No': rollNo,
          'ID Number': idNumber,
          Phone: phone
        } = row;

        const name = email?.split('@')[0];

        if (!name || !email || !password || !section || !year || !rollNo || !idNumber) {
          skipped++;
          errors.push({ row: index + 2, reason: 'Missing required fields' });
          continue;
        }

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
          skipped++;
          errors.push({ row: index + 2, reason: 'Email already exists' });
          continue;
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = new User({
          name,
          email: email.toLowerCase(),
          passwordHash,
          role: 'student'
        });
        await user.save();

        const student = new Student({
          userId: user._id,
          section,
          year,
          rollNo,
          idNumber,
          phone
        });
        await student.save();

        created++;
      } catch (err) {
        skipped++;
        errors.push({ row: index + 2, reason: err.message });
      }
    }

    fs.unlinkSync(req.file.path);

    console.log(`✅ Import complete: ${created} created, ${skipped} skipped.`);
    if (errors.length) {
      console.log('⚠️ Skipped Rows:', errors);
    }

    res.json({
      status: 'success',
      message: `Import complete: ${created} created, ${skipped} skipped.`,
      created,
      skipped,
      errors
    });

  } catch (err) {
    console.error('❌ Server error:', err.message);
    res.status(500).json({ status: 'error', message: 'Server error', error: err.message });
  }
};

// Helper to normalize date to midnight UTC
function normalizeDate(dateStr) {
  const d = new Date(dateStr);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// Bulk import attendance from Excel
exports.importAttendance = async (req, res) => {
  // Step 1: Check for confirmation flag (from body or query)
  const confirmUpdate = req.body.confirmUpdate === true || req.query.confirmUpdate === 'true';
  console.log('📁 Received file for attendance import...');
  try {
    if (!req.file) {
      console.log('⚠️ No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    let created = 0;
    let skipped = 0;
    const errors = [];
let updated = 0;
const dryRunCreate = [];
const dryRunUpdate = [];
const dryRunNoChange = [];
const notifications = [];


    console.log(`📄 Processing ${rows.length} rows from Excel...`);

    for (const [index, row] of rows.entries()) {
      try {
        let {
          'ID Number': idNumber,
          Date: date,
          Status: status,
          Section: section,
          Year: year,
          Semester: semester,
          Subject: subject
        } = row;

        // Normalize and trim all fields
        if (typeof idNumber === 'string') idNumber = idNumber.trim();
        if (typeof date === 'string') date = date.trim();
        if (typeof status === 'string') {
          status = status.trim();
          // Normalize status to 'Present' or 'Absent' (capitalized)
          const normalized = status.toLowerCase();
          if (normalized === 'present') status = 'Present';
          else if (normalized === 'absent') status = 'Absent';
          else {
            skipped++;
            errors.push({ row: index + 2, reason: `Invalid status value '${status}'. Must be Present or Absent.` });
            continue;
          }
        }
        if (typeof section === 'string') section = section.trim().toUpperCase();
        if (typeof year === 'string') year = year.trim().toUpperCase();
        if (typeof semester === 'string') {
          let s = semester.trim().toLowerCase();
          if (s === 'sem1' || s === '1') semester = 'sem1';
          else if (s === 'sem2' || s === '2') semester = 'sem2';
          else semester = null; // Unrecognized, will be caught below
        }
        if (typeof subject === 'string') subject = subject.trim();

        if (!idNumber || !date || !status || !section || !year || !semester || !subject) {
          skipped++;
          errors.push({ row: index + 2, reason: 'Missing or invalid required fields (check semester value: must be sem1 or sem2)' });
          continue;
        }

        // Find student by idNumber
        const student = await Student.findOne({ idNumber });
        if (!student) {
          skipped++;
          errors.push({ row: index + 2, reason: 'Student not found' });
          continue;
        }

        const filter = {
          studentId: student._id,
          date: normalizeDate(date),
          subject: subject
        };
        // Prevent importing attendance for future dates
        const now = new Date('2025-05-02T13:26:08+05:30');
        const normalizedDate = normalizeDate(date);
        if (normalizedDate > now) {
          skipped++;
          errors.push({ row: index + 2, reason: 'Cannot import attendance for a future date.' });
          continue;
        }
        const update = {
          status,
          section,
          year,
          semester,
          subject,
          date: normalizeDate(date),
          studentId: student._id
        };
        // Check if record already exists
        const preExisting = await Attendance.findOne(filter);
        if (!confirmUpdate) {
          // Dry run: preview changes, do not write to DB
          if (preExisting) {
            // Compare if update is needed
            if (
              preExisting.status !== update.status ||
              preExisting.section !== update.section ||
              preExisting.year !== update.year ||
              preExisting.semester !== update.semester ||
              preExisting.subject !== update.subject
            ) {
              dryRunUpdate.push({ row: index + 2, idNumber, changes: {
                from: {
                  status: preExisting.status, section: preExisting.section, year: preExisting.year, semester: preExisting.semester, subject: preExisting.subject
                },
                to: { status, section, year, semester, subject }
              }});
            } else {
              dryRunNoChange.push({ row: index + 2, idNumber });
            }
          } else {
            dryRunCreate.push({ row: index + 2, idNumber });
          }
        } else {
          // Actual update/insert
          const doc = await Attendance.findOneAndUpdate(filter, update, { upsert: true, new: true, setDefaultsOnInsert: true });
          if (preExisting) {
            updated++;
            notifications.push({ row: index + 2, message: 'Record already existed and was updated.' });
          } else {
            created++;
          }
        }
      } catch (err) {
        skipped++;
        errors.push({ row: index + 2, reason: err.message });
      }
    }

    fs.unlinkSync(req.file.path);

    if (!confirmUpdate) {
      // Dry run response: Preview what would happen
      return res.json({
        status: 'dryrun',
        message: 'Duplicates are not possible, but you can update the records or cancel the operation.',
        duplicatesNotPossible: true,
        toCreate: dryRunCreate,
        toUpdate: dryRunUpdate,
        noChange: dryRunNoChange,
        skipped,
        errors
      });
    }

    console.log(`✅ Attendance import complete: ${created} created, ${updated} updated, ${skipped} skipped.`);
    if (errors.length) {
      console.log('⚠️ Skipped Rows:', errors);
    }

    res.json({
      status: 'success',
      message: `Attendance import complete: ${created} created, ${updated} updated, ${skipped} skipped.`,
      created,
      updated,
      skipped,
      errors,
      notifications
    });
  } catch (err) {
    console.error('❌ Server error:', err.message);
    res.status(500).json({ status: 'error', message: 'Server error', error: err.message });
  }
};
