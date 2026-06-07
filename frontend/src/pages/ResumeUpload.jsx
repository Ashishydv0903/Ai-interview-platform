import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useState } from "react";
import axios from "axios";

function ResumeUpload() {
  const [file, setFile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [score, setScore] = useState(0);
  const [showInterviewOption, setShowInterviewOption] = useState(false);
  const [showDuration, setShowDuration] = useState(false);

  const startInterview = (minutes) => {
  const allQuestions =
    JSON.parse(localStorage.getItem("questions")) || [];

  let count = 5;

  if (minutes === 10) count = 10;
  if (minutes === 15) count = 15;
  if (minutes === 20) count = 20;

  const selectedQuestions =
    allQuestions.slice(0, count);

  localStorage.setItem(
    "selectedQuestions",
    JSON.stringify(selectedQuestions)
  );

  localStorage.setItem(
    "interviewDuration",
    minutes
  );

  window.location.href = "/interview";
};

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a PDF");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/resume/upload",
        formData
      );

      console.log(response.data);

      setSkills(response.data.skills || []);

      setScore(response.data.score || 0);

      setShowInterviewOption(true);

      localStorage.setItem(
        "skills",
        JSON.stringify(response.data.skills)
      );

      localStorage.setItem(
        "questions",
        JSON.stringify(response.data.questions)
      );

      localStorage.setItem(
        "score",
        response.data.score
      );

      alert("Resume processed successfully");
    } catch (error) {
      console.error(error);
      alert("Upload failed");
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
            <div className="bg-[#101827] rounded-3xl p-10 border border-white/10">
              <h1 className="text-3xl font-bold text-white">
                Upload Resume
              </h1>

              <p className="text-gray-400 mt-3">
                Upload PDF to extract skills and generate interview questions
              </p>

              <div className="border-2 border-dashed border-blue-500 rounded-3xl mt-8 p-16 text-center">
                <p className="text-white text-xl">
                  Drop Resume Here
                </p>

                <p className="text-gray-400 mt-2">
                  PDF only
                </p>

                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="mt-8 text-white"
                />

                <div>
                  <button
                    onClick={handleUpload}
                    className="bg-blue-600 px-8 py-3 rounded-xl text-white mt-8 hover:bg-blue-700"
                  >
                    Upload Resume
                  </button>
                </div>
              </div>

              {/* Resume Score */}
              {showInterviewOption && (
                <div className="mt-8 bg-[#1A2333] p-6 rounded-2xl">
                  <h2 className="text-white text-2xl">
                    Resume Score
                  </h2>

                  <p className="text-green-400 text-4xl font-bold mt-3">
                    {score}%
                  </p>

                  <p className="text-gray-400 mt-2">
                    Based on detected technical skills
                  </p>
                </div>
              )}

              {/* Start Interview */}
              {showInterviewOption && (
                <div className="mt-6 bg-[#1A2333] p-6 rounded-2xl">
                  <h2 className="text-white text-xl">
                    Would you like to start an interview?
                  </h2>

                  <div className="flex gap-4 mt-4">
                    <button
                      onClick={() => setShowDuration(true)}
                      className="bg-blue-600 px-6 py-3 rounded-xl text-white"
                    >
                      Start Interview
                    </button>

                    <button
                      className="bg-gray-700 px-6 py-3 rounded-xl text-white"
                    >
                      Not Now
                    </button>
                  </div>
                </div>
              )}

              {/* Duration Selection */}
              {showDuration && (
                <div className="mt-6 bg-[#1A2333] p-6 rounded-2xl">
                  <h2 className="text-white text-xl mb-4">
                    Select Interview Duration
                  </h2>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => startInterview(5)}
                      className="bg-blue-600 p-4 rounded-xl text-white"
                    >
                      5 Minutes
                    </button>

                    <button
                      onClick={() => startInterview(10)}
                      className="bg-blue-600 p-4 rounded-xl text-white"
                    >
                      10 Minutes
                    </button>

                    <button
                      onClick={() => startInterview(15)}
                      className="bg-blue-600 p-4 rounded-xl text-white"
                    >
                      15 Minutes
                    </button>

                    <button
                      onClick={() => startInterview(20)}
                      className="bg-blue-600 p-4 rounded-xl text-white"
                    >
                      20 Minutes
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Section */}
          <div>
            <div className="bg-[#101827] rounded-3xl p-8 border border-white/10">
              <h1 className="text-white text-2xl">
                Detected Skills
              </h1>

              <div className="space-y-4 mt-8">
                {skills.length === 0 ? (
                  <p className="text-gray-400">
                    No skills detected yet
                  </p>
                ) : (
                  skills.map((skill, index) => (
                    <div
                      key={index}
                      className="bg-[#1A2333] p-4 rounded-xl text-white"
                    >
                      {skill}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResumeUpload;