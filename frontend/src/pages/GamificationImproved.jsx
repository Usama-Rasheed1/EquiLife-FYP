import React, { useState, useEffect } from "react";
import axios from 'axios';
import Layout from "../components/Layout";
import AppModal from "../components/AppModal";
import { Trophy, X, CheckCircle2, Clock, ChevronLeft, Star, Award, Target } from "lucide-react";

const GamificationImproved = () => {
  const [view, setView] = useState("available");
  const [myChallenges, setMyChallenges] = useState([]);
  const [userXP, setUserXP] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [userRank, setUserRank] = useState(0);
  const [userBadges, setUserBadges] = useState([]);
  const [availableChallenges, setAvailableChallenges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const backendUrl = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:5001';

  // Load all gamification data
  useEffect(() => {
    loadGamificationData();
  }, []);

  const loadGamificationData = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setLoading(false);
      return;
    }
    
    const headers = { Authorization: `Bearer ${token}` };
    
    try {
      // Load profile, challenges, leaderboard, and badges in parallel
      const [profileRes, challengesRes, leaderboardRes, badgesRes, rankRes] = await Promise.all([
        axios.get(`${backendUrl}/api/gamification/profile`, { headers }),
        axios.get(`${backendUrl}/api/gamification/challenges`, { headers }),
        axios.get(`${backendUrl}/api/gamification/leaderboard`, { headers }),
        axios.get(`${backendUrl}/api/gamification/badges`, { headers }),
        axios.get(`${backendUrl}/api/gamification/rank`, { headers })
      ]);

      // Set profile data
      if (profileRes?.data?.ok) {
        const profile = profileRes.data.profile;
        setUserXP(profileRes.data.userXP || profile.totalPoints || 0);
        setUserLevel(profileRes.data.level || profile.level || 1);
        
        // Set active challenges with proper structure
        const activeChallenges = (profile.activeChallenges || []).map(ac => ({
          id: ac.challengeId,
          title: ac.title || 'Unknown Challenge',
          xp: ac.xp || 0,
          totalDays: ac.totalDays || 1,
          currentProgress: ac.currentProgress || 0,
          startDate: ac.startedAt,
          lastUpdateDate: ac.lastUpdateDate,
          status: ac.currentProgress >= ac.totalDays ? 'completed' : 'in-progress'
        }));
        setMyChallenges(activeChallenges);
      }

      // Set available challenges
      if (challengesRes?.data?.ok) {
        setAvailableChallenges(challengesRes.data.challenges || []);
      }

      // Set leaderboard
      if (leaderboardRes?.data?.ok) {
        setLeaderboard(leaderboardRes.data.leaderboard || []);
      }

      // Set badges
      if (badgesRes?.data?.ok) {
        setUserBadges(badgesRes.data.badges || []);
      }

      // Set rank
      if (rankRes?.data?.ok) {
        setUserRank(rankRes.data.rank || 0);
      }

    } catch (err) {
      console.error('Failed to load gamification data:', err);
      showToast('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleStartChallenge = async (challengeId) => {
    if (myChallenges.some((c) => c.id === challengeId)) {
      showToast("You already started this challenge");
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      showToast('Please log in to start challenges');
      return;
    }
    
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const res = await axios.post(`${backendUrl}/api/gamification/challenge/start`, { challengeId }, { headers });
      if (res?.data?.ok) {
        await loadGamificationData(); // Reload all data
        setShowSuccessModal(true);
      } else {
        showToast(res?.data?.message || 'Failed to start challenge');
      }
    } catch (err) {
      console.error('Start challenge error:', err);
      showToast(err?.response?.data?.message || 'Failed to start challenge');
    }
  };

  const handleUpdateProgress = async (challengeId) => {
    const challenge = myChallenges.find((c) => c.id === challengeId);
    if (!challenge) return;

    const today = new Date().toISOString().split("T")[0];
    const lastUpdate = challenge.lastUpdateDate
      ? new Date(challenge.lastUpdateDate).toISOString().split("T")[0]
      : null;

    if (lastUpdate === today) {
      showToast("You can update this challenge again tomorrow");
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      showToast('Please log in to update progress');
      return;
    }
    
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const res = await axios.post(`${backendUrl}/api/gamification/challenge/update`, { challengeId }, { headers });
      if (res?.data?.ok) {
        await loadGamificationData(); // Reload all data
        if (res.data.isCompleted) {
          showToast(`🎉 Challenge completed! +${res.data.pointsEarned} XP`);
        } else {
          showToast('Progress updated successfully!');
        }
      } else {
        showToast(res?.data?.message || 'Failed to update progress');
      }
    } catch (err) {
      console.error('Update progress error:', err);
      showToast(err?.response?.data?.message || 'Failed to update progress');
    }
  };

  const handleDeleteChallenge = (challengeId) => {
    if (window.confirm("Are you sure you want to delete this challenge?")) {
      setMyChallenges(myChallenges.filter((c) => c.id !== challengeId));
    }
  };

  const getAvailableChallenges = () => {
    const startedIds = myChallenges.map((c) => c.id);
    return availableChallenges.filter((c) => !startedIds.includes(c.id));
  };

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

  const canUpdateToday = (challenge) => {
    if (challenge.status === "completed") return false;
    const today = new Date().toISOString().split("T")[0];
    const lastUpdate = challenge.lastUpdateDate
      ? new Date(challenge.lastUpdateDate).toISOString().split("T")[0]
      : null;
    return lastUpdate !== today;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading gamification data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row bg-white h-[calc(100vh-64px)] overflow-hidden">
        {/* Left Section - Main Content */}
        <div className="flex-1 p-3 sm:p-6 border-r border-gray-200 overflow-y-auto">
          {/* Header with Stats */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {view === "available" ? "Available Challenges" : "My Challenges"}
              </h2>
            </div>
            
            {/* User Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                <div className="flex items-center gap-2">
                  <Trophy size={20} />
                  <span className="text-sm opacity-90">Total XP</span>
                </div>
                <p className="text-2xl font-bold">{userXP}</p>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                <div className="flex items-center gap-2">
                  <Star size={20} />
                  <span className="text-sm opacity-90">Level</span>
                </div>
                <p className="text-2xl font-bold">{userLevel}</p>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                <div className="flex items-center gap-2">
                  <Target size={20} />
                  <span className="text-sm opacity-90">Rank</span>
                </div>
                <p className="text-2xl font-bold">#{userRank}</p>
              </div>
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-4 text-white">
                <div className="flex items-center gap-2">
                  <Award size={20} />
                  <span className="text-sm opacity-90">Badges</span>
                </div>
                <p className="text-2xl font-bold">{userBadges.length}</p>
              </div>
            </div>
          </div>

          {/* View Toggle */}
          {view === "available" && (
            <div className="mb-6">
              <button
                onClick={() => setView("my-challenges")}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg"
              >
                My Challenges ({myChallenges.length})
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
                        challenge.badgeName === "physical"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {challenge.badgeName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="text-yellow-500" size={18} />
                      <span className="text-lg font-bold text-blue-500">
                        {challenge.xp_points} XP
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

                        {!canUpdate && challenge.status !== "completed" && (
                          <p className="text-xs text-gray-500 mb-3 text-center">
                            You can update this challenge again tomorrow
                          </p>
                        )}

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

        {/* Right Section - Leaderboard & Badges */}
        <div className="w-full lg:w-80 bg-gray-50 border-l border-gray-200 p-3 sm:p-6 overflow-y-auto">
          {/* Leaderboard */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Leaderboard</h3>
            <div className="space-y-3">
              {leaderboard.slice(0, 10).map((user, index) => (
                <div
                  key={user.rank}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                    index === 0 ? 'bg-yellow-100 text-yellow-600' :
                    index === 1 ? 'bg-gray-100 text-gray-600' :
                    index === 2 ? 'bg-orange-100 text-orange-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {user.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500">Level {user.level}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy className="text-yellow-500" size={16} />
                    <span className="text-sm font-bold text-blue-500">
                      {user.points}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User Badges */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">My Badges</h3>
            {userBadges.length === 0 ? (
              <div className="text-center py-6">
                <Award className="text-gray-400 mx-auto mb-2" size={32} />
                <p className="text-gray-500 text-sm">No badges earned yet</p>
                <p className="text-gray-400 text-xs">Complete challenges to earn badges!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {userBadges.map((badge, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg p-3 border border-gray-200 text-center"
                  >
                    <Award className="text-yellow-500 mx-auto mb-1" size={24} />
                    <p className="text-xs font-semibold text-gray-800">{badge.name}</p>
                    <p className="text-xs text-gray-500">{badge.description}</p>
                  </div>
                ))}
              </div>
            )}
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
          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={() => setShowSuccessModal(false)}
              className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Add More Challenges
            </button>
            <button
              onClick={() => {
                setShowSuccessModal(false);
                setView("my-challenges");
              }}
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

export default GamificationImproved;