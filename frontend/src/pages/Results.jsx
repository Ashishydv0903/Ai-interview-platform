import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import {

BarChart,
Bar,
XAxis,
YAxis,
Tooltip,
PieChart,
Pie,
Cell

} from "recharts";

const skillData=[

{
skill:"Python",
score:90
},

{
skill:"React",
score:85
},

{
skill:"MongoDB",
score:70
},

{
skill:"Docker",
score:40
}

]

const pieData=[

{
name:"Strong",
value:70
},

{
name:"Weak",
value:30
}

]

const COLORS=["#2563EB","#1A2333"]

function Results(){

return(

<div className="flex bg-[#050816] min-h-screen">

<Sidebar/>

<div className="flex-1 p-8">

<Navbar/>

<div className="grid grid-cols-3 gap-6 mt-8">

<div className="bg-[#101827] rounded-3xl p-8 border border-white/10">

<p className="text-gray-400">

Overall Score

</p>

<h1 className="text-white text-5xl font-bold mt-4">

85%

</h1>

</div>

<div className="bg-[#101827] rounded-3xl p-8 border border-white/10">

<p className="text-gray-400">

Interview Rank

</p>

<h1 className="text-white text-5xl font-bold mt-4">

A+

</h1>

</div>

<div className="bg-[#101827] rounded-3xl p-8 border border-white/10">

<p className="text-gray-400">

Performance Tier

</p>

<h1 className="text-white text-5xl font-bold mt-4">

Level 2

</h1>

</div>

</div>

<div className="grid grid-cols-2 gap-6 mt-8">

<div className="bg-[#101827] rounded-3xl p-8 border border-white/10">

<h1 className="text-white text-2xl">

Skill Analysis

</h1>

<BarChart

width={500}

height={300}

data={skillData}

>

<XAxis dataKey="skill"/>

<YAxis/>

<Tooltip/>

<Bar dataKey="score" fill="#2563EB"/>

</BarChart>

</div>

<div className="bg-[#101827] rounded-3xl p-8 border border-white/10">

<h1 className="text-white text-2xl">

Strength Ratio

</h1>

<PieChart width={300} height={300}>

<Pie

data={pieData}

cx={150}

cy={150}

outerRadius={100}

dataKey="value"

>

{

pieData.map(

(entry,index)=>(

<Cell

key={index}

fill={COLORS[index]}

/>

)

)

}

</Pie>

</PieChart>

</div>

</div>

<div className="bg-[#101827] rounded-3xl p-8 border border-white/10 mt-8">

<h1 className="text-white text-2xl">

AI Recommendations

</h1>

<div className="space-y-4 mt-6">

<div className="bg-[#1A2333] p-5 rounded-xl text-white">

Improve Docker concepts

</div>

<div className="bg-[#1A2333] p-5 rounded-xl text-white">

Practice System Design

</div>

<div className="bg-[#1A2333] p-5 rounded-xl text-white">

Strengthen deployment skills

</div>

</div>

</div>

</div>

</div>

)

}

export default Results