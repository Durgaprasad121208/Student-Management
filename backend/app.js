require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.get('/', (req, res) => {
    res.send('Student Management System API');
});
app.use('/api/auth', require('./routes/auth'));
app.use('/api/marks', require('./routes/marks'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/subject', require('./routes/subject'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/student', require('./routes/student'));
app.use('/api/report', require('./routes/report'));
app.use('/api/notification', require('./routes/notification'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api/import', require('./routes/import'));
app.use('/api/admin/dashboard', require('./routes/dashboard'));

// Error handling middleware (placeholder)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
