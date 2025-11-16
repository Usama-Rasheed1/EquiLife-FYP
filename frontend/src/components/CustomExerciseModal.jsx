import React, { useState } from "react";
import AppModal from "./AppModal";

const CustomExerciseModal = ({ isOpen, onClose, onAddExercise }) => {
  const [formData, setFormData] = useState({
    name: "",
    type: "continuous", // "continuous" or "discrete"
    caloriesPerMinute: "",
    caloriesPerRep: "",
    intensity: "moderate", // "low", "moderate", "high"
    duration: "", // for continuous exercises
    reps: "", // for discrete exercises
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Exercise name validation
    if (!formData.name.trim()) {
      newErrors.name = "Exercise name is required";
    }

    // Type-specific validation
    if (formData.type === "continuous") {
      if (!formData.caloriesPerMinute || parseFloat(formData.caloriesPerMinute) <= 0) {
        newErrors.caloriesPerMinute = "Calories per minute must be a positive number";
      }
      if (!formData.duration || parseFloat(formData.duration) <= 0) {
        newErrors.duration = "Duration must be a positive number";
      }
    } else {
      if (!formData.caloriesPerRep || parseFloat(formData.caloriesPerRep) <= 0) {
        newErrors.caloriesPerRep = "Calories per rep must be a positive number";
      }
      if (!formData.reps || parseFloat(formData.reps) <= 0) {
        newErrors.reps = "Reps must be a positive number";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = () => {
    if (validateForm()) {
      const caloriesPerMinute = formData.type === "continuous" 
        ? parseFloat(formData.caloriesPerMinute) 
        : null;
      const caloriesPerRep = formData.type === "discrete" 
        ? parseFloat(formData.caloriesPerRep) 
        : null;
      
      const duration = formData.type === "continuous" ? parseFloat(formData.duration) : null;
      const reps = formData.type === "discrete" ? parseFloat(formData.reps) : null;
      
      const caloriesBurned = formData.type === "continuous"
        ? caloriesPerMinute * duration
        : caloriesPerRep * reps;

      const exerciseObject = {
        name: formData.name.trim(),
        type: formData.type,
        intensity: formData.intensity,
        caloriesPerMinute: caloriesPerMinute,
        caloriesPerRep: caloriesPerRep,
        duration: duration,
        reps: reps,
        caloriesBurned: Math.round(caloriesBurned * 10) / 10,
        isCustom: true,
      };

      onAddExercise(exerciseObject);
      handleClear();
      onClose();
    }
  };

  const handleClear = () => {
    setFormData({
      name: "",
      type: "continuous",
      caloriesPerMinute: "",
      caloriesPerRep: "",
      intensity: "moderate",
      duration: "",
      reps: "",
    });
    setErrors({});
  };

  const handleClose = () => {
    handleClear();
    onClose();
  };

  return (
    <AppModal isOpen={isOpen} onClose={handleClose} title="Custom Exercise Entry">
      {/* Form */}
      <div className="space-y-3 sm:space-y-4">
        {/* Exercise Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Exercise Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter exercise name"
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name}</p>
          )}
        </div>

        {/* Exercise Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Exercise Type *
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="continuous">Continuous (Duration in minutes)</option>
            <option value="discrete">Discrete (Reps/Sets)</option>
          </select>
        </div>

        {/* Intensity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Intensity
          </label>
          <select
            name="intensity"
            value={formData.intensity}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
          </select>
        </div>

        {/* Calories Per Minute (for continuous) */}
        {formData.type === "continuous" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Calories Per Minute *
              </label>
              <input
                type="number"
                name="caloriesPerMinute"
                value={formData.caloriesPerMinute}
                onChange={handleInputChange}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.caloriesPerMinute ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., 8.5"
                min="0"
                step="0.1"
              />
              {errors.caloriesPerMinute && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.caloriesPerMinute}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes) *
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.duration ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., 30"
                min="1"
                step="1"
              />
              {errors.duration && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.duration}
                </p>
              )}
            </div>
          </>
        )}

        {/* Calories Per Rep (for discrete) */}
        {formData.type === "discrete" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Calories Per Rep *
              </label>
              <input
                type="number"
                name="caloriesPerRep"
                value={formData.caloriesPerRep}
                onChange={handleInputChange}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.caloriesPerRep ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., 0.5"
                min="0"
                step="0.1"
              />
              {errors.caloriesPerRep && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.caloriesPerRep}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reps/Sets *
              </label>
              <input
                type="number"
                name="reps"
                value={formData.reps}
                onChange={handleInputChange}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.reps ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., 20"
                min="1"
                step="1"
              />
              {errors.reps && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.reps}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
        <button
          onClick={handleClear}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Clear
        </button>
        <button
          onClick={handleAdd}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Add
        </button>
      </div>
    </AppModal>
  );
};

export default CustomExerciseModal;
