// src/app/native/avisos.js
//
// AVISOS PUSH EN LA APK (Firebase Cloud Messaging).
//
// El telefono se registra en la API (POST /me/devices) y la API le manda los
// avisos de venta, pedido web, derivacion y cierre de caja con diferencia
// (pos360-commerce-api/src/services/avisosPush.service.js). Tocar el aviso
// abre la pantalla que trae en `data.ruta`.
//
// Necesita el proyecto de Firebase: android/app/google-services.json (fuera de
// git). scripts/build-apk.mjs pone VITE_APK_PUSH=1 solo si ese archivo existe.
// Sin el, este modulo no hace nada: llamar a register() sin Firebase cierra
// la app en Android.
//
// Se apaga y prende en Impresión y teléfono > Avisos de ventas y pedidos.

import { isCapacitor } from "@/app/utils/runtime";
import http from "@/app/api/http";

const CLAVE = "pos360.avisos"; // "0" = apagados por el usuario
const CLAVE_TOKEN = "pos360.avisos.token";

export const AVISOS_CONFIGURADOS = isCapacitor() && import.meta.env.VITE_APK_PUSH === "1";

export function avisosActivos() {
  try { return localStorage.getItem(CLAVE) !== "0"; } catch { return true; }
}

let _plugin = null;
async function plugin() {
  if (!AVISOS_CONFIGURADOS) return null;
  if (!_plugin) _plugin = (await import("@capacitor/push-notifications")).PushNotifications;
  return _plugin;
}

let _escuchando = false;

/**
 * Pide permiso, registra el telefono y deja escuchando los toques.
 * `router` es el de vue-router, para abrir la pantalla del aviso.
 * Devuelve true si quedo registrado.
 */
export async function iniciarAvisos(router, { branch_id = null } = {}) {
  const P = await plugin();
  if (!P || !avisosActivos()) return false;
  try {
    let { receive } = await P.checkPermissions();
    if (receive === "prompt" || receive === "prompt-with-rationale") ({ receive } = await P.requestPermissions());
    if (receive !== "granted") return false;

    if (!_escuchando) {
      _escuchando = true;
      await P.createChannel?.({ id: "avisos", name: "Ventas y pedidos", importance: 4 }).catch(() => {});
      P.addListener("registration", async ({ value }) => {
        try {
          await http.post("/me/devices", { token: value, platform: "android", branch_id, app_version: import.meta.env.VITE_APP_VERSION || null });
          localStorage.setItem(CLAVE_TOKEN, value);
        } catch { /* se reintenta en el proximo arranque */ }
      });
      P.addListener("pushNotificationActionPerformed", ({ notification }) => {
        const ruta = notification?.data?.ruta;
        if (ruta && String(ruta).startsWith("/app")) router.push(String(ruta)).catch(() => {});
      });
    }
    await P.register();
    return true;
  } catch {
    return false;
  }
}

/** Apaga los avisos en este telefono: lo da de baja en la API. */
export async function apagarAvisos() {
  try { localStorage.setItem(CLAVE, "0"); } catch { /* */ }
  const token = (() => { try { return localStorage.getItem(CLAVE_TOKEN); } catch { return null; } })();
  if (token) {
    await http.delete(`/me/devices/${encodeURIComponent(token)}`).catch(() => {});
    try { localStorage.removeItem(CLAVE_TOKEN); } catch { /* */ }
  }
  const P = await plugin();
  await P?.unregister?.().catch(() => {});
}

export async function prenderAvisos(router, opciones) {
  try { localStorage.removeItem(CLAVE); } catch { /* */ }
  return iniciarAvisos(router, opciones);
}
