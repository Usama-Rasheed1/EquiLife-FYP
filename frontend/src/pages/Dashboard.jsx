import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import SummaryCard from "../components/SummaryCard";
import ActivitiesChart from "../components/ActivitiesChart";
import ActionCard from "../components/ActionCard";
import CommunitySection from "../components/CommunitySection";
import GamificationTable from "../components/GamificationTable";
import ActivitySummary from "../components/ProgressChart";
import GoalsList from "../components/GoalsList";
import { BarChart3, Scale, Flame } from "lucide-react";
import axios from "axios";
import { getActivitySummary } from "../services/activitySummaryService";

const DashboardLayout = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mentalHealthData, setMentalHealthData] = useState({ score: 0, percentage: 0 });
  const [calorieData, setCalorieData] = useState({ balance: 0, percentage: 0, label: "No Data" });

  // Calculate calorie balance using ActivitySummary service
  const calculateCalorieData = async (token) => {
    try {
      const [nutritionResponse, activitySummary] = await Promise.all([
        axios.get(
          `${import.meta.env.VITE_BACKEND_BASE_URL}/api/meals/daily?date=${new Date().toISOString().slice(0, 10)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ).catch(() => ({ data: { meals: {} } })),
        getActivitySummary()
      ]);
      
      const todayMeals = nutritionResponse.data?.meals || {};
      const totalIntake = Object.values(todayMeals).flat().reduce((sum, meal) => {
        return sum + ((meal.calories || 0) * (meal.quantity || 1));
      }, 0);
      
      const totalBurned = activitySummary.caloriesBurned || 0;
      const balance = Math.ceil(totalIntake - totalBurned);
      const percentage = totalIntake > 0 ? Math.round(Math.abs(balance / totalIntake) * 100) : (totalBurned > 0 ? 100 : 0);
      const label = balance === 0 ? "Balanced" : balance > 0 ? "Calorie Surplus" : "Calorie Deficit";
      
      return { balance, percentage, label };
    } catch (error) {
      return { balance: 0, percentage: 0, label: "No Data" };
    }
  };

  // Calculate mental health score out of 10
  const calculateMentalHealthScore = (assessments) => {
    if (!assessments || assessments.length === 0) return 5; // Default neutral score
    
    // Get latest assessment of each type
    const latest = assessments.reduce((acc, assessment) => {
      if (!acc[assessment.assessmentName] || new Date(assessment.createdAt) > new Date(acc[assessment.assessmentName].createdAt)) {
        acc[assessment.assessmentName] = assessment;
      }
      return acc;
    }, {});
    
    let totalScore = 0;
    let count = 0;
    
    // Convert each assessment to 0-10 scale (lower is better for mental health)
    if (latest['GAD-7']) {
      // GAD-7: 0-21 scale, invert to 0-10 (0=worst, 10=best)
      totalScore += Math.max(0, 10 - (latest['GAD-7'].totalScore / 21) * 10);
      count++;
    }
    if (latest['PHQ-9']) {
      // PHQ-9: 0-27 scale, invert to 0-10
      totalScore += Math.max(0, 10 - (latest['PHQ-9'].totalScore / 27) * 10);
      count++;
    }
    if (latest['GHQ-12']) {
      // GHQ-12: 0-36 scale, invert to 0-10
      totalScore += Math.max(0, 10 - (latest['GHQ-12'].totalScore / 36) * 10);
      count++;
    }
    
    return count > 0 ? Math.round((totalScore / count) * 10) / 10 : 5;
  };
  
  // Calculate percentage change from last week
  const calculateWeeklyChange = (assessments) => {
    if (!assessments || assessments.length < 2) return 0;
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const thisWeek = assessments.filter(a => new Date(a.createdAt) >= oneWeekAgo);
    const lastWeek = assessments.filter(a => {
      const date = new Date(a.createdAt);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      return date >= twoWeeksAgo && date < oneWeekAgo;
    });
    
    if (thisWeek.length === 0 || lastWeek.length === 0) return 0;
    
    const thisWeekScore = calculateMentalHealthScore(thisWeek);
    const lastWeekScore = calculateMentalHealthScore(lastWeek);
    
    if (lastWeekScore === 0) return 0;
    return Math.round(((thisWeekScore - lastWeekScore) / lastWeekScore) * 100);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          setLoading(false);
          return;
        }

        const [userResponse, assessmentResponse] = await Promise.all([
          axios.get(
            `${import.meta.env.VITE_BACKEND_BASE_URL}/api/auth/profile`,
            { headers: { Authorization: `Bearer ${token}` } }
          ),
          axios.get(
            `${import.meta.env.VITE_BACKEND_BASE_URL}/api/assessments/user/history`,
            { headers: { Authorization: `Bearer ${token}` } }
          ).catch(() => ({ data: { results: [] } }))
        ]);

        setUserData(userResponse.data?.user);
        
        const assessments = assessmentResponse.data?.results || [];
        const score = calculateMentalHealthScore(assessments);
        const percentage = calculateWeeklyChange(assessments);
        setMentalHealthData({ score, percentage });
        
        // Calculate calorie data after user data is set
        const calorieResult = await calculateCalorieData(token);
        setCalorieData(calorieResult);
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    
    // Refresh calorie data when page becomes visible
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        const token = localStorage.getItem("authToken");
        if (token) {
          const calorieResult = await calculateCalorieData(token);
          setCalorieData(calorieResult);
        }
      }
    };
    
    const handleFocus = async () => {
      const token = localStorage.getItem("authToken");
      if (token) {
        const calorieResult = await calculateCalorieData(token);
        setCalorieData(calorieResult);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Get weight display value
  const getWeightValue = () => {
    if (userData?.weightKg) {
      return `${userData.weightKg}kg`;
    }
    return "N/A";
  };

  // Get calories/day display value
  const getCaloriesValue = () => {
    if (userData?.dailyCalories?.moderateActivity) {
      return `${userData.dailyCalories.moderateActivity}/day`;
    } else if (userData?.bmr) {
      // Fallback to BMR * 1.55 (moderate activity) if dailyCalories not set
      return `${Math.round(userData.bmr * 1.55)}/day`;
    }
    return "N/A";
  };

  return (
    <Layout>
      <div className="p-6 bg-gray-50 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Main Content (3/4 width) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Top Row Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SummaryCard
                title="Emotional well-being"
                value={`${mentalHealthData.score}/10`}
                percentage={mentalHealthData.percentage}
                icon={BarChart3}
              />
              <SummaryCard
                title="Weight"
                value={getWeightValue()}
                percentage={30}
                icon={Scale}
              />
              <SummaryCard
                title="Calories"
                value={calorieData.balance === 0 ? "0" : calorieData.balance >= 0 ? `+${calorieData.balance}` : `${calorieData.balance}`}
                percentage={calorieData.balance === 0 ? 0 : calorieData.balance >= 0 ? calorieData.percentage : -calorieData.percentage}
                customLabel={calorieData.label}
                icon={Flame}
              />
            </div>

            {/* Activities Chart */}
            <ActivitiesChart />

            {/* Action Cards row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ActionCard
                navigateTo="/dashboard/assessment"
                title="Assessment"
                action="Take Assessment"
                imageSrc="/mentalD.png"
              />
              <ActionCard
                navigateTo="/dashboard/fitness"
                title="Fitness"
                action="Add Workout"
                imageSrc="/fitnessD.jpg"
              />
              <ActionCard
                navigateTo="/dashboard/nutrition"
                title="Nutrition"
                action="Add Calories"
                imageSrc="/nutritionD.png"
              />
            </div>

            {/* Community + Gamification row */}
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
              <div className="lg:col-span-3">
                <CommunitySection />
              </div>
              <div className="lg:col-span-3">
                <GamificationTable />
              </div>
            </div>
          </div>

          {/* Right Column - Progress and Goals (1/4 width) */}
          <div className="lg:col-span-1 space-y-6">
            <ActivitySummary />
            <GoalsList />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardLayout;