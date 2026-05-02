// src/app/utils/tokenStorage.js
//
// Wrapper de almacenamiento del token de sesión del shop:
// - En Capacitor (Android/iOS) usa @capacitor/preferences (SharedPreferences
//   en Android, NSUserDefaults en iOS) — persiste entre cierres del app.
// - En web usa localStorage como fallback (la cookie httpOnly del backend
//   sigue siendo el primary, esto es solo backup defensivo).
//
// Además guarda el flag `biometric_enabled` para saber si tenemos que
// pedir la huella al abrir el app.

import { isCapacitor } from "@/app/utils/runtime";

const KEY_TOKEN = "shop_session_token";
const KEY_EXP = "shop_session_expires_at"; // epoch ms
const KEY_BIO = "shop_biometric_enabled"; // "1" / "0"

// Carga lazy del plugin para no romper en SSR/web
let _prefs = null;
async function getPrefs() {
  if (!isCapacitor()) return null;
  if (_prefs) return _prefs;
  try {
    const mod = await import("@capacitor/preferences");
    _prefs = mod.Preferences;
  } catch (e) {
    console.warn("[tokenStorage] @capacitor/preferences no disponible:", e?.message);
    _prefs = null;
  }
  return _prefs;
}

async function pGet(key) {
  const prefs = await getPrefs();
  if (prefs) {
    try {
      const { value } = await prefs.get({ key });
      return value || null;
    } catch {
      return null;
    }
  }
  try {
    return localStorage.getItem(key) || null;
  } catch {
    return null;
  }
}

async function pSet(key, value) {
  const prefs = await getPrefs();
  if (prefs) {
    try {
      await prefs.set({ key, value: String(value ?? "") });
      return;
    } catch {}
  }
  try {
    localStorage.setItem(key, String(value ?? ""));
  } catch {}
}

async function pRemove(key) {
  const prefs = await getPrefs();
  if (prefs) {
    try {
      await prefs.remove({ key });
      return;
    } catch {}
  }
  try {
    localStorage.removeItem(key);
  } catch {}
}

/* ============================================================
   Token de sesión
============================================================ */

export async function getToken() {
  const tok = await pGet(KEY_TOKEN);
  if (!tok) return null;

  // Validar expiración local (no hace una request, solo descarta tokens
  // claramente vencidos para evitar ruido).
  const expStr = await pGet(KEY_EXP);
  const exp = Number(expStr || 0);
  if (exp > 0 && Date.now() > exp) {
    await clearToken();
    return null;
  }
  return tok;
}

/**
 * @param {string} token
 * @param {number} expiresInSeconds — segundos hasta expirar
 */
export async function setToken(token, expiresInSeconds) {
  if (!token) return clearToken();
  await pSet(KEY_TOKEN, String(token));
  if (expiresInSeconds && Number(expiresInSeconds) > 0) {
    const expAt = Date.now() + Number(expiresInSeconds) * 1000;
    await pSet(KEY_EXP, String(expAt));
  } else {
    await pRemove(KEY_EXP);
  }
}

export async function clearToken() {
  await pRemove(KEY_TOKEN);
  await pRemove(KEY_EXP);
}

/* ============================================================
   Flag de biometría habilitada por el usuario
============================================================ */

export async function isBiometricEnabled() {
  const v = await pGet(KEY_BIO);
  return String(v) === "1";
}

export async function setBiometricEnabled(on) {
  await pSet(KEY_BIO, on ? "1" : "0");
}
