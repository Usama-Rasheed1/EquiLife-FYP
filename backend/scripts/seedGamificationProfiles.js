// Seeder to create Gamification profiles for existing users
// Usage: node scripts/seedGamificationProfiles.js

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Gamification = require('../models/Gamification');

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/equilife';

async function run() {
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to DB');

  const users = await User.find({}).lean();
  console.log('Found users:', users.length);

  for (const u of users) {
    const exists = await Gamification.findOne({ userId: u._id });
    if (exists) {
      console.log('Profile exists for', u._id.toString());
      continue;
    }
    const p = new Gamification({ userId: u._id, totalPoints: 0, activeChallenges: [], completedChallenges: [], badges: [] });
    await p.save();
    console.log('Created profile for', u._id.toString());
  }

  await mongoose.disconnect();
  console.log('Done');
}

run().catch(err => { console.error(err); process.exit(1); });
