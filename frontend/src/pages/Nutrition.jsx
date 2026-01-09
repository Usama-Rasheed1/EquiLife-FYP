import React, { useState,useEffect, useRef, useMemo } from "react";
import Layout from "../components/Layout";
import CustomFoodModal from "../components/CustomFoodModal";
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts";
import { Pencil, Trash2, Plus, Minus } from "lucide-react";
import { getTodayDiet, saveTodayDiet } from '../services/nutritionService';


const Nutrition = () => {
  const COLORS = ["#22c55e", "#3b82f6", "#facc15"];

  const [foodList,setFoodList] = useState([]);
  const [isLogging, setIsLogging] = useState(false);
  const [loggingError, setLoggingError] = useState('');
  const [userFitnessData, setUserFitnessData] = useState(null);
  // Debouncing refs for quantity changes and deletes
  const debounceTimeouts = useRef({});
  useEffect(() => {
    // Fetch food list from backend 
    const fetchFoodList = async () => {
      try {
        const respPre = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/foods/predefined`);
        const predefined = await respPre.json();

        // Try fetch user custom foods if logged in
        let custom = [];
        try {
          const token = localStorage.getItem('authToken');
          if (token) {
            const respCustom = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/foods/custom`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (respCustom.ok) custom = await respCustom.json();
          }
        } catch (err) {
          console.warn('Could not fetch custom foods', err);
        }

        const combined = [...(predefined || []), ...(custom || [])];
        setFoodList(combined);
        console.log("Fetched food list:", combined);
      } catch (error) {
        console.error("Error fetching food list:", error);}};
    fetchFoodList();

    // Fetch user fitness data (BMI, BMR)
    const fetchUserFitnessData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          const response = await fetch(
            `${import.meta.env.VITE_BACKEND_BASE_URL}/api/auth/profile`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (response.ok) {
            const data = await response.json();
            setUserFitnessData(data.user);
          }
        }
      } catch (err) {
        console.warn('Could not fetch user fitness data', err);
      }
    };
    fetchUserFitnessData();

    // Fetch today's meal log from backend
    const fetchTodayMeals = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_BASE_URL}/api/meals/daily?date=${today}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const result = await response.json();
        if (result.meals) {
          // Enrich meals with food names by looking up foodId in the Food collection
          // Fetch predefined and user custom foods to build a lookup map
          const predefinedResp = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/foods/predefined`);
          const predefinedFoods = await predefinedResp.json();

          let customFoods = [];
          try {
            const customResp = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/foods/custom`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (customResp.ok) customFoods = await customResp.json();
          } catch (err) {
            // ignore if custom fetch fails
            console.warn('Could not fetch custom foods:', err);
          }

          const allFoods = [...(predefinedFoods || []), ...(customFoods || [])];
          // Create a map of foodId -> food for quick lookup
          const foodMap = {};
          allFoods.forEach((food) => {
            if (food && (food._id || food.id)) foodMap[food._id || food.id] = food;
          });

          // Enrich each meal item with the food name
          const enrichedMeals = {
            Breakfast: (result.meals.Breakfast || []).map(item => ({
              ...item,
              name: foodMap[item.foodId]?.name || 'Unknown Food'
            })),
            Lunch: (result.meals.Lunch || []).map(item => ({
              ...item,
              name: foodMap[item.foodId]?.name || 'Unknown Food'
            })),
            Dinner: (result.meals.Dinner || []).map(item => ({
              ...item,
              name: foodMap[item.foodId]?.name || 'Unknown Food'
            })),
          };
          
          setMeals(enrichedMeals);
          console.log('Fetched today meals:', enrichedMeals);
        }
      } catch (error) {
        console.error('Error fetching today meals:', error);
      }
    };
    fetchTodayMeals();
  }, []);
  const [editIndex, setEditIndex] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editFood, setEditFood] = useState(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState("");

  

  const [meals, setMeals] = useState({
    Breakfast: [],
    Lunch: [],
    Dinner: [],
  });

  const [totals, setTotals] = useState({ carbs:0, fats:0, protein:0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // State for dropdown values
  const [dropdownValues, setDropdownValues] = useState({
    Breakfast: "",
    Lunch: "",
    Dinner: "",
  });

  // helper: estimate macros (grams) from an array of items with calories and quantity
  const computeMacrosFromItems = (items = []) => {
    // If items include explicit macros per item, sum those. Otherwise fall back to heuristic by calories.
    let carbs = 0, fats = 0, protein = 0;
    let caloriesSum = 0;
    for (const it of items) {
      const qty = Number(it.quantity || 1);
      if (it.macros) {
        carbs += (Number(it.macros.carbs || 0) * qty);
        fats += (Number(it.macros.fats || 0) * qty);
        protein += (Number(it.macros.protein || 0) * qty);
      } else if (it.calories) {
        caloriesSum += Number(it.calories) * qty;
      }
    }
    if (caloriesSum > 0 && carbs === 0 && fats === 0 && protein === 0) {
      const ratios = { carbs: 0.5, fats: 0.3, protein: 0.2 };
      carbs = Math.round((caloriesSum * ratios.carbs) / 4);
      fats = Math.round((caloriesSum * ratios.fats) / 9);
      protein = Math.round((caloriesSum * ratios.protein) / 4);
    } else {
      carbs = Math.round(carbs);
      fats = Math.round(fats);
      protein = Math.round(protein);
    }
    return { carbs, fats, protein };
  };

  // ✅ Add new food item
  const handleAddFood = (meal, food) => {
    // Clear any editing state when adding new food
    setEditIndex(null);
    setEditFood(null);
    // build the updated meals synchronously so we can save immediately
    setMeals((prev) => {
      const updated = { ...prev };
      const existingIndex = prev[meal].findIndex((item) => item.name === food.name);

      if (existingIndex !== -1) {
        updated[meal] = prev[meal].map((item, index) =>
          index === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        const isCustomFood = !foodList.some((f) => f.name === food.name);
        updated[meal] = [...prev[meal], { ...food, quantity: 1, isCustom: isCustomFood }];
      }

      // Reset dropdown value immediately
      setDropdownValues((dprev) => ({ ...dprev, [meal]: "" }));

      // prepare payload: store meal items in description so backend persists them
      (async () => {
        try {
          setSaving(true);
          const breakfastMacros = computeMacrosFromItems(updated.Breakfast || []);
          const lunchMacros = computeMacrosFromItems(updated.Lunch || []);
          const dinnerMacros = computeMacrosFromItems(updated.Dinner || []);
          const payload = {
            breakfast: { description: JSON.stringify(updated.Breakfast || []), ...breakfastMacros },
            lunch: { description: JSON.stringify(updated.Lunch || []), ...lunchMacros },
            dinner: { description: JSON.stringify(updated.Dinner || []), ...dinnerMacros },
          };
          const saved = await saveTodayDiet(payload);
          // if backend returns totals update local totals
          if (saved && saved.totals) setTotals(saved.totals);
          else setTotals({ carbs: breakfastMacros.carbs + lunchMacros.carbs + dinnerMacros.carbs, fats: breakfastMacros.fats + lunchMacros.fats + dinnerMacros.fats, protein: breakfastMacros.protein + lunchMacros.protein + dinnerMacros.protein });
        } catch (err) {
          console.error('Auto-save failed', err);
          setError(err.message || 'Auto-save failed');
        } finally {
          setSaving(false);
        }
      })();

      return updated;
    });
  };

  // ✅ Increase / decrease quantity (with debounced API call)
  const handleQuantityChange = (meal, index, type) => {
    const currentItem = meals[meal][index];
    if (!currentItem) return;

    const currentQty = currentItem.quantity || 1;
    const newQty = type === 'inc' ? currentQty + 1 : currentQty > 1 ? currentQty - 1 : 1;

    // Update UI immediately
    setMeals((prev) => {
      const updated = { ...prev };
      updated[meal] = prev[meal].map((item, i) =>
        i === index ? { ...item, quantity: newQty } : item
      );

      // auto-save after updating quantities
      (async () => {
        try {
          setSaving(true);
          const breakfastMacros = computeMacrosFromItems(updated.Breakfast || []);
          const lunchMacros = computeMacrosFromItems(updated.Lunch || []);
          const dinnerMacros = computeMacrosFromItems(updated.Dinner || []);
          const payload = {
            breakfast: { description: JSON.stringify(updated.Breakfast || []), ...breakfastMacros },
            lunch: { description: JSON.stringify(updated.Lunch || []), ...lunchMacros },
            dinner: { description: JSON.stringify(updated.Dinner || []), ...dinnerMacros },
          };
          const saved = await saveTodayDiet(payload);
          if (saved && saved.totals) setTotals(saved.totals);
          else setTotals({ carbs: breakfastMacros.carbs + lunchMacros.carbs + dinnerMacros.carbs, fats: breakfastMacros.fats + lunchMacros.fats + dinnerMacros.fats, protein: breakfastMacros.protein + lunchMacros.protein + dinnerMacros.protein });
        } catch (err) {
          console.error('Auto-save failed', err);
          setError(err.message || 'Auto-save failed');
        } finally {
          setSaving(false);
        }
      })();

      return updated;
    });

    const debounceKey = `qty-${meal}-${index}`;
    if (debounceTimeouts.current[debounceKey]) clearTimeout(debounceTimeouts.current[debounceKey]);

    // Schedule API update after user stops clicking for 500ms
    debounceTimeouts.current[debounceKey] = setTimeout(async () => {
      try {
        const token = localStorage.getItem('authToken');
        // require meal item id from server snapshot
        const item = meals[meal][index];
        const mealItemId = item && (item._id || item.id);
        if (!mealItemId) return; // nothing to update on server

        const resp = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/meals/${mealItemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ quantity: newQty }),
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to update quantity');
        }
      } catch (err) {
        console.error('Error updating quantity:', err);
      }
    }, 500);
  };

  // ✅ Delete item (with debounced API call)
  const handleDelete = (meal, index) => {
    const item = meals[meal][index];
    if (!item) return;

    // Update UI immediately
    setMeals((prev) => {
      const updated = { ...prev };
      updated[meal] = prev[meal].filter((_, i) => i !== index);

      // auto-save after delete
      (async () => {
        try {
          setSaving(true);
          const breakfastMacros = computeMacrosFromItems(updated.Breakfast || []);
          const lunchMacros = computeMacrosFromItems(updated.Lunch || []);
          const dinnerMacros = computeMacrosFromItems(updated.Dinner || []);
          const payload = {
            breakfast: { description: JSON.stringify(updated.Breakfast || []), ...breakfastMacros },
            lunch: { description: JSON.stringify(updated.Lunch || []), ...lunchMacros },
            dinner: { description: JSON.stringify(updated.Dinner || []), ...dinnerMacros },
          };
          const saved = await saveTodayDiet(payload);
          if (saved && saved.totals) setTotals(saved.totals);
          else setTotals({ carbs: breakfastMacros.carbs + lunchMacros.carbs + dinnerMacros.carbs, fats: breakfastMacros.fats + lunchMacros.fats + dinnerMacros.fats, protein: breakfastMacros.protein + lunchMacros.protein + dinnerMacros.protein });
        } catch (err) {
          console.error('Auto-save failed', err);
          setError(err.message || 'Auto-save failed');
        } finally {
          setSaving(false);
        }
      })();

      return updated;
    });

    const debounceKey = `del-${meal}-${index}`;
    if (debounceTimeouts.current[debounceKey]) clearTimeout(debounceTimeouts.current[debounceKey]);

    debounceTimeouts.current[debounceKey] = setTimeout(async () => {
      try {
        const token = localStorage.getItem('authToken');
        const mealItemId = item && (item._id || item.id);
        if (!mealItemId) return;

        const resp = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/meals/${mealItemId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to delete meal');
        }
      } catch (err) {
        console.error('Error deleting meal:', err);
      }
    }, 300);
  };

  // ✅ Edit item
  const handleEdit = (meal, index) => {
    const currentItem = meals[meal][index];
    console.log("Editing item:", currentItem);
    // cancel pending debounced operations for this item
    const debounceKeyQty = `qty-${meal}-${index}`;
    const debounceKeyDel = `del-${meal}-${index}`;
    if (debounceTimeouts.current[debounceKeyQty]) clearTimeout(debounceTimeouts.current[debounceKeyQty]);
    if (debounceTimeouts.current[debounceKeyDel]) clearTimeout(debounceTimeouts.current[debounceKeyDel]);

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

    // persist edit
    (async () => {
      try {
        setSaving(true);
        const payload = {
          breakfast: { description: JSON.stringify(meals.Breakfast || []), carbs: 0, fats: 0, protein: 0 },
          lunch: { description: JSON.stringify(meals.Lunch || []), carbs: 0, fats: 0, protein: 0 },
          dinner: { description: JSON.stringify(meals.Dinner || []), carbs: 0, fats: 0, protein: 0 },
        };
        const saved = await saveTodayDiet(payload);
        if (saved && saved.totals) setTotals(saved.totals);
      } catch (err) {
        console.error('Auto-save failed', err);
        setError(err.message || 'Auto-save failed');
      } finally {
        setSaving(false);
      }
    })();
  };

  // Helper function to get current calories for an item (accounting for editing state)
  const getCurrentItemCalories = (item, meal, index) => {
    if (editIndex?.meal === meal && editIndex?.index === index && editFood) {
      return editFood.calories * item.quantity;
    }
    return item.calories * item.quantity;
  };

  const totalCalories = useMemo(() => {
    return Object.keys(meals).reduce((total, meal) => {
      const mealTotal = meals[meal].reduce((mealSum, item, index) => {
        return mealSum + getCurrentItemCalories(item, meal, index);
      }, 0);
      return total + mealTotal;
    }, 0);
  }, [meals, editIndex, editFood]);

  // Calculate macro totals from meals (memoized)
  const { totalProtein, totalCarbs, totalFats } = useMemo(() => {
    const acc = { totalProtein: 0, totalCarbs: 0, totalFats: 0 };
    Object.keys(meals).forEach((meal) => {
      meals[meal].forEach((item, index) => {
        const qty = item.quantity || 1;
        const protein = editIndex?.meal === meal && editIndex?.index === index && editFood ? editFood.protein : item.protein || 0;
        const carbs = editIndex?.meal === meal && editIndex?.index === index && editFood ? editFood.carbs : item.carbs || 0;
        const fat = editIndex?.meal === meal && editIndex?.index === index && editFood ? editFood.fat : item.fat || 0;

        acc.totalProtein += protein * qty;
        acc.totalCarbs += carbs * qty;
        acc.totalFats += fat * qty;
      });
    });
    return acc;
  }, [meals, editIndex, editFood]);

  const chartData = useMemo(() => [
    { name: "Protein", value: Math.max(0, Math.round(totalProtein)) },
    { name: "Carbs", value: Math.max(0, Math.round(totalCarbs)) },
    { name: "Fats", value: Math.max(0, Math.round(totalFats)) },
  ], [totalProtein, totalCarbs, totalFats]);

  // If all macro values are zero, provide a safe fallback so the Pie chart
  // renders predictably (Recharts may render nothing or behave oddly with all zeros).
  const macroSum = chartData.reduce((s, e) => s + (Number(e.value) || 0), 0);
  const displayChartData = macroSum > 0 ? chartData : [{ name: 'No Data', value: 1 }];
  const displayColors = macroSum > 0 ? COLORS : ['#E5E7EB'];


  // load today's diet
  useEffect(() => {
    (async () => {
      try {
        const data = await getTodayDiet();
        // map saved format (breakfast/lunch/dinner with macros) into meals list if present
        if (data) {
          const parseMeal = (meal) => {
            if (!meal) return [];
            // if description is stored as JSON array of items, parse it
            try {
              if (meal.description) {
                const parsed = JSON.parse(meal.description);
                if (Array.isArray(parsed)) return parsed.map(it => ({ ...it, quantity: it.quantity || 1 }));
              }
            } catch (err) {
              // not JSON, ignore
            }
            // fallback: if meal has macros but no description return empty array
            return [];
          };

          setMeals({
            Breakfast: parseMeal(data.breakfast),
            Lunch: parseMeal(data.lunch),
            Dinner: parseMeal(data.dinner),
          });

          setTotals(data.totals || { carbs:0,fats:0,protein:0 });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
                  className={`w-full border border-gray-300 rounded-lg px-3 py-2 cursor-pointer text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-ellipsis `}
                  value={dropdownValues[meal]}
                  onChange={async (e) => {
                    const selectedValue = e.target.value;
                    setDropdownValues((prev) => ({
                      ...prev,
                      [meal]: selectedValue,
                    }));

                    if (selectedValue === "Custom") {
                      setSelectedMeal(meal);
                      setIsCustomModalOpen(true);
                    } else if (selectedValue) {
                      // Log meal to backend and show loader
                      setLoggingError('');
                      setIsLogging(true);
                      try {
                        const food = foodList.find((f) => f.name === selectedValue);
                        if (!food) throw new Error('Selected food not found');

                        const token = localStorage.getItem('authToken');
                        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

                        // Check if the same food already exists in this meal section
                        const existingIndex = meals[meal].findIndex((it) => {
                          // prefer matching by foodId if present, otherwise by name
                          return (
                            (it.foodId && (it.foodId === food._id || it.foodId === food.id)) ||
                            (it._id && (it._id === food._id || it._id === food.id)) ||
                            it.name === food.name
                          );
                        });

                        if (existingIndex !== -1) {
                          // Increment existing quantity instead of creating a new entry
                          const existing = meals[meal][existingIndex];
                          const newQty = (existing.quantity || 1) + 1;

                          // Optimistic UI update
                          setMeals((prev) => {
                            const updated = { ...prev };
                            updated[meal] = prev[meal].map((item, i) =>
                              i === existingIndex ? { ...item, quantity: newQty } : item
                            );
                            return updated;
                          });

                          // If the existing item has a server id, update it on server
                          const mealItemId = existing._id || existing.id;
                          if (mealItemId) {
                            const resp = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/meals/${mealItemId}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ quantity: newQty }),
                            });
                            if (!resp.ok) {
                              const err = await resp.json().catch(() => ({}));
                              throw new Error(err.message || 'Failed to update quantity');
                            }
                          } else {
                            // Fallback: create a new meal item on server and replace existing entry with server snapshot
                            const resp = await fetch(
                              `${import.meta.env.VITE_BACKEND_BASE_URL}/api/meals/log`,
                              {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify({
                                  date: today,
                                  mealType: meal,
                                  foodId: food._id,
                                  quantity: newQty,
                                }),
                              }
                            );
                            const result = await resp.json();
                            if (!resp.ok) throw new Error(result.message || 'Failed to log meal');
                            const mealItem = result.mealItem || { ...food, quantity: newQty };

                            // Ensure name present
                            if (!mealItem.name) mealItem.name = food.name;

                            // Replace the optimistic entry with server snapshot
                            setMeals((prev) => {
                              const updated = { ...prev };
                              updated[meal] = prev[meal].map((item, i) =>
                                i === existingIndex ? mealItem : item
                              );
                              return updated;
                            });
                          }
                        } else {
                          // No existing entry in this meal — create a new meal item
                          const resp = await fetch(
                            `${import.meta.env.VITE_BACKEND_BASE_URL}/api/meals/log`,
                            {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                              },
                              body: JSON.stringify({
                                date: today,
                                mealType: meal,
                                foodId: food._id,
                                quantity: 1,
                              }),
                            }
                          );
                          const result = await resp.json();
                          if (!resp.ok) throw new Error(result.message || 'Failed to log meal');

                          // Prefer server-returned mealItem snapshot; otherwise, construct from food
                          const mealItem = result.mealItem || result.data || {
                            ...food,
                            quantity: 1,
                          };

                          // Ensure mealItem has the food name for display
                          if (!mealItem.name) {
                            mealItem.name = food.name;
                          }

                          // Add to UI
                          setMeals((prev) => ({
                            ...prev,
                            [meal]: [...prev[meal], mealItem],
                          }));
                        }
                      } catch (err) {
                        console.error('Error logging/updating meal:', err);
                        setLoggingError(err.message || 'Error logging meal');
                      } finally {
                        setIsLogging(false);
                        setDropdownValues((prev) => ({ ...prev, [meal]: '' }));
                      }
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
          {/* Minimal macro summary (compact) */}
          <div className="w-full flex items-center justify-between text-xs sm:text-sm text-gray-700 px-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: COLORS[0] }} />
              <span className="text-gray-500 hidden sm:inline">Protein</span>
              <span className="font-semibold ml-1">{Math.max(0, Math.round(totalProtein))}g</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: COLORS[1] }} />
              <span className="text-gray-500 hidden sm:inline">Carbs</span>
              <span className="font-semibold ml-1">{Math.max(0, Math.round(totalCarbs))}g</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: COLORS[2] }} />
              <span className="text-gray-500 hidden sm:inline">Fats</span>
              <span className="font-semibold ml-1">{Math.max(0, Math.round(totalFats))}g</span>
            </div>
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
                              className={`w-full border border-gray-300 rounded-md px-2 py-1 text-xs sm:text-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500`}
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
                              {(item.isCustom || item.userId ||
                                // If the meal references a foodId or name, check the loaded foodList for an isCustom flag
                                (item.foodId && foodList.some(f => (f._id || f.id) === item.foodId && f.isCustom)) ||
                                (item.name && foodList.some(f => f.name === item.name && f.isCustom))
                              ) && (
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
                              {/* <Pencil size={14} className="sm:hidden" /> */}
                              {/* <Pencil size={16} className="hidden sm:block" /> */}
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

          <div className="w-full flex flex-col items-center bg-white rounded-lg shadow-sm p-3 sm:p-4">
            <h4 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-center">
              Food Intake
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

          <button onClick={async () => {
            setError(''); setSaving(true);
            try {
              // build payload from totals as simple custom macro entries
              const payload = {
                breakfast: { carbs: 0, fats:0, protein:0 },
                lunch: { carbs:0, fats:0, protein:0 },
                dinner: { carbs:0, fats:0, protein:0 }
              };
              // try to preserve any existing meal macro inputs by parsing meals state if custom
              // fallback: distribute totals equally
              payload.breakfast = { carbs: Math.round(totals.carbs/3), fats: Math.round(totals.fats/3), protein: Math.round(totals.protein/3) };
              payload.lunch = { carbs: Math.round(totals.carbs/3), fats: Math.round(totals.fats/3), protein: Math.round(totals.protein/3) };
              payload.dinner = { carbs: totals.carbs - payload.breakfast.carbs - payload.lunch.carbs, fats: totals.fats - payload.breakfast.fats - payload.lunch.fats, protein: totals.protein - payload.breakfast.protein - payload.lunch.protein };
              const saved = await saveTodayDiet(payload);
              setTotals(saved.totals || totals);
            } catch (err) {
              setError(err.message || 'Save failed');
            } finally { setSaving(false); }
          }} className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg shadow transition-all self-center w-full mt-1 cursor-pointer text-sm sm:text-base">
            {saving ? 'Get Help' : 'Get Help'}
          </button>
        </div>
      </div>
      {/* Logging overlay */}
      {isLogging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg px-6 py-4 shadow">
            <p className="font-medium">Logging meal...</p>
          </div>
        </div>
      )}

      {/* Show logging error if any */}
      {loggingError && (
        <div className="fixed bottom-4 right-4 z-50 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">
          {loggingError}
        </div>
      )}

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
        mealType={selectedMeal}
        onAddFood={(food) => handleAddFood(selectedMeal, food)}
      />
    </Layout>
  );
};

export default Nutrition;
