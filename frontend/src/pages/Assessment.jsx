import React, { useState, useMemo, useEffect } from "react";
import Layout from "../components/Layout";
import AssessmentModal from "../components/AssessmentModal";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import assessmentService from "../services/assessmentService";

const Assessment = () => {
  const [selectedTest, setSelectedTest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [latestScores, setLatestScores] = useState({});
  const [completedToday, setCompletedToday] = useState([]);
  const [graphData, setGraphData] = useState(null);
  const [hasCompletedFiveWeeks, setHasCompletedFiveWeeks] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [fiveWeeksData, setFiveWeeksData] = useState(null);

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

  // Use real graph data from database, fall back to empty array if not loaded
  const trendData = graphData || [];

  // Fetch assessments on mount
  useEffect(() => {
    loadAssessments();
    loadGraphData();
  }, []);

  const loadAssessments = async () => {
    setLoading(true);
    try {
      const response = await assessmentService.getAssessments();
      if (response.ok) {
        // Map API response to component format
        const mappedAssessments = response.assessments.map((assessment) => ({
          id: assessment._id,
          shortName: assessment.shortName,
          technicalName: assessment.name,
          description: assessment.description,
        }));
        setAssessments(mappedAssessments);
      }

      // Also fetch latest scores and check for today's submissions
      try {
        const scoresResponse = await assessmentService.getLatestScores();
        if (scoresResponse.ok) {
          setLatestScores(scoresResponse.latestScores);
        }

        // Fetch assessment history to check what was done today
        const historyResponse = await assessmentService.getUserHistory();
        if (historyResponse.ok && historyResponse.results) {
          // Get today's date (start and end of day in UTC)
          const now = new Date();
          const startOfDay = new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)
          );
          const endOfDay = new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999)
          );

          // Find assessments completed today
          const todayCompletions = historyResponse.results
            .filter((result) => {
              const createdAt = new Date(result.createdAt);
              return createdAt >= startOfDay && createdAt <= endOfDay;
            })
            .map((result) => result.assessmentName);

          setCompletedToday(todayCompletions);
        }
      } catch (err) {
        // Not authenticated, which is fine for public view
      }
    } catch (err) {
      console.error("Error loading assessments:", err);
      // Fallback: show default assessments if API fails
      setAssessments([
        {
          id: "gad7",
          shortName: "Anxiety Assessment",
          technicalName: "GAD-7",
          description: "A brief screening tool to identify and measure the severity of generalized anxiety disorder symptoms.",
        },
        {
          id: "phq9",
          shortName: "Depression Assessment",
          technicalName: "PHQ-9",
          description: "Used for screening, diagnosing, and monitoring the severity of depressive symptoms over the past two weeks.",
        },
        {
          id: "ghq12",
          shortName: "General Health Questionnaire",
          technicalName: "GHQ-12",
          description: "A self-assessment tool designed to detect psychological distress and early signs of mental health concerns.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = (testId) => {
    setSelectedTest(testId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTest(null);
    // Reload latest scores when modal closes
    loadAssessments();
    loadGraphData();
  };

  const handlePredictTrend = async () => {
    setPredicting(true);
    setPrediction(null); // Reset prediction before fetching
    try {
      if (!fiveWeeksData) {
        setPrediction('No data available for prediction');
        setPredicting(false);
        return;
      }

      const response = await fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fiveWeeksData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Flask response:', data); // Debug log
        // Handle different response formats from Flask
        const pred = (data.trend || data.prediction || data.result || data.class || data.predicted_class).toLowerCase();
        setPrediction(pred);
      } else {
        const errorData = await response.text();
        console.error('Flask error response:', errorData);
        setPrediction('Unable to generate prediction');
      }
    } catch (err) {
      console.error('Error predicting trend:', err);
      setPrediction('Error connecting to prediction service');
    } finally {
      setPredicting(false);
    }
  };

  /**
   * Fetch graph data from database
   * Transforms API response into trendData format for Recharts
   */
  const loadGraphData = async () => {
    try {
      const response = await assessmentService.getGraphTrends();
      if (response.ok && response.graphData) {
        const { weeks, anxiety, depression, wellbeing } = response.graphData;
        
        // Transform into trendData format for compatibility with existing graphs
        // Helper: compute connector series that fills only null slots to allow
        // a dotted grey line across skipped weeks while keeping the main line broken.
        const computeConnector = (arr) => {
          const n = arr.length;
          const out = new Array(n).fill(null);

          // Find indices of non-null values
          const known = [];
          for (let i = 0; i < n; i++) if (arr[i] !== null && arr[i] !== undefined) known.push(i);

          if (known.length === 0) return out; // nothing to connect

          for (let k = 0; k < known.length - 1; k++) {
            const i = known[k];
            const j = known[k + 1];
            const vi = arr[i];
            const vj = arr[j];
            // Fill values BETWEEN i and j (exclusive) with linear interpolation
            for (let t = i + 1; t < j; t++) {
              // only fill if arr[t] is null (skipped)
              if (arr[t] === null || arr[t] === undefined) {
                const ratio = (t - i) / (j - i);
                out[t] = vi + (vj - vi) * ratio;
              }
            }
          }

          // Edge cases: before first known and after last known — copy nearest known value
          const first = known[0];
          for (let t = 0; t < first; t++) if (arr[t] === null || arr[t] === undefined) out[t] = arr[first];
          const last = known[known.length - 1];
          for (let t = last + 1; t < n; t++) if (arr[t] === null || arr[t] === undefined) out[t] = arr[last];

          return out;
        };

        const anxietyConnector = computeConnector(anxiety);
        const depressionConnector = computeConnector(depression);
        const wellbeingConnector = computeConnector(wellbeing);

        const formattedData = weeks.map((week, index) => {
          // Extract week number from "Week X" format
          const weekNum = parseInt(week.split(' ')[1]);
          return {
            week: weekNum,
            anxiety: anxiety[index],
            depression: depression[index],
            wellbeing: wellbeing[index],
            // connector values are numeric only where the original value was missing
            anxietyConnector: anxietyConnector[index] === undefined ? null : anxietyConnector[index],
            depressionConnector: depressionConnector[index] === undefined ? null : depressionConnector[index],
            wellbeingConnector: wellbeingConnector[index] === undefined ? null : wellbeingConnector[index],
          };
        });
        
        setGraphData(formattedData);

        // Check if user has completed assessments for at least 5 weeks
        const weeksWithData = formattedData.filter(
          (week) => week.anxiety !== null || week.depression !== null || week.wellbeing !== null
        );
        setHasCompletedFiveWeeks(weeksWithData.length >= 5);

        // Extract last 5 weeks data for ML model
        if (weeksWithData.length >= 5) {
          const lastFiveWeeks = weeksWithData.slice(-5);
          const modelData = {
            gad_w1: lastFiveWeeks[0].anxiety,
            gad_w2: lastFiveWeeks[1].anxiety,
            gad_w3: lastFiveWeeks[2].anxiety,
            gad_w4: lastFiveWeeks[3].anxiety,
            gad_w5: lastFiveWeeks[4].anxiety,
            phq_w1: lastFiveWeeks[0].depression,
            phq_w2: lastFiveWeeks[1].depression,
            phq_w3: lastFiveWeeks[2].depression,
            phq_w4: lastFiveWeeks[3].depression,
            phq_w5: lastFiveWeeks[4].depression,
            ghq_w1: lastFiveWeeks[0].wellbeing,
            ghq_w2: lastFiveWeeks[1].wellbeing,
            ghq_w3: lastFiveWeeks[2].wellbeing,
            ghq_w4: lastFiveWeeks[3].wellbeing,
            ghq_w5: lastFiveWeeks[4].wellbeing,
          };
          setFiveWeeksData(modelData);
        }
      }
    } catch (err) {
      console.error("Error loading graph data:", err);
      // Keep default empty data if fetch fails
      setGraphData([]);
    }
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
            {assessments.map((assessment) => {
              // Check if this assessment was completed today
              const isCompletedToday = completedToday.includes(assessment.technicalName);
              
              return (
              <div
                key={assessment.id}
                className={`bg-white/90 border rounded-2xl shadow-sm transition-all p-8 flex flex-col ${
                  isCompletedToday
                    ? 'border-gray-300 opacity-75'
                    : 'border-gray-200 hover:shadow-lg hover:-translate-y-1'
                }`}
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

                {isCompletedToday && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-800 font-medium">
                      ✓ Completed today
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      Come back tomorrow to take this assessment again.
                    </p>
                  </div>
                )}

                <button
                  onClick={() => handleStartTest(assessment.id)}
                  disabled={isCompletedToday}
                  className={`w-full py-2 mt-5 rounded-lg text-sm font-medium transition ${
                    isCompletedToday
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isCompletedToday ? 'Already Completed Today' : 'Start Test'}
                </button>
              </div>
            );
            })}
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
                      {/* Connector dotted gray line across skipped weeks */}
                      <Line
                        type="monotone"
                        dataKey="anxietyConnector"
                        stroke="#9ca3af"
                        strokeWidth={2}
                        strokeDasharray="3 3"
                        dot={false}
                        connectNulls={true}
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
                      {/* Connector dotted gray line across skipped weeks */}
                      <Line
                        type="monotone"
                        dataKey="depressionConnector"
                        stroke="#9ca3af"
                        strokeWidth={2}
                        strokeDasharray="3 3"
                        dot={false}
                        connectNulls={true}
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
                      {/* Connector dotted gray line across skipped weeks */}
                      <Line
                        type="monotone"
                        dataKey="wellbeingConnector"
                        stroke="#9ca3af"
                        strokeWidth={2}
                        strokeDasharray="3 3"
                        dot={false}
                        connectNulls={true}
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
          {hasCompletedFiveWeeks && (
            <div className="space-y-2">
              <button
                onClick={handlePredictTrend}
                disabled={predicting}
                className="w-full mt-auto bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {predicting ? 'Analyzing Trends...' : 'Get Trend Prediction'}
              </button>

              {prediction && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    {prediction === 'improving' && (
                      <>
                        <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Improving</p>
                          <p className="text-sm text-gray-700 mt-1">Your mental health scores show a positive upward trend over the past 5 weeks, indicating improvement in overall wellbeing.</p>
                        </div>
                      </>
                    )}
                    {prediction === 'worsening' && (
                      <>
                        <TrendingDown className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Worsening</p>
                          <p className="text-sm text-gray-700 mt-1">Your mental health scores show a downward trend over the past 5 weeks. Consider reaching out to a mental health professional for support.</p>
                        </div>
                      </>
                    )}
                    {prediction === 'stable' && (
                      <>
                        <ArrowRight className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Stable</p>
                          <p className="text-sm text-gray-700 mt-1">Your mental health scores remain consistent over the past 5 weeks. Continue with your current wellness routine and monitor for any changes.</p>
                        </div>
                      </>
                    )}
                    {!['improving', 'worsening', 'stable'].includes(prediction) && (
                      <p className="text-sm font-semibold text-green-900">{prediction}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
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
