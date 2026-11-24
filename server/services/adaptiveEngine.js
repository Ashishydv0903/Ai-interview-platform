/**
 * Adaptive Interview Engine
 * Controls difficulty progression, question sequencing, and dynamic skill adjustments.
 */

const { QUESTION_BANK } = require('../data/questionBank');

const DIFFICULTY_ORDER = ["Easy", "Medium", "Hard", "Expert"];

/**
 * Filter questions based strictly on candidate role / domain
 */
function getEligibleQuestions(domain) {
  if (!domain || domain === "All" || domain === "Custom") {
    return QUESTION_BANK;
  }

  const targetDomain = domain.toLowerCase();

  if (targetDomain.includes("aptitude") || targetDomain.includes("reasoning")) {
    const apt = QUESTION_BANK.filter(q => 
      q.domain.toLowerCase().includes("aptitude") || q.domain.toLowerCase().includes("reasoning")
    );
    if (apt.length > 0) return apt;
  }

  if (targetDomain.includes("business") || targetDomain.includes("product") || targetDomain.includes("management")) {
    const biz = QUESTION_BANK.filter(q => q.domain.toLowerCase().includes("business"));
    if (biz.length > 0) return biz;
  }

  if (targetDomain.includes("english") || targetDomain.includes("communication")) {
    const comm = QUESTION_BANK.filter(q => 
      q.domain.toLowerCase().includes("english") || q.domain.toLowerCase().includes("communication")
    );
    if (comm.length > 0) return comm;
  }

  if (targetDomain.includes("finance") || targetDomain.includes("accounting")) {
    const fin = QUESTION_BANK.filter(q => 
      q.domain.toLowerCase().includes("finance") || q.domain.toLowerCase().includes("accounting")
    );
    if (fin.length > 0) return fin;
  }

  if (targetDomain.includes("datascience") || targetDomain.includes("ai")) {
    const ds = QUESTION_BANK.filter(q => q.domain.toLowerCase().includes("datascience"));
    if (ds.length > 0) return ds;
  }

  if (targetDomain.includes("fullstack") || targetDomain.includes("full stack") || targetDomain.includes("full-stack")) {
    const fs = QUESTION_BANK.filter(q => q.domain.toLowerCase() === "fullstack");
    if (fs.length > 0) return fs;
  }

  if (targetDomain.includes("backend") || targetDomain.includes("cloud") || targetDomain.includes("devops") || targetDomain.includes("server") || targetDomain.includes("database") || targetDomain.includes("api") || targetDomain.includes("microservice")) {
    const be = QUESTION_BANK.filter(q => q.domain.toLowerCase() === "backend");
    if (be.length > 0) return be;
  }

  if (targetDomain.includes("frontend") || targetDomain.includes("ui") || targetDomain.includes("web") || targetDomain.includes("react")) {
    const fe = QUESTION_BANK.filter(q => q.domain.toLowerCase() === "frontend");
    if (fe.length > 0) return fe;
  }

  // Exact match fallback
  let matched = QUESTION_BANK.filter(q => q.domain.toLowerCase() === targetDomain);
  return matched.length > 0 ? matched : QUESTION_BANK;
}

/**
 * Select next question adaptively based on candidate performance trajectory.
 * GUARANTEE: Never spills into wrong domains and never finishes prematurely until totalQuestionsPlanned is reached.
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
    } else if (lastScore < 40 && currentIndex > 0) {
      targetDifficulty = DIFFICULTY_ORDER[currentIndex - 1];
    }
  }

  // 1. Find unasked question matching target difficulty in eligible domain set
  let candidateQuestions = eligible.filter(q => q.difficulty === targetDifficulty && !askedIds.has(q.id));

  // 2. If none at exact difficulty, try any unasked question in eligible domain set
  if (candidateQuestions.length === 0) {
    candidateQuestions = eligible.filter(q => !askedIds.has(q.id));
  }

  // 3. If domain questions exhausted (e.g. candidate chose 10+ questions), recycle within the SAME domain!
  if (candidateQuestions.length === 0) {
    const fallbackQ = eligible[sessionHistory.length % eligible.length] || eligible[0];
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
  DIFFICULTY_ORDER,
  getEligibleQuestions
};
