const { GoogleGenerativeAI } = require("@google/generative-ai");

// Helper for timeout protection (prevents hanging if Google API latency spikes)
const withTimeout = (promise, ms = 7000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Gemini API request timed out after ${ms}ms`)), ms)
    )
  ]);
};

// Robust JSON extractor for LLM output (handles markdown wrappers, leading text, etc.)
function extractJson(text) {
  if (!text) return null;
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {}
  }
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    return null;
  }
}

let quotaExceededUntil = 0;
const isQuotaExceeded = () => Date.now() < quotaExceededUntil;
const markQuotaExceeded = (errMessage) => {
  if (errMessage && (errMessage.includes('429') || errMessage.includes('Quota exceeded') || errMessage.includes('rate-limit') || errMessage.includes('Too Many Requests'))) {
    quotaExceededUntil = Date.now() + 15 * 60 * 1000; // 15-minute circuit breaker for instant fallback
    console.warn("⚠️ Gemini Free-Tier Quota Exceeded. Fast-switching to instant local semantic NLP engine for 15 minutes.");
  }
};

// Dynamic Gemini API Model Provider
const getGeminiModel = (config = {}) => {
  if (isQuotaExceeded()) {
    return null;
  }
  const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    return null;
  }
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-2.5-flash with structured JSON output for ultra-fast, reliable questions & evaluations
    return genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        ...config
      }
    });
  } catch (err) {
    console.warn("⚠️ Gemini AI initialization error:", err.message);
    return null;
  }
};

/**
 * Generate AI questions tailored STRICTLY to the selected domain
 */
const generateQuestionsWithGemini = async (skills = [], domain = "Frontend", customSubject = null) => {
  const model = getGeminiModel({ maxOutputTokens: 900 });
  if (!model) {
    return null; // Fallback to curated question bank
  }

  const dLower = (domain || "").toLowerCase();
  let domainDescription = "";
  let relevantTopics = [];

  if (dLower.includes("aptitude") || dLower.includes("reasoning")) {
    domainDescription = "Aptitude, Quantitative Mathematics, and Logical Reasoning (e.g., probability, speed-distance-time, percentages, syllogisms, number series, seating arrangements, ratios). DO NOT generate coding or software questions.";
    relevantTopics = ["Logical Deduction", "Quantitative Aptitude", "Probability & Combinatorics", "Time and Work", "Ratios and Percentages"];
  } else if (dLower.includes("business") || dLower.includes("management") || dLower.includes("product")) {
    domainDescription = "Business Management, Product Strategy & Metrics (e.g., CAC/LTV unit economics, SWOT, RICE prioritization, stakeholder conflict, market sizing). DO NOT generate technical coding questions.";
    relevantTopics = ["Product Strategy", "Unit Economics", "Stakeholder Alignment", "Prioritization Frameworks"];
  } else if (dLower.includes("english") || dLower.includes("communication")) {
    domainDescription = "Professional Workplace Communication, Conflict De-escalation & STAR Behavioral Interview Scenarios. DO NOT generate technical coding questions.";
    relevantTopics = ["STAR Method", "De-escalation", "Executive Communication", "Client Relationship Management"];
  } else if (dLower.includes("finance") || dLower.includes("accounting")) {
    domainDescription = "Corporate Finance, Accounting & Valuation (e.g., Three Financial Statements integration, Net Working Capital, Cash Flow, DCF). DO NOT generate programming questions.";
    relevantTopics = ["Financial Statements", "Working Capital", "Valuation", "Accounting Principles"];
  } else if (dLower === "custom" && customSubject) {
    domainDescription = `Specialized Subject / Exam: "${customSubject}". All questions must strictly pertain to this topic.`;
    relevantTopics = [customSubject];
  } else if (dLower.includes("frontend")) {
    domainDescription = "Frontend Web Engineering (e.g., React, JavaScript event loop, DOM reconciliation, modern CSS, Web Core Vitals, state management). Focus ONLY on Frontend; do not ask backend or database questions.";
    relevantTopics = (skills || []).filter(s => /react|vue|angular|javascript|typescript|html|css|tailwind|redux|frontend/i.test(s));
    if (relevantTopics.length === 0) relevantTopics = ["React", "JavaScript", "Browser Performance", "State Management"];
  } else if (dLower.includes("backend")) {
    domainDescription = "Backend Software Engineering (e.g., Node.js runtime, REST vs GraphQL, SQL/NoSQL databases, microservices, distributed caching, concurrency). Focus ONLY on Backend; do not ask frontend/UI questions.";
    relevantTopics = (skills || []).filter(s => /node|express|python|java|database|sql|mongo|redis|api|backend/i.test(s));
    if (relevantTopics.length === 0) relevantTopics = ["Node.js", "REST APIs", "SQL & Databases", "Caching Architecture"];
  } else if (dLower.includes("datascience") || dLower.includes("ai")) {
    domainDescription = "Data Science, Machine Learning & AI (e.g., Bias-Variance Tradeoff, Precision vs Recall, Transformers, Embeddings).";
    relevantTopics = ["Machine Learning", "Transformers & NLP", "Model Evaluation", "Vector Embeddings"];
  } else {
    domainDescription = `${domain} Assessment`;
    relevantTopics = skills.length > 0 ? skills : ["Core Fundamentals", "Problem Solving"];
  }

  const prompt = `
Generate exactly 4 realistic, interview questions specifically tailored for the target domain:
TARGET DOMAIN: ${domainDescription}
FOCUS TOPICS: ${relevantTopics.join(", ")}
Vary difficulty cleanly from Easy to Hard.

Rules:
- Questions MUST be 100% relevant to "${domainDescription}". If domain is Aptitude/Business/English, DO NOT ask software coding questions.
- Return ONLY a valid JSON array of objects.
- Do not add conversational text, markdown fences, or explanation.
- Each object must have:
  "question": string,
  "topic": string,
  "difficulty": "Easy" | "Medium" | "Hard" | "Expert",
  "expectedConcepts": array of 4-6 key concepts/terms required in a complete answer,
  "hints": array of 1-2 clue strings,
  "idealAnswer": a comprehensive 2-3 sentence model answer explaining what a 100% score includes.

Example JSON format:
[
  {
    "question": "Sample question text...",
    "topic": "Sample Topic",
    "difficulty": "Easy",
    "expectedConcepts": ["Concept A", "Concept B", "Concept C"],
    "hints": ["Helpful clue here."],
    "idealAnswer": "A complete 100% answer explains Concept A, proves Concept B, and provides practical application."
  }
]
`;

  try {
    const result = await withTimeout(model.generateContent(prompt), 4500);
    const text = result.response.text();
    const parsed = extractJson(text);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch (err) {
    markQuotaExceeded(err.message);
    console.warn("⚠️ Gemini Question Generation Notice:", err.message, "-> Using curated Question Bank.");
    return null;
  }
};

/**
 * Evaluate answer using Gemini LLM with strict grading rules against random/gibberish answers
 */
const evaluateAnswerWithGemini = async (question, answer) => {
  const model = getGeminiModel({ maxOutputTokens: 500, temperature: 0.2 });
  if (!model) {
    return null; // Fallback to semantic NLP engine
  }

  const prompt = `
You are a senior, rigorous interview evaluator evaluating a candidate's answer.

Question:
${question}

Candidate Answer:
${answer}

CRITICAL EVALUATION & SCORING RULES:
1. If the candidate wrote random keystrokes (e.g. "asdfghjkl", "vfrvf"), off-topic nonsense, gibberish, or completely failed to address the question, the score MUST BE between 0 and 15.
2. DO NOT give polite or generous pity marks to random or irrelevant answers.
3. "matchedConcepts": list ONLY key domain concepts that the candidate actually explained correctly. If they mentioned none, return an empty array [].
4. "missingConcepts": list the essential concepts the candidate failed to cover.
5. "depthScore": (0 to 100). If off-topic or random text, depth MUST BE 0.
6. "clarityScore": (0 to 100). If gibberish or incoherent, clarity MUST BE 10 or less.
7. "score": (0 to 100). The overall score must strictly reflect answer accuracy.
8. "rationale": 1-2 sentence constructive critique explaining why marks were awarded or deducted.

Return ONLY a valid JSON object:
{
  "score": 10,
  "matchedConcepts": [],
  "missingConcepts": ["Expected Concept 1", "Expected Concept 2"],
  "clarityScore": 10,
  "depthScore": 0,
  "rationale": "The candidate provided an off-topic or incomplete response with none of the required domain concepts."
}
`;

  try {
    const result = await withTimeout(model.generateContent(prompt), 4500);
    const text = result.response.text();
    const parsed = extractJson(text);
    if (parsed && typeof parsed.score === 'number') {
      return parsed;
    }
    return null;
  } catch (err) {
    markQuotaExceeded(err.message);
    console.warn("⚠️ Gemini Answer Evaluation Notice:", err.message, "-> Using semantic NLP engine fallback.");
    return null;
  }
};

module.exports = {
  generateQuestionsWithGemini,
  evaluateAnswerWithGemini
};
