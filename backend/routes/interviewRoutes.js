const express = require("express");

const router = express.Router();

const {
  evaluateInterviewAnswer,
} = require("../controllers/interviewController");

router.post("/evaluate", evaluateInterviewAnswer);

module.exports = router;