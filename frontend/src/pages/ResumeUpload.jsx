import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function ResumeUpload() {

return(

<div className="flex bg-[#050816] min-h-screen">

<Sidebar/>

<div className="flex-1 p-8">

<Navbar/>

<div className="grid grid-cols-3 gap-6 mt-8">

<div className="col-span-2">

<div className="bg-[#101827] rounded-3xl p-10 border border-white/10">

<h1 className="text-3xl font-bold text-white">

Upload Resume

</h1>

<p className="text-gray-400 mt-3">

Upload PDF to extract skills and generate interview questions

</p>

<div className="border-2 border-dashed border-blue-500 rounded-3xl mt-8 p-16 text-center">

<p className="text-white text-xl">

Drop Resume Here

</p>

<p className="text-gray-400 mt-2">

PDF only

</p>

<input
type="file"
className="mt-8 text-white"
/>

</div>

<button className="bg-blue-600 px-8 py-3 rounded-xl text-white mt-8">

Upload Resume

</button>

</div>

</div>

<div>

<div className="bg-[#101827] rounded-3xl p-8 border border-white/10">

<h1 className="text-white text-2xl">

Detected Skills

</h1>

<div className="space-y-4 mt-8">

<div className="bg-[#1A2333] p-4 rounded-xl text-white">

Python

</div>

<div className="bg-[#1A2333] p-4 rounded-xl text-white">

React

</div>

<div className="bg-[#1A2333] p-4 rounded-xl text-white">

MongoDB

</div>

</div>

</div>

</div>

</div>

</div>

</div>

)

}

export default ResumeUpload