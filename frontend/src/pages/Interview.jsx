import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useState, useEffect } from "react";

function Interview() {
  const questions =
    JSON.parse(
      localStorage.getItem("selectedQuestions")
    ) || [];

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState([]);
  const [started, setStarted] = useState(false);

  const duration =
    Number(localStorage.getItem("interviewDuration")) || 5;

  const [timeLeft, setTimeLeft] = useState(duration * 60);

  useEffect(() => {
    if (questions.length === 0) {
      alert(
        "Please upload a resume and start an interview first."
      );

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

          alert("Time is up!");

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

  const submitAnswer = () => {
    if (!answer.trim()) {
      alert("Please write an answer first");
      return;
    }

    const updatedAnswers = [...answers];
    updatedAnswers[currentQuestion] = answer;

    setAnswers(updatedAnswers);

    localStorage.setItem(
      "answers",
      JSON.stringify(updatedAnswers)
    );

    alert("Answer saved successfully");
  };

  const nextQuestion = () => {
    if (answer.trim()) {
      const updatedAnswers = [...answers];
      updatedAnswers[currentQuestion] = answer;

      setAnswers(updatedAnswers);

      localStorage.setItem(
        "answers",
        JSON.stringify(updatedAnswers)
      );
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setAnswer("");
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
          {/* Interview Section */}
          <div className="col-span-2">
            <div className="bg-[#101827] rounded-3xl p-8 border border-white/10">
              <div className="flex justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    Interview Session
                  </h1>

                  <p className="text-gray-400 mt-2">
                    AI Generated Interview
                  </p>
                </div>

                <div className="bg-blue-600 px-5 py-3 rounded-xl text-white font-semibold">
                  {started
                    ? formatTime(timeLeft)
                    : "Not Started"}
                </div>
              </div>

              {!started && (
                <div className="mt-8 text-center">
                  <button
                    onClick={() => setStarted(true)}
                    className="bg-green-600 px-8 py-3 rounded-xl text-white hover:bg-green-700"
                  >
                    Start Interview
                  </button>
                </div>
              )}

              {started && (
                <div className="mt-8">
                  <div className="bg-[#1A2333] p-6 rounded-2xl">
                    <p className="text-gray-400">
                      Question {currentQuestion + 1} /{" "}
                      {questions.length}
                    </p>

                    <h2 className="text-white text-xl mt-3">
                      {questions[currentQuestion]}
                    </h2>
                  </div>

                  <textarea
                    rows="10"
                    value={answer}
                    onChange={(e) =>
                      setAnswer(e.target.value)
                    }
                    placeholder="Write answer here..."
                    className="w-full bg-[#1A2333] text-white rounded-2xl p-5 mt-6 outline-none"
                  />

                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={submitAnswer}
                      className="bg-blue-600 px-6 py-3 rounded-xl text-white hover:bg-blue-700"
                    >
                      Submit Answer
                    </button>

                    <button
                      onClick={nextQuestion}
                      className="bg-[#1A2333] px-6 py-3 rounded-xl text-white hover:bg-[#24314a]"
                    >
                      {currentQuestion ===
                      questions.length - 1
                        ? "Finish Interview"
                        : "Next Question"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div>
            {/* Progress */}
            <div className="bg-[#101827] rounded-3xl p-8 border border-white/10">
              <h1 className="text-white text-2xl">
                Progress
              </h1>

              <div className="mt-8">
                <div className="w-full h-3 bg-[#1A2333] rounded-full">
                  <div
                    className="bg-blue-600 h-3 rounded-full"
                    style={{
                      width: `${
                        questions.length > 0
                          ? ((currentQuestion + 1) /
                              questions.length) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>

                <p className="text-gray-400 mt-4">
                  {currentQuestion + 1} /{" "}
                  {questions.length} Questions
                </p>
              </div>
            </div>

            {/* AI Evaluation */}
            <div className="bg-[#101827] rounded-3xl p-8 border border-white/10 mt-6">
              <h1 className="text-white text-2xl">
                AI Evaluation
              </h1>

              <div className="space-y-4 mt-6">
                <div className="bg-[#1A2333] p-4 rounded-xl text-white">
                  Correctness : Pending
                </div>

                <div className="bg-[#1A2333] p-4 rounded-xl text-white">
                  Depth : Pending
                </div>

                <div className="bg-[#1A2333] p-4 rounded-xl text-white">
                  Communication : Pending
                </div>
              </div>
            </div>

            {/* Answers Saved */}
            <div className="bg-[#101827] rounded-3xl p-8 border border-white/10 mt-6">
              <h1 className="text-white text-2xl">
                Answers Saved
              </h1>

              <p className="text-gray-400 mt-4">
                {answers.filter(Boolean).length} /{" "}
                {questions.length}
              </p>
            </div>

            {/* Duration */}
            <div className="bg-[#101827] rounded-3xl p-8 border border-white/10 mt-6">
              <h1 className="text-white text-2xl">
                Duration
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