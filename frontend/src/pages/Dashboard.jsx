import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function Dashboard() {

return(

<div className="flex bg-[#050816] min-h-screen">

<Sidebar/>

<div className="flex-1 p-8">

<Navbar/>

<div className="grid grid-cols-3 gap-6 mt-8">

<div className="bg-[#101827] p-8 rounded-3xl border border-white/10">

<p className="text-gray-400">

Interviews

</p>

<h1 className="text-4xl font-bold text-white mt-3">

10

</h1>

</div>

<div className="bg-[#101827] p-8 rounded-3xl border border-white/10">

<p className="text-gray-400">

Avg Score

</p>

<h1 className="text-4xl font-bold text-white mt-3">

85%

</h1>

</div>

<div className="bg-[#101827] p-8 rounded-3xl border border-white/10">

<p className="text-gray-400">

Performance Tier

</p>

<h1 className="text-4xl font-bold text-white mt-3">

Level 1

</h1>

</div>

</div>

<div className="grid grid-cols-2 gap-6 mt-8">

<div className="bg-[#101827] rounded-3xl p-8 border border-white/10">

<h1 className="text-3xl font-bold text-white">

Start Interview Sprint

</h1>

<p className="text-gray-400 mt-3">

Build baseline score

</p>

<button className="bg-blue-600 px-6 py-3 rounded-xl mt-8 text-white">

Start Interview

</button>

</div>

<div className="bg-[#101827] rounded-3xl p-8 border border-white/10">

<h1 className="text-2xl text-white">

Quick Actions

</h1>

<div className="space-y-4 mt-6">

<div className="bg-[#1A2333] p-4 rounded-xl text-white">

Start New Interview

</div>

<div className="bg-[#1A2333] p-4 rounded-xl text-white">

View Reports

</div>

<div className="bg-[#1A2333] p-4 rounded-xl text-white">

Explore Skills

</div>

</div>

</div>

</div>

<div className="bg-[#101827] rounded-3xl p-8 mt-8 border border-white/10">

<h1 className="text-2xl text-white">

Learning Path

</h1>

<div className="mt-8 space-y-5">

<div className="bg-[#1A2333] p-5 rounded-xl text-white">

1. Assess Baseline

</div>

<div className="bg-[#1A2333] p-5 rounded-xl text-white">

2. Improve Weak Areas

</div>

<div className="bg-[#1A2333] p-5 rounded-xl text-white">

3. Validate Under Pressure

</div>

</div>

</div>

</div>

</div>

)

}

export default Dashboard