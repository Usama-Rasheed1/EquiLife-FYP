import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import CustomExerciseModal from "../components/CustomExerciseModal";
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts";
import {  Trash2, Plus, Minus, ChevronDown, ChevronUp } from "lucide-react";
import * as fitnessService from "../services/fitnessService";

const Fitness = () => {
  const [editIndex, setEditIndex] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editExercise, setEditExercise] = useState(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState("");
  const [gymAccordionOpen, setGymAccordionOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [predefinedExercises, setPredefinedExercises] = useState([]);
  const [customExercises, setCustomExercises] = useState([]);
  const [userFitnessData, setUserFitnessData] = useState(null);
  const navigate = useNavigate();

  // Get all exercises (predefined + custom)
  const allExercises = [...predefinedExercises, ...customExercises];
  
  // Separate continuous and discrete for display
  const continuousExercises = allExercises.filter(e => e.type === "continuous");
  const discreteExercises = allExercises.filter(e => e.type === "discrete");

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

  // Get all exercises including custom ones (for dropdown)
  const getAllExercisesIncludingCustom = () => {
    return allExercises.map(e => ({
      ...e,
      isCustom: customExercises.some(ce => ce._id === e._id || ce.name === e.name)
    }));
  };

  // Get exercise details by name or ID
  const getExerciseDetails = (exerciseNameOrId) => {
    const allExercisesWithCustom = getAllExercisesIncludingCustom();
    return allExercisesWithCustom.find((e) => e.name === exerciseNameOrId || e._id === exerciseNameOrId);
  };
  
  // Get exercise by ID
  const getExerciseById = (exerciseId) => {
    return allExercises.find((e) => e._id === exerciseId);
  };

  // Fetch exercises and weekly logs on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch predefined exercises
        const predefined = await fitnessService.getPredefinedExercises();
        setPredefinedExercises(predefined || []);
        
        // Fetch custom exercises (if logged in)
        try {
          const token = localStorage.getItem('authToken');
          if (token) {
            const custom = await fitnessService.getCustomExercises();
            setCustomExercises(custom || []);
            
            // Fetch user fitness data (BMI, BMR)
            try {
              const response = await fetch(
                `${import.meta.env.VITE_BACKEND_BASE_URL}/api/auth/profile`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              if (response.ok) {
                const data = await response.json();
                setUserFitnessData(data.user);
              }
            } catch (err) {
              console.warn('Could not fetch user fitness data', err);
            }
          }
        } catch (err) {
          console.warn('Could not fetch custom exercises', err);
        }
        
        // Fetch weekly logs
        const today = new Date().toISOString().slice(0, 10);
        try {
          const token = localStorage.getItem('authToken');
          if (token) {
            const weekData = await fitnessService.getExerciseLogsByWeek(null, today);
            if (weekData && weekData.activities) {
              // Transform backend data to frontend format
              const transformed = {};
              Object.keys(weekData.activities).forEach(day => {
                transformed[day] = weekData.activities[day].map(log => {
                  const exercise = log.exerciseId || {};
                  return {
                    _id: log._id,
                    name: exercise.name || log.name || 'Unknown',
                    type: exercise.type || log.type,
                    intensity: exercise.intensity || log.intensity,
                    duration: log.duration,
                    reps: log.reps,
                    caloriesBurned: log.caloriesBurned,
                    caloriesPerMinute: exercise.caloriesPerMinute,
                    caloriesPerRep: exercise.caloriesPerRep,
                    isCustom: log.exerciseModel === 'ExerciseCustom',
                    exerciseId: log.exerciseId?._id || log.exerciseId,
                    exerciseModel: log.exerciseModel,
                  };
                });
              });
              setWeeklyActivities(transformed);
            }
          }
        } catch (err) {
          console.warn('Could not fetch weekly logs', err);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

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
  const handleAddExercise = async () => {
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

    try {
      const today = new Date().toISOString().slice(0, 10);
      const isCustom = customExercises.some(ce => ce._id === exercise._id || ce.name === exercise.name);
      
      const logData = {
        exerciseId: exercise._id,
        exerciseModel: isCustom ? 'ExerciseCustom' : 'ExercisePredefined',
        day: formData.selectedDay,
        date: today,
        duration: formData.exerciseType === "continuous" ? parseFloat(value) : null,
        reps: formData.exerciseType === "discrete" ? parseFloat(value) : null,
      };

      const savedLog = await fitnessService.addExerciseLog(logData);
      
      // Check if exercise was incremented (already existed) or newly added
      if (savedLog.wasIncremented) {
        // Update existing entry in state
        setWeeklyActivities((prev) => {
          const updated = { ...prev };
          const dayActivities = [...prev[formData.selectedDay]];
          
          // Find existing entry by exerciseId (same exercise for same day)
          const exerciseIndex = dayActivities.findIndex(
            item => item.exerciseId && item.exerciseId.toString() === exercise._id.toString()
          );
          
          if (exerciseIndex !== -1) {
            // Update existing entry with new values
            const oldValue = exercise.type === "continuous" 
              ? dayActivities[exerciseIndex].duration 
              : dayActivities[exerciseIndex].reps;
            const newValue = exercise.type === "continuous" 
              ? savedLog.duration 
              : savedLog.reps;
            const added = newValue - oldValue;
            
            dayActivities[exerciseIndex] = {
              ...dayActivities[exerciseIndex],
              _id: savedLog._id,
              duration: savedLog.duration,
              reps: savedLog.reps,
              caloriesBurned: savedLog.caloriesBurned,
            };
            
            // Show notification
            const unit = exercise.type === "continuous" ? "minutes" : "reps";
            console.log(`Added ${added} ${unit} to existing ${exercise.name} entry`);
          } else {
            // If not found, add as new entry (shouldn't happen, but fallback)
            const exerciseEntry = {
              _id: savedLog._id,
              name: exercise.name,
              type: exercise.type,
              intensity: exercise.intensity || formData.intensity,
              duration: savedLog.duration,
              reps: savedLog.reps,
              caloriesBurned: savedLog.caloriesBurned,
              caloriesPerMinute: exercise.caloriesPerMinute,
              caloriesPerRep: exercise.caloriesPerRep,
              isCustom: isCustom,
              exerciseId: exercise._id,
              exerciseModel: savedLog.exerciseModel,
            };
            dayActivities.push(exerciseEntry);
          }
          updated[formData.selectedDay] = dayActivities;
          return updated;
        });
      } else {
        // Add new entry
        const exerciseEntry = {
          _id: savedLog._id,
          name: exercise.name,
          type: exercise.type,
          intensity: exercise.intensity || formData.intensity,
          duration: savedLog.duration,
          reps: savedLog.reps,
          caloriesBurned: savedLog.caloriesBurned,
          caloriesPerMinute: exercise.caloriesPerMinute,
          caloriesPerRep: exercise.caloriesPerRep,
          isCustom: isCustom,
          exerciseId: exercise._id,
          exerciseModel: savedLog.exerciseModel,
        };

        setWeeklyActivities((prev) => ({
          ...prev,
          [formData.selectedDay]: [...prev[formData.selectedDay], exerciseEntry],
        }));
      }

      // Reset form
      setFormData({
        selectedDay: formData.selectedDay, // Keep the day selected
        selectedExercise: "",
        exerciseType: "continuous",
        duration: "",
        reps: "",
        intensity: "moderate",
      });
    } catch (err) {
      console.error('Error adding exercise:', err);
      alert(err.message || 'Failed to add exercise');
    }
  };

  // Handle custom exercise from modal
  const handleAddCustomExercise = async (exercise) => {
    if (!selectedDay) return;

    try {
      // First, create the custom exercise in the backend
      const customExerciseData = {
        name: exercise.name,
        type: exercise.type,
        caloriesPerMinute: exercise.caloriesPerMinute || 0,
        caloriesPerRep: exercise.caloriesPerRep || 0,
        intensity: exercise.intensity,
      };

      const savedCustomExercise = await fitnessService.createCustomExercise(customExerciseData);
      
      // Update custom exercises list
      setCustomExercises(prev => [...prev, savedCustomExercise]);

      // Then, log the exercise for the selected day
      const today = new Date().toISOString().slice(0, 10);
      const logData = {
        exerciseId: savedCustomExercise._id,
        exerciseModel: 'ExerciseCustom',
        day: selectedDay,
        date: today,
        duration: exercise.duration,
        reps: exercise.reps,
      };

      const savedLog = await fitnessService.addExerciseLog(logData);

      // Check if exercise was incremented (already existed) or newly added
      if (savedLog.wasIncremented) {
        // Update existing entry in state
        setWeeklyActivities((prev) => {
          const updated = { ...prev };
          const dayActivities = [...prev[selectedDay]];
          
          // Find existing entry by exerciseId (same exercise for same day)
          const exerciseIndex = dayActivities.findIndex(
            item => item.exerciseId && item.exerciseId.toString() === savedCustomExercise._id.toString()
          );
          
          if (exerciseIndex !== -1) {
            // Update existing entry with new values
            const oldValue = savedCustomExercise.type === "continuous" 
              ? dayActivities[exerciseIndex].duration 
              : dayActivities[exerciseIndex].reps;
            const newValue = savedCustomExercise.type === "continuous" 
              ? savedLog.duration 
              : savedLog.reps;
            const added = newValue - oldValue;
            
            dayActivities[exerciseIndex] = {
              ...dayActivities[exerciseIndex],
              _id: savedLog._id,
              duration: savedLog.duration,
              reps: savedLog.reps,
              caloriesBurned: savedLog.caloriesBurned,
            };
            
            // Show notification
            const unit = savedCustomExercise.type === "continuous" ? "minutes" : "reps";
            console.log(`Added ${added} ${unit} to existing ${savedCustomExercise.name} entry`);
          } else {
            // If not found, add as new entry (shouldn't happen, but fallback)
            const exerciseEntry = {
              _id: savedLog._id,
              name: savedCustomExercise.name,
              type: savedCustomExercise.type,
              intensity: savedCustomExercise.intensity,
              duration: savedLog.duration,
              reps: savedLog.reps,
              caloriesBurned: savedLog.caloriesBurned,
              caloriesPerMinute: savedCustomExercise.caloriesPerMinute,
              caloriesPerRep: savedCustomExercise.caloriesPerRep,
              isCustom: true,
              exerciseId: savedCustomExercise._id,
              exerciseModel: savedLog.exerciseModel,
            };
            dayActivities.push(exerciseEntry);
          }
          updated[selectedDay] = dayActivities;
          return updated;
        });
      } else {
        // Add new entry
        const exerciseEntry = {
          _id: savedLog._id,
          name: savedCustomExercise.name,
          type: savedCustomExercise.type,
          intensity: savedCustomExercise.intensity,
          duration: savedLog.duration,
          reps: savedLog.reps,
          caloriesBurned: savedLog.caloriesBurned,
          caloriesPerMinute: savedCustomExercise.caloriesPerMinute,
          caloriesPerRep: savedCustomExercise.caloriesPerRep,
          isCustom: true,
          exerciseId: savedCustomExercise._id,
          exerciseModel: savedLog.exerciseModel,
        };

        setWeeklyActivities((prev) => ({
          ...prev,
          [selectedDay]: [...prev[selectedDay], exerciseEntry],
        }));
      }
    } catch (err) {
      console.error('Error adding custom exercise:', err);
      alert(err.message || 'Failed to add custom exercise');
    }
  };

  // Increase/decrease quantity (for editing)
  const handleQuantityChange = async (day, index, changeType) => {
    const item = weeklyActivities[day][index];
    if (!item || !item._id) return;

    try {
      let updates = {};
      if (item.type === "continuous") {
        const newDuration =
          changeType === "inc"
            ? (item.duration || 0) + 1
            : Math.max(1, (item.duration || 0) - 1);
        updates.duration = newDuration;
      } else {
        const newReps =
          changeType === "inc"
            ? (item.reps || 0) + 1
            : Math.max(1, (item.reps || 0) - 1);
        updates.reps = newReps;
      }

      const updatedLog = await fitnessService.updateExerciseLog(item._id, updates);

      // Update local state
      setWeeklyActivities((prev) => {
        const updated = { ...prev };
        updated[day][index] = {
          ...item,
          duration: updatedLog.duration,
          reps: updatedLog.reps,
          caloriesBurned: updatedLog.caloriesBurned,
        };
        return updated;
      });
    } catch (err) {
      console.error('Error updating exercise:', err);
      alert(err.message || 'Failed to update exercise');
    }
  };

  // Delete exercise
  const handleDelete = async (day, index) => {
    const item = weeklyActivities[day][index];
    if (!item || !item._id) {
      // If no ID, just remove from local state (for items not yet saved)
      setWeeklyActivities((prev) => {
        const updated = { ...prev };
        updated[day] = prev[day].filter((_, i) => i !== index);
        return updated;
      });
      return;
    }

    try {
      await fitnessService.deleteExerciseLog(item._id);
      
      // Update local state
      setWeeklyActivities((prev) => {
        const updated = { ...prev };
        updated[day] = prev[day].filter((_, i) => i !== index);
        return updated;
      });
    } catch (err) {
      console.error('Error deleting exercise:', err);
      alert(err.message || 'Failed to delete exercise');
    }
  };

  // Edit exercise
  const handleEdit = (day, index) => {
    const currentItem = weeklyActivities[day][index];
    setEditIndex({ day, index });
    setEditValue(currentItem.name);
    setEditExercise(currentItem);
  };

  // Save edited exercise
  const handleSaveEdit = async (day, index) => {
    const exercise = getExerciseDetails(editValue);
    if (!exercise) return;

    const currentItem = weeklyActivities[day][index];
    if (!currentItem._id) {
      // If no ID, treat as new entry
      alert('Cannot edit unsaved exercise. Please delete and re-add.');
      setEditIndex(null);
      setEditExercise(null);
      return;
    }

    try {
      // If exercise changed, we need to update the log with new exercise
      // For simplicity, we'll delete the old log and create a new one
      // Or we could update the backend to support exercise change
      
      // For now, if exercise name changed, delete and recreate
      if (currentItem.name !== exercise.name) {
        await fitnessService.deleteExerciseLog(currentItem._id);
        
        const today = new Date().toISOString().slice(0, 10);
        const isCustom = customExercises.some(ce => ce._id === exercise._id || ce.name === exercise.name);
        
        const logData = {
          exerciseId: exercise._id,
          exerciseModel: isCustom ? 'ExerciseCustom' : 'ExercisePredefined',
          day: day,
          date: today,
          duration: exercise.type === "continuous" ? (currentItem.duration || 0) : null,
          reps: exercise.type === "discrete" ? (currentItem.reps || 0) : null,
        };

        const savedLog = await fitnessService.addExerciseLog(logData);
        
        setWeeklyActivities((prev) => {
          const updated = { ...prev };
          updated[day][index] = {
            _id: savedLog._id,
            name: exercise.name,
            type: exercise.type,
            intensity: exercise.intensity,
            duration: savedLog.duration,
            reps: savedLog.reps,
            caloriesBurned: savedLog.caloriesBurned,
            caloriesPerMinute: exercise.caloriesPerMinute,
            caloriesPerRep: exercise.caloriesPerRep,
            isCustom: isCustom,
            exerciseId: exercise._id,
            exerciseModel: savedLog.exerciseModel,
          };
          return updated;
        });
      } else {
        // Just update duration/reps if exercise didn't change
        const updates = {};
        if (exercise.type === "continuous") {
          updates.duration = currentItem.duration || 0;
        } else {
          updates.reps = currentItem.reps || 0;
        }
        
        const updatedLog = await fitnessService.updateExerciseLog(currentItem._id, updates);
        
        setWeeklyActivities((prev) => {
          const updated = { ...prev };
          updated[day][index] = {
            ...currentItem,
            duration: updatedLog.duration,
            reps: updatedLog.reps,
            caloriesBurned: updatedLog.caloriesBurned,
          };
          return updated;
        });
      }

      setEditIndex(null);
      setEditExercise(null);
    } catch (err) {
      console.error('Error saving edit:', err);
      alert(err.message || 'Failed to save changes');
    }
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

  // Check if there's any activity data
  const totalWeekCalories = getWeekTotalCalories();
  const hasActivityData = totalWeekCalories > 0;
  const displayChartData = hasActivityData ? chartData : [{ name: 'No Data', value: 1 }];
  const displayColors = hasActivityData ? COLORS : ['#E5E7EB'];

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
                {allExercises.map((exercise) => (
                  <option key={exercise._id || exercise.name} value={exercise.name}>
                    {exercise.name} ({exercise.type === "continuous" ? `${exercise.caloriesPerMinute || 0} cal/min` : `${exercise.caloriesPerRep || 0} cal/rep`})
                    {customExercises.some(ce => ce._id === exercise._id || ce.name === exercise.name) ? " (Custom)" : ""}
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

                            <button>
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
              {userFitnessData?.bmi ? userFitnessData.bmi.toFixed(1) : "N/A"}
            </p>
            {!userFitnessData?.bmi && (
              <p className="text-xs text-gray-500 text-center mt-1">
                Calculate in Fitness Calculations
              </p>
            )}
          </div>

          <div>
            <h4 className="text-base sm:text-lg font-semibold mb-1">BMR</h4>
            <p className="text-xl sm:text-2xl font-bold text-green-600 text-center">
              {userFitnessData?.bmr ? `${Math.round(userFitnessData.bmr)} Kcal` : "N/A"}
            </p>
            {!userFitnessData?.bmr && (
              <p className="text-xs text-gray-500 text-center mt-1">
                Calculate in Fitness Calculations
              </p>
            )}
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
            <div className="w-full h-40 sm:h-48 md:h-38 flex justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={displayChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius="55%"
                    outerRadius="70%"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {displayChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={displayColors[index % displayColors.length]} />
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

          <button onClick={() => navigate('/fitness/calculations')} className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg shadow transition-all self-center w-full mt-1 cursor-pointer text-sm sm:text-base">
            Calculate Body Metrics
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