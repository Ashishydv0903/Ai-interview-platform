const fs = require("fs");
const pdfParse = require("pdf-parse");
const generateQuestions = require("../services/questionGenerator");
const uploadResume = async (req, res) => {
  try {
    const pdfBuffer = fs.readFileSync(req.file.path);

    const data = await pdfParse(pdfBuffer);

    const text = data.text;

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

    const detectedSkills = skillList.filter(skill =>
      text.toLowerCase().includes(skill.toLowerCase())
    );
    const questions = generateQuestions(detectedSkills);
    console.log("========== RESUME TEXT ==========");
console.log(text.substring(0, 500));
console.log("================================");

console.log("Detected Skills:", detectedSkills);
const score = Math.min(
  detectedSkills.length * 10,
  100
);
    res.json({
      success: true,
      skills: detectedSkills,
       questions,
       score
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Error parsing resume"
    });
  }
};

module.exports = { uploadResume };