import React, { useState, useEffect, useMemo } from "react";
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
import { useSelector, useDispatch } from 'react-redux';
import { setUserData } from '../store/userSlice';
import { getActivitySummary } from "../services/activitySummaryService";

const DashboardLayout = () => {
  const [userData, setUserDataLocal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mentalHealthData, setMentalHealthData] = useState({ score: 0, percentage: 0 });
  const [calorieData, setCalorieData] = useState({ balance: 0, percentage: 0, label: "No Data" });
  const storeUser = useSelector((s) => s.user || {});
  const dispatch = useDispatch();

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

        // If redux store has user data, prefer that and avoid an extra fetch
        let userResponseData = null;
        if (storeUser && (storeUser.weight || storeUser.fullName || storeUser.profilePhoto || storeUser.dob)) {
          userResponseData = { user: storeUser };
        } else {
          const res = await axios.get(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/auth/profile`, { headers: { Authorization: `Bearer ${token}` } });
          userResponseData = res.data;
          // populate redux for future reuse
          try { dispatch(setUserData({ fullName: userResponseData.user?.fullName, profilePhoto: userResponseData.user?.profilePhoto, weight: userResponseData.user?.weightKg, dob: userResponseData.user?.dob, age: userResponseData.user?.age })); } catch (e) {}
        }

        const assessmentResponse = await axios.get(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/assessments/user/history`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { results: [] } }));

        setUserDataLocal(userResponseData?.user || null);

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
        const token = localStorage.getItem('authToken');
        if (token) {
          const calorieResult = await calculateCalorieData(token);
          setCalorieData(calorieResult);
        }
      }
    };

    const handleFocus = async () => {
      const token = localStorage.getItem('authToken');
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
  // include storeUser so when redux updates (weight/dob/etc) we re-run effect to sync local user
  }, [storeUser]);

  // Get weight display value
  const getWeightValue = () => {
    const w = storeUser.weight ?? userData?.weightKg ?? userData?.weight;
    if (w) return `${w}kg`;
    return "N/A";
  };

  // Get calories/day display value
  const getCaloriesValue = () => {
    // prefer computed calorieData if available
    if (calorieData?.moderateActivity) return `${calorieData.moderateActivity}/day`;
    if (calorieData && calorieData.balance !== undefined) return `${calorieData.label === 'No Data' ? 'N/A' : (calorieData.balance === 0 ? '0' : (calorieData.balance > 0 ? `+${calorieData.balance}` : `${calorieData.balance}`))}`;

    // fallback: compute BMR from available fields
    const w = Number(storeUser.weight ?? userData?.weightKg ?? userData?.weight);
    const h = Number(storeUser.height ?? userData?.heightCm ?? userData?.height);
    const dobVal = storeUser.dob ?? userData?.dob;
    if (w && h && dobVal) {
      const birthDate = new Date(dobVal);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      const gender = storeUser.gender ?? userData?.gender ?? 'male';
      let bmr = 0;
      if (gender === 'male') bmr = 10 * w + 6.25 * h - 5 * age + 5;
      else bmr = 10 * w + 6.25 * h - 5 * age - 161;
      if (bmr) return `${Math.round(bmr * 1.55)}/day`;
    }
    return "N/A";
  };

  // compute BMI and BMR from available store/local user data
  const fitnessComputed = useMemo(() => {
    const w = Number(storeUser.weight ?? userData?.weightKg ?? userData?.weight);
    const hCm = Number(storeUser.height ?? userData?.heightCm ?? userData?.height);
    const dobVal = storeUser.dob ?? userData?.dob;
    const gender = (storeUser.gender ?? userData?.gender ?? 'male').toLowerCase();
    if (!w || !hCm) return { bmi: null, bmr: null };
    const h = hCm / 100;
    const bmi = Math.round((w / (h * h)) * 10) / 10;
    let age = null;
    if (dobVal) {
      const birthDate = new Date(dobVal);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    }
    const a = age ?? (storeUser.age ?? userData?.age ?? 30);
    let bmr = 0;
    if (gender === 'male') bmr = 10 * w + 6.25 * hCm - 5 * a + 5;
    else bmr = 10 * w + 6.25 * hCm - 5 * a - 161;
    return { bmi: Math.max(0, Math.round(bmi * 10) / 10), bmr: Math.round(bmr) };
  }, [storeUser, userData]);

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