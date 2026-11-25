const fs = require('fs');
const { PDFParse } = require('pdf-parse');
const { extractResumeMetadata, evaluateResponseSemantic } = require('../services/nlpEngine');
const { getNextAdaptiveQuestion } = require('../services/adaptiveEngine');
const { generateXAIExplanation, generateSkillGapAnalysis } = require('../services/xaiEngine');
const { generateQuestionsWithGemini, evaluateAnswerWithGemini } = require('../services/geminiService');
const storage = require('../services/storageService');
const { v4: uuidv4 } = require('uuid');

/**
 * Handle PDF File Upload or Raw Resume Text Parsing
 */
exports.parseResume = async (req, res) => {
  try {
    let resumeText = req.body.resumeText || "";

    if (req.file) {
      try {
        const pdfBuffer = fs.readFileSync(req.file.path);
        const parser = new PDFParse({ data: pdfBuffer });
        const parsed = await parser.getText();
        resumeText = (parsed && parsed.text) ? parsed.text : (typeof parsed === 'string' ? parsed : "");
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (pdfErr) {
        console.error("PDF parse error:", pdfErr);
      }
    }

    const { targetRole } = req.body;
    const metadata = extractResumeMetadata(resumeText);
    const score = Math.min(metadata.skills.length * 12, 100);

    return res.json({
      success: true,
      data: {
        skills: metadata.skills,
        experienceLevel: metadata.experienceLevel,
        inferredDomain: metadata.inferredDomain,
        targetRole: targetRole || `${metadata.inferredDomain} Candidate`,
        rawText: resumeText,
        score
      }
    });
  } catch (err) {
    console.error("Parse resume error:", err);
    return res.status(500).json({ success: false, message: "Error parsing resume." });
  }
};

/**
 * Initialize adaptive interview with custom question count & duration limits
 */
exports.startInterview = async (req, res) => {
  try {
    const {
      userId,
      candidateName,
      targetRole,
      domain,
      candidateSkills,
      initialDifficulty,
      totalQuestionsPlanned,
      timeLimitMinutes,
      customSubject,
      resumeText,
      jobDescription,
      mode
    } = req.body;

    // Enforce mandatory user authentication: guest/unregistered interviews are strictly prohibited
    if (!userId || userId === "guest-candidate") {
      return res.status(401).json({
        success: false,
        message: "Authentication required: Please sign in or create an account to start an interview session."
      });
    }

    const candidateDomain = domain || "Frontend";
    const difficulty = initialDifficulty || "Easy";
    const totalQuestions = parseInt(totalQuestionsPlanned) || 5;
    const timeLimit = parseInt(timeLimitMinutes) || 15;
    const interviewMode = mode || (resumeText && resumeText.trim().length > 30 ? "RESUME_BASED" : "ROLE_BASED");

    const sessionId = uuidv4();
    const session = {
      id: sessionId,
      sessionId: sessionId,
      userId: userId,
      candidateName: candidateName || "Candidate",
      targetRole: targetRole || `${candidateDomain} Candidate`,
      candidateDomain,
      interviewMode,
      customSubject: customSubject || null,
      candidateSkills: candidateSkills || ["General Concepts"],
      resumeText: interviewMode === "RESUME_BASED" ? (resumeText || null) : null,
      jobDescription: interviewMode === "RESUME_BASED" ? (jobDescription || null) : null,
      currentDifficulty: difficulty,
      totalQuestionsPlanned: totalQuestions,
      timeLimitMinutes: timeLimit,
      evaluations: [],
      status: "IN_PROGRESS",
      isClosed: false,
      createdAt: new Date().toISOString()
    };

    // Attempt Gemini AI Question generation tailored explicitly to the chosen mode (Resume vs Role)
    let geminiQuestions = null;
    geminiQuestions = await generateQuestionsWithGemini({
      mode: interviewMode,
      resumeText: interviewMode === "RESUME_BASED" ? resumeText : null,
      jobDescription: interviewMode === "RESUME_BASED" ? jobDescription : null,
      skills: candidateSkills || [],
      domain: candidateDomain,
      customSubject,
      totalQuestions
    });

    if (geminiQuestions && geminiQuestions.length > 0) {
      session.geminiQuestions = geminiQuestions;
      session.currentQuestion = {
        id: `gemini_1`,
        domain: candidateDomain,
        role: session.targetRole,
        topic: geminiQuestions[0].topic || candidateSkills[0],
        difficulty: geminiQuestions[0].difficulty || "Easy",
        question: geminiQuestions[0].question,
        expectedConcepts: geminiQuestions[0].expectedConcepts || candidateSkills,
        hints: geminiQuestions[0].hints || ["Focus on core principles."],
        idealAnswer: geminiQuestions[0].idealAnswer || `A comprehensive model response covers: ${(geminiQuestions[0].expectedConcepts || candidateSkills).join(', ')}.`
      };
    } else {
      const adaptiveResult = getNextAdaptiveQuestion({
        sessionHistory: [],
        currentDifficulty: difficulty,
        candidateDomain,
        candidateRole: session.targetRole,
        totalQuestionsPlanned: totalQuestions
      });
      session.currentQuestion = adaptiveResult.question;
      session.currentDifficulty = adaptiveResult.nextDifficulty;
    }

    // Guarantee currentQuestion is never null
    if (!session.currentQuestion) {
      const { QUESTION_BANK } = require('../data/questionBank');
      const { getEligibleQuestions } = require('../services/adaptiveEngine');
      const eligible = getEligibleQuestions(candidateDomain);
      session.currentQuestion = eligible[0] || QUESTION_BANK[0];
      session.currentDifficulty = session.currentQuestion.difficulty || "Easy";
    }

    await storage.saveSession(session);

    return res.json({
      success: true,
      data: {
        sessionId: session.id,
        currentQuestion: session.currentQuestion,
        currentDifficulty: session.currentDifficulty,
        questionIndex: 1,
        totalQuestionsPlanned: totalQuestions,
        timeLimitMinutes: timeLimit
      }
    });
  } catch (err) {
    console.error("Start interview error:", err);
    return res.status(500).json({ success: false, message: "Error starting interview." });
  }
};

/**
 * Evaluate answer & yield next question until custom totalQuestions limit reached
 */
exports.evaluateAndNext = async (req, res) => {
  try {
    const { sessionId, answer, timeSpentSeconds, isCodeSandboxAnswer, codeSnippet, proctoringSummary } = req.body;

    const session = await storage.getSessionById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found." });
    }

    const maxQuestions = parseInt(session.totalQuestionsPlanned) || 5;

    // Gracefully handle case where session is already completed
    if (session.status === 'COMPLETED' || (session.evaluations && session.evaluations.length >= maxQuestions)) {
      if (!session.finalReport) {
        session.finalReport = generateSkillGapAnalysis({
          candidateSkills: session.candidateSkills,
          targetRole: session.targetRole,
          sessionEvaluations: session.evaluations || [],
          totalQuestionsPlanned: maxQuestions
        });
      }
      if (proctoringSummary) {
        session.proctoringSummary = proctoringSummary;
        session.finalReport.proctoringSummary = proctoringSummary;
      }
      await storage.saveSession(session);
      return res.json({
        success: true,
        data: {
          isCompleted: true,
          nextQuestion: null,
          finalReport: session.finalReport,
          session
        }
      });
    }

    const currentQ = session.currentQuestion;
    if (!currentQ) {
      return res.status(400).json({ success: false, message: "No active question found for session." });
    }

    const fullTextAnswer = isCodeSandboxAnswer ? `${answer || ''}\n[Code snippet]: ${codeSnippet || ''}` : answer;

    // Fast-path for empty, ultra-short, or obvious gibberish keyboard-mashing (evaluates in 2ms without burning LLM latency or quota)
    const trimmedAnswer = (fullTextAnswer || "").trim();
    const answerWords = trimmedAnswer.split(/\s+/).filter(Boolean);
    const isObviousGibberishOrTooShort = 
      trimmedAnswer.length < 12 || 
      answerWords.length < 3 || 
      /(.)\1{4,}/.test(trimmedAnswer) || 
      (answerWords.length <= 2 && trimmedAnswer.length > 8 && !/[aeiouy]{2,}/i.test(trimmedAnswer));

    let geminiEval = null;
    if (!isObviousGibberishOrTooShort) {
      try {
        geminiEval = await evaluateAnswerWithGemini(currentQ.question, fullTextAnswer);
      } catch (evalErr) {
        console.warn("Gemini evaluation error handled gracefully:", evalErr.message);
      }
    }
    
    let semanticResult;
    if (geminiEval && geminiEval.score) {
      semanticResult = {
        score: geminiEval.score,
        matchedConcepts: geminiEval.matchedConcepts || currentQ.expectedConcepts || [],
        missingConcepts: geminiEval.missingConcepts || [],
        conceptCoveragePercent: geminiEval.score,
        depthScore: geminiEval.depthScore || 80,
        clarityScore: geminiEval.clarityScore || 85,
        confidenceScore: geminiEval.score,
        fillerCount: 0,
        wordCount: (fullTextAnswer || "").split(/\s+/).length
      };
    } else {
      semanticResult = evaluateResponseSemantic({
        answer: fullTextAnswer,
        questionObj: currentQ,
        expectedConcepts: currentQ.expectedConcepts
      });
    }

    const xaiResult = generateXAIExplanation({
      questionObj: currentQ,
      answer: fullTextAnswer,
      semanticResult,
      difficulty: session.currentDifficulty
    });

    if (geminiEval && geminiEval.rationale) {
      xaiResult.rationale = geminiEval.rationale;
    }

    // Default model answer if none provided on question
    const defaultIdeal = `A complete, high-scoring answer covers: ${(currentQ.expectedConcepts || ['core principles']).join(', ')}. It cites practical examples and explains relevant trade-offs.`;

    const evalRecord = {
      questionId: currentQ.id,
      questionText: currentQ.question,
      topic: currentQ.topic,
      difficulty: session.currentDifficulty,
      userAnswer: fullTextAnswer,
      codeSnippet: codeSnippet || null,
      timeSpentSeconds: timeSpentSeconds || 30,
      idealAnswer: currentQ.idealAnswer || defaultIdeal,
      expectedConcepts: currentQ.expectedConcepts || [],
      evaluation: {
        score: semanticResult.score,
        matchedConcepts: semanticResult.matchedConcepts,
        missingConcepts: semanticResult.missingConcepts,
        clarityScore: semanticResult.clarityScore,
        depthScore: semanticResult.depthScore,
        confidenceScore: semanticResult.confidenceScore,
        fillerCount: semanticResult.fillerCount,
        rationale: xaiResult.rationale,
        highlightTag: xaiResult.highlightTag,
        breakdown: xaiResult.breakdown
      }
    };

    session.evaluations = session.evaluations || [];
    session.evaluations.push(evalRecord);

    const isCompleted = session.evaluations.length >= maxQuestions;

    if (!isCompleted) {
      // Check if Gemini generated a next question
      const nextIndex = session.evaluations.length;
      if (session.geminiQuestions && session.geminiQuestions.length > nextIndex) {
        const gq = session.geminiQuestions[nextIndex];
        session.currentQuestion = {
          id: `gemini_${nextIndex + 1}`,
          domain: session.candidateDomain,
          role: session.targetRole,
          topic: gq.topic || session.candidateSkills[0] || 'Technical',
          difficulty: gq.difficulty || session.currentDifficulty,
          question: gq.question,
          expectedConcepts: gq.expectedConcepts || session.candidateSkills,
          hints: gq.hints || ["Focus on core principles."],
          idealAnswer: gq.idealAnswer || `A comprehensive model response covers: ${(gq.expectedConcepts || []).join(', ')}.`
        };
        session.currentDifficulty = session.currentQuestion.difficulty;
      } else {
        const adaptiveResult = getNextAdaptiveQuestion({
          sessionHistory: session.evaluations,
          currentDifficulty: session.currentDifficulty,
          candidateDomain: session.candidateDomain,
          candidateRole: session.targetRole,
          totalQuestionsPlanned: maxQuestions
        });
        session.currentQuestion = adaptiveResult.question;
        session.currentDifficulty = adaptiveResult.nextDifficulty;
      }

      // Failsafe guarantee: currentQuestion is never null while interview is still in progress
      if (!session.currentQuestion) {
        const { QUESTION_BANK } = require('../data/questionBank');
        session.currentQuestion = QUESTION_BANK[session.evaluations.length % QUESTION_BANK.length];
        session.currentDifficulty = session.currentQuestion.difficulty;
      }
    } else {
      session.currentQuestion = null;
      session.status = "COMPLETED";
      session.isClosed = true;
      session.completedAt = new Date().toISOString();

      // Automatically generate final report when all questions are done
      session.finalReport = generateSkillGapAnalysis({
        candidateSkills: session.candidateSkills,
        targetRole: session.targetRole,
        sessionEvaluations: session.evaluations,
        totalQuestionsPlanned: maxQuestions
      });
      if (proctoringSummary) {
        session.proctoringSummary = proctoringSummary;
        session.finalReport.proctoringSummary = proctoringSummary;
      }
    }

    await storage.saveSession(session);

    return res.json({
      success: true,
      data: {
        lastEvaluation: evalRecord,
        isCompleted,
        nextQuestion: session.currentQuestion,
        nextDifficulty: session.currentDifficulty,
        questionIndex: session.evaluations.length + 1,
        totalQuestionsPlanned: maxQuestions,
        finalReport: session.finalReport || null,
        session
      }
    });
  } catch (err) {
    console.error("Evaluate next error:", err);
    return res.status(500).json({ success: false, message: "Error processing evaluation." });
  }
};

/**
 * Finalize session and generate Skill Gap Analysis report
 */
exports.finalizeSession = async (req, res) => {
  try {
    const { sessionId, proctoringSummary, isEarlyExit } = req.body;
    const session = await storage.getSessionById(sessionId);

    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found." });
    }

    const analysisReport = generateSkillGapAnalysis({
      candidateSkills: session.candidateSkills,
      targetRole: session.targetRole,
      sessionEvaluations: session.evaluations || [],
      isEarlyExit: !!isEarlyExit,
      totalQuestionsPlanned: session.totalQuestionsPlanned || 5
    });

    if (proctoringSummary) {
      session.proctoringSummary = proctoringSummary;
      analysisReport.proctoringSummary = proctoringSummary;
    }

    session.isEarlyExit = !!isEarlyExit;
    analysisReport.isEarlyExit = !!isEarlyExit;
    session.finalReport = analysisReport;
    session.status = "COMPLETED";
    session.isClosed = true;
    session.completedAt = new Date().toISOString();
    await storage.saveSession(session);

    return res.json({
      success: true,
      data: {
        session,
        finalReport: analysisReport
      }
    });
  } catch (err) {
    console.error("Finalize error:", err);
    return res.status(500).json({ success: false, message: "Error finalizing session." });
  }
};

/**
 * Get list of interview sessions for candidate history
 */
exports.getSessions = async (req, res) => {
  try {
    const { userId } = req.query;
    const sessions = await storage.getAllSessions(userId || null);
    return res.json({ success: true, data: sessions });
  } catch (err) {
    console.error("Get sessions error:", err);
    return res.status(500).json({ success: false, message: "Error fetching sessions." });
  }
};

/**
 * Get details of a single interview session
 */
exports.getSessionById = async (req, res) => {
  try {
    const session = await storage.getSessionById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found." });
    }
    return res.json({ success: true, data: session });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error fetching session." });
  }
};
