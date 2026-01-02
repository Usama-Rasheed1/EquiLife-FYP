const User = require('../models/User');
const Gamification = require('../models/Gamification');

// Initialize gamification profile for user
exports.init = async (req, res) => {
  try {
    const userId = req.user.id;
    
    let profile = await Gamification.findOne({ userId });
    if (!profile) {
      profile = await Gamification.create({ userId });
    }
    
    res.json({ profile });
  } catch (error) {
    res.status(500).json({ message: 'Error initializing gamification profile' });
  }
};

// Get user's gamification profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    let profile = await Gamification.findOne({ userId });
    if (!profile) {
      profile = await Gamification.create({ userId });
    }
    
    // Get totalPoints from User model (source of truth)
    const user = await User.findById(userId).select('totalPoints');
    const userXP = user ? user.totalPoints || 0 : 0;
    
    // Sync profile points with user points
    if (profile.totalPoints !== userXP) {
      profile.totalPoints = userXP;
      await profile.save();
    }
    
    res.json({ ok: true, profile, userXP });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Error fetching gamification profile' });
  }
};

// List available challenges
exports.listChallenges = async (req, res) => {
  try {
    const challenges = [
      // Physical Challenges
      { id: 1, title: "Extra Workout Day", description: "Add an additional workout session to your weekly routine", xp_points: 50, badgeName: "physical", totalDays: 1, status: 'active' },
      { id: 2, title: "10K Steps Daily", description: "Walk 10,000 steps every day for a week", xp_points: 100, badgeName: "physical", totalDays: 7, status: 'active' },
      { id: 3, title: "7-Day Stretch Routine", description: "Complete a stretching routine for 7 consecutive days", xp_points: 75, badgeName: "physical", totalDays: 7, status: 'active' },
      { id: 4, title: "No Sugar Day", description: "Avoid all added sugars for one full day", xp_points: 40, badgeName: "physical", totalDays: 1, status: 'active' },
      { id: 5, title: "Hydration Streak", description: "Drink 8 glasses of water daily for 5 days", xp_points: 60, badgeName: "physical", totalDays: 5, status: 'active' },
      // Mental Well-Being Challenges
      { id: 6, title: "Meditation Streak", description: "Meditate for 10 minutes daily for 7 days", xp_points: 80, badgeName: "mental", totalDays: 7, status: 'active' },
      { id: 7, title: "Gratitude Journaling", description: "Write three things you're grateful for daily for 5 days", xp_points: 55, badgeName: "mental", totalDays: 5, status: 'active' },
      { id: 8, title: "No Social Media Before Bed", description: "Avoid social media 2 hours before bedtime for 7 days", xp_points: 70, badgeName: "mental", totalDays: 7, status: 'active' },
      { id: 9, title: "Deep Breathing Practice", description: "Practice deep breathing exercises for 5 minutes daily for 5 days", xp_points: 50, badgeName: "mental", totalDays: 5, status: 'active' },
      { id: 10, title: "Digital Detox Hour", description: "Spend one hour without any digital devices daily for 3 days", xp_points: 45, badgeName: "mental", totalDays: 3, status: 'active' }
    ];
    
    res.json({ ok: true, challenges });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching challenges' });
  }
};

// Start a challenge
exports.startChallenge = async (req, res) => {
  try {
    const userId = req.user.id;
    const { challengeId } = req.body;
    
    console.log('Start challenge request:', { userId, challengeId });
    
    // Handle both simple challengeId and challenge object
    let actualChallengeId, challengeData;
    if (typeof challengeId === 'object') {
      actualChallengeId = challengeId.id || challengeId._id;
      challengeData = challengeId;
    } else {
      actualChallengeId = challengeId;
      // Find challenge data from predefined challenges (use same data as listChallenges)
      const challenges = [
        { id: 1, title: "Extra Workout Day", xp: 50, totalDays: 1 },
        { id: 2, title: "10K Steps Daily", xp: 100, totalDays: 7 },
        { id: 3, title: "7-Day Stretch Routine", xp: 75, totalDays: 7 },
        { id: 4, title: "No Sugar Day", xp: 40, totalDays: 1 },
        { id: 5, title: "Hydration Streak", xp: 60, totalDays: 5 },
        { id: 6, title: "Meditation Streak", xp: 80, totalDays: 7 },
        { id: 7, title: "Gratitude Journaling", xp: 55, totalDays: 5 },
        { id: 8, title: "No Social Media Before Bed", xp: 70, totalDays: 7 },
        { id: 9, title: "Deep Breathing Practice", xp: 50, totalDays: 5 },
        { id: 10, title: "Digital Detox Hour", xp: 45, totalDays: 3 }
      ];
      challengeData = challenges.find(c => c.id == actualChallengeId);
    }
    
    if (!challengeData) {
      return res.status(400).json({ ok: false, message: 'Challenge not found' });
    }
    
    let profile = await Gamification.findOne({ userId });
    if (!profile) {
      profile = await Gamification.create({ userId });
    }
    
    // Check if challenge already active
    const isActive = profile.activeChallenges.some(c => c.challengeId == actualChallengeId);
    if (isActive) {
      return res.status(400).json({ ok: false, message: 'Challenge already active' });
    }
    
    // Check if challenge was already completed
    const isCompleted = profile.completedChallenges.some(c => c.challengeId == actualChallengeId);
    if (isCompleted) {
      return res.status(400).json({ ok: false, message: 'Challenge already completed' });
    }
    
    profile.activeChallenges.push({
      challengeId: actualChallengeId,
      startedAt: new Date(),
      currentProgress: 0,
      totalDays: challengeData.totalDays || 1,
      title: challengeData.title || 'Unknown Challenge',
      xp: challengeData.xp || 10
    });
    
    await profile.save();
    console.log('Challenge started successfully');
    res.json({ ok: true, message: 'Challenge started successfully', profile });
  } catch (error) {
    console.error('Start challenge error:', error);
    res.status(500).json({ ok: false, message: 'Error starting challenge' });
  }
};

// Update challenge progress
exports.updateProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { challengeId } = req.body;
    
    let profile = await Gamification.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ ok: false, message: 'Gamification profile not found' });
    }
    
    // Find active challenge
    const challengeIndex = profile.activeChallenges.findIndex(c => c.challengeId == challengeId);
    if (challengeIndex === -1) {
      return res.status(400).json({ ok: false, message: 'Challenge not active' });
    }
    
    const challenge = profile.activeChallenges[challengeIndex];
    
    // Check if already updated today
    const today = new Date().toISOString().split('T')[0];
    const lastUpdate = challenge.lastUpdateDate ? new Date(challenge.lastUpdateDate).toISOString().split('T')[0] : null;
    
    if (lastUpdate === today) {
      return res.status(400).json({ ok: false, message: 'Challenge already updated today' });
    }
    
    // Update progress
    challenge.currentProgress += 1;
    challenge.lastUpdateDate = new Date();
    
    // Update streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (!profile.streak.lastActivity || profile.streak.lastActivity.toISOString().split('T')[0] === yesterdayStr) {
      profile.streak.current += 1;
      if (profile.streak.current > profile.streak.longest) {
        profile.streak.longest = profile.streak.current;
      }
    } else {
      profile.streak.current = 1;
    }
    profile.streak.lastActivity = new Date();
    
    // Check if challenge is completed
    let isCompleted = false;
    if (challenge.currentProgress >= challenge.totalDays) {
      isCompleted = true;
      
      // Move to completed challenges
      profile.completedChallenges.push({
        challengeId: challenge.challengeId,
        completedAt: new Date(),
        pointsEarned: challenge.xp,
        title: challenge.title
      });
      
      // Remove from active challenges
      profile.activeChallenges.splice(challengeIndex, 1);
      
      // Award points
      profile.totalPoints += challenge.xp;
      
      // Update user's totalPoints in User model (source of truth)
      const user = await User.findById(userId);
      if (user) {
        user.totalPoints = (user.totalPoints || 0) + challenge.xp;
        await user.save();
      }
    }
    
    await profile.save();
    
    res.json({ 
      ok: true, 
      message: isCompleted ? 'Challenge completed!' : 'Progress updated', 
      challenge,
      isCompleted,
      pointsEarned: isCompleted ? challenge.xp : 0,
      profile
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ ok: false, message: 'Error updating progress' });
  }
};

// Complete a challenge (legacy endpoint)
exports.completeChallenge = async (req, res) => {
  try {
    const userId = req.user.id;
    const { challengeId } = req.body;
    
    let profile = await Gamification.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ message: 'Gamification profile not found' });
    }
    
    // Find and remove from active challenges
    const activeIndex = profile.activeChallenges.findIndex(c => c.challengeId == challengeId);
    if (activeIndex === -1) {
      return res.status(400).json({ message: 'Challenge not active' });
    }
    
    const challenge = profile.activeChallenges[activeIndex];
    
    // Check if already completed to prevent XP farming
    const alreadyCompleted = profile.completedChallenges.some(c => c.challengeId == challengeId);
    if (alreadyCompleted) {
      return res.status(400).json({ message: 'Challenge already completed' });
    }
    
    profile.activeChallenges.splice(activeIndex, 1);
    
    // Add to completed challenges
    profile.completedChallenges.push({
      challengeId,
      completedAt: new Date(),
      pointsEarned: challenge.xp || 10,
      title: challenge.title || 'Unknown Challenge'
    });
    
    // Award points
    const points = challenge.xp || 10;
    profile.totalPoints += points;
    
    // Update user's totalPoints in User model (source of truth)
    const user = await User.findById(userId);
    if (user) {
      user.totalPoints = (user.totalPoints || 0) + points;
      await user.save();
    }
    
    await profile.save();
    res.json({ 
      ok: true, 
      message: 'Challenge completed successfully', 
      pointsEarned: points, 
      profile,
      userXP: user ? user.totalPoints : profile.totalPoints
    });
  } catch (error) {
    console.error('Complete challenge error:', error);
    res.status(500).json({ message: 'Error completing challenge' });
  }
};



// Delete/abandon a challenge
exports.deleteChallenge = async (req, res) => {
  try {
    const userId = req.user.id;
    const { challengeId } = req.body;
    
    let profile = await Gamification.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ ok: false, message: 'Gamification profile not found' });
    }
    
    // Find and remove from active challenges
    const activeIndex = profile.activeChallenges.findIndex(c => c.challengeId == challengeId);
    if (activeIndex === -1) {
      return res.status(400).json({ ok: false, message: 'Challenge not active' });
    }
    
    profile.activeChallenges.splice(activeIndex, 1);
    await profile.save();
    
    res.json({ ok: true, message: 'Challenge deleted successfully', profile });
  } catch (error) {
    console.error('Delete challenge error:', error);
    res.status(500).json({ ok: false, message: 'Error deleting challenge' });
  }
};

// Get leaderboard
exports.leaderboard = async (req, res) => {
  try {
    // Fetch top 10 users directly from User model since totalPoints is stored there
    const users = await User.find({ totalPoints: { $gt: 0 } })
      .select('fullName totalPoints')
      .sort({ totalPoints: -1 })
      .limit(10);
    
    const leaderboard = users.map((user, index) => ({
      id: user._id,
      rank: index + 1,
      name: user.fullName || 'Anonymous User',
      points: user.totalPoints || 0,
      xp: user.totalPoints || 0, // For compatibility with frontend
      avatar: '/user.jpg' // Default avatar
    }));
    
    res.json({ ok: true, leaderboard });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Error fetching leaderboard' });
  }
};

// Get user's rank
exports.rank = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId).select('totalPoints');
    if (!user) {
      return res.json({ rank: 0, totalPoints: 0 });
    }
    
    const higherRanked = await User.countDocuments({
      totalPoints: { $gt: user.totalPoints || 0 }
    });
    
    res.json({ 
      ok: true,
      rank: higherRanked + 1, 
      totalPoints: user.totalPoints || 0
    });
  } catch (error) {
    console.error('Rank error:', error);
    res.status(500).json({ message: 'Error fetching rank' });
  }
};



// Debug status
exports.debugStatus = async (req, res) => {
  try {
    const totalProfiles = await Gamification.countDocuments();
    const totalUsers = await User.countDocuments();
    res.json({ 
      status: 'ok', 
      totalProfiles,
      totalUsers,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching debug status' });
  }
};