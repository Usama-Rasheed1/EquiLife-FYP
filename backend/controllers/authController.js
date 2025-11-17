const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { generateAccessToken } = require("../utils/token");

exports.register = async (req, res) => {
  const { fullName,email, password } = req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "Email already exists" });

    // Create user with hashed password
    await User.create({ fullName, email, password });

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Registration Error:", err);
    res.status(500).json({ message: "Error registering user" });
  }
};

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user._id);

    res.json({ accessToken });
  } catch (err) {
    res.status(500).json({ message: "Error logging in" });
  }
};

// Update profile fields separately
exports.updateProfile = async (req, res) => {
  const { fullName, gender, dob, heightCm, weightKg } = req.body;
  try {
    const updates = {};
    if (fullName !== undefined) updates.fullName = fullName;
    if (gender !== undefined) updates.gender = gender;
    if (dob !== undefined) updates.dob = dob ? new Date(dob) : null;
    if (heightCm !== undefined) updates.heightCm = heightCm;
    if (weightKg !== undefined) updates.weightKg = weightKg;

    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const updated = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).select("-password");
    if (!updated) return res.status(404).json({ message: "User not found" });

    return res.json({ user: updated });
  } catch (err) {
    console.error("Update profile error:", err);
    return res.status(500).json({ message: "Error updating profile" });
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
