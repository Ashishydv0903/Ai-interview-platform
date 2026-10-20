const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getIsConnected } = require('../config/db');
let User = null;
try {
  User = require('../models/User');
} catch (e) {}

const USERS_FILE = path.join(__dirname, '../data/users.json');

function ensureUsersFile() {
  const dir = path.dirname(USERS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    const initialUsers = [
      {
        id: "user-candidate-1",
        name: "Ashish Yadav",
        email: "ashish@example.com",
        password: "password123",
        role: "candidate",
        savedResumeText: "Ashish Yadav - Senior Full Stack Engineer. Skills: React, Node.js, TypeScript, REST API, MongoDB, Redux.",
        createdAt: new Date().toISOString()
      }
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(initialUsers, null, 2), 'utf8');
  }
}

function getAllUsersLocal() {
  ensureUsersFile();
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    return [];
  }
}

async function findUserByEmail(email) {
  if (getIsConnected() && User) {
    try {
      const userDoc = await User.findOne({ email: email.toLowerCase() }).lean();
      if (userDoc) {
        return { ...userDoc, id: userDoc._id.toString() };
      }
    } catch (e) {
      console.error("MongoDB findUserByEmail error:", e.message);
    }
  }

  const users = getAllUsersLocal();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

async function findUserById(id) {
  if (getIsConnected() && User) {
    try {
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        const userDoc = await User.findById(id).lean();
        if (userDoc) return { ...userDoc, id: userDoc._id.toString() };
      }
    } catch (e) {
      console.error("MongoDB findUserById error:", e.message);
    }
  }

  const users = getAllUsersLocal();
  return users.find(u => u.id === id);
}

async function createUser({ name, email, password }) {
  ensureUsersFile();
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new Error("User with this email already exists.");
  }

  const newUser = {
    id: `user-${uuidv4().substring(0, 8)}`,
    name,
    email: email.toLowerCase(),
    password,
    role: "candidate",
    savedResumeText: "",
    createdAt: new Date().toISOString()
  };

  // Save to MongoDB if connected
  if (getIsConnected() && User) {
    try {
      const created = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        role: 'candidate',
        savedResumeText: ''
      });
      newUser.id = created._id.toString();
    } catch (e) {
      console.error("MongoDB createUser error (saving locally):", e.message);
    }
  }

  // Always keep local JSON updated
  const users = getAllUsersLocal();
  users.push(newUser);
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');

  return newUser;
}

async function updateUserResume(userId, resumeText) {
  if (getIsConnected() && User) {
    try {
      if (userId.match(/^[0-9a-fA-F]{24}$/)) {
        await User.findByIdAndUpdate(userId, { savedResumeText: resumeText });
      }
    } catch (e) {
      console.error("MongoDB updateUserResume error:", e.message);
    }
  }

  ensureUsersFile();
  const users = getAllUsersLocal();
  const index = users.findIndex(u => u.id === userId);
  if (index >= 0) {
    users[index].savedResumeText = resumeText;
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
    return users[index];
  }
  return null;
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  updateUserResume
};
