const mongoose = require('mongoose');

/**
 * MongoDB Question Evaluation Sub-Schema
 * Records each individual question, candidate's submitted answer,
 * code snippet (if any), and AI semantic evaluation metrics.
 */
const EvaluationSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true
  },
  questionText: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    default: 'General'
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard', 'Expert'],
    default: 'Medium'
  },
  userAnswer: {
    type: String,
    default: ''
  },
  codeSnippet: {
    type: String,
    default: null
  },
  timeSpentSeconds: {
    type: Number,
    default: 0
  },
  evaluation: {
    score: { type: Number, default: 0 },
    matchedConcepts: [String],
    missingConcepts: [String],
    clarityScore: { type: Number, default: 0 },
    depthScore: { type: Number, default: 0 },
    confidenceScore: { type: Number, default: 0 },
    fillerCount: { type: Number, default: 0 },
    rationale: { type: String, default: '' },
    highlightTag: { type: String, default: 'GOOD' },
    breakdown: [
      {
        metric: String,
        score: Number,
        weight: String,
        description: String
      }
    ]
  }
});

/* >>> CHANGED: START — define schemas for the active question and AI question bank.
 * These fields must be declared explicitly because Mongoose strict mode
 * otherwise drops them when a session is saved to MongoDB.
 */
const QuestionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  domain: { type: String, default: 'General' },
  role: { type: String, default: 'General Candidate' },
  topic: { type: String, default: 'General' },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard', 'Expert'],
    default: 'Easy'
  },
  question: { type: String, required: true },
  expectedConcepts: { type: [String], default: [] },
  hints: { type: [String], default: [] },
  idealAnswer: { type: String, default: '' },
  codeTemplate: { type: String, default: '' }
}, { _id: false });

const GeminiQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  topic: { type: String, default: 'General' },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard', 'Expert'],
    default: 'Easy'
  },
  expectedConcepts: { type: [String], default: [] },
  hints: { type: [String], default: [] },
  idealAnswer: { type: String, default: '' }
}, { _id: false });
// <<< CHANGED: END — question schemas.

/**
 * MongoDB Interview Session Schema
 * 
 * Captures full interview session details so candidate can:
 * 1. Resume / recall all past mock interviews
 * 2. Track score progression and skill gap remediation over time
 * 3. Inspect question-by-question mentor feedback
 */
const InterviewSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    candidateName: {
      type: String,
      default: 'Candidate'
    },
    targetRole: {
      type: String,
      default: 'General Candidate'
    },
    candidateDomain: {
      type: String,
      default: 'Frontend'
    },
    customSubject: {
      type: String,
      default: null
    },
    candidateSkills: {
      type: [String],
      default: []
    },
    currentDifficulty: {
      type: String,
      default: 'Easy'
    },
    /* >>> CHANGED: START — persist the current question and generated question bank.
     * Without these declared fields, Mongoose strict mode strips them from MongoDB.
     */
    currentQuestion: {
      type: QuestionSchema,
      default: null
    },
    geminiQuestions: {
      type: [GeminiQuestionSchema],
      default: []
    },
    // <<< CHANGED: END — persisted question fields.
    totalQuestionsPlanned: {
      type: Number,
      default: 5
    },
    timeLimitMinutes: {
      type: Number,
      default: 15
    },
    status: {
      type: String,
      enum: ['IN_PROGRESS', 'COMPLETED', 'ABANDONED'],
      default: 'IN_PROGRESS'
    },
    // Required by evaluateAndNext to retrieve the active question from MongoDB.
    currentQuestion: {
      type: QuestionSchema,
      default: null
    },
    // Keep Gemini's generated question sequence so sessions longer than four
    // questions can continue using the adaptive question bank.
    geminiQuestions: {
      type: [GeminiQuestionSchema],
      default: []
    },
    evaluations: [EvaluationSchema],
    finalReport: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    proctoringSummary: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Index for rapid queries of a user's past interviews
InterviewSessionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.models.InterviewSession || mongoose.model('InterviewSession', InterviewSessionSchema);
