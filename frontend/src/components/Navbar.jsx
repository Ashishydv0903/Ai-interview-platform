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

      <button className="bg-blue-600 px-6 py-3 rounded-xl text-white">

        Sign In

      </button>

    </div>

  );
}

export default Navbar;