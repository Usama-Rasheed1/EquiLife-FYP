const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { generateAccessToken } = require("../utils/token");
const goalController = require("./goalController");
const notificationService = require('../services/notificationService');

exports.register = async (req, res) => {
  const { fullName,email, password } = req.body;

  try {
    // reject duplicates
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "Email already exists" });

    // create user (password hashed by model hook) and return token
    const user = await User.create({ fullName, email, password });
  // create initial notifications (welcome, profile reminder)
    notificationService.createInitialNotifications(user._id)
      .then(() => console.debug('[auth] initial notifications triggered for', String(user._id)))
      .catch(err => console.error('Notification init error:', err));
    const accessToken = generateAccessToken(user._id);
    return res.status(201).json({ message: "User registered successfully", accessToken });
  } catch (err) {
    console.error("Registration Error:", err);
    return res.status(500).json({ message: "Error registering user" });
  }
};

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: "Invalid credentials" });
    const accessToken = generateAccessToken(user._id);
  // On login, create initial notifications if needed (non-blocking)
    notificationService.createInitialNotifications(user._id)
      .then(() => console.debug('[auth] initial notifications triggered for', String(user._id)))
      .catch(err => console.error('Notification init error:', err));
    return res.json({ accessToken });
  } catch (err) {
    return res.status(500).json({ message: "Error logging in" });
  }
};

// Update profile fields separately
exports.updateProfile = async (req, res) => {
  const { fullName, gender, dob, age, heightCm, weightKg, password, bmi, bmr, dailyCalories, profilePhoto } = req.body;
  try {
    const updates = {};
    if (fullName !== undefined) updates.fullName = fullName;
    if (gender !== undefined) updates.gender = gender;
    if (dob !== undefined) updates.dob = dob ? new Date(dob) : null;
    if (age !== undefined) updates.age = age;
    if (heightCm !== undefined) updates.heightCm = heightCm;
    if (weightKg !== undefined) updates.weightKg = weightKg;
    if (bmi !== undefined) updates.bmi = bmi;
    if (bmr !== undefined) updates.bmr = bmr;
    if (dailyCalories !== undefined) updates.dailyCalories = dailyCalories;
    if (profilePhoto !== undefined) updates.profilePhoto = profilePhoto;
    
    // Handle password update separately to ensure it gets hashed
    if (password !== undefined && password !== null && password !== "") {
      if (password.length < 5) {
        return res.status(400).json({ message: "Password must be at least 5 characters" });
      }
      updates.password = password; // Will be hashed by the model's pre-save hook
    }

    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const updated = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true }).select("-password");
    if (!updated) return res.status(404).json({ message: "User not found" });
    
    // Update goal progress if weight was updated
    if (weightKg !== undefined) {
      goalController.updateProgressForGoalType(userId, 'weight').catch(err => {
        console.error('Error updating weight goal progress:', err);
      });
    }
    
    return res.json({ user: updated });
  } catch (err) {
    console.error("Update profile error:", err);
    return res.status(500).json({ message: "Error updating profile" });
  }
};

// Save fitness calculations (BMI, BMR, etc.)
exports.saveFitnessCalculations = async (req, res) => {
  try {
    const { weight, height, dob, gender, bmi, bmr, dailyCalories } = req.body;
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const updates = {};
    if (weight !== undefined) updates.weightKg = weight;
    if (height !== undefined) updates.heightCm = height;
    if (dob !== undefined) updates.dob = dob ? new Date(dob) : null;
    if (gender !== undefined) updates.gender = gender;
    if (bmi !== undefined) updates.bmi = bmi;
    if (bmr !== undefined) updates.bmr = bmr;
    if (dailyCalories !== undefined) updates.dailyCalories = dailyCalories;

    const updated = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true }).select("-password");
    if (!updated) return res.status(404).json({ message: "User not found" });
    
    // Update goal progress if weight was updated
    if (weight !== undefined) {
      goalController.updateProgressForGoalType(userId, 'weight').catch(err => {
        console.error('Error updating weight goal progress:', err);
      });
    }
    
    return res.json({ user: updated, message: "Fitness calculations saved successfully" });
  } catch (err) {
    console.error("Save fitness calculations error:", err);
    return res.status(500).json({ message: "Error saving fitness calculations" });
  }
};

// Get current user's profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json({ user });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ message: 'Error fetching profile' });
  }
};
