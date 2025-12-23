const BASE = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:5001';

function authHeaders() {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export async function getTodayDiet() {
  const res = await fetch(`${BASE}/api/nutrition`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to load diet');
  return res.json();
}

export async function saveTodayDiet(payload) {
  const res = await fetch(`${BASE}/api/nutrition`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to save diet');
  }
  return res.json();
}
