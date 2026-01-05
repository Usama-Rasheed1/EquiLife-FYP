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
      .then(() => {})
      .catch(err => {});
    const accessToken = generateAccessToken(user._id);
    return res.status(201).json({ message: "User registered successfully", accessToken });
  } catch (err) {
    console.error("Registration Error:", err);
    return res.status(500).json({ message: "Error registering user" });
  }
};

// Login (Updated: check email verification)
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: "Invalid credentials" });
    
    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({ 
        ok: false,
        message: "Email not verified. Please check your email for the verification code.",
        requiresOTPVerification: true 
      });
    }

    const accessToken = generateAccessToken(user._id);
  // On login, create initial notifications if needed (non-blocking)
    notificationService.createInitialNotifications(user._id)
      .then(() => console.debug('[auth] initial notifications triggered for', String(user._id)))
      .catch(err => console.error('Notification init error:', err));
    return res.json({ ok: true, accessToken, role: user.role });
  } catch (err) {
    return res.status(500).json({ message: "Error logging in" });
  }
};

// Update profile fields separately
exports.updateProfile = async (req, res) => {
  const { fullName, gender, dob, age, heightCm, weightKg, password, bmi, bmr, dailyCalories, profilePhoto } = req.body;
  
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Find user first, then update and save to trigger pre-save hooks
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update fields
    if (fullName !== undefined) user.fullName = fullName;
    if (gender !== undefined) user.gender = gender;
    if (dob !== undefined) {
      user.dob = dob ? new Date(dob) : null;
      // Calculate age from dob if provided
      if (dob) {
        const birthDate = new Date(dob);
        const today = new Date();
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }
        user.age = calculatedAge;
      }
    }
    if (age !== undefined) user.age = age;
    if (heightCm !== undefined) user.heightCm = heightCm;
    if (weightKg !== undefined) user.weightKg = weightKg;
    if (bmi !== undefined) user.bmi = bmi;
    if (bmr !== undefined) user.bmr = bmr;
    if (dailyCalories !== undefined) user.dailyCalories = dailyCalories;
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;
    
    // Handle password update separately to ensure it gets hashed
    if (password !== undefined && password !== null && password !== "") {
      if (password.length < 5) {
        return res.status(400).json({ message: "Password must be at least 5 characters" });
      }
      user.password = password; // Will be hashed by the model's pre-save hook
    }
    
    // Save user to trigger pre-save hooks
    const updated = await user.save();
    
    // Update goal progress if weight was updated
    if (weightKg !== undefined) {
      goalController.updateProgressForGoalType(userId, 'weight').catch(err => {
        // Error handled silently
      });
    }
    
    // Remove password from response
    const userResponse = updated.toObject();
    delete userResponse.password;
    
    return res.json({ user: userResponse });
  } catch (err) {
    // Error handled silently
    return res.status(500).json({ message: "Error updating profile" });
  }
};

// Save fitness calculations (BMI, BMR, etc.)
exports.saveFitnessCalculations = async (req, res) => {
  try {
    const { weight, height, dob, gender, bmi, bmr, dailyCalories } = req.body;
    
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Find user first, then update and save to trigger pre-save hooks
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update fields
    if (weight !== undefined) user.weightKg = weight;
    if (height !== undefined) user.heightCm = height;
    if (dob !== undefined) user.dob = dob ? new Date(dob) : null;
    if (gender !== undefined) user.gender = gender;
    if (bmi !== undefined) user.bmi = bmi;
    if (bmr !== undefined) user.bmr = bmr;
    if (dailyCalories !== undefined) user.dailyCalories = dailyCalories;

    // Calculate age from dob if provided
    if (dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      user.age = age;
    }
    
    // Save user to trigger pre-save hooks
    const updated = await user.save();
    
    // Update goal progress if weight was updated
    if (weight !== undefined) {
      goalController.updateProgressForGoalType(userId, 'weight').catch(err => {
        // Error handled silently
      });
    }
    
    // Remove password from response
    const userResponse = updated.toObject();
    delete userResponse.password;
    
    return res.json({ user: userResponse, message: "Fitness calculations saved successfully" });
  } catch (err) {
    // Error handled silently
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
    // Error handled silently
    return res.status(500).json({ message: 'Error fetching profile' });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { currentPassword, newPassword } = req.body;

    // Validate inputs
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 5) {
      return res.status(400).json({ message: 'New password must be at least 5 characters' });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Verify current password
    const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password (will be hashed by model's pre-save hook)
    user.password = newPassword;
    await user.save();

    return res.json({ ok: true, message: 'Password changed successfully' });
  } catch (err) {
    // Error handled silently
    return res.status(500).json({ message: 'Error changing password' });
  }
};

