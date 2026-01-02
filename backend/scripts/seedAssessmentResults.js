/**
 * Seed Script: Assessment Results Mock Data
 * 
 * Creates sample AssessmentResult records (complete submissions with answers)
 * to match the weekly assessment data
 */

const mongoose = require("mongoose");
const AssessmentResult = require("../models/AssessmentResult");
const Assessment = require("../models/Assessment");
const User = require("../models/User");

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/equilife";

async function seedAssessmentResults() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✓ Connected to MongoDB");

    // Determine target user for seeding assessment results
    const seedEmail = process.env.SEED_USER_EMAIL || "test@example.com";
    let testUser = await User.findOne({ email: seedEmail });
    if (!testUser) {
      testUser = await User.findOne();
      if (testUser) {
        console.log("✓ Using first existing user for seeding results:", testUser._id);
      } else {
        console.log("❌ No user found to attach results to. Create a user first or set SEED_USER_EMAIL.");
        await mongoose.connection.close();
        process.exit(1);
      }
    } else {
      console.log("✓ Using seed user:", testUser._id);
    }

    // Get assessments by code (safer - seed file sets `code` field)
    const gad7 = await Assessment.findOne({ code: "gad7" });
    const phq9 = await Assessment.findOne({ code: "phq9" });
    const ghq12 = await Assessment.findOne({ code: "ghq12" });

    if (!gad7 || !phq9 || !ghq12) {
      console.log("❌ Assessments not found. Make sure assessments are seeded first (node scripts/seedAssessments.js).");
      await mongoose.connection.close();
      process.exit(1);
    }
    console.log("✓ Found all assessments");

    // Clear existing results for this user
    await AssessmentResult.deleteMany({ userId: testUser._id });
    console.log("✓ Cleared previous mock results");

    // Create mock results matching the weekly data
    const mockResults = [
      {
        userId: testUser._id,
        assessmentId: gad7._id,
        assessmentName: "GAD-7",
        totalScore: 8,
        answers: {
          0: 1, 1: 1, 2: 2, 3: 1, 4: 1, 5: 1, 6: 0,
        },
        severityLabel: "Mild",
      },
      {
        userId: testUser._id,
        assessmentId: phq9._id,
        assessmentName: "PHQ-9",
        totalScore: 6,
        answers: {
          0: 1, 1: 1, 2: 1, 3: 1, 4: 0, 5: 1, 6: 0, 7: 1, 8: 0,
        },
        severityLabel: "Mild",
      },
      {
        userId: testUser._id,
        assessmentId: gad7._id,
        assessmentName: "GAD-7",
        totalScore: 7,
        answers: {
          0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 0,
        },
        severityLabel: "Mild",
      },
      {
        userId: testUser._id,
        assessmentId: phq9._id,
        assessmentName: "PHQ-9",
        totalScore: 5,
        answers: {
          0: 1, 1: 1, 2: 1, 3: 0, 4: 0, 5: 1, 6: 0, 7: 1, 8: 0,
        },
        severityLabel: "Minimal",
      },
      {
        userId: testUser._id,
        assessmentId: gad7._id,
        assessmentName: "GAD-7",
        totalScore: 5,
        answers: {
          0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 0, 6: 0,
        },
        severityLabel: "Mild",
      },
      {
        userId: testUser._id,
        assessmentId: gad7._id,
        assessmentName: "GAD-7",
        totalScore: 4,
        answers: {
          0: 1, 1: 1, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0,
        },
        severityLabel: "Minimal",
      },
      {
        userId: testUser._id,
        assessmentId: phq9._id,
        assessmentName: "PHQ-9",
        totalScore: 4,
        answers: {
          0: 1, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 1, 8: 0,
        },
        severityLabel: "Minimal",
      },
    ];

    const inserted = await AssessmentResult.insertMany(mockResults);
    console.log("✓ Inserted", inserted.length, "assessment result records");

    console.log("\n📋 Assessment Results Added:");
    console.log("─".repeat(60));
    console.log("Assessment | Score | Severity");
    console.log("─".repeat(60));
    inserted.forEach((result) => {
      console.log(
        `${result.assessmentName.padEnd(10)} | ${String(result.totalScore).padEnd(5)} | ${result.severityLabel}`
      );
    });
    console.log("─".repeat(60));

    console.log("\n✨ Seeding complete!");
    console.log("\nYou can now:");
    console.log("1. View assessment history on the Assessment page");
    console.log("2. Check latest scores in the app");
    console.log("3. See the weekly trends graph with all data");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

seedAssessmentResults();
