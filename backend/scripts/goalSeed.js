const mongoose = require('mongoose');
const Goal = require('../models/Goal'); // template schema for predefined goals
const dotenv = require('dotenv');

dotenv.config();

const goals = [
  {
    title: "Control Anxiety",
    description: "Reduce anxiety levels based on GAD-7 assessment scores",
    goalType: "mental_health",
    metric: "gad7",
    improvementDirection: "decrease"
  },
  {
    title: "Reduce Depression",
    description: "Improve mood based on PHQ-9 assessment scores",
    goalType: "mental_health",
    metric: "phq9",
    improvementDirection: "decrease"
  },
  {
    title: "Improve General Mental Health",
    description: "Enhance overall wellbeing based on GHQ-12 scores",
    goalType: "mental_health",
    metric: "ghq12",
    improvementDirection: "decrease"
  },
  {
    title: "Get Slim",
    description: "Achieve healthy BMI through balanced calories and activity",
    goalType: "weight",
    metric: "weight",
    improvementDirection: "decrease"
  },
  {
    title: "Build Muscle",
    description: "Gain muscle mass through calorie surplus and protein intake",
    goalType: "nutrition",
    metric: "protein",
    improvementDirection: "increase"
  },
  {
    title: "Improve Daily Activity",
    description: "Increase weekly calories burned through regular exercise",
    goalType: "activity",
    metric: "calories_burned",
    improvementDirection: "increase"
  }
];

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    await Goal.deleteMany({}); // remove old templates
    await Goal.insertMany(goals);
    console.log("Predefined goals seeded successfully!");
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });