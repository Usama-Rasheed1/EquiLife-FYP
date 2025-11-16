import React, { useState } from "react";
import Layout from "../components/Layout";
import CustomExerciseModal from "../components/CustomExerciseModal";
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts";
import { Pencil, Trash2, Plus, Minus, ChevronDown, ChevronUp } from "lucide-react";

const Fitness = () => {
  const [editIndex, setEditIndex] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editExercise, setEditExercise] = useState(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState("");
  const [gymAccordionOpen, setGymAccordionOpen] = useState(false);

  // Predefined continuous exercises (calories per minute)
  const continuousExercises = [
    { name: "Walking", caloriesPerMinute: 4.5, type: "continuous", intensity: "low" },
    { name: "Running", caloriesPerMinute: 11.5, type: "continuous", intensity: "high" },
    { name: "Jogging", caloriesPerMinute: 8.5, type: "continuous", intensity: "moderate" },
    { name: "Swimming", caloriesPerMinute: 10, type: "continuous", intensity: "high" },
    { name: "Cycling", caloriesPerMinute: 8, type: "continuous", intensity: "moderate" },
    { name: "Yoga", caloriesPerMinute: 3, type: "continuous", intensity: "low" },
  ];

  // Predefined discrete exercises (calories per rep)
  const discreteExercises = [
    { name: "Pushups", caloriesPerRep: 0.5, type: "discrete", intensity: "moderate" },
    { name: "Squats", caloriesPerRep: 0.4, type: "discrete", intensity: "moderate" },
    { name: "Lunges", caloriesPerRep: 0.5, type: "discrete", intensity: "moderate" },
    { name: "Crunches", caloriesPerRep: 0.3, type: "discrete", intensity: "low" },
    { name: "Bench Press", caloriesPerRep: 1.2, type: "discrete", intensity: "high" },
    { name: "Deadlift", caloriesPerRep: 1.5, type: "discrete", intensity: "high" },
    { name: "Pull-ups", caloriesPerRep: 0.8, type: "discrete", intensity: "high" },
    { name: "Burpees", caloriesPerRep: 1.0, type: "discrete", intensity: "high" },
  ];

  // Combined exercise list for dropdown
  const allExercises = [...continuousExercises, ...discreteExercises];

  // Weekly state (Mon-Sun)
  const [weeklyActivities, setWeeklyActivities] = useState({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  });

  // State for form inputs
  const [formData, setFormData] = useState({
    selectedDay: "",
    selectedExercise: "",
    exerciseType: "continuous", // "continuous" or "discrete"
    duration: "", // minutes for continuous
    reps: "", // reps/sets for discrete
    intensity: "moderate",
  });

  // Get all exercises including custom ones
  const getAllExercisesIncludingCustom = () => {
    const customExercises = Object.values(weeklyActivities)
      .flat()
      .filter((item) => item.isCustom)
      .map((item) => ({
        name: item.name,
        type: item.type,
        caloriesPerMinute: item.type === "continuous" ? (item.caloriesBurned / (item.duration || 1)) : null,
        caloriesPerRep: item.type === "discrete" ? (item.caloriesBurned / (item.reps || 1)) : null,
        intensity: item.intensity,
        isCustom: true,
      }));
    
    // Remove duplicates
    const uniqueCustom = customExercises.filter((custom, index, self) =>
      index === self.findIndex((c) => c.name === custom.name)
    );
    
    return [...allExercises, ...uniqueCustom];
  };

  // Get exercise details
  const getExerciseDetails = (exerciseName) => {
    const allExercisesWithCustom = getAllExercisesIncludingCustom();
    return allExercisesWithCustom.find((e) => e.name === exerciseName);
  };

  // Calculate calories burned
  const calculateCalories = (exercise, value, type) => {
    if (type === "continuous") {
      return exercise.caloriesPerMinute * parseFloat(value || 0);
    } else {
      return exercise.caloriesPerRep * parseFloat(value || 0);
    }
  };

  // Handle form input change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Auto-detect exercise type when exercise is selected
    if (name === "selectedExercise" && value) {
      const exercise = getExerciseDetails(value);
      if (exercise) {
        setFormData((prev) => ({
          ...prev,
          exerciseType: exercise.type,
        }));
      }
    }
  };

  // Add exercise to selected day
  const handleAddExercise = () => {
    if (!formData.selectedDay || !formData.selectedExercise) {
      return;
    }

    const exercise = getExerciseDetails(formData.selectedExercise);
    if (!exercise) return;

    const value =
      formData.exerciseType === "continuous"
        ? formData.duration
        : formData.reps;

    if (!value || parseFloat(value) <= 0) {
      return;
    }

    const caloriesBurned = calculateCalories(
      exercise,
      value,
      formData.exerciseType
    );

    const exerciseEntry = {
      name: exercise.name,
      type: exercise.type,
      intensity: exercise.intensity || formData.intensity,
      duration: formData.exerciseType === "continuous" ? parseFloat(value) : null,
      reps: formData.exerciseType === "discrete" ? parseFloat(value) : null,
      caloriesBurned: Math.round(caloriesBurned * 10) / 10,
      isCustom: exercise.isCustom || false,
    };

    setWeeklyActivities((prev) => ({
      ...prev,
      [formData.selectedDay]: [...prev[formData.selectedDay], exerciseEntry],
    }));

    // Reset form
    setFormData({
      selectedDay: formData.selectedDay, // Keep the day selected
      selectedExercise: "",
      exerciseType: "continuous",
      duration: "",
      reps: "",
      intensity: "moderate",
    });
  };

  // Handle custom exercise from modal
  const handleAddCustomExercise = (exercise) => {
    if (!selectedDay) return;

    setWeeklyActivities((prev) => ({
      ...prev,
      [selectedDay]: [...prev[selectedDay], exercise],
    }));
  };

  // Increase/decrease quantity (for editing)
  const handleQuantityChange = (day, index, type) => {
    setWeeklyActivities((prev) => {
      const updated = { ...prev };
      const item = prev[day][index];

      if (item.type === "continuous") {
        const newDuration =
          type === "inc"
            ? (item.duration || 0) + 1
            : Math.max(1, (item.duration || 0) - 1);
        // Use stored caloriesPerMinute from item, or calculate from exercise details, or calculate from current values
        const caloriesPerMinute = item.caloriesPerMinute || 
          (getExerciseDetails(item.name)?.caloriesPerMinute) || 
          (item.duration > 0 ? (item.caloriesBurned / item.duration) : 0);
        updated[day][index] = {
          ...item,
          duration: newDuration,
          caloriesBurned: Math.round(caloriesPerMinute * newDuration * 10) / 10,
        };
      } else {
        const newReps =
          type === "inc"
            ? (item.reps || 0) + 1
            : Math.max(1, (item.reps || 0) - 1);
        // Use stored caloriesPerRep from item, or calculate from exercise details, or calculate from current values
        const caloriesPerRep = item.caloriesPerRep || 
          (getExerciseDetails(item.name)?.caloriesPerRep) || 
          (item.reps > 0 ? (item.caloriesBurned / item.reps) : 0);
        updated[day][index] = {
          ...item,
          reps: newReps,
          caloriesBurned: Math.round(caloriesPerRep * newReps * 10) / 10,
        };
      }

      return updated;
    });
  };

  // Delete exercise
  const handleDelete = (day, index) => {
    setWeeklyActivities((prev) => {
      const updated = { ...prev };
      updated[day] = prev[day].filter((_, i) => i !== index);
      return updated;
    });
  };

  // Edit exercise
  const handleEdit = (day, index) => {
    const currentItem = weeklyActivities[day][index];
    setEditIndex({ day, index });
    setEditValue(currentItem.name);
    setEditExercise(currentItem);
  };

  // Save edited exercise
  const handleSaveEdit = (day, index) => {
    const exercise = getExerciseDetails(editValue);
    if (!exercise) return;

    const currentItem = weeklyActivities[day][index];
    const value =
      exercise.type === "continuous"
        ? currentItem.duration || 0
        : currentItem.reps || 0;

    const caloriesBurned = calculateCalories(exercise, value, exercise.type);

    setWeeklyActivities((prev) => {
      const updated = { ...prev };
      updated[day][index] = {
        ...exercise,
        duration: exercise.type === "continuous" ? value : null,
        reps: exercise.type === "discrete" ? value : null,
        caloriesBurned: Math.round(caloriesBurned * 10) / 10,
        isCustom: exercise.isCustom || false,
      };
      return updated;
    });

    setEditIndex(null);
    setEditExercise(null);
  };

  // Calculate total calories for a day
  const getDayTotalCalories = (day) => {
    return weeklyActivities[day].reduce(
      (sum, item) => sum + (item.caloriesBurned || 0),
      0
    );
  };

  // Calculate total calories for the week
  const getWeekTotalCalories = () => {
    return Object.keys(weeklyActivities).reduce(
      (total, day) => total + getDayTotalCalories(day),
      0
    );
  };

  // Get chart data for donut chart (7 days)
  const getChartData = () => {
    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    return days.map((day) => ({
      name: day.substring(0, 3),
      value: Math.round(getDayTotalCalories(day)),
    }));
  };

  const chartData = getChartData();
  const COLORS = [
    "#3b82f6",
    "#22c55e",
    "#facc15",
    "#ef4444",
    "#a855f7",
    "#f97316",
    "#06b6d4",
  ];

  // Get current item calories (for editing)
  const getCurrentItemCalories = (item, day, index) => {
    if (editIndex?.day === day && editIndex?.index === index && editExercise) {
      const exercise = getExerciseDetails(editValue);
      if (exercise) {
        const value =
          exercise.type === "continuous"
            ? item.duration || 0
            : item.reps || 0;
        return calculateCalories(exercise, value, exercise.type);
      }
    }
    return item.caloriesBurned || 0;
  };

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row bg-white h-[calc(100vh-64px)] overflow-hidden">
        {/* Left Side - Scrollable Form and Cards */}
        <div className="flex-1 p-3 sm:p-6 border-r border-gray-200 overflow-y-auto scrollbar-hide">
          {/* Add Exercise Form */}
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
            Add Exercise
          </h2>

          <div className="flex flex-col gap-3 sm:gap-4 mb-6">
            {/* Day Selection */}
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Day
              </label>
              <select
                name="selectedDay"
                value={formData.selectedDay}
                onChange={handleFormChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 cursor-pointer text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Day</option>
                {Object.keys(weeklyActivities).map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            {/* Exercise Selection */}
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Exercise
              </label>
              <select
                name="selectedExercise"
                value={formData.selectedExercise}
                onChange={(e) => {
                  const selectedValue = e.target.value;
                  handleFormChange(e);
                  
                  // Open modal immediately when Custom is selected
                  if (selectedValue === "Custom") {
                    if (!formData.selectedDay) {
                      alert("Please select a day first");
                      setFormData((prev) => ({
                        ...prev,
                        selectedExercise: "",
                      }));
                      return;
                    }
                    setSelectedDay(formData.selectedDay);
                    setIsCustomModalOpen(true);
                  }
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 cursor-pointer text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Exercise</option>
                {continuousExercises.map((exercise) => (
                  <option key={exercise.name} value={exercise.name}>
                    {exercise.name} ({exercise.type === "continuous" ? `${exercise.caloriesPerMinute} cal/min` : `${exercise.caloriesPerRep} cal/rep`})
                  </option>
                ))}
                <option value="Custom">+ Add Custom Exercise</option>
              </select>
            </div>

            {/* Exercise Type Toggle (auto-detected but can be shown) */}
            {formData.selectedExercise && formData.selectedExercise !== "Custom" && (
              <div className="flex-1 min-w-0">
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Type: {formData.exerciseType === "continuous" ? "Duration (minutes)" : "Reps/Sets"}
                </label>
                {formData.exerciseType === "continuous" ? (
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter duration in minutes"
                    min="1"
                    step="1"
                  />
                ) : (
                  <input
                    type="number"
                    name="reps"
                    value={formData.reps}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter reps/sets"
                    min="1"
                    step="1"
                  />
                )}
              </div>
            )}

            {/* Add Button */}
            {formData.selectedDay && formData.selectedExercise && formData.selectedExercise !== "Custom" && (
              <button
                onClick={handleAddExercise}
                className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base"
              >
                Add Exercise
              </button>
            )}
          </div>

          {/* Predefined Exercises Accordion */}
          <div className="mb-6 border border-gray-200 rounded-lg">
            <button
              onClick={() => setGymAccordionOpen(!gymAccordionOpen)}
              className="w-full flex items-center justify-between p-3 sm:p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-base sm:text-lg font-semibold">
                Gym Exercises (Reps/Sets)
              </h3>
              {gymAccordionOpen ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </button>
            {gymAccordionOpen && (
              <div className="p-3 sm:p-4 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {discreteExercises.map((exercise) => (
                    <div
                      key={exercise.name}
                      className="bg-gray-50 p-2 sm:p-3 rounded-lg text-sm"
                    >
                      <p className="font-medium">{exercise.name}</p>
                      <p className="text-gray-600 text-xs">
                        {exercise.caloriesPerRep} cal/rep
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Weekly Activity Tracker */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-4">
            <h3 className="text-base sm:text-lg font-semibold">
              Weekly Activity Tracker
            </h3>
            <span className="bg-blue-100 text-blue-600 text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full">
              Week Total: {Math.round(getWeekTotalCalories())} Kcal
            </span>
          </div>

          {/* Day Cards */}
          <div className="space-y-4 pb-8">
            {Object.keys(weeklyActivities).map((day) => (
              <div
                key={day}
                className="border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <h4 className="font-semibold text-sm sm:text-base">{day}</h4>
                  <span className="text-xs sm:text-sm text-gray-600 font-medium">
                    Total: {Math.round(getDayTotalCalories(day))} Kcal
                  </span>
                </div>
                {weeklyActivities[day].length === 0 ? (
                  <p className="text-gray-400 text-sm">No exercises added</p>
                ) : (
                  <ul className="space-y-2">
                    {weeklyActivities[day].map((item, index) => (
                      <li
                        key={index}
                        className="flex flex-wrap items-start sm:items-center justify-between bg-gray-50 p-2 sm:p-3 rounded-lg gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          {editIndex?.day === day &&
                          editIndex?.index === index ? (
                            <select
                              className="w-full border border-gray-300 rounded-md px-2 py-1 mt-6 text-xs sm:text-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 mb-1"
                              value={editValue}
                              onChange={(e) => {
                                const newExerciseName = e.target.value;
                                setEditValue(newExerciseName);
                                const newExercise = getExerciseDetails(
                                  newExerciseName
                                );
                                if (newExercise) {
                                  setEditExercise(newExercise);
                                }
                              }}
                            >
                              {getAllExercisesIncludingCustom().map((exercise) => (
                                <option key={exercise.name} value={exercise.name}>
                                  {exercise.name}
                                  {exercise.isCustom ? " (Custom)" : ""}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                              <p className="font-medium text-sm sm:text-base">
                                {item.name}
                                {item.type === "continuous"
                                  ? ` (${item.duration} min)`
                                  : ` (${item.reps} reps)`}
                              </p>
                              {item.isCustom && (
                                <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm">
                                  Custom
                                </span>
                              )}
                            </div>
                          )}
                          <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            {Math.round(
                              getCurrentItemCalories(item, day, index)
                            )}{" "}
                            kcal
                          </p>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-2 mt-2 sm:mt-0 flex-shrink-0 self-center">
                          <button
                            onClick={() =>
                              handleQuantityChange(day, index, "dec")
                            }
                            className="p-1 rounded-md border hover:bg-gray-100 cursor-pointer flex-shrink-0"
                          >
                            <Minus size={12} className="sm:hidden" />
                            <Minus size={14} className="hidden sm:block" />
                          </button>

                          <span className="px-1 sm:px-2 text-xs sm:text-sm font-semibold min-w-[20px] text-center">
                            {item.type === "continuous"
                              ? item.duration
                              : item.reps}
                          </span>

                          <button
                            onClick={() =>
                              handleQuantityChange(day, index, "inc")
                            }
                            className="p-1 rounded-md border hover:bg-gray-100 cursor-pointer flex-shrink-0"
                          >
                            <Plus size={12} className="sm:hidden" />
                            <Plus size={14} className="hidden sm:block" />
                          </button>

                          {editIndex?.day === day &&
                          editIndex?.index === index ? (
                            <button
                              onClick={() => handleSaveEdit(day, index)}
                              className="text-green-500 hover:text-green-600 font-semibold text-xs sm:text-sm cursor-pointer flex-shrink-0"
                            >
                              Save
                            </button>
                          ) : (
                            <button
                              onClick={() => handleEdit(day, index)}
                              className="text-blue-500 hover:text-blue-600 cursor-pointer flex-shrink-0"
                            >
                              <Pencil size={14} className="sm:hidden" />
                              <Pencil size={16} className="hidden sm:block" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(day, index)}
                            className="text-red-500 hover:text-red-600 cursor-pointer flex-shrink-0"
                          >
                            <Trash2 size={14} className="sm:hidden" />
                            <Trash2 size={16} className="hidden sm:block" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Fixed Section (No Scroll) */}
        <div className="w-full lg:w-1/4 p-3 sm:p-6 bg-gray-50 flex flex-col gap-4 sm:gap-6 border-l border-gray-200">
          <div>
            <h4 className="text-base sm:text-lg font-semibold mb-1">BMI</h4>
            <p className="text-xl sm:text-2xl font-bold text-blue-600 text-center">
              22.8
            </p>
          </div>

          <div>
            <h4 className="text-base sm:text-lg font-semibold mb-1">BMR</h4>
            <p className="text-xl sm:text-2xl font-bold text-green-600 text-center">
              1550 Kcal
            </p>
          </div>

          <div>
            <h4 className="text-base sm:text-lg font-semibold mb-1">
              Calories Burned (Week)
            </h4>
            <p className="text-xl sm:text-2xl font-bold text-red-600 text-center">
              {Math.round(getWeekTotalCalories())} Kcal
            </p>
          </div>

          <div className="w-full flex flex-col items-center bg-white rounded-lg shadow-sm p-3 sm:p-4">
            <h4 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-center">
              Weekly Activity
            </h4>
            <div className="w-full h-40 sm:h-48 md:h-38 flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius="55%"
                    outerRadius="70%"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <button className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg shadow transition-all self-center w-full mt-1 cursor-pointer text-sm sm:text-base">
            Calculate All
          </button>
        </div>
      </div>

      {/* Custom Exercise Modal */}
      <CustomExerciseModal
        isOpen={isCustomModalOpen}
        onClose={() => {
          setIsCustomModalOpen(false);
          if (formData.selectedExercise === "Custom") {
            setFormData((prev) => ({
              ...prev,
              selectedExercise: "",
            }));
          }
        }}
        onAddExercise={(exercise) => {
          handleAddCustomExercise(exercise);
          setFormData((prev) => ({
            ...prev,
            selectedExercise: "",
          }));
        }}
      />
    </Layout>
  );
};

export default Fitness;