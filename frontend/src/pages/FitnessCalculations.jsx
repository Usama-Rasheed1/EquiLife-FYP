// src/pages/fitness/FitnessCalculations.jsx
import React, { useState } from "react";
import Layout from "../components/Layout";

const FitnessCalculations = () => {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  const [bmi, setBmi] = useState(null);
  const [bmr, setBmr] = useState(null);

  const calculate = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100;
    const a = parseInt(age);

    if (!w || !h || !a) {
      alert("Please enter valid values");
      return;
    }

    // BMI calculation
    const bmiValue = w / (h * h);
    setBmi(Math.round(bmiValue * 10) / 10);

    // BMR calculation (Mifflin-St Jeor Equation)
    let bmrValue;
    if (gender === "male") {
      bmrValue = 10 * w + 6.25 * (h * 100) - 5 * a + 5;
    } else {
      bmrValue = 10 * w + 6.25 * (h * 100) - 5 * a - 161;
    }
    setBmr(Math.round(bmrValue));
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center p-6">
        <h2 className="text-2xl font-bold mb-4">Fitness Calculations</h2>

        <div className="w-full max-w-md space-y-4 bg-white p-6 rounded-lg shadow">
          <div>
            <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter weight in kg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter height in cm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Age</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter age"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <button
            onClick={calculate}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Calculate
          </button>

          {bmi !== null && bmr !== null && (
            <div className="mt-4 space-y-2">
              <p className="text-lg font-semibold">BMI: <span className="text-blue-600">{bmi}</span></p>
              <p className="text-lg font-semibold">BMR: <span className="text-green-600">{bmr} Kcal/day</span></p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default FitnessCalculations;