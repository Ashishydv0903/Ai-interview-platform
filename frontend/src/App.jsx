import { BrowserRouter, Routes, Route } from "react-router-dom";
import ResumeUpload from "./pages/ResumeUpload";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Interview from "./pages/Interview";
import Results from "./pages/Results";
function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route path="/" element={<Login />} />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />
        <Route
            path="/upload"
            element={<ResumeUpload/>}
           />

           <Route
                path="/interview"
                element={<Interview/>}
             />

             <Route
                path="/results"
                element={<Results/>}
             />

      </Routes>

    </BrowserRouter>
  );
}

export default App;