const { GoogleGenerativeAI } = require("@google/generative-ai");
console.log("Loaded Gemini Key:", process.env.GEMINI_API_KEY);
const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

const generateQuestions = async (skills) => {
  const prompt = `
Generate exactly 10 technical interview questions based on these skills:

${skills.join(", ")}

Rules:
- Return ONLY a JSON array.
- Do not add explanations.
- Do not use markdown.

Example:
[
  "Question 1",
  "Question 2"
]
`;

  const result = await model.generateContent(prompt);

  const text = result.response.text();

  console.log("========== GEMINI RESPONSE ==========");
  console.log(text);
  console.log("=====================================");

  try {
    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch (err) {
    console.error("JSON Parse Error:", err);

    return [
      "Explain Java OOP concepts.",
      "What is React?",
      "Explain Node.js.",
      "What is MongoDB?",
      "Explain REST API.",
      "What is HTML?",
      "Explain CSS Flexbox.",
      "Difference between SQL and NoSQL.",
      "What is Git?",
      "Explain JavaScript Closures."
    ];
  }
};
const evaluateAnswer = async (question, answer) => {

const prompt = `
You are a technical interviewer.

Question:
${question}

Candidate Answer:
${answer}

Evaluate the answer.

Return ONLY JSON.

Example:

{
"score":85,
"correctness":"Good",
"depth":"Average",
"communication":"Excellent",
"feedback":"Explain time complexity more clearly."
}
`;

const result = await model.generateContent(prompt);

const text = result.response.text();

const cleaned = text
.replace(/```json/g,"")
.replace(/```/g,"")
.trim();


return JSON.parse(cleaned);

};

module.exports = {
  generateQuestions,
  evaluateAnswer,
};