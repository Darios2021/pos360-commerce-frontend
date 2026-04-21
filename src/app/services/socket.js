// src/app/services/socket.js
// Cliente Socket.io singleton — se conecta al backend para recibir eventos en tiempo real.
//
// URL: usa VITE_SOCKET_URL si está definida; si no, deriva del VITE_API_BASE_URL
// quitando el sufijo /api (p.ej. https://sanjuantecnologia.com/api → https://sanjuantecnologia.com).
//
// El socket NO conecta automáticamente. Llamar connect() / disconnect() según auth.

import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "");

const socket = io(SOCKET_URL, {
  autoConnect:          false,
  transports:           ["polling", "websocket"],
  reconnectionAttempts: 5,           // reducido: no spamear indefinidamente
  reconnectionDelay:    5_000,
  reconnectionDelayMax: 30_000,
  timeout:              20_000,
});

socket.on("connect",    () => console.log("🔌 [Socket] Conectado:", socket.id));
socket.on("disconnect", (r) => console.log("🔌 [Socket] Desconectado:", r));

// Suprimir errores repetidos — solo loguear el primero y luego silencio
let _socketErrCount = 0;
socket.on("connect_error", (e) => {
  _socketErrCount++;
  if (_socketErrCount === 1) {
    console.warn("🔌 [Socket] No se pudo conectar:", e.message, "— reintentando en background.");
  } else if (_socketErrCount === 5) {
    console.warn("🔌 [Socket] Reintentos agotados. Socket desactivado hasta próxima sesión.");
  }
});

export default socket;
