import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function Results() {

  const answers =
    JSON.parse(localStorage.getItem("answers")) || [];

  const resumeScore =
    Number(localStorage.getItem("score")) || 0;

  const totalScore =
    answers.reduce((sum, item) => {
      return sum + (item?.evaluation?.score || 0);
    }, 0);

  const averageScore =
    answers.length > 0
      ? Math.round(totalScore / answers.length)
      : 0;

  return (
    <div className="flex bg-[#050816] min-h-screen">

      <Sidebar />

      <div className="flex-1 p-8">

        <Navbar />

        <div className="bg-[#101827] rounded-3xl p-10 mt-8 border border-white/10">

          <h1 className="text-4xl font-bold text-white">
            Interview Results
          </h1>

          <div className="grid grid-cols-3 gap-6 mt-8">

            <div className="bg-[#1A2333] p-6 rounded-2xl">

              <h2 className="text-gray-400">
                Resume Score
              </h2>

              <p className="text-green-400 text-5xl mt-3">
                {resumeScore}%
              </p>

            </div>

            <div className="bg-[#1A2333] p-6 rounded-2xl">

              <h2 className="text-gray-400">
                Interview Score
              </h2>

              <p className="text-blue-400 text-5xl mt-3">
                {averageScore}%
              </p>

            </div>

            <div className="bg-[#1A2333] p-6 rounded-2xl">

              <h2 className="text-gray-400">
                Questions Answered
              </h2>

              <p className="text-white text-5xl mt-3">
                {answers.length}
              </p>

            </div>

          </div>

          <div className="mt-10">

            <h2 className="text-3xl text-white font-bold mb-6">
              AI Evaluation
            </h2>

            {answers.map((item, index) => (

              <div
                key={index}
                className="bg-[#1A2333] rounded-2xl p-6 mb-6"
              >

                <h3 className="text-xl text-blue-400 font-semibold">
                  Question {index + 1}
                </h3>

                <p className="text-white mt-3">
                  {item.question}
                </p>

                <h4 className="text-green-400 mt-6 font-semibold">
                  Your Answer
                </h4>

                <p className="text-gray-300 mt-2">
                  {item.answer}
                </p>

                <div className="grid grid-cols-2 gap-4 mt-6">

                  <div className="bg-[#101827] p-4 rounded-xl text-white">
                    Score :
                    {" "}
                    {item.evaluation?.score}
                  </div>

                  <div className="bg-[#101827] p-4 rounded-xl text-white">
                    Correctness :
                    {" "}
                    {item.evaluation?.correctness}
                  </div>

                  <div className="bg-[#101827] p-4 rounded-xl text-white">
                    Depth :
                    {" "}
                    {item.evaluation?.depth}
                  </div>

                  <div className="bg-[#101827] p-4 rounded-xl text-white">
                    Communication :
                    {" "}
                    {item.evaluation?.communication}
                  </div>

                </div>

                <div className="bg-[#101827] rounded-xl p-4 mt-5">

                  <h4 className="text-yellow-400 font-semibold">
                    AI Feedback
                  </h4>

                  <p className="text-gray-300 mt-2">
                    {item.evaluation?.feedback}
                  </p>

                </div>

              </div>

            ))}

          </div>

        </div>

      </div>

    </div>
  );
}

export default Results;