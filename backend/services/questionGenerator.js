const questionBank = {
  React: [
    "What is Virtual DOM?",
    "What are React Hooks?",
    "Explain useState."
  ],

  "Node.js": [
    "What is Node.js?",
    "What is Event Loop?",
    "What is Express.js?"
  ],

  MongoDB: [
    "What is MongoDB?",
    "Difference between SQL and MongoDB?",
    "What are indexes?"
  ],

  JavaScript: [
    "What is closure?",
    "Difference between let and var?",
    "Explain promises."
  ]
};

function generateQuestions(skills) {
  let questions = [];

  skills.forEach(skill => {
    if (questionBank[skill]) {
      questions.push(...questionBank[skill]);
    }
  });

  return questions.slice(0, 10);
}

module.exports = generateQuestions;