require('dotenv').config();
const mongoose = require('mongoose');

// Models
const Food = require('../models/Food');
const WorkoutPredefined = require('../models/WorkoutPredefined');

// Simple seed data for predefined meals and workouts
const predefinedFoods = [
  { name: 'Oatmeal (1 cup)', calories: 150, protein: 5, carbs: 27, fat: 3, grams: 100, isCustom: false },
  { name: 'Grilled Chicken Breast (100g)', calories: 165, protein: 31, carbs: 0, fat: 3.6, grams: 100, isCustom: false },
  { name: 'Brown Rice (1 cup)', calories: 216, protein: 5, carbs: 45, fat: 1.8, grams: 195, isCustom: false },
  { name: 'Apple (1 medium)', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, grams: 182, isCustom: false },
  { name: 'Greek Yogurt (1 cup)', calories: 130, protein: 11, carbs: 9, fat: 4, grams: 245, isCustom: false },
  { name: 'Pancakes (2 medium)', calories: 350, protein: 6, carbs: 60, fat: 8, grams: 160, isCustom: false },
];

const predefinedWorkouts = [
  { name: 'Brisk Walking', caloriesPerMinute: 4, intensity: 'low', tags: ['cardio'] },
  { name: 'Jogging', caloriesPerMinute: 8, intensity: 'medium', tags: ['cardio'] },
  { name: 'Cycling (moderate)', caloriesPerMinute: 7, intensity: 'medium', tags: ['cardio'] },
  { name: 'HIIT (intervals)', caloriesPerMinute: 12, intensity: 'high', tags: ['cardio','strength'] },
];

async function seed() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not defined in environment');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    // Remove only existing predefined foods (keep any custom foods intact)
    await Food.deleteMany({ isCustom: false });
    console.log('Deleted existing predefined Food documents');

    // Insert predefined foods
    for (const food of predefinedFoods) {
      await Food.create(food);
      console.log('Inserted predefined food:', food.name);
    }

    // Reset predefined workouts collection
    await WorkoutPredefined.deleteMany({});
    console.log('Deleted existing WorkoutPredefined documents');

    for (const workout of predefinedWorkouts) {
      await WorkoutPredefined.create(workout);
      console.log('Inserted workout:', workout.name);
    }

    console.log('Seeding complete');
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
