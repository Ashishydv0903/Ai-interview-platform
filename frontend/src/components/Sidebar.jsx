import { Link } from "react-router-dom";

function Sidebar() {
  return (

    <div className="w-64 h-screen bg-slate-900 text-white p-5">

      <h1 className="text-2xl font-bold mb-10">

        AI Interview

      </h1>

      <ul className="space-y-6">

        <li>

          <Link to="/dashboard">

            Dashboard

          </Link>

        </li>

        <li>

              <Link to="/upload">

                Resume Upload

                  </Link>

        </li>

        <li>

          <Link to="/interview">

             Interview

           </Link>

        </li>

        <li>

             
          <Link to="/results">
          Results
          </Link>

        </li>

      </ul>

    </div>

  );
}

export default Sidebar;