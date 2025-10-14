import React, { useState } from "react";
import { X } from "lucide-react";

const CustomFoodModal = ({ isOpen, onClose, onAddFood }) => {
  const [formData, setFormData] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Food name validation
    if (!formData.name.trim()) {
      newErrors.name = "Food name is required";
    }

    // Calories validation
    if (!formData.calories || formData.calories <= 0) {
      newErrors.calories = "Calories must be a positive number";
    }

    // Protein validation
    if (!formData.protein || formData.protein === "" || parseFloat(formData.protein) < 0) {
      newErrors.protein = "Protein is required and cannot be negative";
    }

    // Carbs validation
    if (!formData.carbs || formData.carbs === "" || parseFloat(formData.carbs) < 0) {
      newErrors.carbs = "Carbs is required and cannot be negative";
    }

    // Fats validation
    if (!formData.fats || formData.fats === "" || parseFloat(formData.fats) < 0) {
      newErrors.fats = "Fats is required and cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = () => {
    if (validateForm()) {
      const foodObject = {
        name: formData.name.trim(),
        calories: parseInt(formData.calories),
        protein: formData.protein ? parseFloat(formData.protein) : 0,
        carbs: formData.carbs ? parseFloat(formData.carbs) : 0,
        fats: formData.fats ? parseFloat(formData.fats) : 0,
        grams: 100, // Default grams for custom food
      };
      
      onAddFood(foodObject);
      handleClear();
      onClose();
    }
  };

  const handleClear = () => {
    setFormData({
      name: "",
      calories: "",
      protein: "",
      carbs: "",
      fats: "",
    });
    setErrors({});
  };

  const handleClose = () => {
    handleClear();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center scrollbar-hide">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-transparent backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-2xl p-4 sm:p-6 w-full max-w-sm sm:max-w-md mx-4 transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Custom Food Entry</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-3 sm:space-y-4">
          {/* Food Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Food Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter food name"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* Calories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Calories (kcal) *
            </label>
            <input
              type="number"
              name="calories"
              value={formData.calories}
              onChange={handleInputChange}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.calories ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter calories"
              min="1"
            />
            {errors.calories && (
              <p className="text-red-500 text-xs mt-1">{errors.calories}</p>
            )}
          </div>

          {/* Protein */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Protein (g) *
            </label>
            <input
              type="number"
              name="protein"
              value={formData.protein}
              onChange={handleInputChange}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.protein ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter protein"
              min="0"
              step="0.1"
              required
            />
            {errors.protein && (
              <p className="text-red-500 text-xs mt-1">{errors.protein}</p>
            )}
          </div>

          {/* Carbs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Carbs (g) *
            </label>
            <input
              type="number"
              name="carbs"
              value={formData.carbs}
              onChange={handleInputChange}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.carbs ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter carbs"
              min="0"
              step="0.1"
              required
            />
            {errors.carbs && (
              <p className="text-red-500 text-xs mt-1">{errors.carbs}</p>
            )}
          </div>

          {/* Fats */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fats (g) *
            </label>
            <input
              type="number"
              name="fats"
              value={formData.fats}
              onChange={handleInputChange}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.fats ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter fats"
              min="0"
              step="0.1"
              required
            />
            {errors.fats && (
              <p className="text-red-500 text-xs mt-1">{errors.fats}</p>
            )}
          </div>
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
      </div>
    </div>
  );
};

export default CustomFoodModal;
