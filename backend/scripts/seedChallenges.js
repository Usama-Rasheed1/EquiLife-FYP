// Lightweight seeder for default challenges
// Usage: node scripts/seedChallenges.js

require('dotenv').config();
const mongoose = require('mongoose');
const Challenge = require('../models/Challenge');

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/equilife';

const DEFAULTS = [
  { title: 'Daily Walk', description: 'Walk 5,000 steps', xp_points: 10, badgeName: 'physical', totalDays: 1, cooldownHours: 24, status: 'active' },
  { title: 'Hydration', description: 'Drink 8 glasses of water', xp_points: 5, badgeName: 'physical', totalDays: 1, cooldownHours: 24, status: 'active' },
  { title: 'Weekly Run', description: 'Run 10 km this week', xp_points: 50, badgeName: 'physical', totalDays: 7, cooldownHours: 168, status: 'active' }
];

async function run() {
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to DB');

  for (const c of DEFAULTS) {
    const exists = await Challenge.findOne({ title: c.title });
    if (exists) {
      console.log('Exists:', c.title);
      continue;
    }
    const doc = new Challenge(c);
    await doc.save();
    console.log('Seeded:', c.title);
  }

  await mongoose.disconnect();
  console.log('Done');
}

run().catch(err => { console.error(err); process.exit(1); });
