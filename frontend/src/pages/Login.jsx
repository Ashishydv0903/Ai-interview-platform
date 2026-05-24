import { Link, useNavigate } from "react-router-dom";

function Login() {

const navigate = useNavigate();

const handleLogin = () => {

navigate("/dashboard");

};

return(

<div className="min-h-screen bg-[#050816] flex justify-center items-center">

<div className="bg-[#101827] p-10 rounded-3xl w-[420px] border border-white/10">

<h1 className="text-3xl text-white text-center font-bold">

AI Mock Platform

</h1>

<input

type="email"

placeholder="Email"

className="w-full mt-8 p-4 rounded-xl bg-[#1A2333] text-white outline-none"

/>

<input

type="password"

placeholder="Password"

className="w-full mt-5 p-4 rounded-xl bg-[#1A2333] text-white outline-none"

/>

<button

onClick={handleLogin}

className="w-full bg-blue-600 text-white p-4 rounded-xl mt-6"

>

Login

</button>

<p className="text-center text-gray-400 mt-5">

No account?

<Link to="/register" className="text-blue-500 ml-2">

Register

</Link>

</p>

</div>

</div>

)

}

export default Login