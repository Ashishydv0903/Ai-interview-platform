const { GoogleGenerativeAI } = require("@google/generative-ai");

// Helper for timeout protection (prevents hanging if Google API latency spikes)
const withTimeout = (promise, ms = 12000) => {
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

// Dynamic Gemini API Model Provider
const getGeminiModel = (config = {}) => {
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
 * Generate AI questions tailored to candidate's Resume and optional Job Description.
 * If no resume is provided, falls back to the selected domain & role topics.
 */
const generateQuestionsWithGemini = async (options = {}, legacyDomain = "Frontend", legacyCustom = null) => {
  let mode = "ROLE_BASED";
  let resumeText = null;
  let jobDescription = null;
  let skills = [];
  let domain = "Frontend";
  let customSubject = null;
  let totalQuestions = 5;

  if (Array.isArray(options)) {
    skills = options;
    domain = legacyDomain;
    customSubject = legacyCustom;
  } else if (typeof options === 'object' && options !== null) {
    mode = options.mode || (options.resumeText && options.resumeText.trim().length > 25 ? "RESUME_BASED" : "ROLE_BASED");
    resumeText = options.resumeText || null;
    jobDescription = options.jobDescription || null;
    skills = options.skills || [];
    domain = options.domain || "Frontend";
    customSubject = options.customSubject || null;
    totalQuestions = parseInt(options.totalQuestions) || 5;
  }

  const model = getGeminiModel({ maxOutputTokens: 2500 });
  if (!model) {
    return null; // Fallback to curated question bank
  }

  const isResumeMode = mode === "RESUME_BASED" && resumeText && resumeText.trim().length > 25;
  const hasJD = isResumeMode && jobDescription && jobDescription.trim().length > 15;

  let prompt = "";

  if (isResumeMode) {
    prompt = `
You are a senior hiring manager and lead technical interviewer conducting an in-depth, realistic interview.

CANDIDATE'S ACTUAL RESUME:
"""
${resumeText.trim().substring(0, 4000)}
"""
${hasJD ? `
TARGET JOB DESCRIPTION / ROLE REQUIREMENTS:
"""
${jobDescription.trim().substring(0, 3000)}
"""
` : ''}

CRITICAL INTERVIEW INSTRUCTIONS:
1. Generate exactly ${totalQuestions} realistic, rigorous, and practical interview questions that directly evaluate the candidate on the ACTUAL projects, architecture, tools, responsibilities, and technical claims in their resume.
2. Reference specific projects, technologies, and achievements from their resume in the questions (e.g. "In your project [X], you used [Y]; how did you design...", "You mentioned improving performance by [Z]; what architectural decisions made that possible?").
${hasJD ? '3. Bridge their past experience with the requirements described in the Target Job Description.' : '3. Test both foundational depth and practical real-world problem solving based on their resume background.'}
4. Vary difficulty smoothly across the questions: starting with a clear foundational/architectural question and progressing to deep real-world trade-offs and edge-case design.
5. Return ONLY a valid JSON array of objects. Do not add markdown fences or conversational text.

Each object must have:
- "question": string (the detailed, realistic interview question referencing candidate's background),
- "topic": string (specific skill or project area),
- "difficulty": "Easy" | "Medium" | "Hard" | "Expert",
- "expectedConcepts": array of 4-6 key concepts/terms a great answer should cover,
- "hints": array of 1-2 helpful hints,
- "idealAnswer": 2-3 sentence comprehensive model answer demonstrating what a 100% score includes.
`;
  } else {
    // Standard domain-based fallback when candidate provided no resume
    const dLower = (domain || "").toLowerCase();
    let domainDescription = "";
    let relevantTopics = [];

    if (dLower.includes("aptitude") || dLower.includes("reasoning")) {
      domainDescription = "Aptitude, Quantitative Mathematics, and Logical Reasoning (e.g., probability, speed-distance-time, percentages, syllogisms, number series, seating arrangements, ratios). DO NOT generate coding questions.";
      relevantTopics = ["Logical Deduction", "Quantitative Aptitude", "Probability & Combinatorics", "Time and Work", "Ratios and Percentages"];
    } else if (dLower.includes("business") || dLower.includes("management") || dLower.includes("product")) {
      domainDescription = "Business Management, Product Strategy & Metrics (e.g., CAC/LTV unit economics, SWOT, RICE prioritization, stakeholder conflict, market sizing). DO NOT generate coding questions.";
      relevantTopics = ["Product Strategy", "Unit Economics", "Stakeholder Alignment", "Prioritization Frameworks"];
    } else if (dLower.includes("english") || dLower.includes("communication")) {
      domainDescription = "Professional Workplace Communication, Conflict De-escalation & STAR Behavioral Interview Scenarios.";
      relevantTopics = ["STAR Method", "De-escalation", "Executive Communication", "Client Relationship Management"];
    } else if (dLower.includes("finance") || dLower.includes("accounting")) {
      domainDescription = "Corporate Finance, Accounting & Valuation (e.g., Three Financial Statements integration, Net Working Capital, Cash Flow, DCF).";
      relevantTopics = ["Financial Statements", "Working Capital", "Valuation", "Accounting Principles"];
    } else if (dLower === "custom" && customSubject) {
      domainDescription = `Specialized Subject / Exam: "${customSubject}". All questions must strictly pertain to this topic.`;
      relevantTopics = [customSubject];
    } else if (dLower.includes("frontend")) {
      domainDescription = "Frontend Web Engineering (e.g., React, JavaScript event loop, DOM reconciliation, modern CSS, Web Core Vitals, state management).";
      relevantTopics = (skills || []).filter(s => /react|vue|angular|javascript|typescript|html|css|tailwind|redux|frontend/i.test(s));
      if (relevantTopics.length === 0) relevantTopics = ["React", "JavaScript", "Browser Performance", "State Management"];
    } else if (dLower.includes("backend")) {
      domainDescription = "Backend Software Engineering (e.g., Node.js runtime, REST vs GraphQL, SQL/NoSQL databases, microservices, distributed caching, concurrency).";
      relevantTopics = (skills || []).filter(s => /node|express|python|java|database|sql|mongo|redis|api|backend/i.test(s));
      if (relevantTopics.length === 0) relevantTopics = ["Node.js", "REST APIs", "SQL & Databases", "Caching Architecture"];
    } else if (dLower.includes("datascience") || dLower.includes("ai")) {
      domainDescription = "Data Science, Machine Learning & AI (e.g., Bias-Variance Tradeoff, Precision vs Recall, Transformers, Embeddings).";
      relevantTopics = ["Machine Learning", "Transformers & NLP", "Model Evaluation", "Vector Embeddings"];
    } else {
      domainDescription = `${domain} Assessment`;
      relevantTopics = skills.length > 0 ? skills : ["Core Fundamentals", "Problem Solving"];
    }

    prompt = `
Generate exactly ${totalQuestions} realistic, interview questions specifically tailored for the target domain:
TARGET DOMAIN: ${domainDescription}
FOCUS TOPICS: ${relevantTopics.join(", ")}
Vary difficulty cleanly from Easy to Hard / Expert.

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
`;
  }

  try {
    let result;
    try {
      result = await withTimeout(model.generateContent(prompt), 14000);
    } catch (firstErr) {
      const msg = firstErr?.message || '';
      if (msg.includes('429') || msg.includes('Quota') || msg.includes('ResourceExhausted') || msg.includes('rate-limit') || msg.includes('fetch failed')) {
        console.warn("⚠️ Transient Gemini rate-limit/latency. Retrying once after 2s...");
        await new Promise(r => setTimeout(r, 2000));
        result = await withTimeout(model.generateContent(prompt), 14000);
      } else {
        throw firstErr;
      }
    }
    const text = result.response.text();
    const parsed = extractJson(text);
    if (Array.isArray(parsed) && parsed.length > 0) {
      console.log(`✅ [Gemini] Successfully generated ${parsed.length} tailored interview questions${isResumeMode ? ' (Mode: RESUME_BASED)' : ` (Mode: ROLE_BASED - ${domain})`}${hasJD ? ' (Aligned with Job Description)' : ''}.`);
      return parsed;
    }
    return null;
  } catch (err) {
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
    let result;
    try {
      result = await withTimeout(model.generateContent(prompt), 10000);
    } catch (firstErr) {
      const msg = firstErr?.message || '';
      if (msg.includes('429') || msg.includes('Quota') || msg.includes('ResourceExhausted') || msg.includes('rate-limit') || msg.includes('fetch failed')) {
        console.warn("⚠️ Transient Gemini evaluation rate-limit. Retrying after 1.5s...");
        await new Promise(r => setTimeout(r, 1500));
        result = await withTimeout(model.generateContent(prompt), 10000);
      } else {
        throw firstErr;
      }
    }
    const text = result.response.text();
    const parsed = extractJson(text);
    if (parsed && typeof parsed.score === 'number') {
      return parsed;
    }
    return null;
  } catch (err) {
    console.warn("⚠️ Gemini Answer Evaluation Notice:", err.message, "-> Using semantic NLP engine fallback.");
    return null;
  }
};

module.exports = {
  generateQuestionsWithGemini,
  evaluateAnswerWithGemini
};
