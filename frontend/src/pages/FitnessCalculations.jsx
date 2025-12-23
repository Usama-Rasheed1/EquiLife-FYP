import React, { useState } from "react";
import Layout from "../components/Layout";
import { Scale, Flame, Activity } from "lucide-react";

const FitnessCalculations = () => {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  
  // Validation errors
  const [errors, setErrors] = useState({
    weight: "",
    height: "",
    age: "",
  });

  // Results
  const [results, setResults] = useState(null);

  // Real-time validation
  const validateField = (name, value) => {
    let error = "";
    
    switch (name) {
      case "weight":
        if (!value || value.trim() === "") {
          error = "Weight is required";
        } else if (parseFloat(value) <= 0) {
          error = "Weight must be greater than 0";
        } else if (parseFloat(value) > 500) {
          error = "Weight must be realistic (less than 500 kg)";
        }
        break;
      case "height":
        if (!value || value.trim() === "") {
          error = "Height is required";
        } else if (parseFloat(value) <= 0) {
          error = "Height must be greater than 0";
        } else if (parseFloat(value) > 300) {
          error = "Height must be realistic (less than 300 cm)";
        }
        break;
      case "age":
        if (!value || value.trim() === "") {
          error = "Age is required";
        } else if (parseInt(value) <= 0) {
          error = "Age must be greater than 0";
        } else if (parseInt(value) > 150) {
          error = "Age must be realistic (less than 150 years)";
        }
        break;
      default:
        break;
    }
    
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
    
    return error === "";
  };

  const handleWeightChange = (e) => {
    const value = e.target.value;
    setWeight(value);
    validateField("weight", value);
  };

  const handleHeightChange = (e) => {
    const value = e.target.value;
    setHeight(value);
    validateField("height", value);
  };

  const handleAgeChange = (e) => {
    const value = e.target.value;
    setAge(value);
    validateField("age", value);
  };

  const handleGenderChange = (e) => {
    setGender(e.target.value);
  };

  // Check if form is valid
  const isFormValid = () => {
    return (
      weight &&
      height &&
      age &&
      !errors.weight &&
      !errors.height &&
      !errors.age &&
      parseFloat(weight) > 0 &&
      parseFloat(height) > 0 &&
      parseInt(age) > 0
    );
  };

  const calculate = () => {
    // Validate all fields before calculation
    const weightValid = validateField("weight", weight);
    const heightValid = validateField("height", height);
    const ageValid = validateField("age", age);

    if (!weightValid || !heightValid || !ageValid) {
      return;
    }

    const w = parseFloat(weight);
    const h = parseFloat(height) / 100; // Convert cm to meters
    const a = parseInt(age);

    // BMI calculation
    const bmiValue = w / (h * h);
    const roundedBmi = Math.round(bmiValue * 10) / 10;

    // BMR calculation (Mifflin-St Jeor Equation)
    let bmrValue;
    if (gender === "male") {
      bmrValue = 10 * w + 6.25 * (h * 100) - 5 * a + 5;
    } else {
      bmrValue = 10 * w + 6.25 * (h * 100) - 5 * a - 161;
    }
    const roundedBmr = Math.round(bmrValue);

    // Get BMI classification
    let bmiCategory = "";
    let bmiColor = "";
    if (roundedBmi < 18.5) {
      bmiCategory = "Underweight";
      bmiColor = "text-blue-600";
    } else if (roundedBmi < 25) {
      bmiCategory = "Normal";
      bmiColor = "text-green-600";
    } else if (roundedBmi < 30) {
      bmiCategory = "Overweight";
      bmiColor = "text-yellow-600";
    } else {
      bmiCategory = "Obese";
      bmiColor = "text-red-600";
    }

    // Get BMR interpretation
    let bmrCategory = "";
    let bmrColor = "";
    let bmrDescription = "";
    
    // BMR ranges based on age and gender (approximate)
    if (gender === "male") {
      if (roundedBmr < 1400) {
        bmrCategory = "Low Metabolism";
        bmrColor = "text-blue-600";
        bmrDescription = "Your BMR is below average. Consider increasing physical activity and muscle mass.";
      } else if (roundedBmr < 1800) {
        bmrCategory = "Normal Metabolism";
        bmrColor = "text-green-600";
        bmrDescription = "Your BMR is within the normal range for your age and gender.";
      } else {
        bmrCategory = "High Metabolism";
        bmrColor = "text-orange-600";
        bmrDescription = "Your BMR is above average. You have a faster metabolism.";
      }
    } else {
      if (roundedBmr < 1200) {
        bmrCategory = "Low Metabolism";
        bmrColor = "text-blue-600";
        bmrDescription = "Your BMR is below average. Consider increasing physical activity and muscle mass.";
      } else if (roundedBmr < 1600) {
        bmrCategory = "Normal Metabolism";
        bmrColor = "text-green-600";
        bmrDescription = "Your BMR is within the normal range for your age and gender.";
      } else {
        bmrCategory = "High Metabolism";
        bmrColor = "text-orange-600";
        bmrDescription = "Your BMR is above average. You have a faster metabolism.";
      }
    }

    // Calculate daily calorie needs (BMR * activity factor)
    const sedentary = Math.round(roundedBmr * 1.2);
    const lightActivity = Math.round(roundedBmr * 1.375);
    const moderateActivity = Math.round(roundedBmr * 1.55);
    const active = Math.round(roundedBmr * 1.725);
    const veryActive = Math.round(roundedBmr * 1.9);

    // Estimate body fat percentage (simple approximation)
    // Using Deurenberg formula: BF% = (1.20 × BMI) + (0.23 × Age) - (10.8 × gender) - 5.4
    // gender: 1 for male, 0 for female
    const genderFactor = gender === "male" ? 1 : 0;
    const estimatedBodyFat = Math.round(
      (1.20 * roundedBmi) + (0.23 * a) - (10.8 * genderFactor) - 5.4
    );

    setResults({
      bmi: roundedBmi,
      bmr: roundedBmr,
      bmiCategory,
      bmiColor,
      bmrCategory,
      bmrColor,
      bmrDescription,
      estimatedBodyFat: Math.max(5, Math.min(50, estimatedBodyFat)), // Clamp between 5-50%
      dailyCalories: {
        sedentary,
        lightActivity,
        moderateActivity,
        active,
        veryActive,
      },
    });
  };

  const handleRecalculate = () => {
    setResults(null);
    setWeight("");
    setHeight("");
    setAge("");
    setGender("male");
    setErrors({
      weight: "",
      height: "",
      age: "",
    });
  };

  // BMI recommendations
  const getBMIRecommendation = (bmi, category) => {
    if (category === "Underweight") {
      return "Consider consulting with a healthcare provider to develop a healthy weight gain plan. Focus on nutrient-dense foods and strength training to build muscle mass safely.";
    } else if (category === "Normal") {
      return "Great! You're in a healthy weight range. Maintain your current lifestyle with balanced nutrition and regular physical activity.";
    } else if (category === "Overweight") {
      return "Consider a balanced approach to weight management: combine moderate calorie reduction with regular exercise. Aim for gradual, sustainable weight loss of 0.5-1 kg per week.";
    } else {
      return "It's important to consult with a healthcare provider to develop a safe and effective weight management plan. Focus on sustainable lifestyle changes including diet modification and increased physical activity.";
    }
  };

  // BMR recommendations
  const getBMRRecommendation = (category, bmr) => {
    if (category === "Low Metabolism") {
      return "To boost your metabolism, focus on building muscle through strength training, eating protein-rich meals, staying hydrated, and getting adequate sleep. Consider increasing your daily activity level gradually.";
    } else if (category === "Normal Metabolism") {
      return "Your metabolism is functioning well. Maintain your current activity level and balanced diet. Continue regular exercise to preserve muscle mass and metabolic health.";
    } else {
      return "With a higher metabolism, ensure you're consuming enough calories to support your energy needs. Focus on nutrient-dense foods and maintain regular physical activity to preserve muscle mass.";
    }
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4 sm:p-6 bg-gray-50">
        {!results ? (
          // Form View
          <div className="w-full max-w-2xl">
            <h2 className="text-3xl font-bold mb-2 text-center text-gray-800">
              Fitness Calculations
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Enter your details to calculate your BMI and BMR
            </p>

            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 space-y-6">
              {/* Weight Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Weight (kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={weight}
                  onChange={handleWeightChange}
                  onBlur={() => validateField("weight", weight)}
                  className={`mt-1 w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 transition-colors ${
                    errors.weight
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                  placeholder="Enter weight in kilograms"
                  min="1"
                  step="0.1"
                />
                {errors.weight && (
                  <p className="mt-1 text-sm text-red-600">{errors.weight}</p>
                )}
                {!errors.weight && weight && (
                  <p className="mt-1 text-xs text-gray-500">
                    Enter your current weight in kilograms
                  </p>
                )}
              </div>

              {/* Height Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Height (cm) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={handleHeightChange}
                  onBlur={() => validateField("height", height)}
                  className={`mt-1 w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 transition-colors ${
                    errors.height
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                  placeholder="Enter height in centimeters"
                  min="1"
                  step="0.1"
                />
                {errors.height && (
                  <p className="mt-1 text-sm text-red-600">{errors.height}</p>
                )}
                {!errors.height && height && (
                  <p className="mt-1 text-xs text-gray-500">
                    Enter your height in centimeters
                  </p>
                )}
              </div>

              {/* Age Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Age <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={handleAgeChange}
                  onBlur={() => validateField("age", age)}
                  className={`mt-1 w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 transition-colors ${
                    errors.age
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                  placeholder="Enter your age"
                  min="1"
                  step="1"
                />
                {errors.age && (
                  <p className="mt-1 text-sm text-red-600">{errors.age}</p>
                )}
                {!errors.age && age && (
                  <p className="mt-1 text-xs text-gray-500">
                    Enter your current age in years
                  </p>
                )}
              </div>

              {/* Gender Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  value={gender}
                  onChange={handleGenderChange}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Gender affects BMR calculation
                </p>
              </div>

              {/* Calculate Button */}
              <button
                onClick={calculate}
                disabled={!isFormValid()}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 ${
                  isFormValid()
                    ? "bg-blue-500 hover:bg-blue-600 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                Calculate
              </button>
            </div>
          </div>
        ) : (
          // Results View - New Design
          <div className="w-full max-w-6xl space-y-6 animate-fadeIn">
            {/* Section 1: Summary Cards (Top Row) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* BMI Card */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Scale className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Body Mass Index</p>
                    <p className="text-3xl font-bold text-gray-800">{results.bmi}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      results.bmiCategory === "Underweight"
                        ? "bg-blue-100 text-blue-700"
                        : results.bmiCategory === "Normal"
                        ? "bg-green-100 text-green-700"
                        : results.bmiCategory === "Overweight"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {results.bmiCategory}
                  </span>
                </div>
              </div>

              {/* BMR Card */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Flame className="text-green-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Basal Metabolic Rate</p>
                    <p className="text-3xl font-bold text-gray-800">{results.bmr}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Calories needed per day at rest
                </p>
              </div>

              {/* Estimated Body Fat Card */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Activity className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estimated Body Fat</p>
                    <p className="text-3xl font-bold text-gray-800">
                      {results.estimatedBodyFat}%
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">Approximate value</p>
              </div>
            </div>

            {/* Section 2: Classification Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* BMI Classification Table */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">BMI Classification</h3>
                <div className="overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Range
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Category
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        className={`border-b ${
                          results.bmiCategory === "Underweight"
                            ? "bg-blue-50 font-semibold"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="py-3 px-4 text-sm text-gray-700">&lt; 18.5</td>
                        <td className="py-3 px-4 text-sm text-gray-700">Underweight</td>
                      </tr>
                      <tr
                        className={`border-b ${
                          results.bmiCategory === "Normal"
                            ? "bg-green-50 font-semibold"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="py-3 px-4 text-sm text-gray-700">18.5–24.9</td>
                        <td className="py-3 px-4 text-sm text-gray-700">Normal</td>
                      </tr>
                      <tr
                        className={`border-b ${
                          results.bmiCategory === "Overweight"
                            ? "bg-yellow-50 font-semibold"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="py-3 px-4 text-sm text-gray-700">25–29.9</td>
                        <td className="py-3 px-4 text-sm text-gray-700">Overweight</td>
                      </tr>
                      <tr
                        className={`${
                          results.bmiCategory === "Obese"
                            ? "bg-red-50 font-semibold"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="py-3 px-4 text-sm text-gray-700">≥ 30</td>
                        <td className="py-3 px-4 text-sm text-gray-700">Obese</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* BMR Usage Guide */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">BMR Usage Guide</h3>
                <div className="overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Activity Level
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Daily Calories
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-700">Sedentary</td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-800">
                          {results.dailyCalories.sedentary} kcal
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-700">Light</td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-800">
                          {results.dailyCalories.lightActivity} kcal
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-gray-50 bg-blue-50 font-semibold">
                        <td className="py-3 px-4 text-sm text-gray-700">Moderate</td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-800">
                          {results.dailyCalories.moderateActivity} kcal
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-700">Active</td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-800">
                          {results.dailyCalories.active} kcal
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Section 3: Personalized Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* BMI Recommendation Card */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Scale className="text-blue-600" size={20} />
                  BMI Recommendation
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {getBMIRecommendation(results.bmi, results.bmiCategory)}
                </p>
              </div>

              {/* BMR Recommendation Card */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Flame className="text-green-600" size={20} />
                  BMR Recommendation
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {getBMRRecommendation(results.bmrCategory, results.bmr)}
                </p>
              </div>
            </div>

            {/* Recalculate Button */}
            <div className="flex justify-center pt-4">
              <button
                onClick={handleRecalculate}
                className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-8 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
              >
                Recalculate
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </Layout>
  );
};

export default FitnessCalculations;
