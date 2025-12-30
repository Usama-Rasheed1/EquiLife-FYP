// Migration script to remove use_xp field from all users
// Usage: node scripts/removeUseXpField.js

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/equilife';

async function run() {
  try {
    await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    // Find all users with use_xp field
    const users = await User.find({ use_xp: { $exists: true } });
    console.log(`Found ${users.length} users with use_xp field`);

    let synced = 0;
    let removed = 0;

    for (const user of users) {
      // If use_xp has a value greater than totalPoints, sync it (safety measure)
      if (user.use_xp && user.use_xp > (user.totalPoints || 0)) {
        user.totalPoints = user.use_xp;
        await user.save();
        synced++;
        console.log(`Synced use_xp (${user.use_xp}) to totalPoints for user: ${user.email}`);
      }

      // Remove use_xp field
      await User.updateOne(
        { _id: user._id },
        { $unset: { use_xp: "" } }
      );
      removed++;
    }

    console.log(`\nMigration complete:`);
    console.log(`- Synced ${synced} users (use_xp > totalPoints)`);
    console.log(`- Removed use_xp field from ${removed} users`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();


