/**
 * NLP & Semantic Processing Engine
 * Provides skill extraction, semantic similarity calculation, concept coverage evaluation,
 * and text clarity analysis.
 */

const KNOWN_SKILLS = [
  "React", "React.js", "Vue", "Angular", "JavaScript", "TypeScript", "HTML", "CSS", "Tailwind CSS", "Redux",
  "Node.js", "Express", "Python", "Django", "FastAPI", "Java", "Spring Boot", "C++", "Go", "Rust",
  "MongoDB", "PostgreSQL", "MySQL", "Redis", "GraphQL", "REST API", "SQL", "Database Indexing",
  "Docker", "Kubernetes", "AWS", "CI/CD", "Git", "DevOps", "Microservices", "Kafka",
  "Machine Learning", "NLP", "PyTorch", "TensorFlow", "Sentence Transformers", "BERT", "LLM", "OpenAI",
  "System Design", "Distributed Systems", "Security", "JWT", "Performance Optimization"
];

/**
 * Extract technical & soft skills from resume text
 */
function extractResumeMetadata(resumeText) {
  if (!resumeText || typeof resumeText !== 'string') {
    resumeText = "";
  }

  const textLower = resumeText.toLowerCase();
  const detectedSkills = [];

  // Match known technical skills
  KNOWN_SKILLS.forEach(skill => {
    const escaped = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(resumeText)) {
      detectedSkills.push(skill);
    }
  });

  // Estimate experience level from resume keywords
  let experienceLevel = "Mid-Level";
  if (/\b(senior|lead|architect|principal|5\+ years|7\+ years|10\+ years)\b/i.test(resumeText)) {
    experienceLevel = "Senior / Lead";
  } else if (/\b(junior|intern|fresher|graduate|1 year|2 years|entry)\b/i.test(resumeText)) {
    experienceLevel = "Junior / Entry";
  }

  // Determine domain fit
  let inferredDomain = "FullStack";
  const feCount = (textLower.match(/react|vue|html|css|frontend|ui|tailwind|javascript/g) || []).length;
  const beCount = (textLower.match(/node|express|python|java|sql|mongodb|backend|api|database/g) || []).length;
  const dsCount = (textLower.match(/machine learning|nlp|data science|pytorch|tensorflow|python|model|ai/g) || []).length;
  const doCount = (textLower.match(/docker|kubernetes|aws|devops|ci\/cd|cloud/g) || []).length;

  const counts = [
    { domain: "Frontend", count: feCount },
    { domain: "Backend", count: beCount },
    { domain: "DataScience", count: dsCount },
    { domain: "DevOps", count: doCount }
  ];
  counts.sort((a, b) => b.count - a.count);

  if (counts[0].count > 1) {
    inferredDomain = counts[0].domain;
  }

  // Deduplicate skills
  const uniqueSkills = Array.from(new Set(detectedSkills));

  return {
    skills: uniqueSkills.length > 0 ? uniqueSkills : ["JavaScript", "React", "Node.js", "REST API", "SQL"],
    experienceLevel,
    inferredDomain,
    wordCount: resumeText.split(/\s+/).length
  };
}

/**
 * Calculate semantic similarity and concept coverage for an answer against an ideal answer rubric
 */
function evaluateResponseSemantic({ answer, questionObj, expectedConcepts }) {
  if (!answer || answer.trim().length === 0) {
    return {
      score: 0,
      matchedConcepts: [],
      missingConcepts: expectedConcepts || [],
      conceptCoveragePercent: 0,
      depthScore: 0,
      clarityScore: 0,
      confidenceScore: 0,
      feedbackSummary: "No response was provided."
    };
  }

  const answerLower = answer.toLowerCase();

  // 1. Expected Concept Coverage
  const matchedConcepts = [];
  const missingConcepts = [];

  (expectedConcepts || []).forEach(concept => {
    const conceptLower = concept.toLowerCase();
    // check simple term match or sub-tokens
    const tokens = conceptLower.split(/\s+/);
    const hasFullMatch = answerLower.includes(conceptLower);
    const hasPartialMatch = tokens.every(t => answerLower.includes(t));

    if (hasFullMatch || hasPartialMatch) {
      matchedConcepts.push(concept);
    } else {
      missingConcepts.push(concept);
    }
  });

  const conceptCoveragePercent = expectedConcepts && expectedConcepts.length > 0
    ? Math.round((matchedConcepts.length / expectedConcepts.length) * 100)
    : 70;

  // 2. Depth & Length Score
  const words = answer.trim().split(/\s+/);
  const wordCount = words.length;
  let depthScore = Math.min(100, Math.round((wordCount / 40) * 100)); // ~40 words optimal for concise detailed answer
  if (wordCount < 10) depthScore = 25;

  // 3. Technical Keyword Density
  let techDensityBonus = 0;
  const techTerms = ["because", "therefore", "implements", "algorithm", "performance", "memory", "async", "latency", "scale", "complexity", "trade-off", "solution"];
  techTerms.forEach(term => {
    if (answerLower.includes(term)) techDensityBonus += 5;
  });
  techDensityBonus = Math.min(20, techDensityBonus);

  // 4. Calculate Final Composite Score (0 - 100)
  const compositeScore = Math.min(100, Math.round(
    (conceptCoveragePercent * 0.55) + (depthScore * 0.30) + techDensityBonus
  ));

  // 5. Behavioral / Speech Clarity Metrics (Filler word count, pacing)
  const fillerWords = ["um", "uh", "like", "you know", "basically", "actually", "sort of"];
  let fillerCount = 0;
  fillerWords.forEach(fw => {
    const regex = new RegExp(`\\b${fw}\\b`, 'gi');
    const matches = answer.match(regex);
    if (matches) fillerCount += matches.length;
  });

  const clarityScore = Math.max(30, 100 - (fillerCount * 12));
  const confidenceScore = Math.min(100, Math.round((compositeScore * 0.7) + (clarityScore * 0.3)));

  return {
    score: compositeScore,
    matchedConcepts,
    missingConcepts,
    conceptCoveragePercent,
    depthScore,
    clarityScore,
    confidenceScore,
    fillerCount,
    wordCount
  };
}

module.exports = {
  extractResumeMetadata,
  evaluateResponseSemantic
};
