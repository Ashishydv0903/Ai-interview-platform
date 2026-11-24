/**
 * Explainable AI (XAI) & Human Mentor Scorecard Engine
 * Generates transparent, human-readable breakdowns and constructive feedback.
 */

/**
 * Generate transparent XAI explanation for an individual answer evaluation
 */
function generateXAIExplanation({ questionObj, answer, semanticResult, difficulty }) {
  const score = semanticResult.score;
  const matched = semanticResult.matchedConcepts || [];
  const missing = semanticResult.missingConcepts || [];

  let highlightTag = "NEEDS_IMPROVEMENT";
  if (score >= 80) highlightTag = "EXEMPLARY";
  else if (score >= 60) highlightTag = "PROFICIENT";

  let rationale = "";
  if (score >= 80) {
    rationale = `Great job! Your answer was clear, direct, and hit the core concepts well: ${matched.slice(0, 4).join(', ')}.`;
  } else if (score >= 50) {
    rationale = `Solid start! You covered ${matched.join(', ')} nicely. To get a top score, also mention ${missing.slice(0, 3).join(', ')} and provide a short practical example.`;
  } else if (score > 15) {
    rationale = `You touched on the basic idea, but interviewers look for more depth. Next time, try to explicitly explain: ${missing.slice(0, 4).join(', ')}.`;
  } else {
    rationale = `This response was too brief or off-topic. In a real interview, be sure to explain: ${missing.slice(0, 4).join(', ')} with a clear example.`;
  }

  const breakdown = [
    {
      metric: "Key Concepts Covered",
      score: semanticResult.conceptCoveragePercent || 0,
      weight: "50%",
      description: matched.length > 0
        ? `Mentioned ${matched.length} out of ${(matched.length + missing.length)} important points.`
        : "Did not mention the expected key concepts for this topic."
    },
    {
      metric: "Answer Detail & Reasoning",
      score: semanticResult.depthScore || 0,
      weight: "30%",
      description: `${semanticResult.wordCount || 0} words provided to explain your reasoning.`
    },
    {
      metric: "Clarity & Delivery",
      score: semanticResult.clarityScore || 0,
      weight: "20%",
      description: semanticResult.score > 20
        ? "Clear sentence structure with confident tone and minimal filler words."
        : "Answer was brief or lacked structured explanation."
    }
  ];

  return {
    score,
    highlightTag,
    rationale,
    breakdown
  };
}

/**
 * Generate Human-Friendly Skill Gap Analysis & Coach Scorecard
 */
function generateSkillGapAnalysis({ candidateSkills, targetRole, sessionEvaluations, isEarlyExit = false, totalQuestionsPlanned = 5 }) {
  const categoryScores = {
    "Core Technical Knowledge": [],
    "Problem Solving & Logic": [],
    "Architecture & Best Practices": [],
    "Code Quality & Structure": [],
    "Communication & Articulation": []
  };

  (sessionEvaluations || []).forEach(item => {
    const s = item.evaluation?.score ?? 0;
    const clarity = item.evaluation?.clarityScore ?? 0;
    const depth = item.evaluation?.depthScore ?? 0;

    categoryScores["Core Technical Knowledge"].push(s);
    categoryScores["Problem Solving & Logic"].push(s > 15 ? depth : Math.min(10, depth));
    categoryScores["Architecture & Best Practices"].push(s > 15 ? Math.round((s + depth) / 2) : Math.min(10, s));
    categoryScores["Code Quality & Structure"].push(s);
    categoryScores["Communication & Articulation"].push(s > 15 ? clarity : Math.min(20, clarity));
  });

  const average = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  const coreScore = average(categoryScores["Core Technical Knowledge"]);
  const problemScore = average(categoryScores["Problem Solving & Logic"]);
  const archScore = average(categoryScores["Architecture & Best Practices"]);
  const codeScore = average(categoryScores["Code Quality & Structure"]);
  const commScore = average(categoryScores["Communication & Articulation"]);

  const hasEvaluations = (sessionEvaluations || []).length > 0;
  const overallAvgScore = hasEvaluations ? Math.round((coreScore + problemScore + archScore + codeScore + commScore) / 5) : 0;

  let readinessTier = "Job Ready";
  let humanSummary = "";
  if (!hasEvaluations) {
    readinessTier = "Early Exit (No Responses)";
    humanSummary = "You exited the interview before completing any questions. You can start a new mock interview anytime!";
  } else if (overallAvgScore >= 80) {
    readinessTier = isEarlyExit ? "Ready for Real Interviews (Early Exit)" : "Ready for Real Interviews";
    humanSummary = `Awesome performance! You spoke with confidence and clearly understood your topic. Your answers had great structure and hit the key points. Review the few quick notes below and you will do great in actual job interviews!`;
  } else if (overallAvgScore >= 65) {
    readinessTier = isEarlyExit ? "Almost Ready (Early Exit)" : "Almost Ready (Quick Brush-Up)";
    humanSummary = `Great effort! You know your fundamentals well and explained your thoughts in a natural way. To stand out even more, practice adding a quick real-world example to your answers and check the tips below.`;
  } else if (overallAvgScore >= 40) {
    readinessTier = isEarlyExit ? "Good Practice (Early Exit)" : "Good Practice Attempt";
    humanSummary = `Good start! You have the basic idea, but interviewers will look for more specific terms and details. Check the sample answers and practice plan below to quickly build your confidence.`;
  } else {
    readinessTier = isEarlyExit ? "Review Recommended (Early Exit)" : "Practice & Review Recommended";
    humanSummary = `A few answers were very short or missed the core concepts. That is completely normal when starting out! Take a look at the model answers below to see how to structure your answers next time.`;
  }

  if (isEarlyExit && hasEvaluations) {
    humanSummary = `Partial interview completed: You answered ${sessionEvaluations.length} of ${totalQuestionsPlanned} planned questions. ${humanSummary}`;
  }

  // Human-friendly Skill Breakdown cards
  const skillsBreakdown = [
    {
      subject: "Core Domain Knowledge",
      score: coreScore,
      benchmark: 80,
      status: coreScore >= 80 ? "Mastered" : coreScore >= 60 ? "Proficient" : "Needs Review",
      mentorFeedback: coreScore >= 80 
        ? "Exemplary grasp of core domain terminology and fundamental mechanics." 
        : coreScore >= 60 
        ? "Good fundamentals; solidify edge-case definitions and best practices." 
        : "Revisit core documentation and fundamental concepts."
    },
    {
      subject: "Problem Solving & Logic",
      score: problemScore,
      benchmark: 75,
      status: problemScore >= 75 ? "Mastered" : problemScore >= 60 ? "Proficient" : "Needs Review",
      mentorFeedback: problemScore >= 75 
        ? "Approached problems with structured reasoning and clear deduction." 
        : problemScore >= 60
        ? "Good problem-solving instinct; practice breaking down complex edge cases aloud."
        : "Practice methodical step-by-step problem breakdown."
    },
    {
      subject: "Architecture & Standards",
      score: archScore,
      benchmark: 75,
      status: archScore >= 75 ? "Mastered" : archScore >= 60 ? "Proficient" : "Needs Review",
      mentorFeedback: archScore >= 75 
        ? "Strong structural awareness and trade-off evaluation." 
        : archScore >= 60
        ? "Focus on discussing scalability, trade-offs, and alternative approaches."
        : "Study standard architectural patterns and design principles."
    },
    {
      subject: "Answer Precision & Rigor",
      score: codeScore,
      benchmark: 80,
      status: codeScore >= 80 ? "Mastered" : codeScore >= 60 ? "Proficient" : "Needs Review",
      mentorFeedback: codeScore >= 80 
        ? "Precise, well-organized answers with exact domain terminology." 
        : codeScore >= 60
        ? "Solid structure; remember to explicitly mention verification and validation."
        : "Ensure responses directly address the specific prompt asked."
    },
    {
      subject: "Communication & Articulation",
      score: commScore,
      benchmark: 85,
      status: commScore >= 85 ? "Mastered" : commScore >= 65 ? "Proficient" : "Needs Review",
      mentorFeedback: commScore >= 85 
        ? "Clear delivery with minimal filler words and structured pacing." 
        : commScore >= 65
        ? "Good conversational tone; structure answers using the STAR method for maximum impact."
        : "Focus on articulating concise, coherent explanations without rambling."
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
  (sessionEvaluations || []).forEach(item => {
    if (item.evaluation?.missingConcepts && Array.isArray(item.evaluation.missingConcepts)) {
      allMissingConcepts.push(...item.evaluation.missingConcepts);
    }
  });
  const uniqueMissing = Array.from(new Set(allMissingConcepts));
  const missingConcepts = uniqueMissing.length > 0 ? uniqueMissing.slice(0, 5) : ["Core Problem Decomposition", "Edge-case Handling"];

  // Top Strengths & Concrete Next Steps
  const strengths = [];
  if (coreScore >= 65) strengths.push("Sound grasp of foundational syntax and terminology");
  if (commScore >= 70) strengths.push("Structured pacing and clear conversational articulation");
  if (problemScore >= 65) strengths.push("Logical reasoning when walking through problem constraints");
  if (strengths.length === 0) strengths.push("Good initiative to practice under timed interview conditions");

  const improvementAreas = [];
  if (coreScore < 70) improvementAreas.push(`Deepen core theoretical understanding of ${targetRole || 'domain'} concepts`);
  if (problemScore < 70) improvementAreas.push("Walk through complex problems step-by-step before concluding");
  if (archScore < 70) improvementAreas.push("Explicitly discuss trade-offs, constraints, and alternative choices");
  if (commScore < 70) improvementAreas.push("Structure verbal responses cleanly using the STAR method");
  if (improvementAreas.length === 0) improvementAreas.push("Continue practicing under timed constraints to build speed");

  // Dynamic Learning Roadmap based on missed concepts
  const learningRoadmap = missingConcepts.slice(0, 4).map((concept, idx) => ({
    step: idx + 1,
    topic: concept,
    priority: idx === 0 ? "High Priority" : "Recommended",
    actionPlan: `Review key documentation and best practices for ${concept}. Practice explaining the concept and solving a practice problem.`,
    estimatedHours: `${idx + 1}-${idx + 2} Hours`,
    resourceUrl: `https://www.google.com/search?q=${encodeURIComponent(concept + ' interview explanation')}`
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
