const KEY = "pos360_auth_v1";

export function loadAuth() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAuth(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function clearAuth() {
  localStorage.removeItem(KEY);
}
