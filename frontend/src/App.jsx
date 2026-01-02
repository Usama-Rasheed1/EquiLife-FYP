import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Signin from "./pages/Signin";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ForgotPasswordVerify from "./pages/ForgotPasswordVerify";
import LandingPage from "./pages/LandingPage";
import Aboutus from "./pages/Aboutus";
import Contactus from "./pages/Contactus";
import Dashboard from "./pages/Dashboard";
import Assessment from "./pages/Assessment";
import Fitness from "./pages/Fitness";
import FitnessCalculations from "./pages/FitnessCalculations";
import Nutrition from "./pages/Nutrition";
import Community from './pages/Community';
import GamificationSimplified from './pages/GamificationSimplified';
import Goals from './pages/Goals';
import GoalProgress from './pages/GoalProgress';
import GoalRedirect from './components/GoalRedirect';



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/forgot-password/verify-otp" element={<ForgotPasswordVerify />} />
        <Route path="/aboutus" element={<Aboutus />} />
        <Route path="/contactus" element={<Contactus />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/assessment" element={<Assessment />} />
        <Route path="/dashboard/fitness" element={<Fitness />} />
        <Route path="/fitness/calculations" element={<FitnessCalculations />} />
        <Route path="/dashboard/nutrition" element={<Nutrition />} />
        <Route path="/dashboard/community" element={<Community />} />
        <Route path="/dashboard/gamification" element={<GamificationSimplified />} />
        <Route path="/dashboard/goals" element={<Goals />} />
        {/* Redirect any goal detail page back to goals list */}
        <Route path="/dashboard/goals/:goalId" element={<GoalRedirect />} />
        <Route path="/goals/:goalId" element={<GoalRedirect />} />


      </Routes>
    </BrowserRouter>
  );
}

export default App;
