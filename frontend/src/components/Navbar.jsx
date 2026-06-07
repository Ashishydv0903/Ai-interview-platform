import { Link } from "react-router-dom";

function Navbar() {
  return (
    <div className="bg-[#101827] rounded-3xl p-5 flex justify-between items-center border border-white/10">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Hello, Find your next Interview
        </h1>

        <p className="text-gray-400">
          Discover your next action
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-white font-semibold">
            Ashish
          </p>

          <p className="text-gray-400 text-sm">
            Candidate
          </p>
        </div>

        <Link
          to="/"
          className="bg-blue-600 px-6 py-3 rounded-xl text-white"
        >
          Home
        </Link>
      </div>
    </div>
  );
}

export default Navbar;