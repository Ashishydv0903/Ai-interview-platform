import { useNavigate } from "react-router-dom";

function Home() {

const navigate = useNavigate();

return(

<div className="min-h-screen bg-[#050816] text-white">

<nav className="flex justify-between items-center p-8">

<h1 className="text-3xl font-bold">

AI Mock

</h1>

<div className="space-x-4">

<button
onClick={()=>navigate("/login")}
className="bg-[#101827] px-6 py-3 rounded-xl"
>
Login
</button>

<button

onClick={()=>navigate("/register")}

className="bg-blue-600 px-6 py-3 rounded-xl"

>

Register

</button>

</div>

</nav>

<div className="flex flex-col justify-center items-center mt-32">

<h1 className="text-6xl font-bold text-center">

AI Powered Adaptive Interview Platform

</h1>

<p className="text-gray-400 mt-6 text-center max-w-2xl">

Upload resume, take AI interviews, analyze skills and get recommendations.

</p>

<div className="flex gap-5 mt-10">

<button

onClick={()=>navigate("/register")}

className="bg-blue-600 px-8 py-4 rounded-xl"

>

Get Started

</button>

<button

onClick={()=>navigate("/dashboard")}

className="bg-[#101827] px-8 py-4 rounded-xl"

>

Explore Dashboard

</button>

</div>

</div>

</div>

)

}

export default Home