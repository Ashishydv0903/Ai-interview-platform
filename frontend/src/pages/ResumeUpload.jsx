import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function ResumeUpload() {
  return (
    <div className="flex">

      <Sidebar />

      <div className="flex-1 bg-gray-100 min-h-screen">

        <Navbar />

        <div className="p-8">

          <div className="bg-white p-8 rounded shadow max-w-lg">

            <h1 className="text-2xl font-bold mb-5">

              Upload Resume

            </h1>

            <input
              type="file"
              className="border p-3 w-full"
            />

            <button
              className="bg-blue-600 text-white p-3 mt-5 rounded w-full"
            >
              Upload Resume
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default ResumeUpload;