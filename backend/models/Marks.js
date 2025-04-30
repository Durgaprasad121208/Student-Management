const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  subject: { type: String, required: true },
  assessmentType: { type: String, required: true },
  score: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  date: { type: Date, required: true },
  semester: { type: String, enum: ['sem1', 'sem2'], required: true },
});

module.exports = mongoose.model('Marks', marksSchema);
