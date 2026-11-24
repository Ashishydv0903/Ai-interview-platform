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
  "System Design", "Distributed Systems", "Security", "JWT", "Performance Optimization",
  "Logical Deduction", "Quantitative Aptitude", "Probability", "Permutations", "Ratios", "Time and Work"
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
 * Calculate semantic similarity and concept coverage for an answer against an ideal answer rubric.
 * Rigorous: Prevents random gibberish or off-topic responses from inflating scores.
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

  const trimmed = answer.trim();
  const answerLower = trimmed.toLowerCase();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Gibberish Detection (repeated chars like 'aaaa', single-letter words, or no vowels in long word)
  const isGibberish = 
    /(.)\1{4,}/.test(trimmed) || 
    (wordCount < 4 && trimmed.length > 15 && !/[aeiouy]/i.test(trimmed)) ||
    (wordCount === 1 && trimmed.length > 8 && !/[aeiouy]{2,}/i.test(trimmed));

  if (isGibberish) {
    return {
      score: 0,
      matchedConcepts: [],
      missingConcepts: expectedConcepts || [],
      conceptCoveragePercent: 0,
      depthScore: 0,
      clarityScore: 0,
      confidenceScore: 0,
      fillerCount: 0,
      wordCount,
      feedbackSummary: "The submitted response appears to be random keystrokes or invalid text."
    };
  }

  // 1. Concept Coverage
  const matchedConcepts = [];
  const missingConcepts = [];

  (expectedConcepts || []).forEach(concept => {
    const conceptLower = concept.toLowerCase();
    const tokens = conceptLower.split(/\s+/);
    const hasFullMatch = answerLower.includes(conceptLower);
    const hasPartialMatch = tokens.length > 1 && tokens.every(t => answerLower.includes(t));

    if (hasFullMatch || hasPartialMatch) {
      matchedConcepts.push(concept);
    } else {
      missingConcepts.push(concept);
    }
  });

  const totalExpected = (expectedConcepts && expectedConcepts.length > 0) ? expectedConcepts.length : 1;
  const conceptCoveragePercent = Math.round((matchedConcepts.length / totalExpected) * 100);

  // If ZERO concepts were matched, this response is off-topic or lacks domain substance
  if (matchedConcepts.length === 0) {
    const minimalScore = Math.min(10, Math.round(wordCount * 0.4));
    return {
      score: minimalScore,
      matchedConcepts: [],
      missingConcepts: expectedConcepts || [],
      conceptCoveragePercent: 0,
      depthScore: 0,
      clarityScore: wordCount >= 5 ? 15 : 5,
      confidenceScore: minimalScore,
      fillerCount: 0,
      wordCount,
      feedbackSummary: "Answer does not cover the required core concepts for this question."
    };
  }

  // 2. Depth & Substance (scaled strictly by concept coverage)
  const baseDepth = Math.min(100, Math.round((wordCount / 35) * 100));
  const depthScore = Math.round(baseDepth * (0.3 + 0.7 * (conceptCoveragePercent / 100)));

  // 3. Technical Terms & Transitional Reasoning
  let techDensityBonus = 0;
  const techTerms = ["because", "therefore", "implements", "algorithm", "performance", "memory", "async", "latency", "scale", "complexity", "trade-off", "solution", "step", "formula", "ratio"];
  techTerms.forEach(term => {
    if (answerLower.includes(term)) techDensityBonus += 3;
  });
  techDensityBonus = Math.min(12, techDensityBonus);

  // 4. Clarity & Filler Word Detection
  const fillerWords = ["um", "uh", "like", "you know", "basically", "actually", "sort of"];
  let fillerCount = 0;
  fillerWords.forEach(fw => {
    const regex = new RegExp(`\\b${fw}\\b`, 'gi');
    const matches = answer.match(regex);
    if (matches) fillerCount += matches.length;
  });

  const clarityScore = Math.max(20, Math.min(100, 100 - (fillerCount * 10)));

  // 5. Composite Score Calculation
  const compositeScore = Math.min(100, Math.round(
    (conceptCoveragePercent * 0.65) + (depthScore * 0.25) + techDensityBonus
  ));
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
  evaluateResponseSemantic,
  KNOWN_SKILLS
};
