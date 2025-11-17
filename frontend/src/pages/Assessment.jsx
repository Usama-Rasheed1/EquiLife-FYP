import React, { useState, useMemo } from "react";
import Layout from "../components/Layout";
import AssessmentModal from "../components/AssessmentModal";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";

const Assessment = () => {
  const [selectedTest, setSelectedTest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get current month and year
  const currentDate = new Date();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();
  
  // Calculate weeks in current month
  const getWeeksInMonth = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();
    
    // Calculate number of weeks
    const weeks = Math.ceil((daysInMonth + startDay) / 7);
    return weeks;
  };

  const weeksInMonth = getWeeksInMonth();

  // Generate sample trend data with visible trends (in a real app, this would come from backend)
  const trendData = useMemo(() => {
    const weeks = [];
    // Create realistic trend patterns with some missing data
    for (let i = 1; i <= weeksInMonth; i++) {
      // Anxiety: decreasing trend with one missing week
      const anxietyValue = i === 1 ? 9 : i === 2 ? null : i === 3 ? 7 : i === 4 ? 6 : weeksInMonth >= 5 && i === 5 ? 5 : null;
      
      // Depression:
      const depressionValue = i === 1 ? 12 : i === 2 ? 11 : i === 3 ? 6 : i === 4 ? 9 : weeksInMonth >= 5 && i === 5 ? 8 : null;
      
      // Wellbeing: improving trend with one missing week
      const wellbeingValue = i === 1 ? 10 : i === 2 ? null : i === 3 ? 13 : i === 4 ? 15 : weeksInMonth >= 5 && i === 5 ? 16 : null;
      
      weeks.push({
        week: i,
        anxiety: anxietyValue,
        depression: depressionValue,
        wellbeing: wellbeingValue,
        // For missing data visualization - interpolated values for dotted lines
        anxietyMissing: anxietyValue === null ? (i === 2 ? 8 : null) : null,
        depressionMissing: depressionValue === null ? (i === 3 ? 10 : null) : null,
        wellbeingMissing: wellbeingValue === null ? (i === 2 ? 11.5 : null) : null,
      });
    }
    return weeks;
  }, [weeksInMonth]);

  const assessments = [
    {
      id: "gad7",
      shortName: "Anxiety Assessment",
      technicalName: "GAD-7",
      description:
        "A brief screening tool to identify and measure the severity of generalized anxiety disorder symptoms.",
    },
    {
      id: "phq9",
      shortName: "Depression Assessment",
      technicalName: "PHQ-9",
      description:
        "Used for screening, diagnosing, and monitoring the severity of depressive symptoms over the past two weeks.",
    },
    {
      id: "ghq12",
      shortName: "General Health Questionnaire",
      technicalName: "GHQ-12",
      description:
        "A self-assessment tool designed to detect psychological distress and early signs of mental health concerns.",
    },
  ];

  const handleStartTest = (testId) => {
    setSelectedTest(testId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTest(null);
  };

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden bg-gray-50">
        
        {/* Left Section */}
        <div className="flex-1 p-6 overflow-y-auto scrollbar-hide">

          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Mental Health Assessments
          </h2>
          <p className="text-gray-600 mb-6 text-sm">
            Choose an assessment to begin evaluating your current mental wellbeing.
          </p>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            {assessments.map((assessment) => (
              <div
                key={assessment.id}
                className="bg-white/90 border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all p-8 flex flex-col"
              >
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {assessment.shortName}
                  </h3>

                  <span className="inline-block text-xs font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded-full mb-3">
                    {assessment.technicalName}
                  </span>

                  <p className="text-sm text-gray-600 leading-relaxed">
                    {assessment.description}
                  </p>
                </div>

                <button
                  onClick={() => handleStartTest(assessment.id)}
                  className="w-full py-2 mt-5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                >
                  Start Test
                </button>
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Before You Begin
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="text-blue-500 font-semibold">•</span>
                Answer according to how you’ve felt in the past two weeks.
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 font-semibold">•</span>
                Choose the option that best reflects your experience.
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 font-semibold">•</span>
                Take the test in a calm, distraction-free environment.
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 font-semibold">•</span>
                These assessments help identify patterns—not diagnose.
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 font-semibold">•</span>
                Be honest; this is a tool for your wellbeing.
              </li>
            </ul>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-full lg:w-1/4 bg-white border-l border-gray-200 p-5 flex flex-col gap-5">
          
          {/* Golden Rules */}
          <div className="bg-gray-50 rounded-2xl shadow-sm p-5 border border-gray-200">
            <h4 className="text-base font-semibold text-gray-900 mb-1">
              5 Golden Rules for Mental Health
            </h4>
            <ol className="text-sm text-gray-700 space-y-1">
              <li><strong className="text-blue-600 mr-1">1.</strong> Maintain consistent sleep habits.</li>
              <li><strong className="text-blue-600 mr-1">2.</strong> Engage in daily physical activity.</li>
              <li><strong className="text-blue-600 mr-1">3.</strong> Stay socially connected.</li>
              <li><strong className="text-blue-600 mr-1">4.</strong> Practice mindfulness and grounding.</li>
              <li><strong className="text-blue-600 mr-1">5.</strong> Seek help when needed — it’s strength.</li>
            </ol>
          </div>

          {/* Mental Health Trends */}
          <div className="bg-gray-50 rounded-2xl shadow-sm p-2 border border-gray-200">
            <h4 className="text-base font-semibold text-gray-900">
              Your Mental Health Trends
            </h4>
            <p className="text-xs text-gray-500 mb-3">
              {monthName} {year}
            </p>
            
            <div className="space-y-3">
              {/* Anxiety (GAD-7) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-gray-700">Anxiety (GAD-7)</span>
                </div>
                <div className="h-12">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const value = data.anxiety;
                            return (
                              <div className="bg-white border border-gray-200 rounded px-2 py-1 shadow-sm text-xs">
                                <p className="font-medium">Week {data.week}</p>
                                <p className="text-gray-600">
                                  {value !== null ? `Score: ${value}` : "No test taken"}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      {/* Missing data line (grey dotted) */}
                      <Line
                        type="monotone"
                        dataKey="anxietyMissing"
                        stroke="#9ca3af"
                        strokeWidth={2}
                        strokeDasharray="3 3"
                        dot={{ r: 3, fill: "transparent", stroke: "#9ca3af", strokeWidth: 2 }}
                        connectNulls={false}
                      />
                      {/* Data line (soft blue, smoothed) */}
                      <Line
                        type="monotone"
                        dataKey="anxiety"
                        stroke="#93c5fd"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "#93c5fd", strokeWidth: 0 }}
                        activeDot={{ r: 4, fill: "#93c5fd" }}
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Depression (PHQ-9) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-gray-700">Depression (PHQ-9)</span>
                </div>
                <div className="h-12">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const value = data.depression;
                            return (
                              <div className="bg-white border border-gray-200 rounded px-2 py-1 shadow-sm text-xs">
                                <p className="font-medium">Week {data.week}</p>
                                <p className="text-gray-600">
                                  {value !== null ? `Score: ${value}` : "No test taken"}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      {/* Missing data line (grey dotted) */}
                      <Line
                        type="monotone"
                        dataKey="depressionMissing"
                        stroke="#9ca3af"
                        strokeWidth={2}
                        strokeDasharray="3 3"
                        dot={{ r: 3, fill: "transparent", stroke: "#9ca3af", strokeWidth: 2 }}
                        connectNulls={false}
                      />
                      {/* Data line (soft purple, smoothed) */}
                      <Line
                        type="monotone"
                        dataKey="depression"
                        stroke="#c4b5fd"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "#c4b5fd", strokeWidth: 0 }}
                        activeDot={{ r: 4, fill: "#c4b5fd" }}
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Wellbeing (GHQ-12) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-gray-700">Wellbeing (GHQ-12)</span>
                </div>
                <div className="h-12">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const value = data.wellbeing;
                            return (
                              <div className="bg-white border border-gray-200 rounded px-2 py-1 shadow-sm text-xs">
                                <p className="font-medium">Week {data.week}</p>
                                <p className="text-gray-600">
                                  {value !== null ? `Score: ${value}` : "No test taken"}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      {/* Missing data line (grey dotted) */}
                      <Line
                        type="monotone"
                        dataKey="wellbeingMissing"
                        stroke="#9ca3af"
                        strokeWidth={2}
                        strokeDasharray="3 3"
                        dot={{ r: 3, fill: "transparent", stroke: "#9ca3af", strokeWidth: 2 }}
                        connectNulls={false}
                      />
                      {/* Data line (soft green/teal, smoothed) */}
                      <Line
                        type="monotone"
                        dataKey="wellbeing"
                        stroke="#5eead4"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "#5eead4", strokeWidth: 0 }}
                        activeDot={{ r: 4, fill: "#5eead4" }}
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Button */}
          <button
            onClick={() => alert("External help link coming soon.")}
            className="mt-auto bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Get Help
          </button>
        </div>
      </div>

      {/* Modal */}
      <AssessmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        testId={selectedTest}
      />
    </Layout>
  );
};

export default Assessment;
