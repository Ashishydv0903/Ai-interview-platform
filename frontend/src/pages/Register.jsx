import { Link, useNavigate } from "react-router-dom";

function Register(){

const navigate = useNavigate();

return(

<div className="min-h-screen bg-[#050816] flex justify-center items-center">

<div className="bg-[#101827] p-10 rounded-3xl w-[420px] border border-white/10">

<h1 className="text-3xl text-white text-center">

Register

</h1>

<input

type="text"

placeholder="Name"

className="w-full mt-6 p-4 rounded-xl bg-[#1A2333] text-white"

/>

<input

type="email"

placeholder="Email"

className="w-full mt-5 p-4 rounded-xl bg-[#1A2333] text-white"

/>

<input

type="password"

placeholder="Password"

className="w-full mt-5 p-4 rounded-xl bg-[#1A2333] text-white"

/>

<button

onClick={()=>navigate("/")}

className="w-full bg-blue-600 p-4 rounded-xl mt-6 text-white"

>

Create Account

</button>

<p className="text-center text-gray-400 mt-5">

Already have account?

<Link to="/login" className="text-blue-500 ml-2">

Login

</Link>

</p>

</div>

</div>

)

}

export default Register