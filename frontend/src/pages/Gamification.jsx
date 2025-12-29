import React, { useState, useEffect } from "react";
import axios from 'axios';
import Layout from "../components/Layout";
import AppModal from "../components/AppModal";
import { Trophy, X, CheckCircle2, Clock, ChevronLeft } from "lucide-react";

// Challenge definitions
const AVAILABLE_CHALLENGES = [
  // Physical Challenges
  {
    id: 1,
    title: "Extra Workout Day",
    description: "Add an additional workout session to your weekly routine",
    xp: 50,
    type: "physical",
    totalDays: 1,
  },
  {
    id: 2,
    title: "10K Steps Daily",
    description: "Walk 10,000 steps every day for a week",
    xp: 100,
    type: "physical",
    totalDays: 7,
  },
  {
    id: 3,
    title: "7-Day Stretch Routine",
    description: "Complete a stretching routine for 7 consecutive days",
    xp: 75,
    type: "physical",
    totalDays: 7,
  },
  {
    id: 4,
    title: "No Sugar Day",
    description: "Avoid all added sugars for one full day",
    xp: 40,
    type: "physical",
    totalDays: 1,
  },
  {
    id: 5,
    title: "Hydration Streak",
    description: "Drink 8 glasses of water daily for 5 days",
    xp: 60,
    type: "physical",
    totalDays: 5,
  },
  // Mental Well-Being Challenges
  {
    id: 6,
    title: "Meditation Streak",
    description: "Meditate for 10 minutes daily for 7 days",
    xp: 80,
    type: "mental",
    totalDays: 7,
  },
  {
    id: 7,
    title: "Gratitude Journaling",
    description: "Write three things you're grateful for daily for 5 days",
    xp: 55,
    type: "mental",
    totalDays: 5,
  },
  {
    id: 8,
    title: "No Social Media Before Bed",
    description: "Avoid social media 2 hours before bedtime for 7 days",
    xp: 70,
    type: "mental",
    totalDays: 7,
  },
  {
    id: 9,
    title: "Deep Breathing Practice",
    description: "Practice deep breathing exercises for 5 minutes daily for 5 days",
    xp: 50,
    type: "mental",
    totalDays: 5,
  },
  {
    id: 10,
    title: "Digital Detox Hour",
    description: "Spend one hour without any digital devices daily for 3 days",
    xp: 45,
    type: "mental",
    totalDays: 3,
  },
];

// Leaderboard data (static for now)
const LEADERBOARD_DATA = [
  { id: 1, name: "Usama Rasheed", xp: 289, avatar: "/user.jpg" },
  { id: 2, name: "Muhammad Tayyab", xp: 276, avatar: "/user.jpg" },
  { id: 3, name: "Muhammad Rehman", xp: 249, avatar: "/user.jpg" },
  { id: 4, name: "UbaidUllah", xp: 235, avatar: "/user.jpg" },
  { id: 5, name: "Tauqir Hayat", xp: 220, avatar: "/user.jpg" },
  { id: 6, name: "Fatima UMT", xp: 198, avatar: "/user.jpg" },
  { id: 7, name: "Azeem Sheera", xp: 185, avatar: "/user.jpg" },
  { id: 8, name: "Ali Ahmed", xp: 172, avatar: "/user.jpg" },
  { id: 9, name: "Ukasha Sagar", xp: 160, avatar: "/user.jpg" },
  { id: 10, name: "Tayyab Shehzad", xp: 145, avatar: "/user.jpg" },
];

const Gamification = () => {
  const [view, setView] = useState("available"); // "available" or "my-challenges"
  const [myChallenges, setMyChallenges] = useState([]);
  const [userXP, setUserXP] = useState(0);
  const [availableChallengesState, setAvailableChallengesState] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [completedChallenges, setCompletedChallenges] = useState([]); // Track completed challenges to prevent XP farming
  const backendUrl = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:5001';

  // Load data from localStorage on mount
  useEffect(() => {
    const savedChallenges = localStorage.getItem("myChallenges");
    const savedXP = localStorage.getItem("userXP");
    const savedCompleted = localStorage.getItem("completedChallenges");

    if (savedChallenges) setMyChallenges(JSON.parse(savedChallenges));
    if (savedXP) setUserXP(parseInt(savedXP, 10));
    if (savedCompleted) setCompletedChallenges(JSON.parse(savedCompleted));

    // fetch backend challenges and profile if possible
    (async () => {
      const token = localStorage.getItem('authToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      try {
        const res = await axios.get(`${backendUrl}/api/gamification/challenges`, { headers });
        if (res?.data?.ok && Array.isArray(res.data.challenges)) {
          // normalize backend challenge shape into frontend-friendly structure
          const mapped = res.data.challenges.map(c => ({
            id: c.id || c._id,
            _id: c._id,
            title: c.title,
            description: c.description,
            xp: c.xp_points || c.points || 0, // Support new xp_points and legacy points
            type: c.badgeName || c.type || 'custom', // badgeName is the new field (physical/mental)
            totalDays: c.totalDays || (c.type === 'daily' ? 1 : (c.type === 'weekly' ? 7 : 1)),
            cooldownHours: c.cooldownHours || 24,
            isActive: c.status === 'active' // Map status to isActive for frontend compatibility
          }));
          setAvailableChallengesState(mapped);
        }
      } catch (err) {
        // ignore - keep local AVAILABLE_CHALLENGES
      }

      try {
        const res2 = await axios.get(`${backendUrl}/api/gamification/profile`, { headers });
        if (res2?.data?.ok && res2.data.profile) {
          // Use userXP from response (source of truth from User model), fallback to profile.totalPoints
          const xp = res2.data.userXP !== undefined ? res2.data.userXP : (res2.data.profile.totalPoints || 0);
          setUserXP(xp);
          // set completed challenges from profile
          const completed = (res2.data.profile.completedChallenges || []).map(cc => ({ id: cc.challengeId, completedAt: cc.completedAt }));
          setCompletedChallenges(completed);
          // set active challenges from profile (map challengeId -> minimal challenge object)
          const actives = (res2.data.profile.activeChallenges || []).map(ac => ({ id: ac.challengeId, startDate: ac.startedAt, status: 'in-progress', currentProgress: 0, totalDays: 1 }));
          setMyChallenges(actives);
        }
      } catch (err) {
        // ignore - offline mode
        console.error('Failed to load gamification profile:', err);
      }
    })();
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem("myChallenges", JSON.stringify(myChallenges));
  }, [myChallenges]);

  useEffect(() => {
    localStorage.setItem("userXP", userXP.toString());
  }, [userXP]);

  useEffect(() => {
    localStorage.setItem("completedChallenges", JSON.stringify(completedChallenges));
  }, [completedChallenges]);

  // Show toast message
  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Check if challenge was previously completed (XP exploit prevention)
  const isChallengeCompleted = (challengeId) => {
    return completedChallenges.some((c) => c.id === challengeId && c.completedAt);
  };

  // Start a challenge
  const handleStartChallenge = async (challengeId) => {
    // optimistic guard
    if (myChallenges.some((c) => c.id === challengeId)) {
      showToast("You already started this challenge");
      return;
    }
    if (isChallengeCompleted(challengeId)) {
      showToast("You have already completed this challenge");
      return;
    }

    // Find challenge (either from backend or local)
    const backendChallenge = availableChallengesState.find(c => (c._id || c.id) == challengeId);
    const localChallenge = AVAILABLE_CHALLENGES.find((c) => c.id === challengeId);
    const challenge = backendChallenge || localChallenge;
    
    if (!challenge) return;
    
    const token = localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    // Always try to start challenge on backend (accepts challenge metadata)
    let payload;
    if (backendChallenge && backendChallenge._id) {
      // Backend challenge exists - send its _id
      payload = backendChallenge._id;
    } else {
      // Local challenge - send challenge metadata
                payload = {
                  id: challenge.id,
                  _id: challenge.id, // Use frontend id as _id for local challenges
                  title: challenge.title,
                  description: challenge.description,
                  xp: challenge.xp,
                  xp_points: challenge.xp, // Backend uses 'xp_points' field
                  points: challenge.xp, // Legacy support
                  badgeName: challenge.type || 'physical', // Map type to badgeName (physical/mental)
                  type: challenge.type || 'custom', // Keep for compatibility
                  totalDays: challenge.totalDays,
                  cooldownHours: 24 // Default cooldown
                };
    }

    try {
      const res = await axios.post(`${backendUrl}/api/gamification/challenge/start`, { challengeId: payload }, { headers });
      if (res?.data?.ok && res.data.profile) {
        // reflect server state
        const challengeIdToUse = backendChallenge?._id || challenge.id;
        setMyChallenges(prev => [...prev, { 
          id: challengeIdToUse, 
          title: challenge.title, 
          currentProgress: 0, 
          startDate: new Date().toISOString(), 
          lastUpdateDate: null, 
          status: 'in-progress', 
          totalDays: challenge.totalDays,
          xp: challenge.xp
        }]);
        setShowSuccessModal(true);
        return;
      }
    } catch (err) {
      console.error('start challenge error', err?.response?.data || err.message);
      showToast('Failed to start challenge (server) - using offline mode');
    }

    // fallback to local-only start (offline)
    const newChallenge = { ...challenge, currentProgress: 0, startDate: new Date().toISOString(), lastUpdateDate: null, status: 'in-progress' };
    setMyChallenges([...myChallenges, newChallenge]);
    setShowSuccessModal(true);
  };

  // Handle modal navigation
  const handleGoToMyChallenges = () => {
    setShowSuccessModal(false);
    setView("my-challenges");
  };

  const handleAddMoreChallenges = () => {
    setShowSuccessModal(false);
    // Stay on available challenges view
  };

  // Update challenge progress
  const handleUpdateProgress = (challengeId) => {
    const challenge = myChallenges.find((c) => c.id === challengeId);
    if (!challenge) return;

    const today = new Date().toISOString().split("T")[0];
    const lastUpdate = challenge.lastUpdateDate
      ? new Date(challenge.lastUpdateDate).toISOString().split("T")[0]
      : null;

    // Check if already updated today
    if (lastUpdate === today) {
      alert("You can update this challenge again tomorrow");
      return;
    }

    const updatedChallenges = myChallenges.map((c) => {
      if (c.id === challengeId) {
        const newProgress = c.currentProgress + 1;
        const isCompleted = newProgress >= c.totalDays;
        
        // Award XP only once when completed (prevent XP farming)
  if (isCompleted && c.status !== "completed") {
          // Check if this challenge was already completed before (XP exploit prevention)
          const wasPreviouslyCompleted = completedChallenges.some(
            (comp) => comp.id === challengeId
          );
          
          if (!wasPreviouslyCompleted) {
            // Always attempt server-side completion (backend accepts challenge metadata)
            (async () => {
              const token = localStorage.getItem('authToken');
              const headers = token ? { Authorization: `Bearer ${token}` } : {};
              
              // Check if there's a backend challenge
              const backendChallenge = availableChallengesState.find(ac => ac.id === c.id || ac._id === c.id);
              
              // Prepare payload: use backend _id if available, otherwise send challenge metadata
              let payload;
              if (backendChallenge && backendChallenge._id) {
                // Backend challenge exists - send its _id
                payload = backendChallenge._id;
              } else {
                // Local challenge - send challenge metadata with xp, id, etc.
                payload = {
                  id: c.id,
                  _id: c.id, // Use frontend id as _id for local challenges
                  title: c.title,
                  description: c.description,
                  xp: c.xp,
                  points: c.xp, // Backend uses 'points' field
                  type: c.type || 'custom',
                  totalDays: c.totalDays,
                  cooldownHours: 24 // Default cooldown
                };
              }
              
              try {
                const res = await axios.post(`${backendUrl}/api/gamification/challenge/complete`, { challengeId: payload }, { headers });
                if (res?.data?.ok) {
                  // update XP from server response (userXP is the source of truth from User model)
                  const newXP = res.data.userXP !== undefined ? res.data.userXP : (res.data.profile?.totalPoints || (userXP + c.xp));
                  setUserXP(newXP);
                  setCompletedChallenges(prev => [...prev, { id: challengeId, title: c.title, xp: c.xp, completedAt: new Date().toISOString() }]);
                } else {
                  showToast('Could not complete challenge on server');
                  // Fallback to offline awarding
                  setUserXP((prev) => prev + c.xp);
                  setCompletedChallenges(prev => [...prev, { id: challengeId, title: c.title, xp: c.xp, completedAt: new Date().toISOString() }]);
                }
              } catch (err) {
                console.error('complete challenge error', err?.response?.data || err.message);
                showToast('Failed to complete challenge (server) - using offline mode');
                // Fallback to offline awarding
                setUserXP((prev) => prev + c.xp);
                setCompletedChallenges(prev => [...prev, { id: challengeId, title: c.title, xp: c.xp, completedAt: new Date().toISOString() }]);
              }
            })();
          } else {
            showToast("XP already awarded for this challenge");
          }
        }

        return {
          ...c,
          currentProgress: newProgress,
          lastUpdateDate: new Date().toISOString(),
          status: isCompleted ? "completed" : c.status,
        };
      }
      return c;
    });

    setMyChallenges(updatedChallenges);
  };

  // Delete a challenge
  const handleDeleteChallenge = (challengeId) => {
    if (window.confirm("Are you sure you want to delete this challenge?")) {
      setMyChallenges(myChallenges.filter((c) => c.id !== challengeId));
    }
  };

  // Get available challenges (not started and not previously completed)
  const getAvailableChallenges = () => {
    const startedIds = myChallenges.map((c) => c.id);
    const completedIds = completedChallenges.map((c) => c.id);
    return AVAILABLE_CHALLENGES.filter(
      (c) => !startedIds.includes(c.id) && !completedIds.includes(c.id)
    );
  };

  // Get status text and color
  const getStatusInfo = (challenge) => {
    if (challenge.status === "completed") {
      return { text: "Completed", color: "text-green-600", bgColor: "bg-green-50" };
    }
    const progressPercent = (challenge.currentProgress / challenge.totalDays) * 100;
    if (progressPercent >= 80) {
      return { text: "Almost Done", color: "text-yellow-600", bgColor: "bg-yellow-50" };
    }
    return { text: "In Progress", color: "text-blue-600", bgColor: "bg-blue-50" };
  };

  // Check if can update today
  const canUpdateToday = (challenge) => {
    if (challenge.status === "completed") return false;
    const today = new Date().toISOString().split("T")[0];
    const lastUpdate = challenge.lastUpdateDate
      ? new Date(challenge.lastUpdateDate).toISOString().split("T")[0]
      : null;
    return lastUpdate !== today;
  };

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row bg-white h-[calc(100vh-64px)] overflow-hidden">
        {/* Left Section - Main Content (Wide) */}
        <div className="flex-1 p-3 sm:p-6 border-r border-gray-200 overflow-y-auto">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {view === "available" ? "Available Challenges" : "My Challenges"}
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">Total Points:</span>
              <span className="text-2xl font-bold text-blue-500">{userXP}</span>
            </div>
          </div>

          {/* View Toggle Button (only show on available view) */}
          {view === "available" && (
            <div className="mb-6">
              <button
                onClick={() => setView("my-challenges")}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg"
              >
                My Challenges
              </button>
            </div>
          )}

          {/* Available Challenges Grid */}
          {view === "available" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getAvailableChallenges().map((challenge) => (
                <div
                  key={challenge.id}
                  className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        {challenge.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {challenge.description}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        challenge.type === "physical"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {challenge.type}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="text-yellow-500" size={18} />
                      <span className="text-lg font-bold text-blue-500">
                        {challenge.xp} XP
                      </span>
                    </div>
                    <button
                      onClick={() => handleStartChallenge(challenge.id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                    >
                      Start
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* My Challenges View */}
          {view === "my-challenges" && (
            <div>
              {/* Browse More Challenges Button - Only show if user has active challenges */}
              {myChallenges.length > 0 && (
                <button
                  onClick={() => setView("available")}
                  className="mb-6 border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white bg-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2"
                >
                  <ChevronLeft size={18} />
                  Browse More Challenges
                </button>
              )}

              {myChallenges.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center shadow-sm border-2 border-dashed border-gray-200">
                  <div className="flex justify-center mb-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                      <Trophy className="text-gray-400" size={40} />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    No Active Challenges
                  </h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Start your wellness journey by taking on a challenge! Complete challenges to earn XP points and climb the leaderboard.
                  </p>
                  <button
                    onClick={() => setView("available")}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg"
                  >
                    Browse Available Challenges
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myChallenges.map((challenge) => {
                    const statusInfo = getStatusInfo(challenge);
                    const progressPercent = Math.min(
                      (challenge.currentProgress / challenge.totalDays) * 100,
                      100
                    );
                    const canUpdate = canUpdateToday(challenge);

                    return (
                      <div
                        key={challenge.id}
                        className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-800 mb-1">
                              {challenge.title}
                            </h3>
                            <div className="flex items-center gap-2">
                              <Trophy className="text-yellow-500" size={16} />
                              <span className="text-sm font-bold text-blue-500">
                                {challenge.xp} XP
                              </span>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}
                          >
                            {statusInfo.text}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Progress</span>
                            <span className="text-sm font-semibold text-gray-800">
                              {challenge.currentProgress} / {challenge.totalDays}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full transition-all ${
                                challenge.status === "completed"
                                  ? "bg-green-500"
                                  : progressPercent >= 80
                                  ? "bg-yellow-500"
                                  : "bg-blue-500"
                              }`}
                              style={{ width: `${progressPercent}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Update Message */}
                        {!canUpdate && challenge.status !== "completed" && (
                          <p className="text-xs text-gray-500 mb-3 text-center">
                            You can update this challenge again tomorrow
                          </p>
                        )}

                        {/* Footer Buttons */}
                        <div className="flex items-center gap-2 mt-4">
                          <button
                            onClick={() => handleDeleteChallenge(challenge.id)}
                            className="flex-1 border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => handleUpdateProgress(challenge.id)}
                            disabled={!canUpdate}
                            className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                              canUpdate
                                ? "bg-blue-500 hover:bg-blue-600 text-white"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                          >
                            Update Progress
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Section - Leaderboard (Less-Wide) */}
        <div className="w-full lg:w-80 bg-gray-50 border-l border-gray-200 p-3 sm:p-6 overflow-y-auto">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Leaderboard</h3>
          <div className="space-y-3">
            {LEADERBOARD_DATA.map((user, index) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                  {index + 1}
                </div>
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {user.name}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Trophy className="text-yellow-500" size={16} />
                  <span className="text-sm font-bold text-blue-500">
                    {user.xp}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <AppModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="🎉 Challenge Added!"
        widthClass="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            This challenge has been added to your active challenges.
          </p>

          {/* My Challenges Preview */}
          {myChallenges.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-3">
                My Challenges Preview
              </p>
              <div className="space-y-2">
                {myChallenges.slice(0, 3).map((challenge) => (
                  <div
                    key={challenge.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-700 font-medium">
                      {challenge.title}
                    </span>
                    <span className="text-gray-600">
                      {challenge.currentProgress} / {challenge.totalDays}
                    </span>
                  </div>
                ))}
                {myChallenges.length > 3 && (
                  <p className="text-sm text-gray-500 font-medium pt-2 border-t border-gray-200">
                    + {myChallenges.length - 3} more
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Modal Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={handleAddMoreChallenges}
              className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Add More Challenges
            </button>
            <button
              onClick={handleGoToMyChallenges}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Go to My Challenges
            </button>
          </div>
        </div>
      </AppModal>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slideUp">
          <p className="font-medium">{toastMessage}</p>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </Layout>
  );
};

export default Gamification;

