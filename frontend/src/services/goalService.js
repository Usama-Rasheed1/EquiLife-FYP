const BASE = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:5001';

function authHeaders() {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

// Get all goals for the user
export async function getGoals() {
  const res = await fetch(`${BASE}/api/goals`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch goals');
  const data = await res.json();
  return data.goals || [];
}

// Get available goals with their status
export async function getAvailableGoals() {
  const res = await fetch(`${BASE}/api/goals/available`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch available goals');
  const data = await res.json();
  return data.availableGoals || [];
}

// Start a new goal
export async function startGoal(goalType, improvementDirection) {
  const res = await fetch(`${BASE}/api/goals/start`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ goalType, improvementDirection })
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to start goal');
  }
  const data = await res.json();
  return data.goal;
}

// Restart a completed goal
export async function restartGoal(goalId) {
  const res = await fetch(`${BASE}/api/goals/${goalId}/restart`, {
    method: 'POST',
    headers: authHeaders()
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to restart goal');
  }
  const data = await res.json();
  return data.goal;
}

