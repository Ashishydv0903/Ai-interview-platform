import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import {

BarChart,
Bar,
XAxis,
YAxis,
Tooltip

} from "recharts";

const data=[

{
skill:"Python",
score:90
},

{
skill:"React",
score:80
},

{
skill:"Docker",
score:40
}

]

function Results(){

return(

<div className="flex">

<Sidebar/>

<div className="flex-1 bg-gray-100 min-h-screen">

<Navbar/>

<div className="p-8">

<div className="bg-white p-8 rounded shadow">

<h1 className="text-2xl font-bold">

Interview Results

</h1>

<p className="mt-4">

Overall Score:

85%

</p>

<BarChart
width={500}
height={300}
data={data}
>

<XAxis dataKey="skill"/>

<YAxis/>

<Tooltip/>

<Bar dataKey="score"/>

</BarChart>

</div>

</div>

</div>

</div>

)

}

export default Results