require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { connectDB } = require('./config/db');
const interviewController = require('./controllers/interviewController');
const authController = require('./controllers/authController');
const { protect } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5001;

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

// Diagnostic Gemini Status Endpoint
app.get('/api/gemini-status', async (req, res) => {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
  const info = {
    hasKey: !!apiKey,
    keyLength: apiKey.length,
    keyPrefix: apiKey ? apiKey.substring(0, 6) + '...' + apiKey.slice(-4) : 'none',
    timestamp: new Date().toISOString()
  };
  if (!apiKey) {
    return res.json({ ...info, status: 'NO_KEY', message: 'GEMINI_API_KEY is missing from environment variables.' });
  }
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent('ping');
    return res.json({ ...info, status: 'CONNECTED', response: result.response.text().trim() });
  } catch (err) {
    return res.status(500).json({ ...info, status: 'ERROR', error: err.message });
  }
});

// Auth Routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/verify', protect, authController.verifyMe);
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
