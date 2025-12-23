import React, { useState } from "react";
import AppModal from "./AppModal";

// mealType: string (Breakfast|Lunch|Dinner|Snacks) - indicates which meal this custom food will be logged to
const CustomFoodModal = ({ isOpen, onClose, onAddFood, mealType }) => {
  const [formData, setFormData] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiMessage, setApiMessage] = useState('');

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
        fat: formData.fats ? parseFloat(formData.fats) : 0,
        grams: 100, // Default grams for custom food
      };

      // Create custom food in backend and log it to the selected meal
      (async () => {
        setSaving(true);
        setApiMessage('');
        try {
          const token = localStorage.getItem('authToken');
          if (!token) throw new Error('Not authenticated');

          // 1) Create custom food
          const createResp = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/foods/custom`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(foodObject),
          });
          const created = await createResp.json();
          if (!createResp.ok) throw new Error(created.message || 'Failed to create custom food');

          // 2) Log meal for today to the selected mealType
          const today = new Date().toISOString().slice(0,10);
          const logResp = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/meals/log`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ date: today, mealType: mealType || 'Breakfast', foodId: created._id || created.id, quantity: 1 }),
          });
          const logged = await logResp.json();
          if (!logResp.ok) throw new Error(logged.message || 'Failed to log custom food');

          // Prefer returned mealItem snapshot, but ensure it has name for UI
          const mealItem = logged.mealItem || logged.data || { ...created, quantity: 1 };
          if (!mealItem.name) mealItem.name = created.name;

          // Notify parent to add to UI
          if (typeof onAddFood === 'function') onAddFood(mealItem);

          setApiMessage('Added');
          handleClear();
          onClose();
        } catch (err) {
          console.error('CustomFoodModal add error', err);
          setApiMessage(err.message || 'Error');
        } finally {
          setSaving(false);
        }
      })();
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

  return (
    <AppModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Custom Food Entry"
    >
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
            disabled={saving}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Clear
          </button>
          <button
            onClick={handleAdd}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {saving ? 'Adding...' : 'Add'}
          </button>
        </div>
    </AppModal>
  );
};

export default CustomFoodModal;
