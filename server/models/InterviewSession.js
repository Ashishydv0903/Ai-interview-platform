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
    evaluations: [EvaluationSchema],
    finalReport: {
      overallScore: { type: Number, default: 0 },
      readinessTier: { type: String, default: 'Needs Review' },
      humanSummary: { type: String, default: '' },
      strengths: [String],
      improvementAreas: [String],
      radarData: [
        {
          subject: String,
          Candidate: Number,
          TargetBenchmark: Number,
          explanation: String
        }
      ],
      skillsBreakdown: [
        {
          subject: String,
          score: Number,
          benchmark: Number,
          status: String,
          mentorFeedback: String
        }
      ],
      missingConcepts: [String],
      learningRoadmap: [
        {
          step: Number,
          topic: String,
          priority: String,
          actionPlan: String,
          estimatedHours: String,
          resourceUrl: String
        }
      ]
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
