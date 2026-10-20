const { GoogleGenerativeAI } = require("@google/generative-ai");

// Dynamic Gemini API Model Provider
const getGeminiModel = () => {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    return null;
  }
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  } catch (err) {
    console.warn("⚠️ Gemini AI initialization error:", err.message);
    return null;
  }
};

/**
 * Generate AI questions from extracted skills using Gemini API or fallback
 */
const generateQuestionsWithGemini = async (skills, domain = "Frontend") => {
  const model = getGeminiModel();
  if (!model) {
    return null; // Signals fallback to built-in question bank
  }

  const prompt = `
Generate exactly 4 technical interview questions for a candidate with skills: ${skills.join(", ")} targeting domain: ${domain}.
Vary difficulty from Easy to Hard.

Rules:
- Return ONLY a JSON array of objects.
- Do not add explanations or markdown.
- Each object must have: "question", "topic", "difficulty", "expectedConcepts" (array of strings), "hints" (array of strings).

Example:
[
  {
    "question": "Explain Virtual DOM in React.",
    "topic": "React",
    "difficulty": "Easy",
    "expectedConcepts": ["Virtual DOM", "Reconciliation", "Diffing"],
    "hints": ["Think about in-memory DOM representation."]
  }
]
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Gemini Question Generation Error:", err.message);
    return null;
  }
};

/**
 * Evaluate answer using Gemini LLM if key present
 */
const evaluateAnswerWithGemini = async (question, answer) => {
  const model = getGeminiModel();
  if (!model) {
    return null; // Fallback to semantic NLP engine
  }

  const prompt = `
You are an expert technical interviewer evaluating a candidate's answer.

Question:
${question}

Candidate Answer:
${answer}

Evaluate the answer. Return ONLY a JSON object:
{
  "score": 85,
  "matchedConcepts": ["Concept1", "Concept2"],
  "missingConcepts": ["MissingConcept1"],
  "clarityScore": 90,
  "depthScore": 80,
  "rationale": "Clear explanation covering Virtual DOM diffing. Missing microtask queue details."
}
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Gemini Evaluation Error:", err.message);
    return null;
  }
};

module.exports = {
  generateQuestionsWithGemini,
  evaluateAnswerWithGemini
};
