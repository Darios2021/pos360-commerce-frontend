// src/app/utils/storage.js
const KEY = "pos360_auth_v1";

export function saveAuth(payload) {
  localStorage.setItem(KEY, JSON.stringify(payload || {}));
}

export function loadAuth() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(KEY);
}
