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
      customSubject
    } = req.body;

    const candidateDomain = domain || "Frontend";
    const difficulty = initialDifficulty || "Easy";
    const totalQuestions = parseInt(totalQuestionsPlanned) || 5;
    const timeLimit = parseInt(timeLimitMinutes) || 15;

    const sessionId = uuidv4();
    const session = {
      id: sessionId,
      sessionId: sessionId,
      userId: userId || "guest-candidate",
      candidateName: candidateName || "Candidate",
      targetRole: targetRole || `${candidateDomain} Candidate`,
      candidateDomain,
      customSubject: customSubject || null,
      candidateSkills: candidateSkills || ["General Concepts"],
      currentDifficulty: difficulty,
      totalQuestionsPlanned: totalQuestions,
      timeLimitMinutes: timeLimit,
      evaluations: [],
      status: "IN_PROGRESS",
      createdAt: new Date().toISOString()
    };

    // Attempt Gemini AI Question generation if API key is present
    let geminiQuestions = null;
    if (candidateSkills && candidateSkills.length > 0) {
      geminiQuestions = await generateQuestionsWithGemini(candidateSkills, candidateDomain);
    }

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
    const { sessionId, answer, timeSpentSeconds, isCodeSandboxAnswer, codeSnippet } = req.body;

    const session = await storage.getSessionById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found." });
    }

    const currentQ = session.currentQuestion;
    if (!currentQ) {
      return res.status(400).json({ success: false, message: "No active question found for session." });
    }

    const fullTextAnswer = isCodeSandboxAnswer ? `${answer || ''}\n[Code snippet]: ${codeSnippet || ''}` : answer;

    let geminiEval = await evaluateAnswerWithGemini(currentQ.question, fullTextAnswer);
    
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

    const maxQuestions = parseInt(session.totalQuestionsPlanned) || 5;
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
    } else {
      session.currentQuestion = null;
      session.status = "COMPLETED";
      session.completedAt = new Date().toISOString();

      // Automatically generate final report when all questions are done
      session.finalReport = generateSkillGapAnalysis({
        candidateSkills: session.candidateSkills,
        targetRole: session.targetRole,
        sessionEvaluations: session.evaluations
      });
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
    const { sessionId } = req.body;
    const session = await storage.getSessionById(sessionId);

    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found." });
    }

    const analysisReport = generateSkillGapAnalysis({
      candidateSkills: session.candidateSkills,
      targetRole: session.targetRole,
      sessionEvaluations: session.evaluations
    });

    session.finalReport = analysisReport;
    session.status = "COMPLETED";
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
