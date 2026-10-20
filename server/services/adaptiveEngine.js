/**
 * Adaptive Interview Engine
 * Controls difficulty progression, question sequencing, and dynamic skill adjustments.
 */

const { QUESTION_BANK } = require('../data/questionBank');

const DIFFICULTY_ORDER = ["Easy", "Medium", "Hard", "Expert"];

/**
 * Filter questions based on candidate role / domain & skills
 */
function getEligibleQuestions(domain) {
  if (!domain || domain === "All" || domain === "Custom") {
    return QUESTION_BANK;
  }

  const targetDomain = domain.toLowerCase();
  let matched = QUESTION_BANK.filter(q => q.domain.toLowerCase() === targetDomain);

  // If specific domain has limited questions, include complementary domains
  if (targetDomain.includes("frontend")) {
    matched = QUESTION_BANK.filter(q => 
      q.domain.toLowerCase() === "frontend" || q.domain.toLowerCase() === "fullstack"
    );
  } else if (targetDomain.includes("backend")) {
    matched = QUESTION_BANK.filter(q => 
      q.domain.toLowerCase() === "backend" || q.domain.toLowerCase() === "fullstack"
    );
  } else if (targetDomain.includes("aptitude") || targetDomain.includes("reasoning")) {
    matched = QUESTION_BANK.filter(q => 
      q.domain.toLowerCase().includes("aptitude") || q.domain.toLowerCase().includes("business")
    );
  }

  // Fallback to all questions if none matched
  if (matched.length === 0) {
    matched = QUESTION_BANK;
  }
  return matched;
}

/**
 * Select next question adaptively based on candidate performance trajectory.
 * GUARANTEE: Never finishes prematurely until totalQuestionsPlanned is reached.
 */
function getNextAdaptiveQuestion({ sessionHistory, currentDifficulty, candidateDomain, candidateRole, totalQuestionsPlanned = 5 }) {
  const eligible = getEligibleQuestions(candidateDomain);
  const askedIds = new Set((sessionHistory || []).map(item => item.questionId));

  // If candidate has completed the desired number of questions, then finish
  if (sessionHistory && sessionHistory.length >= totalQuestionsPlanned) {
    return {
      question: null,
      isFinished: true,
      nextDifficulty: currentDifficulty
    };
  }

  // Determine target difficulty level for next question based on rolling score
  let targetDifficulty = currentDifficulty || "Easy";

  if (sessionHistory && sessionHistory.length > 0) {
    const lastEvaluation = sessionHistory[sessionHistory.length - 1];
    const lastScore = lastEvaluation.evaluation?.score ?? lastEvaluation.score ?? 70;
    const currentIndex = DIFFICULTY_ORDER.indexOf(currentDifficulty);

    if (lastScore >= 75 && currentIndex < DIFFICULTY_ORDER.length - 1) {
      targetDifficulty = DIFFICULTY_ORDER[currentIndex + 1];
    } else if (lastScore < 50 && currentIndex > 0) {
      targetDifficulty = DIFFICULTY_ORDER[currentIndex - 1];
    }
  }

  // 1. Find unasked question matching target difficulty in eligible set
  let candidateQuestions = eligible.filter(q => q.difficulty === targetDifficulty && !askedIds.has(q.id));

  // 2. If none at exact difficulty, try any unasked question in eligible set
  if (candidateQuestions.length === 0) {
    candidateQuestions = eligible.filter(q => !askedIds.has(q.id));
  }

  // 3. If domain questions exhausted, pull any unasked question from entire QUESTION_BANK
  if (candidateQuestions.length === 0) {
    candidateQuestions = QUESTION_BANK.filter(q => !askedIds.has(q.id));
  }

  // 4. In case candidate requested 20+ questions and exhausted entire bank, recycle with fresh ID
  if (candidateQuestions.length === 0) {
    const fallbackQ = eligible[sessionHistory.length % eligible.length] || QUESTION_BANK[0];
    const recycledQuestion = {
      ...fallbackQ,
      id: `${fallbackQ.id}_repeat_${sessionHistory.length + 1}`
    };
    return {
      question: recycledQuestion,
      isFinished: false,
      nextDifficulty: recycledQuestion.difficulty
    };
  }

  const selectedQuestion = candidateQuestions[0];

  return {
    question: selectedQuestion,
    isFinished: false,
    nextDifficulty: selectedQuestion.difficulty
  };
}

module.exports = {
  getNextAdaptiveQuestion,
  DIFFICULTY_ORDER
};
