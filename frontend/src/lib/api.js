const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || 'Operazione non riuscita');
  }

  if (response.status === 204) return null;

  const rawBody = await response.text();
  if (!rawBody) return null;

  try {
    return JSON.parse(rawBody);
  } catch {
    throw new Error('Risposta server non valida');
  }
}
