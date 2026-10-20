require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { connectDB } = require('./config/db');
const interviewController = require('./controllers/interviewController');
const authController = require('./controllers/authController');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas (if URI configured in .env)
connectDB();

// Ensure upload directory exists
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer Disk Storage for PDF Resumes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Adaptive AI & Student Mock Assessment Platform'
  });
});

// Auth Routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/me/:id', authController.getProfile);
app.post('/api/auth/resume', authController.saveResume);

// Resume REST API Endpoints (Supports both JSON & PDF File Uploads)
app.post('/api/resume/parse', interviewController.parseResume);
app.post('/api/resume/upload', upload.single('resume'), interviewController.parseResume);

// Interview REST API Endpoints
app.post('/api/interview/start', interviewController.startInterview);
app.post('/api/interview/evaluate-next', interviewController.evaluateAndNext);
app.post('/api/interview/finalize', interviewController.finalizeSession);
app.get('/api/interviews', interviewController.getSessions);
app.get('/api/interviews/:id', interviewController.getSessionById);

app.listen(PORT, () => {
  console.log(`🚀 Adaptive AI Assessment Server running on port ${PORT}`);
});
