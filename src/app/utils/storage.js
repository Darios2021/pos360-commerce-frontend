// src/app/utils/storage.js
const KEY = "pos360_auth";

export function loadAuth() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAuth(payload) {
  localStorage.setItem(KEY, JSON.stringify(payload));
}

export function clearAuth() {
  localStorage.removeItem(KEY);
}
