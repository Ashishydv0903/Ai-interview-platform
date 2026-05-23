import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function Interview() {

return(

<div className="flex">

<Sidebar/>

<div className="flex-1 bg-gray-100 min-h-screen">

<Navbar/>

<div className="p-8">

<div className="bg-white p-8 rounded shadow">

<h1 className="text-2xl font-bold">

Interview Session

</h1>

<div className="mt-6">

<p className="font-semibold">

Question 1:

Explain Python decorators

</p>

<textarea
rows="8"
placeholder="Write answer here..."
className="w-full border mt-4 p-3 rounded"
/>

<button className="bg-green-600 text-white px-5 py-2 rounded mt-5">

Next Question

</button>

</div>

</div>

</div>

</div>

</div>

)

}

export default Interview