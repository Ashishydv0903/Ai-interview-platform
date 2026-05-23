import { Link } from "react-router-dom";

function Login() {
  return (
    <div className="h-screen flex justify-center items-center bg-gray-100">

      <div className="bg-white p-8 rounded-xl shadow-lg w-96">

        <h1 className="text-2xl font-bold text-center">
          AI Interview Platform
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full border p-2 mt-5 rounded"
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-2 mt-3 rounded"
        />

        <button className="bg-blue-600 text-white w-full p-2 mt-4 rounded">
          Login
        </button>

        <p className="mt-4 text-center">
          No account?

          <Link
            to="/register"
            className="text-blue-600 ml-1"
          >
            Register
          </Link>

        </p>

      </div>

    </div>
  );
}

export default Login;