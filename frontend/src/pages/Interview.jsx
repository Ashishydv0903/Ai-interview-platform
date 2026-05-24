import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function Interview() {

return(

<div className="flex bg-[#050816] min-h-screen">

<Sidebar/>

<div className="flex-1 p-8">

<Navbar/>

<div className="grid grid-cols-3 gap-6 mt-8">

<div className="col-span-2">

<div className="bg-[#101827] rounded-3xl p-8 border border-white/10">

<div className="flex justify-between">

<div>

<h1 className="text-3xl font-bold text-white">

Interview Session

</h1>

<p className="text-gray-400 mt-2">

Python Interview

</p>

</div>

<div className="bg-blue-600 px-5 py-3 rounded-xl text-white">

15:00

</div>

</div>

<div className="mt-8">

<div className="bg-[#1A2333] p-6 rounded-2xl">

<p className="text-gray-400">

Question 1 / 5

</p>

<h2 className="text-white text-xl mt-3">

Explain Python decorators and their use cases.

</h2>

</div>

<textarea

rows="10"

placeholder="Write answer here..."

className="w-full bg-[#1A2333] text-white rounded-2xl p-5 mt-6 outline-none"

/>

<div className="flex gap-4 mt-6">

<button className="bg-blue-600 px-6 py-3 rounded-xl text-white">

Submit Answer

</button>

<button className="bg-[#1A2333] px-6 py-3 rounded-xl text-white">

Next Question

</button>

</div>

</div>

</div>

</div>

<div>

<div className="bg-[#101827] rounded-3xl p-8 border border-white/10">

<h1 className="text-white text-2xl">

Progress

</h1>

<div className="mt-8">

<div className="w-full h-3 bg-[#1A2333] rounded-full">

<div className="bg-blue-600 h-3 w-[40%] rounded-full">

</div>

</div>

<p className="text-gray-400 mt-4">

2 / 5 Questions

</p>

</div>

</div>

<div className="bg-[#101827] rounded-3xl p-8 border border-white/10 mt-6">

<h1 className="text-white text-2xl">

AI Evaluation

</h1>

<div className="space-y-4 mt-6">

<div className="bg-[#1A2333] p-4 rounded-xl text-white">

Correctness : 85%

</div>

<div className="bg-[#1A2333] p-4 rounded-xl text-white">

Depth : Good

</div>

<div className="bg-[#1A2333] p-4 rounded-xl text-white">

Communication : Strong

</div>

</div>

</div>

</div>

</div>

</div>

</div>

)

}

export default Interview