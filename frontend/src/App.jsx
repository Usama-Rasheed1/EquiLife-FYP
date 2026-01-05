import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

import AdminDashboard from './pages/AdminDashboard';
import Users from './pages/admin/Users';
import AssessmentsAdmin from './pages/admin/community-management';
import HighRiskMonitoring from './pages/admin/HighRiskMonitoring';
import ContentManagement from './pages/admin/ContentManagement';
import ContentAdminManagement from './pages/admin/ContentAdminManagement';


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
        <Route path="/admin/dashboard" element={<Navigate to="/admin/users" replace />} />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/community-abuse" element={<AssessmentsAdmin />} />
        <Route path="/admin/high-risk-monitoring" element={<HighRiskMonitoring />} />
        <Route path="/admin/content-management" element={<ContentManagement />} />
        <Route path="/admin/content-admin-management" element={<ContentAdminManagement />} />

        {/* Redirect any goal detail page back to goals list */}
        <Route path="/dashboard/goals/:goalId" element={<GoalRedirect />} />
        <Route path="/goals/:goalId" element={<GoalRedirect />} />


      </Routes>
    </BrowserRouter>
  );
}

export default App;
