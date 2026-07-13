const { evaluateAnswer } = require("../services/geminiService");

const evaluateInterviewAnswer = async (req, res) => {
  try {
    console.log("===== AI EVALUATION REQUEST =====");
console.log(req.body);
    const { question, answer } = req.body;

    const evaluation = await evaluateAnswer(question, answer);

    res.json({
      success: true,
      evaluation,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Evaluation failed",
    });
  }
};

module.exports = {
  evaluateInterviewAnswer,
};