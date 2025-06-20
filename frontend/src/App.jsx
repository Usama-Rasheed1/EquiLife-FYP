import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Signin from "./pages/Signin";
import Signup from "./pages/Signup";
import LandingPage from "./pages/LandingPage";
import Aboutus from "./pages/Aboutus";
import Contactus from "./pages/Contactus";
import Dashboard from "./pages/Dashboard";
import Community from './pages/Community';



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/aboutus" element={<Aboutus />} />
        <Route path="/contactus" element={<Contactus />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/community" element={<Community />} />


      </Routes>
    </BrowserRouter>
  );
}

export default App;
