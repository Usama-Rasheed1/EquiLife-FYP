/**
 * Seed Script: Weekly Assessment Mock Data
 * 
 * Creates sample WeeklyAssessmentSummary records for visualization
 * Demonstrates:
 * - 5 weeks of assessment data
 * - Varying scores for each assessment type
 * - Some weeks with missing assessments (NULL values)
 * - Week progression showing trends
 */

const mongoose = require("mongoose");
const WeeklyAssessmentSummary = require("../models/WeeklyAssessmentSummary");
const User = require("../models/User");

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/equilife";

async function seedWeeklyAssessments() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✓ Connected to MongoDB");

    // Determine target user for seeding
    const seedEmail = process.env.SEED_USER_EMAIL || "test@example.com";
    let testUser = await User.findOne({ email: seedEmail });

    if (!testUser) {
      // If configured seed email not found, try any existing user
      testUser = await User.findOne();
      if (testUser) {
        console.log("✓ Using first existing user for seeding:", testUser._id);
      } else {
        // No users exist; create a test user
        console.log("No users found - creating test user...");
        testUser = await User.create({
          email: seedEmail,
          password: "hashedPassword123", // In real app, this would be hashed
          name: "Test User",
        });
        console.log("✓ Test user created:", testUser._id);
      }
    } else {
      console.log("✓ Using seed user:", testUser._id);
    }

    // Clear existing weekly assessments for this user
    await WeeklyAssessmentSummary.deleteMany({ userId: testUser._id });
    console.log("✓ Cleared previous mock data");

    // Mock data: 5 weeks showing progression and trends
    const mockWeeks = [
      {
        weekNumber: 1,
        gadScore: 8,      // Moderate anxiety
        phqScore: null,   // Not taken
        ghqScore: 10,     // Moderate wellbeing
      },
      {
        weekNumber: 2,
        gadScore: 7,      // Slight improvement
        phqScore: 6,      // Light depression
        ghqScore: 11,     // Improved wellbeing
      },
      {
        weekNumber: 3,
        gadScore: null,   // Skipped
        phqScore: 5,      // Improved depression
        ghqScore: null,   // Skipped
      },
      {
        weekNumber: 4,
        gadScore: 5,      // Good improvement in anxiety
        phqScore: null,   // Not taken
          ghqScore: 11,     // Good wellbeing
      },
      {
        weekNumber: 5,
        gadScore: 4,      // Minimal anxiety (trending towards normal)
        phqScore: 4,      // Minimal depression (great improvement)
          ghqScore: 12,     // Excellent wellbeing (maximum score)
      },
    ];

    // Insert mock data with current timestamp
    const now = new Date();
    const weeklyRecords = mockWeeks.map((week) => ({
      userId: testUser._id,
      weekNumber: week.weekNumber,
      gadScore: week.gadScore,
      phqScore: week.phqScore,
      ghqScore: week.ghqScore,
      lastUpdatedAt: new Date(now.getTime() - (5 - week.weekNumber) * 7 * 24 * 60 * 60 * 1000),
    }));

    const inserted = await WeeklyAssessmentSummary.insertMany(weeklyRecords);
    console.log("✓ Inserted", inserted.length, "weekly assessment records");

    // Display inserted data
    console.log("\n📊 Mock Data Summary:");
    console.log("─".repeat(70));
    inserted.forEach((record) => {
      console.log(
        `Week ${record.weekNumber}: GAD-7=${record.gadScore || "-"} | PHQ-9=${record.phqScore || "-"} | GHQ-12=${record.ghqScore || "-"}`
      );
    });
    console.log("─".repeat(70));

    console.log("\n✨ Seeding complete!");
    console.log("Test user ID:", testUser._id);
    console.log("\nYou can now:");
    console.log("1. Login with: test@example.com");
    console.log("2. Navigate to Assessment page to see the graph with 5 weeks of data");
    console.log("3. See visualization of anxiety, depression, and wellbeing trends");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

seedWeeklyAssessments();
