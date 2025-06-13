const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { generateAccessToken } = require("../utils/token");

exports.register = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "Email already exists" });

    // Create user with hashed password
    await User.create({ email, password });

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
