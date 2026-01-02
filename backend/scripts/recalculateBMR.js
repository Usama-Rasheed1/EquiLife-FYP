const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function recalculateBMR() {
  try {
    await mongoose.connect('mongodb://localhost:27017/equilife');
    console.log('Connected to MongoDB');

    // Find user with the specific ID from your log
    const user = await User.findById('695815b27906aa8cc50e13a4');
    
    if (user) {
      console.log('Found user:', {
        id: user._id,
        heightCm: user.heightCm,
        weightKg: user.weightKg,
        dob: user.dob,
        age: user.age,
        gender: user.gender,
        bmi: user.bmi,
        bmr: user.bmr
      });

      // Force recalculation by saving
      await user.save();
      console.log('User saved, triggering recalculation');
      
      // Fetch updated user
      const updatedUser = await User.findById('695815b27906aa8cc50e13a4');
      console.log('Updated user:', {
        age: updatedUser.age,
        bmi: updatedUser.bmi,
        bmr: updatedUser.bmr
      });
    } else {
      console.log('User not found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

recalculateBMR();