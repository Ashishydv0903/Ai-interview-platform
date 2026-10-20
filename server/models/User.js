const mongoose = require('mongoose');

/**
 * MongoDB User Schema
 * 
 * Stores student / candidate profiles, authentication credentials,
 * saved resume texts, and references to previous interview attempts.
 */
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide full name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6
    },
    role: {
      type: String,
      enum: ['candidate', 'student'],
      default: 'candidate'
    },
    targetRole: {
      type: String,
      default: 'Full Stack Engineer'
    },
    savedSkills: {
      type: [String],
      default: []
    },
    savedResumeText: {
      type: String,
      default: ''
    },
    totalInterviewsTaken: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Prevent overwrite errors if model is re-compiled
module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
