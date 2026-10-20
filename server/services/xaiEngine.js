/**
 * Explainable AI (XAI) & Human-Friendly Skill Gap Analysis Engine
 * Generates transparent, coach-like scoring justifications, intuitive skill mastery metrics,
 * and actionable remedial learning roadmaps.
 */

function generateXAIExplanation({ questionObj, answer, semanticResult, difficulty }) {
  const { score, matchedConcepts, missingConcepts, conceptCoveragePercent, depthScore, clarityScore } = semanticResult;

  let rationale = "";
  let highlightTag = "GOOD";

  if (score >= 80) {
    highlightTag = "EXCELLENT";
    rationale = `Terrific response! You articulated core principles like ${matchedConcepts.join(", ")} with great clarity. Your answer demonstrated practical fluency and logical structuring.`;
  } else if (score >= 60) {
    highlightTag = "SATISFACTORY";
    rationale = `Solid foundational response covering key points (${matchedConcepts.join(", ")}). To make this an interview-winning answer, touch upon: ${missingConcepts.join(", ")} and cite a quick real-world trade-off.`;
  } else {
    highlightTag = "NEEDS_IMPROVEMENT";
    rationale = `Good attempt, but the explanation remained surface-level. You mentioned: ${matchedConcepts.length > 0 ? matchedConcepts.join(", ") : "a few basic ideas"}. Try expanding on: ${missingConcepts.join(", ")} with concrete examples.`;
  }

  const breakdown = [
    { metric: "Core Concept Coverage", score: conceptCoveragePercent, weight: "50%", description: `Covered ${matchedConcepts.length} out of ${matchedConcepts.length + missingConcepts.length} essential concepts.` },
    { metric: "Depth & Technical Reasoning", score: depthScore, weight: "30%", description: `${semanticResult.wordCount || 0} words evaluated for technical substance & reasoning.` },
    { metric: "Articulation & Delivery", score: clarityScore, weight: "20%", description: `Low filler words (${semanticResult.fillerCount || 0}) with clear, confident sentence structure.` }
  ];

  return {
    score,
    highlightTag,
    rationale,
    matchedConcepts,
    missingConcepts,
    breakdown
  };
}

/**
 * Generate Human-Friendly Skill Gap Analysis & Coach Scorecard
 */
function generateSkillGapAnalysis({ candidateSkills, targetRole, sessionEvaluations }) {
  const categoryScores = {
    "Core Technical Knowledge": [],
    "Problem Solving & Logic": [],
    "Architecture & Best Practices": [],
    "Code Quality & Structure": [],
    "Communication & Articulation": []
  };

  sessionEvaluations.forEach(item => {
    const s = item.evaluation?.score || 65;
    const clarity = item.evaluation?.clarityScore || 70;
    const depth = item.evaluation?.depthScore || 70;

    categoryScores["Core Technical Knowledge"].push(s);
    categoryScores["Problem Solving & Logic"].push(depth);
    categoryScores["Architecture & Best Practices"].push(Math.round((s + depth) / 2));
    categoryScores["Code Quality & Structure"].push(s);
    categoryScores["Communication & Articulation"].push(clarity);
  });

  const average = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 70;

  const coreScore = average(categoryScores["Core Technical Knowledge"]);
  const problemScore = average(categoryScores["Problem Solving & Logic"]);
  const archScore = average(categoryScores["Architecture & Best Practices"]);
  const codeScore = average(categoryScores["Code Quality & Structure"]);
  const commScore = average(categoryScores["Communication & Articulation"]);

  const overallAvgScore = Math.round((coreScore + problemScore + archScore + codeScore + commScore) / 5);

  let readinessTier = "Job Ready";
  let humanSummary = "";
  if (overallAvgScore >= 80) {
    readinessTier = "Strong Candidate (Interview Ready)";
    humanSummary = `Outstanding mock performance! You demonstrated clear, confident command of ${targetRole || 'domain'} concepts. Your technical reasoning was structured and articulate. With just a brief review of the suggested topics below, you are primed to excel in actual screening rounds.`;
  } else if (overallAvgScore >= 65) {
    readinessTier = "Interview Ready (Minor Skill Gaps)";
    humanSummary = `Great effort! You hold a solid grasp of fundamental principles and communicated your thought process well. To stand out among top candidates, focus on providing deeper architectural trade-offs and addressing the highlighted missing concepts before high-stakes interviews.`;
  } else {
    readinessTier = "Needs Core Revision";
    humanSummary = `Good initial practice session! You have the basics down, but several technical questions required more specific terminology and depth. Follow the personalized 7-day revision roadmap below to rapidly build confidence in those target areas.`;
  }

  // Human-friendly Skill Breakdown cards
  const skillsBreakdown = [
    {
      subject: "Core Technical Knowledge",
      score: coreScore,
      benchmark: 80,
      status: coreScore >= 80 ? "Mastered" : coreScore >= 65 ? "Proficient" : "Needs Review",
      mentorFeedback: coreScore >= 80 
        ? "Exemplary grasp of language features and runtime mechanics." 
        : coreScore >= 65 
        ? "Good fundamentals; solidify edge-case definitions and modern best practices." 
        : "Revisit core documentation and fundamental syntax patterns."
    },
    {
      subject: "Problem Solving & Logic",
      score: problemScore,
      benchmark: 75,
      status: problemScore >= 75 ? "Mastered" : problemScore >= 65 ? "Proficient" : "Needs Review",
      mentorFeedback: problemScore >= 75 
        ? "Approached problems with structured reasoning and clear deduction." 
        : "Good problem-solving instinct; practice breaking down complex edge cases aloud."
    },
    {
      subject: "Architecture & Design",
      score: archScore,
      benchmark: 75,
      status: archScore >= 75 ? "Mastered" : archScore >= 65 ? "Proficient" : "Needs Review",
      mentorFeedback: archScore >= 75 
        ? "Strong architectural awareness and modular thinking." 
        : "Focus on discussing scalability, caching, and state management trade-offs."
    },
    {
      subject: "Code Quality & Precision",
      score: codeScore,
      benchmark: 80,
      status: codeScore >= 80 ? "Mastered" : codeScore >= 65 ? "Proficient" : "Needs Review",
      mentorFeedback: codeScore >= 80 
        ? "Clean code structure and idiomatic naming conventions." 
        : "Solid structure; remember to explicitly mention error handling and validation."
    },
    {
      subject: "Communication & Articulation",
      score: commScore,
      benchmark: 85,
      status: commScore >= 85 ? "Mastered" : commScore >= 70 ? "Proficient" : "Needs Review",
      mentorFeedback: commScore >= 85 
        ? "Spoke concisely with minimal filler words and clear pacing." 
        : "Good conversational tone; structure answers using the STAR method for maximum impact."
    }
  ];

  // Radar data format (for secondary chart toggle)
  const radarData = skillsBreakdown.map(s => ({
    subject: s.subject,
    Candidate: s.score,
    TargetBenchmark: s.benchmark,
    explanation: s.mentorFeedback
  }));

  // Aggregate missing concepts across evaluations
  const allMissingConcepts = [];
  sessionEvaluations.forEach(item => {
    if (item.evaluation?.missingConcepts && Array.isArray(item.evaluation.missingConcepts)) {
      allMissingConcepts.push(...item.evaluation.missingConcepts);
    }
  });
  const uniqueMissing = Array.from(new Set(allMissingConcepts));
  const missingConcepts = uniqueMissing.length > 0 ? uniqueMissing.slice(0, 5) : ["Event Loop Microtasks", "Error Boundary Patterns"];

  // Top Strengths & Concrete Next Steps
  const strengths = [];
  if (coreScore >= 70) strengths.push("Strong grasp of foundational syntax and terminology");
  if (commScore >= 75) strengths.push("Clear, confident articulation with structured pacing");
  if (problemScore >= 70) strengths.push("Logical reasoning when walking through problem constraints");
  if (strengths.length === 0) strengths.push("Demonstrated active attempt across all adaptive questions");

  const improvementAreas = [];
  if (archScore < 75) improvementAreas.push("Elaborate more on architectural trade-offs (e.g. caching, latency, scalability)");
  if (uniqueMissing.length > 0) improvementAreas.push(`Review key domain concepts: ${uniqueMissing.slice(0, 3).join(", ")}`);
  if (commScore < 75) improvementAreas.push("Structure answers with the STAR (Situation, Task, Action, Result) method");
  if (improvementAreas.length === 0) improvementAreas.push("Practice timed mock coding to reduce answer retrieval latency");

  // Learning Roadmap
  const learningRoadmap = missingConcepts.map((concept, idx) => ({
    step: idx + 1,
    topic: concept,
    priority: idx === 0 ? "High Priority" : idx === 1 ? "Recommended" : "Good to Know",
    actionPlan: `Spend 30 minutes reading the official documentation for ${concept}. Implement a short code example to cement muscle memory.`,
    estimatedHours: `${1 + (idx % 2)} Hour`,
    resourceUrl: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(concept)}`
  }));

  return {
    overallScore: overallAvgScore,
    readinessTier,
    humanSummary,
    strengths,
    improvementAreas,
    skillsBreakdown,
    radarData,
    missingConcepts,
    learningRoadmap
  };
}

module.exports = {
  generateXAIExplanation,
  generateSkillGapAnalysis
};
