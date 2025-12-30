const BASE = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:5001';

function authHeaders() {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

// Submit an assessment
export async function submitAssessment(assessmentType, score, severity, answers) {
  const res = await fetch(`${BASE}/api/assessments/submit`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ assessmentType, score, severity, answers })
  });
  if (!res.ok) throw new Error('Failed to submit assessment');
  const data = await res.json();
  return data.assessment;
}

// Get latest assessments for the user
export async function getLatestAssessments() {
  const res = await fetch(`${BASE}/api/assessments/latest`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch assessments');
  const data = await res.json();
  return data.assessments || { gad7: null, phq9: null, ghq12: null };
}

