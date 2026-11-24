# 🚀 AdaptiveAI — Smart Mock Interview & Skill Gap Analysis Platform

An intelligent, full-stack mock interview platform designed for students and job candidates. It simulates realistic technical and aptitude interviews, dynamically adapts question difficulty based on candidate answers, provides transparent **Explainable AI (XAI)** evaluation scores with model benchmark answers, and generates actionable skill gap roadmaps.

---

## 🌟 Key Features

1. **📄 Resume Skill Extraction Engine**
   - Automatically parses PDF or text resumes, extracting technical skills, candidate domain, and experience level.

2. **⚡ Dynamic Adaptive Questioning Algorithm**
   - Questions adapt dynamically in real-time. High-scoring answers scale difficulty (Easy → Medium → Hard → Expert), while low-confidence answers adjust pacing and surface targeted hints.

3. **🧠 Explainable AI (XAI) & Semantic Answer Evaluator**
   - Evaluates answers using concept coverage, technical depth, and communication clarity.
   - Shows transparent score breakdowns and reveals the **"Ideal Mentor Answer"** so candidates know exactly how to answer perfectly.

4. **🎯 Custom Assessment Configurator**
   - Candidates can select custom question counts (e.g. 5, 10, 15 questions), time limits (10 to 45 mins), or even choose non-technical tracks (Business, Aptitude, Professional Communication, Custom Skills).

5. **📊 Past Results & History Portal**
   - Candidates can log in or register to track their previous mock sessions, view score trends, review past questions and evaluations, and download verified PDF certificates of completion.

6. **💻 Integrated Live Code Sandbox**
   - Embedded JavaScript / React code playground directly inside technical coding questions with real-time browser execution.

7. **📹 Production OpenCV AI Proctoring & Candidate Verification**
   - **Real-Time Face Presence Verification**: High-performance photometric and skin chrominance computer vision engine with universal Fitzpatrick I-VI coverage. Automatically detects empty-chair departures and pauses response inputs after 4s absence.
   - **Camera Obstruction & Hand-Coverage Defense**: Detects lens blocking, macro blurring, and hands covering the webcam sensor.
   - **Tab-Switching & Window Blur Audit Trail**: Monitors page visibility, window blur/focus events, and duration away from the assessment window with itemized trust score deductions.
   - **Real-Time Hardware Mic Status**: Synchronizes live with WebRTC audio tracks, detecting OS-level mutes and headset disconnects.
   - **Transparent Integrity Dashboard**: Real-time telemetry displaying Face Presence %, Focus Retention %, Tab Switch Count, Device Health, and chronological audit logs.
   - **Speech Dictation & Audio HUD**: Voice volume telemetry and Web Speech API dictation for hands-free answering.

---

## 🏗️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Recharts, Canvas Confetti, HTML2PDF.js
- **Backend**: Node.js, Express.js REST API
- **Authentication**: JSON Web Tokens (JWT, `jsonwebtoken`) with secure password hashing (`bcryptjs`)
- **AI & NLP**: Google Gemini AI (`@google/generative-ai`), Natural Language Processing, TF-IDF / Semantic Concept Coverage
- **Database**: MongoDB (Mongoose) with automatic zero-dependency local JSON fallback (`server/data/`)

---

## 🔑 Environment Variables Setup (`server/.env`)

Configure your `server/.env` file with MongoDB, Gemini AI, and JWT Authentication secret:

```env
PORT=5001

# Optional MongoDB Atlas Connection String (leave empty for automatic local storage fallback):
MONGODB_URI=

# Google Gemini API key (from https://aistudio.google.com/):
GEMINI_API_KEY=your_gemini_api_key_here

# JWT Authentication Secret Key (used to sign candidate tokens):
JWT_SECRET=your_super_secret_jwt_key_change_in_production
```

### 🔒 JWT Authentication Features
- **Stateless Tokens**: Signs secure 7-day expiration JSON Web Tokens containing user ID, email, and role.
- **Password Security**: Passwords are encrypted using salted `bcryptjs` hashes before database storage.
- **Protected Endpoints**: Verified using the `protect` middleware via `Authorization: Bearer <token>` HTTP header.
- **Session Verification**: Dedicated `/api/auth/verify` endpoint verifies existing sessions seamlessly.

---

## 🔑 How to Connect Google Gemini API Key

This platform can operate with **Google Gemini 1.5 Flash** for AI questions and response evaluations, with a built-in offline NLP engine fallback.

### Step 1: Obtain a Free Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click on **"Get API key"** in the top navigation.
4. Click **"Create API key"** (in a new project or existing Google Cloud project).
5. Copy the generated API key string.

### Step 2: Configure Environment Variables
1. Navigate to the `server/` directory.
2. In `server/`, look for the file named `.env` (or copy `.env.example` to `.env` if not present):
   ```bash
   cp server/.env.example server/.env
   ```
3. Open `server/.env` in any text editor and paste your API key:
   ```env
   PORT=5000
   
   # Optional MongoDB Atlas Connection String (leave empty for local file storage):
   MONGODB_URI=
   
   # Paste your Gemini API key here:
   GEMINI_API_KEY=AIzaSyYourGeneratedGeminiKeyHere12345
   ```
4. **Safety Guarantee**: The `.env` file is already listed in `.gitignore`. Your private API key will **never** be pushed to GitHub!

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v16 or higher installed on your machine.
- **npm**: Comes with Node.js.

### 2. Install Dependencies

Open a terminal in the project root:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Run the Application

In **Terminal 1** (Start Backend):
```bash
cd server
npm start
```
*Backend runs at `http://localhost:5001`*

In **Terminal 2** (Start Frontend):
```bash
cd client
npm run dev
```
*Frontend runs at `http://localhost:3000`*

Open `http://localhost:3000` in your web browser.

---

## 📦 Steps to Push to GitHub

When you're ready to upload this clean codebase to GitHub:

### 1. Initialize Git in the project root:
```bash
git init
```

### 2. Verify `.gitignore` is working (make sure `.env` and `node_modules` are NOT staged):
```bash
git status
```

### 3. Stage all clean files and commit:
```bash
git add .
git commit -m "feat: Initial commit of AdaptiveAI Mock Interview Platform"
```

### 4. Link your GitHub repository and push:
```bash
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY_NAME>.git
git push -u origin main
```

---

## 📁 Repository Structure

```
adaptive-interview-platform/
├── .gitignore                    # Ensures node_modules, .env, and logs are never committed
├── DATABASE_SCHEMA.md            # Detailed Mongoose schemas & MongoDB documentation
├── README.md                     # Project documentation & setup instructions
│
├── client/                       # React + Vite Frontend
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── components/           # Core UI Components (Interview, Results, Sandbox, etc.)
│       ├── App.jsx
│       └── main.jsx
│
└── server/                       # Node.js + Express Backend
    ├── .env.example              # Safe template for environment variables
    ├── .gitignore
    ├── index.js                  # Main server entrypoint
    ├── package.json
    ├── config/                   # MongoDB connection config
    ├── controllers/              # Route controllers (Auth, Interview)
    ├── data/                     # Offline storage & comprehensive question bank
    ├── models/                   # Mongoose schemas (User, InterviewSession)
    ├── services/                 # Adaptive engine, Gemini service, NLP & XAI
    └── uploads/                  # Upload directory (.gitkeep preserved)
```

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
