const mongoose = require('mongoose');
const User = require('../models/User');
const Gamification = require('../models/Gamification');
require('dotenv').config();

const seedLeaderboard = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Sample users with XP points for leaderboard
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

    for (const userData of sampleUsers) {
      // Check if user already exists
      let user = await User.findOne({ email: userData.email });
      
      if (!user) {
        // Create new user
        user = new User({
          email: userData.email,
          password: 'password123', // Default password
          fullName: userData.fullName,
          totalPoints: userData.totalPoints
        });
        await user.save();
        console.log(`Created user: ${userData.fullName} with ${userData.totalPoints} XP`);
      } else {
        // Update existing user's XP
        user.totalPoints = userData.totalPoints;
        await user.save();
        console.log(`Updated user: ${userData.fullName} to ${userData.totalPoints} XP`);
      }

      // Create or update gamification profile
      let profile = await Gamification.findOne({ userId: user._id });
      if (!profile) {
        profile = new Gamification({
          userId: user._id,
          totalPoints: userData.totalPoints
        });
        await profile.save();
        console.log(`Created gamification profile for: ${userData.fullName}`);
      } else {
        profile.totalPoints = userData.totalPoints;
        await profile.save();
        console.log(`Updated gamification profile for: ${userData.fullName}`);
      }
    }

    console.log('Leaderboard seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding leaderboard:', error);
    process.exit(1);
  }
};

seedLeaderboard();