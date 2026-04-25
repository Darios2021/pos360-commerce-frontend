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

// Logs solo en dev. En producción no necesitamos saber del lifecycle del socket
// salvo que falle algo fatal — y los errores ya van por `connect_error`.
const isDev = !!import.meta.env?.DEV;
if (isDev) {
  socket.on("connect",    () => console.debug("[Socket] Conectado:", socket.id));
  socket.on("disconnect", (r) => console.debug("[Socket] Desconectado:", r));
}

// Suprimir errores repetidos — solo loguear el primero y luego silencio.
// Además, si no hay URL configurada (ej: dev sin backend de socket.io),
// no intentamos siquiera conectar para no ensuciar la consola.
let _socketErrCount = 0;
socket.on("connect_error", (e) => {
  _socketErrCount++;
  if (_socketErrCount === 1 && isDev) {
    console.debug("[Socket] No conecta:", e.message, "(reintentando en background)");
  }
  // En producción y después del primer reintento no hay nada nuevo que
  // reportar; el socket queda desactivado y la app sigue funcionando vía REST.
});

export default socket;
