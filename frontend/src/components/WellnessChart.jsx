import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { ChevronDown } from "lucide-react";
import axios from "axios";

const WellnessChart = () => {
  const [wellnessData, setWellnessData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Calculate wellness index: mentalScore * physicalFactor
  const calculateWellnessIndex = (mentalScore, bmi) => {
    const mental = mentalScore ?? 5; // Baseline: 5
    const physical = bmi ? Math.max(0.5, Math.min(1.5, 1 - Math.abs(bmi - 22) * 0.05)) : 1.0; // Baseline: 1.0
    return Math.round(mental * physical * 10) / 10;
  };

  const fetchWellnessData = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const [userResponse, assessmentResponse] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/assessments/user/history`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { results: [] } }))
      ]);

      const user = userResponse.data?.user;
      const assessments = assessmentResponse.data?.results || [];
      const userJoinDate = new Date(user?.createdAt);
      const currentWeek = new Date();
      
      // Use BMI from DB or calculate from height/weight
      const bmi = user?.bmi || (user?.heightCm && user?.weightKg ? user.weightKg / ((user.heightCm / 100) ** 2) : null);

      // Generate 5 weeks of data starting from user join date
      const weeks = [];
      for (let i = 0; i < 5; i++) {
        const weekStart = new Date(userJoinDate);
        weekStart.setDate(weekStart.getDate() + (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const isUpcoming = weekEnd < currentWeek ? false : weekStart > currentWeek;

        if (isUpcoming) {
          weeks.push({
            week: `Week ${i + 1}`,
            value: 0,
            isUpcoming: true,
            tooltip: "Coming week"
          });
        } else {
          const weekAssessments = assessments.filter(a => {
            const date = new Date(a.createdAt);
            return date >= weekStart && date <= weekEnd;
          });

          const mentalScore = calculateMentalHealthScore(weekAssessments);
          const wellnessIndex = calculateWellnessIndex(mentalScore, bmi);
          const hasAllAssessments = weekAssessments.some(a => a.assessmentName === 'GAD-7') &&
                                   weekAssessments.some(a => a.assessmentName === 'PHQ-9') &&
                                   weekAssessments.some(a => a.assessmentName === 'GHQ-12');
          const isBaseline = mentalScore === null || !bmi;

          weeks.push({
            week: `Week ${i + 1}`,
            value: wellnessIndex,
            isBaseline,
            tooltip: hasAllAssessments && bmi ? "Complete wellness data available" : 
                    isBaseline ? "This value is based on baseline data. Add assessments for more accurate insights." : null
          });
        }
      }

      setWellnessData(weeks);
    } catch (error) {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  };

  const calculateMentalHealthScore = (assessments) => {
    if (!assessments || assessments.length === 0) return null;
    
    const latest = assessments.reduce((acc, assessment) => {
      if (!acc[assessment.assessmentName] || new Date(assessment.createdAt) > new Date(acc[assessment.assessmentName].createdAt)) {
        acc[assessment.assessmentName] = assessment;
      }
      return acc;
    }, {});
    
    let totalScore = 0;
    let count = 0;
    
    if (latest['GAD-7']) {
      totalScore += Math.max(0, 10 - (latest['GAD-7'].totalScore / 21) * 10);
      count++;
    }
    if (latest['PHQ-9']) {
      totalScore += Math.max(0, 10 - (latest['PHQ-9'].totalScore / 27) * 10);
      count++;
    }
    if (latest['GHQ-12']) {
      totalScore += Math.max(0, 10 - (latest['GHQ-12'].totalScore / 36) * 10);
      count++;
    }
    
    return count > 0 ? Math.round((totalScore / count) * 10) / 10 : null;
  };

  useEffect(() => {
    fetchWellnessData();
  }, []);

  const CustomLabel = (props) => {
    const { x, y, width, value, payload } = props;
    if (payload?.isUpcoming) return null;
    return (
      <text
        x={x + width / 2}
        y={y - 5}
        fill="#374151"
        textAnchor="middle"
        fontSize="11"
        fontWeight="500"
      >
        {value}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload[0]?.payload?.tooltip) {
      return (
        <div className="bg-gray-800 text-white p-2 rounded text-xs max-w-48">
          {payload[0].payload.tooltip}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">EquiLife Wellness Index</h3>
          <ChevronDown size={20} className="text-gray-500" />
        </div>
        <div className="h-56 flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">EquiLife Wellness Index</h3>
        <ChevronDown size={20} className="text-gray-500" />
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={wellnessData} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
            <CartesianGrid stroke="#eef2f7" strokeDasharray="3 8" vertical={false} />
            <XAxis
              dataKey="week"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              padding={{ left: 12, right: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              domain={[0, 10]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="value"
              barSize={12}
              radius={[12, 12, 12, 12]}
              isAnimationActive={true}
              animationDuration={900}
              animationEasing="ease-out"
              label={<CustomLabel />}
            >
              {wellnessData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.isUpcoming ? "#e5e7eb" : entry.isBaseline ? "#9ca3af" : "#3b82f6"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WellnessChart;