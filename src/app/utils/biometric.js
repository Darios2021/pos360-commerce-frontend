// src/app/utils/biometric.js
//
// Helper sobre @aparajita/capacitor-biometric-auth.
// Solo opera en Capacitor (Android/iOS); en web devuelve siempre
// not-available para no romper el flujo del navegador.

import { isCapacitor } from "@/app/utils/runtime";

let _bio = null;
// OJO: el plugin de Capacitor es un Proxy que responde a cualquier propiedad,
// tambien a `then`. Si una funcion async lo devuelve tal cual, el await lo toma
// por una promesa, llama a plugin.then() (que no existe) y queda colgado para
// siempre. Por eso se devuelve envuelto: { plugin }.
async function getBio() {
  if (!isCapacitor()) return { plugin: null };
  if (_bio) return { plugin: _bio };
  try {
    const mod = await import("@aparajita/capacitor-biometric-auth");
    _bio = mod.BiometricAuth;
  } catch (e) {
    console.warn("[biometric] plugin no disponible:", e?.message);
    _bio = null;
  }
  return { plugin: _bio };
}

/**
 * @returns {Promise<{ available: boolean, reason?: string, biometryType?: string }>}
 */
export async function checkBiometricAvailability() {
  const { plugin: bio } = await getBio();
  if (!bio) return { available: false, reason: "no_capacitor" };
  try {
    const r = await bio.checkBiometry();
    // r.isAvailable: boolean
    // r.biometryType: number (1=touchId, 2=faceId, 3=fingerprint, 4=faceAuth, etc.)
    if (r?.isAvailable) {
      return { available: true, biometryType: String(r.biometryType ?? "") };
    }
    return { available: false, reason: r?.reason || "not_available" };
  } catch (e) {
    return { available: false, reason: e?.message || "error" };
  }
}

/**
 * Pide huella/face. Resuelve true si el usuario autentica OK,
 * false si cancela o falla.
 *
 * @param {object} opts
 * @param {string} opts.reason — texto que se muestra en el prompt
 *   (ej. "Ingresá tu huella para abrir Sj Tecnología")
 */
export async function authenticateBiometric(opts = {}) {
  const { plugin: bio } = await getBio();
  if (!bio) return false;
  try {
    await bio.authenticate({
      reason: opts.reason || "Ingresá con tu huella o rostro para continuar",
      cancelTitle: "Cancelar",
      allowDeviceCredential: true, // permite PIN/patrón si la huella falla
      iosFallbackTitle: "Usar PIN del dispositivo",
      androidTitle: opts.title || "Sj Tecnología",
      androidSubtitle: opts.reason || "Confirmá tu identidad",
      androidConfirmationRequired: false,
      androidBiometryStrength: 1, // weak — más permisivo
    });
    return true;
  } catch (e) {
    // El plugin lanza con BiometricAuthError; cualquier error → false
    return false;
  }
}
