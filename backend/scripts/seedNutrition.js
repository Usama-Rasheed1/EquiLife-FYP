/*
Seed script for nutrition (Diet) collection.
Usage: NODE_ENV=development node backend/scripts/seedNutrition.js
Make sure backend/.env is configured with MONGO_URI
*/

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Diet = require('../models/Diet');

async function connect() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/equilife';
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to', uri);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeMealItems() {
  const items = [
    { name: 'Egg', calories: 78, quantity: 1 },
    { name: 'Bread Slice', calories: 66, quantity: 1 },
    { name: 'Apple', calories: 95, quantity: 1 },
    { name: 'Rice (1 cup)', calories: 200, quantity: 1 },
    { name: 'Grilled Chicken', calories: 165, quantity: 1 }
  ];
  // pick 1-3 items randomly
  const count = randomInt(1,3);
  const picked = [];
  for (let i=0;i<count;i++) {
    picked.push(items[randomInt(0, items.length-1)]);
  }
  return picked;
}

function computeMacrosFromItems(items=[]) {
  const totals = items.reduce((acc, it) => acc + (Number(it.calories||0) * (Number(it.quantity||1))), 0);
  const carbs = Math.round((totals * 0.5) / 4);
  const fats = Math.round((totals * 0.3) / 9);
  const protein = Math.round((totals * 0.2) / 4);
  return { carbs, fats, protein };
}

async function seed() {
  try {
    await connect();

    const users = await User.find().limit(5).lean();
    if (!users.length) {
      console.log('No users found. Create some users first (register via API)');
      process.exit(0);
    }

    const days = 7;
    for (const user of users) {
      console.log('Seeding for user', user.email || user._id);
      for (let i=0;i<days;i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0,0,0,0);

        const breakfastItems = makeMealItems();
        const lunchItems = makeMealItems();
        const dinnerItems = makeMealItems();

        const breakfastMacros = computeMacrosFromItems(breakfastItems);
        const lunchMacros = computeMacrosFromItems(lunchItems);
        const dinnerMacros = computeMacrosFromItems(dinnerItems);

        const totals = {
          carbs: breakfastMacros.carbs + lunchMacros.carbs + dinnerMacros.carbs,
          fats: breakfastMacros.fats + lunchMacros.fats + dinnerMacros.fats,
          protein: breakfastMacros.protein + lunchMacros.protein + dinnerMacros.protein
        };

        const doc = {
          user: user._id,
          date,
          breakfast: { description: JSON.stringify(breakfastItems), ...breakfastMacros },
          lunch: { description: JSON.stringify(lunchItems), ...lunchMacros },
          dinner: { description: JSON.stringify(dinnerItems), ...dinnerMacros },
          totals
        };

        await Diet.findOneAndUpdate({ user: user._id, date }, doc, { upsert: true, new: true, setDefaultsOnInsert: true });
      }
    }

    console.log('Seeding complete');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error', err);
    process.exit(1);
  }
}

seed();
