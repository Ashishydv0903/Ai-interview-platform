function Register() {
  return (
    <div className="h-screen flex justify-center items-center bg-gray-100">

      <div className="bg-white p-8 rounded-xl shadow-lg w-96">

        <h1 className="text-2xl font-bold text-center">
          Register
        </h1>

        <input
          type="text"
          placeholder="Full Name"
          className="w-full border p-2 mt-5 rounded"
        />

        <input
          type="email"
          placeholder="Email"
          className="w-full border p-2 mt-3 rounded"
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-2 mt-3 rounded"
        />

        <button className="bg-green-600 text-white w-full p-2 mt-4 rounded">
          Register
        </button>

      </div>

    </div>
  );
}

export default Register;