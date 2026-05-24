import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <div className="w-72 min-h-screen bg-[#0B1220] text-white p-8 border-r border-white/10">

      <h1 className="text-3xl font-bold mb-12">

        AI Mock

      </h1>

      <ul className="space-y-5">

        <li className="bg-[#101827] p-4 rounded-2xl">

          <Link to="/dashboard">

            Dashboard

          </Link>

        </li>

        <li className="hover:bg-[#101827] p-4 rounded-2xl">

          <Link to="/upload">

            Resume Upload

          </Link>

        </li>

        <li className="hover:bg-[#101827] p-4 rounded-2xl">

          <Link to="/interview">

            Interview

          </Link>

        </li>

        <li className="hover:bg-[#101827] p-4 rounded-2xl">

          <Link to="/results">

            Results

          </Link>

        </li>

      </ul>

    </div>
  );
}

export default Sidebar;