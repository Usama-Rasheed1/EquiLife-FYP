const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();

// lightweight CORS handling for dev: allow requests and preflight from the frontend
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    );
    return res.status(200).end();
  }
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);
const nutritionRoutes = require("./routes/nutritionRoutes");
app.use("/api/nutrition", nutritionRoutes);

// Messages (chat) API
const messageRoutes = require("./routes/messageRoutes");
app.use("/api/messages", messageRoutes);

// Mount new EquiLife routes
// const workoutRoutes = require('./routes/workoutRoutes');
const newMealRoutes = require("./routes/mealRoutes");
const foodRoutes = require("./routes/foodRoutes");
const fitnessRoutes = require("./routes/fitnessRoutes");

// Foods endpoints (predefined + user custom)
app.use("/api/foods", foodRoutes);

// Meal logging and retrieval (snapshot-based)
app.use("/api/meals", newMealRoutes);

// Fitness/exercise endpoints (predefined + user custom + logging)
app.use("/api/fitness", fitnessRoutes);

// Existing workout routes kept as-is
// app.use('/api/workouts', workoutRoutes);

// Debug: inspect socket room members (dev only)
try {
  const { getRoomMembers } = require("./socket");
  app.get("/debug/rooms/:room", (req, res) => {
    const room = req.params.room;
    const members = getRoomMembers(room);
    res.json({ room, count: members.length, members });
  });
} catch (err) {
  console.warn("Socket debug route not available:", err.message);
}

// Goals and Assessments routes
const goalRoutes = require("./routes/goalRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
app.use("/api/goals", goalRoutes);
app.use("/api/assessments", assessmentRoutes);

// Notifications
const notificationRoutes = require("./routes/notificationRoutes");
app.use("/api/notifications", notificationRoutes);
// simple ping for debugging routing/proxy issues
app.get("/api/notifications/ping", (req, res) =>
  res.json({ ok: true, ts: Date.now() })
);
console.log("Notification routes mounted at /api/notifications");

// Gamification
const gamificationRoutes = require("./routes/gamificationRoutes");
app.use("/api/gamification", gamificationRoutes);

module.exports = app;
