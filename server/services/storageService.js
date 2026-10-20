const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getIsConnected } = require('../config/db');
let InterviewSession = null;
try {
  InterviewSession = require('../models/InterviewSession');
} catch (e) {
  // Model loading failsafe
}

const STORAGE_FILE = path.join(__dirname, '../data/interviews.json');

// Ensure directory exists
function ensureFile() {
  const dir = path.dirname(STORAGE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(STORAGE_FILE)) {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify([]), 'utf8');
  }
}

function getAllSessionsLocal() {
  try {
    ensureFile();
    const data = fs.readFileSync(STORAGE_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error("Storage read error:", err);
    return [];
  }
}

function saveSessionLocal(sessionData) {
  ensureFile();
  const sessions = getAllSessionsLocal();

  let existingIndex = sessions.findIndex(s => (s.id || s.sessionId) === (sessionData.id || sessionData.sessionId));
  if (existingIndex >= 0) {
    sessions[existingIndex] = { ...sessions[existingIndex], ...sessionData, updatedAt: new Date().toISOString() };
  } else {
    sessionData.id = sessionData.id || sessionData.sessionId || uuidv4();
    sessionData.sessionId = sessionData.sessionId || sessionData.id;
    sessionData.createdAt = sessionData.createdAt || new Date().toISOString();
    sessionData.updatedAt = new Date().toISOString();
    sessions.push(sessionData);
  }

  fs.writeFileSync(STORAGE_FILE, JSON.stringify(sessions, null, 2), 'utf8');
  return sessionData;
}

/**
 * Save session to both MongoDB (if online) and local JSON storage
 */
async function saveSession(sessionData) {
  sessionData.id = sessionData.id || sessionData.sessionId || uuidv4();
  sessionData.sessionId = sessionData.sessionId || sessionData.id;

  // Always keep local JSON storage in sync
  saveSessionLocal(sessionData);

  // If MongoDB is connected, persist to MongoDB Atlas
  if (getIsConnected() && InterviewSession) {
    try {
      await InterviewSession.findOneAndUpdate(
        { sessionId: sessionData.sessionId },
        sessionData,
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
    } catch (mongoErr) {
      console.error("MongoDB saveSession error (cached locally):", mongoErr.message);
    }
  }

  return sessionData;
}

/**
 * Get session by ID (from MongoDB or local file)
 */
async function getSessionById(id) {
  if (getIsConnected() && InterviewSession) {
    try {
      const doc = await InterviewSession.findOne({
        $or: [{ sessionId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
      }).lean();
      if (doc) return { ...doc, id: doc.sessionId || doc._id };
    } catch (mongoErr) {
      console.error("MongoDB getSessionById error:", mongoErr.message);
    }
  }

  const sessions = getAllSessionsLocal();
  return sessions.find(s => s.id === id || s.sessionId === id);
}

/**
 * Get all sessions (optionally filtered by candidate's userId)
 */
async function getAllSessions(filterUserId = null) {
  if (getIsConnected() && InterviewSession) {
    try {
      const query = filterUserId ? { userId: filterUserId } : {};
      const docs = await InterviewSession.find(query).sort({ createdAt: -1 }).lean();
      if (docs && docs.length > 0) {
        return docs.map(d => ({ ...d, id: d.sessionId || d._id }));
      }
    } catch (mongoErr) {
      console.error("MongoDB getAllSessions error:", mongoErr.message);
    }
  }

  let sessions = getAllSessionsLocal();
  if (filterUserId) {
    sessions = sessions.filter(s => s.userId === filterUserId);
  }
  return sessions.reverse(); // Most recent first
}

module.exports = {
  getAllSessions,
  getSessionById,
  saveSession,
  // Synchronous helpers for backward compatibility
  getAllSessionsSync: getAllSessionsLocal,
  getSessionByIdSync: (id) => getAllSessionsLocal().find(s => s.id === id || s.sessionId === id)
};
