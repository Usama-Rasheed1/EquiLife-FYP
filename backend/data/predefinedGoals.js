const predefinedGoals = [
    {
      id: "control-anxiety",
      title: "Control Anxiety",
      description: "Reduce anxiety levels based on GAD-7 assessment scores",
      goalType: "gad7",
      metric: "GAD-7",
      type: "mental",
      improvementDirection: "decrease"
    },
    {
      id: "reduce-depression",
      title: "Reduce Depression",
      description: "Improve mood based on PHQ-9 assessment scores",
      goalType: "phq9",
      metric: "PHQ-9",
      type: "mental",
      improvementDirection: "decrease"
    },
    {
      id: "improve-mental-health",
      title: "Improve General Mental Health",
      description: "Enhance overall wellbeing based on GHQ-12 scores",
      goalType: "ghq12",
      metric: "GHQ-12",
      type: "mental",
      improvementDirection: "decrease"
    },
    {
      id: "get-slim",
      title: "Get Slim",
      description: "Achieve healthy BMI through balanced calories and activity",
      goalType: "weight",
      metric: "Weight (kg)",
      type: "fitness",
      improvementDirection: "decrease"
    },
    {
      id: "build-muscle",
      title: "Build Muscle",
      description: "Gain muscle mass through calorie surplus and protein intake",
      goalType: "protein",
      metric: "Protein Intake (g)",
      type: "fitness",
      improvementDirection: "increase"
    },
    {
      id: "improve-activity",
      title: "Improve Daily Activity",
      description: "Increase weekly calories burned through regular exercise",
      goalType: "calories_burned",
      metric: "Weekly Calories Burned",
      type: "fitness",
      improvementDirection: "increase"
    }
  ];
  
  module.exports = predefinedGoals;
  