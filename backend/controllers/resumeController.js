const fs = require("fs");
const pdfParse = require("pdf-parse");

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

    res.json({
      success: true,
      skills: detectedSkills,
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