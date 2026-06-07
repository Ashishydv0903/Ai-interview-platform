import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function Results() {
  const skills =
    JSON.parse(localStorage.getItem("skills")) || [];

  const score =
    localStorage.getItem("score") || 0;

  const questions =
    JSON.parse(
      localStorage.getItem("selectedQuestions")
    ) || [];

  const answers =
    JSON.parse(
      localStorage.getItem("answers")
    ) || [];

  const duration =
    localStorage.getItem(
      "interviewDuration"
    ) || 0;

  const answeredCount =
    answers.filter(
      (answer) =>
        answer && answer.trim() !== ""
    ).length;

  const performance =
    score >= 80
      ? "Excellent"
      : score >= 60
      ? "Good"
      : "Needs Improvement";

  return (
    <div className="flex bg-[#050816] min-h-screen">
      <Sidebar />

      <div className="flex-1 p-8">
        <Navbar />

        <div className="grid grid-cols-3 gap-6 mt-8">

          {/* Main Results */}
          <div className="col-span-2">
            <div className="bg-[#101827] rounded-3xl p-8 border border-white/10">

              <h1 className="text-4xl font-bold text-white">
                Interview Results
              </h1>

              <p className="text-gray-400 mt-2">
                AI Mock Interview Summary
              </p>

              {/* Score */}
              <div className="mt-8 bg-[#1A2333] rounded-2xl p-6">
                <h2 className="text-white text-2xl">
                  Resume Score
                </h2>

                <p className="text-green-400 text-5xl font-bold mt-4">
                  {score}%
                </p>
              </div>

              {/* Performance */}
              <div className="mt-6 bg-[#1A2333] rounded-2xl p-6">
                <h2 className="text-white text-2xl">
                  Overall Performance
                </h2>

                <p className="text-blue-400 text-3xl mt-4 font-semibold">
                  {performance}
                </p>
              </div>

              {/* Questions & Answers */}
              <div className="mt-6 bg-[#1A2333] rounded-2xl p-6">
                <h2 className="text-white text-2xl mb-6">
                  Interview Responses
                </h2>

                {questions.map((question, index) => (
                  <div
                    key={index}
                    className="mb-6 border-b border-white/10 pb-4"
                  >
                    <p className="text-blue-400 font-semibold">
                      Q{index + 1}. {question}
                    </p>

                    <p className="text-gray-300 mt-2">
                      {answers[index]
                        ? answers[index]
                        : "No answer submitted"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div>

            {/* Interview Stats */}
            <div className="bg-[#101827] rounded-3xl p-8 border border-white/10">
              <h1 className="text-white text-2xl">
                Interview Stats
              </h1>

              <div className="space-y-4 mt-6">

                <div className="bg-[#1A2333] p-4 rounded-xl text-white">
                  Duration : {duration} Minutes
                </div>

                <div className="bg-[#1A2333] p-4 rounded-xl text-white">
                  Questions : {questions.length}
                </div>

                <div className="bg-[#1A2333] p-4 rounded-xl text-white">
                  Answered : {answeredCount}
                </div>

              </div>
            </div>

            {/* Skills */}
            <div className="bg-[#101827] rounded-3xl p-8 border border-white/10 mt-6">

              <h1 className="text-white text-2xl">
                Detected Skills
              </h1>

              <div className="space-y-3 mt-6">

                {skills.length === 0 ? (
                  <p className="text-gray-400">
                    No skills found
                  </p>
                ) : (
                  skills.map((skill, index) => (
                    <div
                      key={index}
                      className="bg-[#1A2333] p-3 rounded-xl text-white"
                    >
                      {skill}
                    </div>
                  ))
                )}

              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-[#101827] rounded-3xl p-8 border border-white/10 mt-6">

              <h1 className="text-white text-2xl">
                Recommendations
              </h1>

              <div className="space-y-4 mt-6">

                <div className="bg-[#1A2333] p-4 rounded-xl text-white">
                  Practice more DSA problems.
                </div>

                <div className="bg-[#1A2333] p-4 rounded-xl text-white">
                  Improve project explanations.
                </div>

                <div className="bg-[#1A2333] p-4 rounded-xl text-white">
                  Strengthen communication skills.
                </div>

              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

export default Results;