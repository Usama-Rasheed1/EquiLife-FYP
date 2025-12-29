const BASE = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:5001';

function authHeaders() {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

// Get predefined exercises
export async function getPredefinedExercises() {
  const res = await fetch(`${BASE}/api/fitness/predefined`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to load predefined exercises');
  return res.json();
}

// Get custom exercises
export async function getCustomExercises() {
  const res = await fetch(`${BASE}/api/fitness/custom`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to load custom exercises');
  return res.json();
}

// Create custom exercise
export async function createCustomExercise(exercise) {
  const res = await fetch(`${BASE}/api/fitness/custom`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(exercise)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to create custom exercise');
  }
  return res.json();
}

// Update custom exercise
export async function updateCustomExercise(id, exercise) {
  const res = await fetch(`${BASE}/api/fitness/custom/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(exercise)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to update custom exercise');
  }
  return res.json();
}

// Delete custom exercise
export async function deleteCustomExercise(id) {
  const res = await fetch(`${BASE}/api/fitness/custom/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to delete custom exercise');
  }
  return res.json();
}

// Add exercise log
export async function addExerciseLog(log) {
  const res = await fetch(`${BASE}/api/fitness/log`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(log)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to add exercise log');
  }
  return res.json();
}

// Get exercise logs for a week
export async function getExerciseLogsByWeek(weekStart, date) {
  const params = new URLSearchParams();
  if (weekStart) params.append('weekStart', weekStart);
  if (date) params.append('date', date);
  
  const res = await fetch(`${BASE}/api/fitness/logs/week?${params.toString()}`, {
    headers: authHeaders()
  });
  if (!res.ok) throw new Error('Failed to load exercise logs');
  return res.json();
}

// Update exercise log
export async function updateExerciseLog(id, updates) {
  const res = await fetch(`${BASE}/api/fitness/log/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(updates)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to update exercise log');
  }
  return res.json();
}

// Delete exercise log
export async function deleteExerciseLog(id) {
  const res = await fetch(`${BASE}/api/fitness/log/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to delete exercise log');
  }
  return res.json();
}

// Helper: Get Monday of the week for a given date
export function getWeekStart(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const diffToMonday = ((day + 6) % 7);
  const monday = new Date(d);
  monday.setDate(d.getDate() - diffToMonday);
  return monday.toISOString().slice(0, 10);
}

