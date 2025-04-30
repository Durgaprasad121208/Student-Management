const Report = require('../models/Report');
const Student = require('../models/Student');
const Marks = require('../models/Marks');
const Attendance = require('../models/Attendance');
const PDFDocument = require('pdfkit');

// Generate a report for a student (PDF, CSV, or XLSX)
exports.generateStudentReport = async (req, res) => {
  try {
    const { studentId, semester } = req.query;
    const student = await Student.findById(studentId).populate('userId');
    const marks = await Marks.find({ studentId, semester });
    const attendance = await Attendance.find({ studentId, semester });
    // Calculate attendance summary
    const presents = attendance.filter(a => a.status === 'Present').length;
    const total = attendance.length;
    const attendancePct = total > 0 ? (presents / total) * 100 : 0;
    // Create PDF
    // Handle format=xlsx (Excel)
    if (req.query.format === 'xlsx') {
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Student Report');
      sheet.columns = [
        { header: 'Field', key: 'field', width: 24 },
        { header: 'Value', key: 'value', width: 48 }
      ];
      sheet.addRow({ field: 'Name', value: student.userId.name });
      sheet.addRow({ field: 'Email', value: student.userId.email });
      sheet.addRow({ field: 'Section', value: student.section });
      sheet.addRow({ field: 'Year', value: student.year });
      sheet.addRow({ field: 'Semester', value: semester });
      sheet.addRow({ field: 'Attendance', value: `${presents}/${total} (${attendancePct.toFixed(2)}%)` });
      sheet.addRow({ field: 'Marks', value: marks.map(m => `${m.subject} (${m.assessmentType}): ${m.score}/${m.maxScore}`).join('; ') });
      // Quiz results
      sheet.addRow({ field: 'Quizzes', value: quizData.filter(q => q).map(q => `${q.quizTitle}: ${q.score}`).join('; ') });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=student_report_${studentId}_${semester}.xlsx`);
      await workbook.xlsx.write(res);
      return res.end();
    }
    // Handle format=csv
    if (req.query.format === 'csv') {
      let csv = '\uFEFFField,Value\n';
      csv += `Name,"${student.userId.name}"\n`;
      csv += `Email,"${student.userId.email}"\n`;
      csv += `Section,"${student.section}"\n`;
      csv += `Year,"${student.year}"\n`;
      csv += `Semester,"${semester}"\n`;
      csv += `Attendance,"${presents}/${total} (${attendancePct.toFixed(2)}%)"\n`;
      csv += `Marks,"${marks.map(m => `${m.subject} (${m.assessmentType}): ${m.score}/${m.maxScore}`).join('; ')}"\n`;
      csv += `Quizzes,"${quizData.filter(q => q).map(q => `${q.quizTitle}: ${q.score}`).join('; ')}"\n`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=student_report_${studentId}_${semester}.csv`);
      return res.send(csv);
    }
    // Default: PDF
    const doc = new PDFDocument();
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      let pdfData = Buffer.concat(buffers);
      res.setHeader('Content-Type', 'application/pdf');
      res.send(pdfData);
    });
    doc.text(`Student Report for ${student.userId.name} (${student.userId.email})`);
    doc.text(`Section: ${student.section}, Year: ${student.year}, Semester: ${semester}`);
    doc.text(`Attendance: ${presents}/${total} (${attendancePct.toFixed(2)}%)`);
    doc.text('Marks:');
    marks.forEach(m => {
      doc.text(`${m.subject} (${m.assessmentType}): ${m.score}/${m.maxScore}`);
    });
    // Save a summary report to the database (before PDF generation)
    const QuizAttempt = require('../models/QuizAttempt');
    const Quiz = require('../models/Quiz');

    // Fetch quiz attempts for this student and semester
    let quizAttempts = [];
    try {
      quizAttempts = await QuizAttempt.find({ studentId: student._id });
    } catch (e) {
      quizAttempts = [];
    }
    // Fetch quiz info for each attempt
    let quizData = [];
    try {
      quizData = await Promise.all(
        quizAttempts.map(async (attempt) => {
          try {
            const quiz = await Quiz.findById(attempt.quizId);
            if (!quiz) return null;
            if (quiz.semester !== semester) return null;
            return {
              quizTitle: quiz.title,
              subject: quiz.subject,
              score: attempt.score,
              submittedAt: attempt.submittedAt
            };
          } catch (err) {
            return null;
          }
        })
      );
    } catch (e) {
      quizData = [];
    }
    // Handle empty marks, attendance, quizzes gracefully
    const attendanceSummary = { presents, total, percent: attendancePct };
    const marksSummary = Array.isArray(marks) && marks.length > 0 ? marks.map(m => ({
      subject: m.subject,
      assessmentType: m.assessmentType,
      score: m.score,
      maxScore: m.maxScore
    })) : [{ subject: null, assessmentType: null, score: 0, maxScore: 0 }];
    const quizzesSummary = quizData && quizData.filter(q => q).length > 0 ? quizData.filter(q => q) : [{ quizTitle: null, subject: null, score: 0, submittedAt: null }];
    await Report.create({
      studentId: student._id,
      type: 'performance',
      data: {
        attendance: attendanceSummary,
        marks: marksSummary,
        quizzes: quizzesSummary
      },
      generatedBy: req.user ? req.user._id : null
    });

    doc.end();
    return;
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Generate a class-wise report for a section/year/semester
exports.generateClassReport = async (req, res) => {
  try {
    const { section, year, semester, format = 'pdf' } = req.query;
    if (!section || !year || !semester) {
      return res.status(400).json({ message: 'Missing section, year, or semester' });
    }
    const Student = require('../models/Student');
    const Marks = require('../models/Marks');
    const Attendance = require('../models/Attendance');
    const QuizAttempt = require('../models/QuizAttempt');
    const Quiz = require('../models/Quiz');
    const students = await Student.find({ section, year });
    let reportRows = [];
    for (const student of students) {
      const marks = await Marks.find({ studentId: student._id, semester });
      const attendance = await Attendance.find({ studentId: student._id, semester });
      const presents = attendance.filter(a => a.status === 'Present').length;
      const total = attendance.length;
      const attendancePct = total > 0 ? (presents / total) * 100 : 0;
      let quizAttempts = [];
      try { quizAttempts = await QuizAttempt.find({ studentId: student._id }); } catch { quizAttempts = []; }
      let quizData = [];
      try {
        quizData = await Promise.all(
          quizAttempts.map(async (attempt) => {
            try {
              const quiz = await Quiz.findById(attempt.quizId);
              if (!quiz) return null;
              if (quiz.semester !== semester) return null;
              return {
                quizTitle: quiz.title,
                subject: quiz.subject,
                score: attempt.score,
                submittedAt: attempt.submittedAt
              };
            } catch { return null; }
          })
        );
      } catch { quizData = []; }
      reportRows.push({
        studentId: student._id,
        name: student.userId?.name || '',
        email: student.userId?.email || '',
        attendance: { presents, total, percent: attendancePct },
        marks: marks.length > 0 ? marks.map(m => ({
          subject: m.subject,
          assessmentType: m.assessmentType,
          score: m.score,
          maxScore: m.maxScore
        })) : [{ subject: null, assessmentType: null, score: 0, maxScore: 0 }],
        quizzes: quizData && quizData.filter(q => q).length > 0 ? quizData.filter(q => q) : [{ quizTitle: null, subject: null, score: 0, submittedAt: null }]
      });
    }
    // If no students, generate a single empty row
    if (reportRows.length === 0) {
      reportRows.push({
        studentId: null,
        name: null,
        email: null,
        attendance: { presents: 0, total: 0, percent: 0 },
        marks: [{ subject: null, assessmentType: null, score: 0, maxScore: 0 }],
        quizzes: [{ quizTitle: null, subject: null, score: 0, submittedAt: null }]
      });
    }
    // Save class report summary in DB
    const Report = require('../models/Report');
    // Determine report type based on query or default to 'Performance'
    let reportType = req.query.reportType;
    if (!['Attendance','Marks','Performance'].includes(reportType)) reportType = 'Performance';
    await Report.create({
      type: reportType,
      data: { section, year, semester, students: reportRows },
      generatedBy: req.user ? req.user._id : null
    });
    // Generate file for download
    if (format === 'xlsx') {
      // Generate real Excel file
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Class Report');
      sheet.columns = [
        { header: 'Name', key: 'name', width: 24 },
        { header: 'Email', key: 'email', width: 32 },
        { header: 'Attendance', key: 'attendance', width: 18 },
        { header: 'Marks', key: 'marks', width: 36 },
        { header: 'Quizzes', key: 'quizzes', width: 36 }
      ];
      for (const row of reportRows) {
        sheet.addRow({
          name: row.name || '',
          email: row.email || '',
          attendance: `${row.attendance.presents}/${row.attendance.total} (${row.attendance.percent.toFixed(2)}%)`,
          marks: (row.marks || []).map(m => `${m.subject||''}:${m.score||0}/${m.maxScore||0}`).join('; '),
          quizzes: (row.quizzes || []).map(q => `${q.quizTitle||''}:${q.score||0}`).join('; ')
        });
      }
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=class_report_${section}_${year}_${semester}.xlsx`);
      await workbook.xlsx.write(res);
      return res.end();
    }
    if (format === 'csv') {
      // CSV logic remains
      let csv = '\uFEFFName,Email,Attendance,Marks,Quizzes\n';
      for (const row of reportRows) {
        csv += `"${row.name}","${row.email}","${row.attendance.presents}/${row.attendance.total} (${row.attendance.percent.toFixed(2)}%)","${row.marks.map(m => `${m.subject||''}:${m.score||0}/${m.maxScore||0}`).join('; ')}","${row.quizzes.map(q => `${q.quizTitle||''}:${q.score||0}`).join('; ')}"\n`;
      }
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=class_report_${section}_${year}_${semester}.csv`);
      return res.send(csv);
    } else {
      // Generate PDF
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument();
      let buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        let pdfData = Buffer.concat(buffers);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=class_report_${section}_${year}_${semester}.pdf`);
        res.send(pdfData);
      });
      doc.fontSize(14).text(`Class Report for Section: ${section}, Year: ${year}, Semester: ${semester}`);
      doc.moveDown();
      // Table headers
      doc.fontSize(12).text('Name', {continued:true, width:120});
      doc.text('Email', {continued:true, width:180});
      doc.text('Attendance', {continued:true, width:120});
      doc.text('Marks', {continued:true, width:180});
      doc.text('Quizzes');
      doc.moveDown(0.5);
      doc.moveTo(doc.x, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke();
      for (const row of reportRows) {
        doc.moveDown(0.5);
        doc.fontSize(11).text(`${row.name || ''}`, {continued:true, width:120});
        doc.text(`${row.email || ''}`, {continued:true, width:180});
        doc.text(`${row.attendance.presents}/${row.attendance.total} (${row.attendance.percent.toFixed(2)}%)`, {continued:true, width:120});
        doc.text(`${row.marks.map(m => `${m.subject||''}:${m.score||0}/${m.maxScore||0}`).join('; ')}`, {continued:true, width:180});
        doc.text(`${row.quizzes.map(q => `${q.quizTitle||''}:${q.score||0}`).join('; ')}`);
        doc.moveDown(0.25);
      }
      doc.end();
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all reports (admin)
exports.getAllReports = async (req, res) => {
  try {
    let reports = await Report.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete a report by ID
exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Report.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Report not found' });
    res.json({ success: true, message: 'Report deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Download a report (PDF or CSV)
exports.downloadReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'pdf' } = req.query;
    let report = await Report.findById(id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    if (format === 'csv') {
      // Improved CSV: flatten nested objects/arrays for readability
      let csv = '';
      if (report.type === 'class' && Array.isArray(report.data.students)) {
        // Class report: header
        csv += 'Name,Email,Attendance,Marks,Quizzes\n';
        for (const row of report.data.students) {
          const attendanceStr = row.attendance ? `${row.attendance.presents}/${row.attendance.total} (${row.attendance.percent?.toFixed(2) || 0}%)` : '';
          const marksStr = Array.isArray(row.marks) ? row.marks.map(m => `${m.subject||''}:${m.score||0}/${m.maxScore||0}`).join('; ') : '';
          const quizStr = Array.isArray(row.quizzes) ? row.quizzes.map(q => `${q.quizTitle||''}:${q.score||0}`).join('; ') : '';
          csv += `"${row.name||''}","${row.email||''}","${attendanceStr}","${marksStr}","${quizStr}"\n`;
        }
      } else {
        // Individual report or unknown: flatten all keys
        csv += Object.entries(report.data).map(([k, v]) => {
          if (Array.isArray(v)) {
            return `${k},"${v.map(item => typeof item === 'object' ? JSON.stringify(item) : item).join('; ')}"`;
          } else if (typeof v === 'object' && v !== null) {
            return `${k},"${Object.entries(v).map(([kk, vv]) => kk+':'+vv).join('; ')}"`;
          } else {
            return `${k},${v}`;
          }
        }).join('\n');
      }
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=report_${id}.csv`);
      return res.send('\uFEFF'+csv);
    }
    // Default: PDF
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      let pdfData = Buffer.concat(buffers);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=report_${id}.pdf`);
      res.send(pdfData);
    });
    doc.text(`Report Type: ${report.type}`);
    Object.entries(report.data).forEach(([k, v]) => {
      doc.text(`${k}: ${v}`);
    });
    // Save a summary report to the database (before PDF generation)
    const QuizAttempt = require('../models/QuizAttempt');
    const Quiz = require('../models/Quiz');

    // Fetch quiz attempts for this student and semester
    let quizAttempts = [];
    try {
      quizAttempts = await QuizAttempt.find({ studentId: student._id });
    } catch (e) {
      quizAttempts = [];
    }
    // Fetch quiz info for each attempt
    let quizData = [];
    try {
      quizData = await Promise.all(
        quizAttempts.map(async (attempt) => {
          try {
            const quiz = await Quiz.findById(attempt.quizId);
            if (!quiz) return null;
            if (quiz.semester !== semester) return null;
            return {
              quizTitle: quiz.title,
              subject: quiz.subject,
              score: attempt.score,
              submittedAt: attempt.submittedAt
            };
          } catch (err) {
            return null;
          }
        })
      );
    } catch (e) {
      quizData = [];
    }
    // Handle empty marks, attendance, quizzes gracefully
    const attendanceSummary = { presents, total, percent: attendancePct };
    const marksSummary = Array.isArray(marks) && marks.length > 0 ? marks.map(m => ({
      subject: m.subject,
      assessmentType: m.assessmentType,
      score: m.score,
      maxScore: m.maxScore
    })) : [{ subject: null, assessmentType: null, score: 0, maxScore: 0 }];
    const quizzesSummary = quizData && quizData.filter(q => q).length > 0 ? quizData.filter(q => q) : [{ quizTitle: null, subject: null, score: 0, submittedAt: null }];
    await Report.create({
      studentId: student._id,
      type: 'performance',
      data: {
        attendance: attendanceSummary,
        marks: marksSummary,
        quizzes: quizzesSummary
      },
      generatedBy: req.user ? req.user._id : null
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get reports for the authenticated student
exports.getMyReports = async (req, res) => {
  try {
    const studentId = req.user.studentId || req.user.id;
    const reports = await Report.find({ studentId });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
