const fs = require("fs");
const pdfParse = require("pdf-parse");
const { generateQuestions } = require("../services/geminiService");

const uploadResume = async (req, res) => {
  try {
    // Read uploaded PDF
    const pdfBuffer = fs.readFileSync(req.file.path);

    // Extract text
    const data = await pdfParse(pdfBuffer);
    const text = data.text;

    console.log("========== RESUME TEXT ==========");
    console.log(text.substring(0, 500));
    console.log("================================");

    // Skills list
    const skillList = [
      "Java",
      "Python",
      "JavaScript",
      "React",
      "Node.js",
      "MongoDB",
      "HTML",
      "CSS",
      "SQL",
      "Express",
      "Git"
    ];

    // Detect skills
    const detectedSkills = skillList.filter((skill) =>
      text.toLowerCase().includes(skill.toLowerCase())
    );

    console.log("Detected Skills:", detectedSkills);

    // Resume Score
    const score = Math.min(detectedSkills.length * 10, 100);

    // Generate AI Questions
    let questions = [];

    try {
      questions = await generateQuestions(detectedSkills);
      console.log("✅ Gemini Questions Generated Successfully");
    } catch (err) {
      console.log("❌ Gemini Failed. Using fallback questions.");
      console.error(err);

      questions = [
        "Explain Java OOP concepts.",
        "What is JavaScript?",
        "Explain React Hooks.",
        "What is Node.js?",
        "Difference between SQL and MongoDB.",
        "Explain REST API.",
        "What is HTML?",
        "Difference between Flexbox and Grid.",
        "Explain Git workflow.",
        "What are JavaScript closures?"
      ];
    }

    // Send response
    res.json({
      success: true,
      skills: detectedSkills,
      questions,
      score,
    });

  } catch (error) {
    console.error("Resume Upload Error:", error);

    res.status(500).json({
      success: false,
      message: "Error parsing resume",
    });
  }
};

module.exports = { uploadResume };