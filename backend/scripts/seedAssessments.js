require('dotenv').config();
const mongoose = require('mongoose');
const Assessment = require('../models/Assessment');

const assessmentData = [
  {
    name: "GAD-7",
    shortName: "Anxiety Assessment",
    description: "A brief screening tool to identify and measure the severity of generalized anxiety disorder symptoms.",
    scoringType: "likert",
    totalQuestions: 7,
    questions: [
      {
        questionText: "Feeling nervous, anxious, or on edge",
        questionOrder: 1,
        options: [
          { optionText: "Not at all", weight: 0, optionOrder: 1 },
          { optionText: "Several days", weight: 1, optionOrder: 2 },
          { optionText: "More than half the days", weight: 2, optionOrder: 3 },
          { optionText: "Nearly every day", weight: 3, optionOrder: 4 },
        ],
      },
      {
        questionText: "Not being able to stop or control worrying",
        questionOrder: 2,
        options: [
          { optionText: "Not at all", weight: 0, optionOrder: 1 },
          { optionText: "Several days", weight: 1, optionOrder: 2 },
          { optionText: "More than half the days", weight: 2, optionOrder: 3 },
          { optionText: "Nearly every day", weight: 3, optionOrder: 4 },
        ],
      },
      {
        questionText: "Worrying too much about different things",
        questionOrder: 3,
        options: [
          { optionText: "Not at all", weight: 0, optionOrder: 1 },
          { optionText: "Several days", weight: 1, optionOrder: 2 },
          { optionText: "More than half the days", weight: 2, optionOrder: 3 },
          { optionText: "Nearly every day", weight: 3, optionOrder: 4 },
        ],
      },
      {
        questionText: "Trouble relaxing",
        questionOrder: 4,
        options: [
          { optionText: "Not at all", weight: 0, optionOrder: 1 },
          { optionText: "Several days", weight: 1, optionOrder: 2 },
          { optionText: "More than half the days", weight: 2, optionOrder: 3 },
          { optionText: "Nearly every day", weight: 3, optionOrder: 4 },
        ],
      },
      {
        questionText: "Being so restless that it is hard to sit still",
        questionOrder: 5,
        options: [
          { optionText: "Not at all", weight: 0, optionOrder: 1 },
          { optionText: "Several days", weight: 1, optionOrder: 2 },
          { optionText: "More than half the days", weight: 2, optionOrder: 3 },
          { optionText: "Nearly every day", weight: 3, optionOrder: 4 },
        ],
      },
      {
        questionText: "Becoming easily annoyed or irritable",
        questionOrder: 6,
        options: [
          { optionText: "Not at all", weight: 0, optionOrder: 1 },
          { optionText: "Several days", weight: 1, optionOrder: 2 },
          { optionText: "More than half the days", weight: 2, optionOrder: 3 },
          { optionText: "Nearly every day", weight: 3, optionOrder: 4 },
        ],
      },
      {
        questionText: "Feeling afraid, as if something awful might happen",
        questionOrder: 7,
        options: [
          { optionText: "Not at all", weight: 0, optionOrder: 1 },
          { optionText: "Several days", weight: 1, optionOrder: 2 },
          { optionText: "More than half the days", weight: 2, optionOrder: 3 },
          { optionText: "Nearly every day", weight: 3, optionOrder: 4 },
        ],
      },
    ],
  },
  {
    name: "PHQ-9",
    shortName: "Depression Assessment",
    description: "Used for screening, diagnosing, and monitoring the severity of depressive symptoms over the past two weeks.",
    scoringType: "likert",
    totalQuestions: 9,
    questions: [
      {
        questionText: "Little interest or pleasure in doing things",
        questionOrder: 1,
        options: [
          { optionText: "Not at all", weight: 0, optionOrder: 1 },
          { optionText: "Several days", weight: 1, optionOrder: 2 },
          { optionText: "More than half the days", weight: 2, optionOrder: 3 },
          { optionText: "Nearly every day", weight: 3, optionOrder: 4 },
        ],
      },
      {
        questionText: "Feeling down, depressed, or hopeless",
        questionOrder: 2,
        options: [
          { optionText: "Not at all", weight: 0, optionOrder: 1 },
          { optionText: "Several days", weight: 1, optionOrder: 2 },
          { optionText: "More than half the days", weight: 2, optionOrder: 3 },
          { optionText: "Nearly every day", weight: 3, optionOrder: 4 },
        ],
      },
      {
        questionText: "Trouble falling or staying asleep, or sleeping too much",
        questionOrder: 3,
        options: [
          { optionText: "Not at all", weight: 0, optionOrder: 1 },
          { optionText: "Several days", weight: 1, optionOrder: 2 },
          { optionText: "More than half the days", weight: 2, optionOrder: 3 },
          { optionText: "Nearly every day", weight: 3, optionOrder: 4 },
        ],
      },
      {
        questionText: "Feeling tired or having little energy",
        questionOrder: 4,
        options: [
          { optionText: "Not at all", weight: 0, optionOrder: 1 },
          { optionText: "Several days", weight: 1, optionOrder: 2 },
          { optionText: "More than half the days", weight: 2, optionOrder: 3 },
          { optionText: "Nearly every day", weight: 3, optionOrder: 4 },
        ],
      },
      {
        questionText: "Poor appetite or overeating",
        questionOrder: 5,
        options: [
          { optionText: "Not at all", weight: 0, optionOrder: 1 },
          { optionText: "Several days", weight: 1, optionOrder: 2 },
          { optionText: "More than half the days", weight: 2, optionOrder: 3 },
          { optionText: "Nearly every day", weight: 3, optionOrder: 4 },
        ],
      },
      {
        questionText: "Feeling bad about yourself or that you are a failure or have let yourself or your family down",
        questionOrder: 6,
        options: [
          { optionText: "Not at all", weight: 0, optionOrder: 1 },
          { optionText: "Several days", weight: 1, optionOrder: 2 },
          { optionText: "More than half the days", weight: 2, optionOrder: 3 },
          { optionText: "Nearly every day", weight: 3, optionOrder: 4 },
        ],
      },
      {
        questionText: "Trouble concentrating on things, such as reading the newspaper or watching television",
        questionOrder: 7,
        options: [
          { optionText: "Not at all", weight: 0, optionOrder: 1 },
          { optionText: "Several days", weight: 1, optionOrder: 2 },
          { optionText: "More than half the days", weight: 2, optionOrder: 3 },
          { optionText: "Nearly every day", weight: 3, optionOrder: 4 },
        ],
      },
      {
        questionText: "Moving or speaking so slowly that other people could have noticed. Or the opposite—being so fidgety or restless that you have been moving around a lot more than usual",
        questionOrder: 8,
        options: [
          { optionText: "Not at all", weight: 0, optionOrder: 1 },
          { optionText: "Several days", weight: 1, optionOrder: 2 },
          { optionText: "More than half the days", weight: 2, optionOrder: 3 },
          { optionText: "Nearly every day", weight: 3, optionOrder: 4 },
        ],
      },
      {
        questionText: "Thoughts that you would be better off dead, or of hurting yourself",
        questionOrder: 9,
        options: [
          { optionText: "Not at all", weight: 0, optionOrder: 1 },
          { optionText: "Several days", weight: 1, optionOrder: 2 },
          { optionText: "More than half the days", weight: 2, optionOrder: 3 },
          { optionText: "Nearly every day", weight: 3, optionOrder: 4 },
        ],
      },
    ],
  },
  {
    name: "GHQ-12",
    shortName: "General Health Questionnaire",
    description: "A self-assessment tool designed to detect psychological distress and early signs of mental health concerns.",
    scoringType: "likert",
    totalQuestions: 12,
    questions: [
      {
        questionText: "Been able to concentrate on whatever you're doing",
        questionOrder: 1,
        options: [
          { optionText: "Better than usual", weight: 0, optionOrder: 1 },
          { optionText: "Same as usual", weight: 0, optionOrder: 2 },
          { optionText: "Less than usual", weight: 1, optionOrder: 3 },
          { optionText: "Much less than usual", weight: 1, optionOrder: 4 },
        ],
      },
      {
        questionText: "Lost much sleep over worry",
        questionOrder: 2,
        options: [
          { optionText: "Not at all", weight: 0, optionOrder: 1 },
          { optionText: "No more than usual", weight: 0, optionOrder: 2 },
          { optionText: "Rather more than usual", weight: 1, optionOrder: 3 },
          { optionText: "Much more than usual", weight: 1, optionOrder: 4 },
        ],
      },
      {
        questionText: "Felt that you are playing a useful part in things",
        questionOrder: 3,
        options: [
          { optionText: "More than usual", weight: 0, optionOrder: 1 },
          { optionText: "Same as usual", weight: 0, optionOrder: 2 },
          { optionText: "Less than usual", weight: 1, optionOrder: 3 },
          { optionText: "Much less than usual", weight: 1, optionOrder: 4 },
        ],
      },
      {
        questionText: "Felt capable of making decisions about things",
        questionOrder: 4,
        options: [
          { optionText: "More able than usual", weight: 0, optionOrder: 1 },
          { optionText: "Same as usual", weight: 0, optionOrder: 2 },
          { optionText: "Less able than usual", weight: 1, optionOrder: 3 },
          { optionText: "Much less able", weight: 1, optionOrder: 4 },
        ],
      },
      {
        questionText: "Felt constantly under strain",
        questionOrder: 5,
        options: [
          { optionText: "Not at all", weight: 0, optionOrder: 1 },
          { optionText: "No more than usual", weight: 0, optionOrder: 2 },
          { optionText: "Rather more than usual", weight: 1, optionOrder: 3 },
          { optionText: "Much more than usual", weight: 1, optionOrder: 4 },
        ],
      },
      {
        questionText: "Felt you couldn't overcome your difficulties",
        questionOrder: 6,
        options: [
          { optionText: "Not at all", weight: 0, optionOrder: 1 },
          { optionText: "No more than usual", weight: 0, optionOrder: 2 },
          { optionText: "Rather more than usual", weight: 1, optionOrder: 3 },
          { optionText: "Much more than usual", weight: 1, optionOrder: 4 },
        ],
      },
      {
        questionText: "Been able to enjoy your normal day-to-day activities",
        questionOrder: 7,
        options: [
          { optionText: "More than usual", weight: 0, optionOrder: 1 },
          { optionText: "Same as usual", weight: 0, optionOrder: 2 },
          { optionText: "Less than usual", weight: 1, optionOrder: 3 },
          { optionText: "Much less than usual", weight: 1, optionOrder: 4 },
        ],
      },
      {
        questionText: "Been able to face up to your problems",
        questionOrder: 8,
        options: [
          { optionText: "Better than usual", weight: 0, optionOrder: 1 },
          { optionText: "Same as usual", weight: 0, optionOrder: 2 },
          { optionText: "Less able than usual", weight: 1, optionOrder: 3 },
          { optionText: "Much less able", weight: 1, optionOrder: 4 },
        ],
      },
      {
        questionText: "Been feeling unhappy or depressed",
        questionOrder: 9,
        options: [
          { optionText: "Not at all", weight: 0, optionOrder: 1 },
          { optionText: "No more than usual", weight: 0, optionOrder: 2 },
          { optionText: "Rather more than usual", weight: 1, optionOrder: 3 },
          { optionText: "Much more than usual", weight: 1, optionOrder: 4 },
        ],
      },
      {
        questionText: "Been losing confidence in yourself",
        questionOrder: 10,
        options: [
          { optionText: "Not at all", weight: 0, optionOrder: 1 },
          { optionText: "No more than usual", weight: 0, optionOrder: 2 },
          { optionText: "Rather more than usual", weight: 1, optionOrder: 3 },
          { optionText: "Much more than usual", weight: 1, optionOrder: 4 },
        ],
      },
      {
        questionText: "Been thinking of yourself as a worthless person",
        questionOrder: 11,
        options: [
          { optionText: "Not at all", weight: 0, optionOrder: 1 },
          { optionText: "No more than usual", weight: 0, optionOrder: 2 },
          { optionText: "Rather more than usual", weight: 1, optionOrder: 3 },
          { optionText: "Much more than usual", weight: 1, optionOrder: 4 },
        ],
      },
      {
        questionText: "Been feeling reasonably happy, all things considered",
        questionOrder: 12,
        options: [
          { optionText: "More than usual", weight: 0, optionOrder: 1 },
          { optionText: "Same as usual", weight: 0, optionOrder: 2 },
          { optionText: "Less than usual", weight: 1, optionOrder: 3 },
          { optionText: "Much less than usual", weight: 1, optionOrder: 4 },
        ],
      },
    ],
  },
];

const seedAssessments = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing assessments
    await Assessment.deleteMany({});
    console.log('Cleared existing assessments');

    // Insert new assessments
    const created = await Assessment.insertMany(assessmentData);
    console.log(`✓ Successfully seeded ${created.length} assessments`);

    created.forEach((assessment) => {
      console.log(`  - ${assessment.name} (${assessment.totalQuestions} questions)`);
    });

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedAssessments();
