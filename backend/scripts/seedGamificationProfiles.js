const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Gamification = require('../models/Gamification');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/equilife');
    console.log('MongoDB connected for seeding gamification profiles');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const sampleUsers = [
  { fullName: 'Muhammad Rehman', email: 'rehman@example.com', totalPoints: 289 },
  { fullName: 'Muhammad Tayyab', email: 'tayyab@example.com', totalPoints: 276 },
  { fullName: 'Usama Rasheed', email: 'usama@example.com', totalPoints: 249 },
  { fullName: 'UbaidUllah', email: 'ubaid@example.com', totalPoints: 235 },
  { fullName: 'Tauqir Hayat', email: 'tauqir@example.com', totalPoints: 220 },
  { fullName: 'Fatima', email: 'fatima@example.com', totalPoints: 198 },
  { fullName: 'Azeem Sheera', email: 'azeem@example.com', totalPoints: 185 },
  { fullName: 'Ali Ahmed', email: 'ali@example.com', totalPoints: 172 },
  { fullName: 'Ukasha Sagar', email: 'ukasha@example.com', totalPoints: 160 },
  { fullName: 'Tayyab Shehzad', email: 'tayyabshehzad@example.com', totalPoints: 145 }
];

const sampleBadges = [
  { badgeId: 'first_challenge', name: 'First Steps', description: 'Completed your first challenge' },
  { badgeId: 'week_streak', name: 'Week Warrior', description: '7-day activity streak' },
  { badgeId: 'physical_champion', name: 'Physical Champion', description: 'Completed a physical wellness challenge' },
  { badgeId: 'mental_master', name: 'Mental Master', description: 'Completed a mental wellness challenge' }
];

const seedGamificationProfiles = async () => {
  try {
    await connectDB();

    console.log('Starting gamification profile seeding...');

    // Clear existing gamification profiles
    await Gamification.deleteMany({});
    console.log('Cleared existing gamification profiles');

    for (const userData of sampleUsers) {
      // Find or create user
      let user = await User.findOne({ email: userData.email });
      
      if (!user) {
        user = await User.create({
          email: userData.email,
          password: 'password123', // This will be hashed automatically
          fullName: userData.fullName,
          totalPoints: userData.totalPoints
        });
        console.log(`Created user: ${userData.fullName}`);
      } else {
        // Update existing user's points
        user.totalPoints = userData.totalPoints;
        await user.save();
        console.log(`Updated user: ${userData.fullName}`);
      }

      // Create gamification profile
      const completedChallenges = [];
      const badges = [];
      let streakCurrent = 0;
      let streakLongest = 0;

      // Generate some completed challenges based on points
      const challengeCount = Math.floor(userData.totalPoints / 50); // Roughly 1 challenge per 50 points
      for (let i = 1; i <= Math.min(challengeCount, 10); i++) {
        const challengeId = ((i - 1) % 10) + 1; // Cycle through challenge IDs 1-10
        const pointsEarned = [50, 100, 75, 40, 60, 80, 55, 70, 50, 45][challengeId - 1];
        
        completedChallenges.push({
          challengeId,
          completedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
          pointsEarned,
          title: ['Extra Workout Day', '10K Steps Daily', '7-Day Stretch Routine', 'No Sugar Day', 'Hydration Streak', 
                  'Meditation Streak', 'Gratitude Journaling', 'No Social Media Before Bed', 'Deep Breathing Practice', 'Digital Detox Hour'][challengeId - 1]
        });
      }

      // Add badges based on achievements
      if (completedChallenges.length > 0) {
        badges.push({
          ...sampleBadges[0], // First challenge badge
          earnedAt: completedChallenges[0].completedAt
        });
      }

      if (completedChallenges.length >= 3) {
        badges.push({
          ...sampleBadges[1], // Week streak badge
          earnedAt: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000)
        });
        streakCurrent = Math.floor(Math.random() * 10) + 1;
        streakLongest = streakCurrent + Math.floor(Math.random() * 5);
      }

      // Add type-specific badges
      const hasPhysicalChallenge = completedChallenges.some(c => [1, 2, 3, 4, 5].includes(c.challengeId));
      const hasMentalChallenge = completedChallenges.some(c => [6, 7, 8, 9, 10].includes(c.challengeId));

      if (hasPhysicalChallenge) {
        badges.push({
          ...sampleBadges[2], // Physical champion badge
          earnedAt: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000)
        });
      }

      if (hasMentalChallenge) {
        badges.push({
          ...sampleBadges[3], // Mental master badge
          earnedAt: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000)
        });
      }

      // Create gamification profile
      const gamificationProfile = await Gamification.create({
        userId: user._id,
        totalPoints: userData.totalPoints,
        level: Math.floor(Math.sqrt(userData.totalPoints / 100)) + 1,
        activeChallenges: [], // No active challenges for seed data
        completedChallenges,
        badges,
        streak: {
          current: streakCurrent,
          longest: streakLongest,
          lastActivity: streakCurrent > 0 ? new Date() : null
        }
      });

      console.log(`Created gamification profile for ${userData.fullName}: ${userData.totalPoints} points, Level ${gamificationProfile.level}, ${badges.length} badges`);
    }

    console.log('Gamification profile seeding completed successfully!');
    
    // Display summary
    const totalProfiles = await Gamification.countDocuments();
    const totalUsers = await User.countDocuments();
    console.log(`\nSummary:`);
    console.log(`- Total users: ${totalUsers}`);
    console.log(`- Total gamification profiles: ${totalProfiles}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding gamification profiles:', error);
    process.exit(1);
  }
};

// Run the seeding
seedGamificationProfiles();