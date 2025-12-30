import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import SummaryCard from "../components/SummaryCard";
import ActivitiesChart from "../components/ActivitiesChart";
import ActionCard from "../components/ActionCard";
import CommunitySection from "../components/CommunitySection";
import GamificationTable from "../components/GamificationTable";
import ProgressChart from "../components/ProgressChart";
import GoalsList from "../components/GoalsList";
import { BarChart3, Scale, Flame } from "lucide-react";
import axios from "axios";

const DashboardLayout = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_BASE_URL}/api/auth/profile`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setUserData(response.data?.user);
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
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
                title="Assessment"
                value="8/10"
                percentage={30}
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
                value={getCaloriesValue()}
                percentage={30}
                icon={Flame}
              />
            </div>

            {/* Activities Chart */}
            <ActivitiesChart />

            {/* Action Cards row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ActionCard
                title="Assessment"
                action="Take Assessment"
                imageSrc="/core1.png"
              />
              <ActionCard
                title="Fitness"
                action="Add Workout"
                imageSrc="/core2.png"
              />
              <ActionCard
                title="Nutrition"
                action="Add Calories"
                imageSrc="/core3.png"
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
            <ProgressChart />
            <GoalsList />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardLayout;
