import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { ChevronDown } from "lucide-react";
import axios from "axios";

const WellnessChart = () => {
  const [wellnessData, setWellnessData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Calculate wellness index: mentalScore * physicalFactor
  // Combine mental (0-10) and physical (0-10) into a wellness index (0-10)
  const calculateWellnessIndex = (mentalScore, physicalScore, weights = { mental: 0.6, physical: 0.4 }) => {
    const mental = mentalScore ?? 5; // Baseline: 5/10
    const physical = physicalScore ?? 5; // Baseline: 5/10
    const w = weights;
    const combined = mental * (w.mental) + physical * (w.physical);
    return Math.round(combined * 10) / 10; // keep one decimal
  };

  const fetchWellnessData = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        // not logged in: do not show demo bars; show empty placeholder
        setWellnessData([]);
        setLoading(false);
        return;
      }

      const [userResponse, graphResp] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/assessments/user/graph-trends`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { graphData: { weeks: [], anxiety: [], depression: [], wellbeing: [] } } }))
      ]);

      const user = userResponse.data?.user;
      const userEmail = (user?.email || '').toLowerCase();
      const demoEmail = 'usamara760@gmail.com';

      // For non-demo users show only the most recent bar (Week 1) computed from latest scores
      if (userEmail !== demoEmail) {
        const latestResp = await axios.get(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/assessments/user/latest-scores`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(()=>({ data: { latestScores: {} } }));

        const latest = latestResp.data?.latestScores || {};
        const mapped = {};
        if (latest.anxiety && typeof latest.anxiety.totalScore === 'number') mapped.gad = Math.max(0, 10 - (latest.anxiety.totalScore / 21) * 10);
        if (latest.depression && typeof latest.depression.totalScore === 'number') mapped.phq = Math.max(0, 10 - (latest.depression.totalScore / 27) * 10);
        if (latest.wellbeing && typeof latest.wellbeing.totalScore === 'number') mapped.ghq = Math.max(0, 10 - (latest.wellbeing.totalScore / 36) * 10);

        const keys = Object.keys(mapped);
        const mentalScore = keys.length ? Math.round((keys.reduce((s,k)=>s+mapped[k],0)/keys.length)*10)/10 : null;

        // Use BMI for physical component if available
        const bmi = user?.bmi || (user?.heightCm && user?.weightKg ? user.weightKg / ((user.heightCm / 100) ** 2) : null);
        const physicalScore = computePhysicalScore(bmi, null, null) || 5;
        const wellnessIndex = calculateWellnessIndex(mentalScore ?? 5, physicalScore ?? 5);

        const weeks = [];
        weeks.push({ week: 'Week 1', value: wellnessIndex, isBaseline: mentalScore === null || !bmi });
        for (let i = 2; i <= 5; i++) {
          weeks.push({ week: `Week ${i}`, value: 0, isUpcoming: true });
        }

        setWellnessData(weeks);
        setLoading(false);
        return;
      }

      const graphData = graphResp.data?.graphData || { weeks: [], anxiety: [], depression: [], wellbeing: [] };
  // fallback to 4 weeks ago if user or createdAt missing
  const userJoinDate = user?.createdAt ? new Date(user.createdAt) : new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
      const currentWeek = new Date();
      
      // Use BMI from DB or calculate from height/weight
      const bmi = user?.bmi || (user?.heightCm && user?.weightKg ? user.weightKg / ((user.heightCm / 100) ** 2) : null);

      // Use backend-provided graphData (fixed 5-week window). Falls back to empty arrays when missing.
      const weeks = [];
      const labels = graphData.weeks || [];
      const anxiety = graphData.anxiety || []; // GAD-7
      const depression = graphData.depression || []; // PHQ-9
      const wellbeing = graphData.wellbeing || []; // GHQ-12

      // Ensure at least 5 weeks shown (backend already provides 5-week window)
      const displayCount = Math.max(5, labels.length || 5);
      for (let idx = 0; idx < displayCount; idx++) {
        const label = labels[idx] || `Week ${idx + 1}`;
        const gad = typeof anxiety[idx] === 'number' ? anxiety[idx] : null;
        const phq = typeof depression[idx] === 'number' ? depression[idx] : null;
        const ghq = typeof wellbeing[idx] === 'number' ? wellbeing[idx] : null;

        // Map raw assessment scores to 0-10 wellness contributions (higher is better)
        const mapped = {};
        if (gad !== null) mapped.gad = Math.max(0, 10 - (gad / 21) * 10);
        if (phq !== null) mapped.phq = Math.max(0, 10 - (phq / 27) * 10);
        if (ghq !== null) mapped.ghq = Math.max(0, 10 - (ghq / 36) * 10);

        // Compute mental score by averaging available mapped scores (equal weights)
        const keys = Object.keys(mapped);
        const mentalScore = keys.length ? Math.round((keys.reduce((s,k)=>s+mapped[k],0)/keys.length)*10)/10 : null;

        // Compute physical score from BMI only (fallback) so chart shows values when weekly nutrition/activity missing
        const physicalScore = computePhysicalScore(bmi, null, null) || 5;

        const wellnessIndex = calculateWellnessIndex(mentalScore ?? 5, physicalScore ?? 5);

        weeks.push({ week: label, value: wellnessIndex, isBaseline: mentalScore === null || !bmi });
      }

      setWellnessData(weeks);
    } catch (error) {
  console.error('fetchWellnessData error', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate a weighted mental health score (0-10). weights: { gad, phq, ghq }
  function calculateMentalHealthScore(assessments, weights = { gad: 0.33, phq: 0.33, ghq: 0.34 }) {
    if (!assessments || assessments.length === 0) return null;

    const latest = assessments.reduce((acc, assessment) => {
      if (!acc[assessment.assessmentName] || new Date(assessment.createdAt) > new Date(acc[assessment.assessmentName].createdAt)) {
        acc[assessment.assessmentName] = assessment;
      }
      return acc;
    }, {});

    // Map each assessment to a 0-10 'wellness' contribution (higher is better)
    const mapped = {};
    if (latest['GAD-7']) mapped.gad = Math.max(0, 10 - (latest['GAD-7'].totalScore / 21) * 10);
    if (latest['PHQ-9']) mapped.phq = Math.max(0, 10 - (latest['PHQ-9'].totalScore / 27) * 10);
    if (latest['GHQ-12']) mapped.ghq = Math.max(0, 10 - (latest['GHQ-12'].totalScore / 36) * 10);

    // Only include weights for the available assessments and normalize weights
    const availableKeys = Object.keys(mapped);
    if (!availableKeys.length) return null;

    const rawWeightSum = availableKeys.reduce((s, k) => s + (weights[k] || 0), 0);
    const normalizedWeights = availableKeys.reduce((acc, k) => {
      acc[k] = (weights[k] || 0) / (rawWeightSum || availableKeys.length);
      return acc;
    }, {});

    let combined = 0;
    availableKeys.forEach(k => {
      combined += mapped[k] * normalizedWeights[k];
    });

    return Math.round(combined * 10) / 10;
  }

  // Compute a physical score (0-10) from BMI, avg calories burned/day and avg protein/day
  function computePhysicalScore(bmi, avgCaloriesBurnedPerDay, avgProteinPerDay) {
    const parts = {};
    if (bmi) {
      // Best BMI around 22 -> score 10. Penalize by 0.5 points per BMI unit away
      parts.bmi = Math.max(0, 10 - Math.abs(bmi - 22) * 0.5);
    }
    if (avgCaloriesBurnedPerDay !== null && avgCaloriesBurnedPerDay !== undefined) {
      // map 0..600+ -> 0..10
      parts.activity = Math.min(10, avgCaloriesBurnedPerDay / 60);
    }
    if (avgProteinPerDay !== null && avgProteinPerDay !== undefined) {
      // target ~80g protein -> 10
      parts.protein = Math.min(10, (avgProteinPerDay / 80) * 10);
    }

    const keys = Object.keys(parts);
    if (!keys.length) return null;

    // default component weights
    const compWeights = { bmi: 0.5, activity: 0.3, protein: 0.2 };
    const rawSum = keys.reduce((s, k) => s + (compWeights[k] || 0), 0);
    const normalized = keys.reduce((acc, k) => {
      acc[k] = (compWeights[k] || 0) / rawSum;
      return acc;
    }, {});

    let score = 0;
    keys.forEach(k => { score += parts[k] * normalized[k]; });
    return Math.round(score * 10) / 10;
  }

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