import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useState, useEffect } from "react";
import axios from "axios";

function Interview() {
  const questions =
    JSON.parse(localStorage.getItem("selectedQuestions")) || [];

  const duration =
    Number(localStorage.getItem("interviewDuration")) || 5;

  const [started, setStarted] = useState(false);

  const [timeLeft, setTimeLeft] = useState(duration * 60);

  const [currentQuestion, setCurrentQuestion] = useState(0);

  const [answer, setAnswer] = useState("");

  const [answers, setAnswers] = useState([]);

  const [loading, setLoading] = useState(false);

  const [evaluation, setEvaluation] = useState({
    score: 0,
    correctness: "Pending",
    depth: "Pending",
    communication: "Pending",
    feedback: "Pending",
  });

  useEffect(() => {
    if (questions.length === 0) {
      alert("Please upload resume first.");
      window.location.href = "/resume-upload";
    }
  }, []);

  useEffect(() => {
    if (!started) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);

          localStorage.setItem(
            "interviewCompleted",
            "true"
          );

          window.location.href = "/results";

          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [started]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);

    const secs = seconds % 60;

    return `${mins}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const submitAnswer = async () => {
    if (!answer.trim()) {
      alert("Write an answer first.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:5000/api/interview/evaluate",
        {
          question: questions[currentQuestion],
          answer,
        }
      );

      const aiEvaluation =
        response.data.evaluation;

      setEvaluation(aiEvaluation);

      const updatedAnswers = [...answers];

      updatedAnswers[currentQuestion] = {
        question: questions[currentQuestion],
        answer,
        evaluation: aiEvaluation,
      };

      setAnswers(updatedAnswers);

      localStorage.setItem(
        "answers",
        JSON.stringify(updatedAnswers)
      );

      setLoading(false);

      alert("AI Evaluation Completed");
    } catch (err) {
      console.error(err);

      setLoading(false);

      alert("AI Evaluation Failed");
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);

      setAnswer("");

      setEvaluation({
        score: 0,
        correctness: "Pending",
        depth: "Pending",
        communication: "Pending",
        feedback: "Pending",
      });
    } else {
      localStorage.setItem(
        "interviewCompleted",
        "true"
      );

      window.location.href = "/results";
    }
  };
    return (
    <div className="flex bg-[#050816] min-h-screen">
      <Sidebar />

      <div className="flex-1 p-8">
        <Navbar />

        <div className="grid grid-cols-3 gap-6 mt-8">

          {/* Left Section */}
          <div className="col-span-2">

            <div className="bg-[#101827] rounded-3xl p-8 border border-white/10">

              <div className="flex justify-between items-center">

                <div>
                  <h1 className="text-3xl font-bold text-white">
                    AI Interview Session
                  </h1>

                  <p className="text-gray-400 mt-2">
                    Gemini Powered Technical Interview
                  </p>
                </div>

                <div className="bg-blue-600 px-6 py-3 rounded-xl text-white font-semibold">
                  {started ? formatTime(timeLeft) : "Not Started"}
                </div>

              </div>

              {!started ? (

                <div className="flex flex-col items-center justify-center mt-20">

                  <h2 className="text-white text-2xl font-semibold">
                    Ready to begin your interview?
                  </h2>

                  <p className="text-gray-400 mt-3">
                    Duration : {duration} Minutes
                  </p>

                  <button
                    onClick={() => setStarted(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-10 py-4 rounded-xl mt-8"
                  >
                    Start Interview
                  </button>

                </div>

              ) : (

                <>

                  <div className="mt-8 bg-[#1A2333] rounded-2xl p-6">

                    <p className="text-gray-400">
                      Question {currentQuestion + 1} / {questions.length}
                    </p>

                    <h2 className="text-white text-xl mt-4 leading-8">
                      {questions[currentQuestion]}
                    </h2>

                  </div>

                  <textarea
                    rows="10"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full bg-[#1A2333] text-white rounded-2xl p-5 mt-6 outline-none resize-none"
                  />

                  <div className="flex gap-4 mt-6">

                    <button
                      disabled={loading}
                      onClick={submitAnswer}
                      className={`px-6 py-3 rounded-xl text-white ${
                        loading
                          ? "bg-gray-600 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      {loading
                        ? "AI Evaluating..."
                        : "Submit Answer"}
                    </button>

                    <button
                      disabled={loading}
                      onClick={nextQuestion}
                      className={`px-6 py-3 rounded-xl text-white ${
                        loading
                          ? "bg-gray-700 cursor-not-allowed"
                          : "bg-[#1A2333] hover:bg-[#24314a]"
                      }`}
                    >
                      {currentQuestion === questions.length - 1
                        ? "Finish Interview"
                        : "Next Question"}
                    </button>

                  </div>

                </>

              )}

            </div>

          </div>          {/* Right Sidebar */}
          <div>

            {/* Progress */}
            <div className="bg-[#101827] rounded-3xl p-8 border border-white/10">

              <h1 className="text-white text-2xl font-bold">
                Progress
              </h1>

              <div className="mt-8">

                <div className="w-full h-3 bg-[#1A2333] rounded-full">

                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        questions.length
                          ? ((currentQuestion + 1) /
                              questions.length) *
                            100
                          : 0
                      }%`,
                    }}
                  />

                </div>

                <p className="text-gray-400 mt-4">
                  {currentQuestion + 1} / {questions.length} Questions
                </p>

              </div>

            </div>

            {/* AI Evaluation */}
            <div className="bg-[#101827] rounded-3xl p-8 border border-white/10 mt-6">

              <h1 className="text-white text-2xl font-bold">
                AI Evaluation
              </h1>

              <div className="space-y-4 mt-6">

                <div className="bg-[#1A2333] p-4 rounded-xl text-white">
                  <span className="font-semibold">Score :</span>{" "}
                  {evaluation.score}
                </div>

                <div className="bg-[#1A2333] p-4 rounded-xl text-white">
                  <span className="font-semibold">
                    Correctness :
                  </span>{" "}
                  {evaluation.correctness}
                </div>

                <div className="bg-[#1A2333] p-4 rounded-xl text-white">
                  <span className="font-semibold">
                    Depth :
                  </span>{" "}
                  {evaluation.depth}
                </div>

                <div className="bg-[#1A2333] p-4 rounded-xl text-white">
                  <span className="font-semibold">
                    Communication :
                  </span>{" "}
                  {evaluation.communication}
                </div>

                <div className="bg-[#1A2333] p-4 rounded-xl text-white">
                  <span className="font-semibold">
                    Feedback :
                  </span>

                  <p className="mt-2 text-gray-300">
                    {evaluation.feedback}
                  </p>
                </div>

              </div>

            </div>

            {/* Answers Saved */}
            <div className="bg-[#101827] rounded-3xl p-8 border border-white/10 mt-6">

              <h1 className="text-white text-2xl font-bold">
                Answers Saved
              </h1>

              <p className="text-gray-400 mt-4">
                {answers.filter(Boolean).length} / {questions.length}
              </p>

            </div>

            {/* Duration */}
            <div className="bg-[#101827] rounded-3xl p-8 border border-white/10 mt-6">

              <h1 className="text-white text-2xl font-bold">
                Interview Duration
              </h1>

              <p className="text-gray-400 mt-4">
                {duration} Minutes
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Interview;