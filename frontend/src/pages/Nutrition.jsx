import React, { useState } from "react";
import Layout from "../components/Layout";
import CustomFoodModal from "../components/CustomFoodModal";
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts";
import { Pencil, Trash2, Plus, Minus } from "lucide-react";

const Nutrition = () => {
  const [editIndex, setEditIndex] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editFood, setEditFood] = useState(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState("");

  const foodList = [
    { name: "Egg", calories: 78, grams: 50 },
    { name: "Bread Slice", calories: 66, grams: 25 },
    { name: "Apple", calories: 95, grams: 100 },
    { name: "Rice (1 cup)", calories: 200, grams: 150 },
    { name: "Grilled Chicken", calories: 165, grams: 100 },
  ];

  const [meals, setMeals] = useState({
    Breakfast: [],
    Lunch: [],
    Dinner: [],
  });

  // State for dropdown values
  const [dropdownValues, setDropdownValues] = useState({
    Breakfast: "",
    Lunch: "",
    Dinner: "",
  });

  // ✅ Add new food item
  const handleAddFood = (meal, food) => {
    // Clear any editing state when adding new food
    setEditIndex(null);
    setEditFood(null);

    setMeals((prev) => {
      const updated = { ...prev };
      // Check if the food item already exists in this meal
      const existingIndex = prev[meal].findIndex(
        (item) => item.name === food.name
      );

      if (existingIndex !== -1) {
        // If item exists, increase its quantity instead of adding a new entry
        updated[meal] = prev[meal].map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // If item doesn't exist, add it as a new entry
        // Mark as custom if it's not in the predefined foodList
        const isCustomFood = !foodList.some((f) => f.name === food.name);
        updated[meal] = [
          ...prev[meal],
          { ...food, quantity: 1, isCustom: isCustomFood },
        ];
      }
      return updated;
    });
    // Reset dropdown to initial state
    setDropdownValues((prev) => ({
      ...prev,
      [meal]: "",
    }));
  };

  // ✅ Increase / decrease quantity
  const handleQuantityChange = (meal, index, type) => {
    setMeals((prev) => {
      const updated = { ...prev };
      updated[meal] = prev[meal].map((item, i) =>
        i === index
          ? {
              ...item,
              quantity:
                type === "inc"
                  ? item.quantity + 1
                  : item.quantity > 1
                  ? item.quantity - 1
                  : 1,
            }
          : item
      );
      return updated;
    });
  };

  // ✅ Delete item
  const handleDelete = (meal, index) => {
    setMeals((prev) => {
      const updated = { ...prev };
      updated[meal] = prev[meal].filter((_, i) => i !== index);
      return updated;
    });
  };

  // ✅ Edit item
  const handleEdit = (meal, index) => {
    const currentItem = meals[meal][index];
    setEditIndex({ meal, index });
    setEditValue(currentItem.name);
    setEditFood(currentItem);
  };

  // ✅ Save edited item
  const handleSaveEdit = (meal, index) => {
    setMeals((prev) => {
      const updated = { ...prev };
      const currentQuantity = meals[meal][index].quantity; // Preserve current quantity

      // Check if it's a predefined food or custom food
      const predefinedFood = foodList.find((f) => f.name === editValue);
      const customFood = Object.values(meals)
        .flat()
        .find((item) => item.name === editValue && item.isCustom);

      if (predefinedFood) {
        // Update with predefined food data
        updated[meal][index] = {
          ...predefinedFood,
          quantity: currentQuantity,
          isCustom: false,
        };
      } else if (customFood) {
        // Update with custom food data (preserve custom properties)
        updated[meal][index] = { ...customFood, quantity: currentQuantity };
      } else {
        // If neither found, keep current item but update name
        updated[meal][index] = { ...updated[meal][index], name: editValue };
      }

      return updated;
    });
    setEditIndex(null);
    setEditFood(null);
  };

  const chartData = [
    { name: "Protein", value: 30 },
    { name: "Carbs", value: 50 },
    { name: "Fats", value: 20 },
  ];

  const COLORS = ["#22c55e", "#3b82f6", "#facc15"];

  // Helper function to get current calories for an item (accounting for editing state)
  const getCurrentItemCalories = (item, meal, index) => {
    if (editIndex?.meal === meal && editIndex?.index === index && editFood) {
      return editFood.calories * item.quantity;
    }
    return item.calories * item.quantity;
  };

  const totalCalories = Object.keys(meals).reduce((total, meal) => {
    const mealTotal = meals[meal].reduce((mealSum, item, index) => {
      return mealSum + getCurrentItemCalories(item, meal, index);
    }, 0);
    return total + mealTotal;
  }, 0);

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row bg-white h-[calc(100vh-64px)] overflow-hidden">
        {/* Left Side - Scrollable Form and Cards */}
        <div className="flex-1 p-3 sm:p-6 border-r border-gray-200 overflow-y-auto scrollbar-hide">
          {/* Add Calories Form */}
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
            Add Calories
          </h2>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
            {["Breakfast", "Lunch", "Dinner"].map((meal) => (
              <div key={meal} className="flex-1 min-w-0">
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  {meal}
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 cursor-pointer text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={dropdownValues[meal]}
                  onChange={(e) => {
                    const selectedValue = e.target.value;
                    setDropdownValues((prev) => ({
                      ...prev,
                      [meal]: selectedValue,
                    }));

                    if (selectedValue === "Custom") {
                      setSelectedMeal(meal);
                      setIsCustomModalOpen(true);
                    } else {
                      const food = foodList.find(
                        (f) => f.name === selectedValue
                      );
                      if (food) handleAddFood(meal, food);
                    }
                  }}
                >
                  <option value="">Select Food</option>
                  {foodList.map((food, i) => (
                    <option key={i} value={food.name}>
                      {food.name} ({food.grams}g) - {food.calories} kcal
                    </option>
                  ))}
                  <option value="Custom">+ Add Custom Food</option>
                </select>
              </div>
            ))}
          </div>

          {/* All Details Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-4">
            <h3 className="text-base sm:text-lg font-semibold">All Details</h3>
            <span className="bg-blue-100 text-blue-600 text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full">
              Total: {totalCalories} Kcal
            </span>
          </div>

          {/* Meal Cards */}
          <div className="space-y-4 pb-8">
            {Object.keys(meals).map((meal) => (
              <div
                key={meal}
                className="border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm"
              >
                <h4 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                  {meal}
                </h4>
                {meals[meal].length === 0 ? (
                  <p className="text-gray-400 text-sm">No items added</p>
                ) : (
                  <ul className="space-y-2">
                    {meals[meal].map((item, index) => (
                      <li
                        key={index}
                        className="flex flex-wrap items-start sm:items-center justify-between bg-gray-50 p-2 sm:p-3 rounded-lg gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          {editIndex?.meal === meal &&
                          editIndex?.index === index ? (
                            <select
                              className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs sm:text-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                              value={editValue}
                              onChange={(e) => {
                                const newFoodName = e.target.value;
                                setEditValue(newFoodName);
                                // Update editFood to show new calories immediately
                                const newFood = foodList.find(
                                  (f) => f.name === newFoodName
                                );
                                const customFood = Object.values(meals)
                                  .flat()
                                  .find(
                                    (item) =>
                                      item.name === newFoodName && item.isCustom
                                  );
                                if (newFood) {
                                  setEditFood(newFood);
                                } else if (customFood) {
                                  setEditFood(customFood);
                                }
                              }}
                            >
                              {foodList.map((food) => (
                                <option key={food.name} value={food.name}>
                                  {food.name} ({food.grams}g)
                                </option>
                              ))}
                              {/* Add custom foods to edit dropdown */}
                              {Object.values(meals)
                                .flat()
                                .filter(
                                  (item) =>
                                    item.isCustom &&
                                    !foodList.some((f) => f.name === item.name)
                                )
                                .map((customFood, idx) => (
                                  <option
                                    key={`custom-${idx}`}
                                    value={customFood.name}
                                  >
                                    {customFood.name} (Custom)
                                  </option>
                                ))}
                            </select>
                          ) : (
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                              <p className="font-medium text-sm sm:text-base">
                                {item.name} ({item.quantity}x)
                              </p>
                              {item.isCustom && (
                                <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm">
                                  Custom
                                </span>
                              )}
                            </div>
                          )}
                          <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            {getCurrentItemCalories(item, meal, index)} kcal
                          </p>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-2 mt-2 sm:mt-0 flex-shrink-0">
                          <button
                            onClick={() =>
                              handleQuantityChange(meal, index, "dec")
                            }
                            className="p-1 rounded-md border hover:bg-gray-100 cursor-pointer flex-shrink-0"
                          >
                            <Minus size={12} className="sm:hidden" />
                            <Minus size={14} className="hidden sm:block" />
                          </button>

                          <span className="px-1 sm:px-2 text-xs sm:text-sm font-semibold min-w-[20px] text-center">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() =>
                              handleQuantityChange(meal, index, "inc")
                            }
                            className="p-1 rounded-md border hover:bg-gray-100 cursor-pointer flex-shrink-0"
                          >
                            <Plus size={12} className="sm:hidden" />
                            <Plus size={14} className="hidden sm:block" />
                          </button>

                          {editIndex?.meal === meal &&
                          editIndex?.index === index ? (
                            <button
                              onClick={() => handleSaveEdit(meal, index)}
                              className="text-green-500 hover:text-green-600 font-semibold text-xs sm:text-sm cursor-pointer flex-shrink-0"
                            >
                              Save
                            </button>
                          ) : (
                            <button
                              onClick={() => handleEdit(meal, index)}
                              className="text-blue-500 hover:text-blue-600 cursor-pointer flex-shrink-0"
                            >
                              <Pencil size={14} className="sm:hidden" />
                              <Pencil size={16} className="hidden sm:block" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(meal, index)}
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

          <div className="w-full flex flex-col items-center bg-white rounded-lg shadow-sm p-3 sm:p-4">
            <h4 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-center">
              Food Intake
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

      {/* Custom Food Modal */}
      <CustomFoodModal
        isOpen={isCustomModalOpen}
        onClose={() => {
          setIsCustomModalOpen(false);
          // Reset dropdown value when modal is closed
          setDropdownValues((prev) => ({
            ...prev,
            [selectedMeal]: "",
          }));
        }}
        onAddFood={(food) => handleAddFood(selectedMeal, food)}
      />
    </Layout>
  );
};

export default Nutrition;
