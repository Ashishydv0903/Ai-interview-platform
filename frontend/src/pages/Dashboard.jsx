import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function Dashboard() {

return(

<div className="flex">

<Sidebar/>

<div className="flex-1 bg-gray-100 min-h-screen">

<Navbar/>

<div className="p-8">

<div className="grid grid-cols-3 gap-5">

<div className="bg-white p-5 rounded shadow">

<h2>

Interviews Taken

</h2>

<p className="text-2xl font-bold">

10

</p>

</div>

<div className="bg-white p-5 rounded shadow">

<h2>

Average Score

</h2>

<p className="text-2xl font-bold">

85%

</p>

</div>

<div className="bg-white p-5 rounded shadow">

<h2>

Skills Evaluated

</h2>

<p className="text-2xl font-bold">

12

</p>

</div>

</div>

</div>

</div>

</div>

)

}

export default Dashboard