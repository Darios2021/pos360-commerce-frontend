// src/modules/dashboard/composables/useTransferNotifications.js
//
// Notificaciones de derivaciones en tiempo real.
// Estrategia dual: Socket.io (inmediato) + polling HTTP (fallback / sync inicial).
//
// Comportamiento:
//  • Al conectarse el socket → join "branch:{branchId}"
//  • "transfer:dispatched"  → agrega al banner, chime, notif desktop
//  • "transfer:received"    → quita del banner inmediatamente
//  • "transfer:cancelled"   → quita del banner inmediatamente
//  • Polling cada 60s       → sincronización por si el socket perdió algún evento
//  • Banner persistente     → no desaparece hasta que no haya pendientes

import { ref, computed, onMounted, onUnmounted } from "vue";
import { useAuthStore }   from "@/app/store/auth.store";
import { listTransfers }  from "../service/stockTransfer.api";
import socket             from "@/app/services/socket";

const SEEN_KEY  = "pos360_seen_transfer_ids_v2";
const SOUND_KEY = "pos360_transfer_sound_enabled";
const POLL_MS   = 60_000;   // 60s — fallback si el socket falla

// ── Estado global singleton ────────────────────────────────────────────────────
const pendingTransfers = ref([]);   // derivaciones "dispatched" hacia mi branch
const initialized      = ref(false);
let   pollTimer        = null;
let   pollConsumers    = 0;
let   socketBranchId   = null;      // branchId actualmente suscripto

// ── Audio ─────────────────────────────────────────────────────────────────────
function playChime() {
  try {
    const ctx   = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [880, 1108, 1319];
    notes.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const t0 = ctx.currentTime + i * 0.13;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.25, t0 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.5);
      osc.start(t0);
      osc.stop(t0 + 0.55);
    });
  } catch {}
}

// ── Desktop notification ───────────────────────────────────────────────────────
function showDesktopNotification(transfer) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const from   = transfer.fromWarehouse?.branch?.name || transfer.from_branch || "Casa Central";
  const items  = transfer.items?.length ?? transfer.item_count ?? 0;
  new Notification("📦 Nuevo paquete en camino", {
    body:      `${transfer.number} · ${items} producto${items !== 1 ? "s" : ""} desde ${from}`,
    icon:      "/favicon.ico",
    tag:       `transfer-${transfer.id}`,
    renotify:  true,
    requireInteraction: true,   // ← la notificación queda fija hasta que el usuario la cierre
  });
}

// ── localStorage helpers ───────────────────────────────────────────────────────
function loadSeenIds() {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]")); } catch { return new Set(); }
}
function saveSeenIds(set) {
  try { localStorage.setItem(SEEN_KEY, JSON.stringify([...set])); } catch {}
}
function getSoundEnabled() {
  const v = localStorage.getItem(SOUND_KEY);
  return v === null ? true : v === "true";
}
function setSoundEnabled(v) { localStorage.setItem(SOUND_KEY, String(v)); }

// ── Composable ────────────────────────────────────────────────────────────────
export function useTransferNotifications() {
  const auth         = useAuthStore();
  const seenIds      = ref(loadSeenIds());
  const soundEnabled = ref(getSoundEnabled());

  // Solo los que vienen HACIA mi sucursal
  const pendingForMe = computed(() =>
    pendingTransfers.value.filter((t) =>
      String(t.to_branch_id) === String(auth.branchId) || auth.isAdmin
    )
  );

  const unreadCount = computed(() =>
    pendingForMe.value.filter((t) => !seenIds.value.has(t.id)).length
  );

  // ── Helpers para manipular pendingTransfers ─────────────────────────────────
  function upsertPending(transfer) {
    const idx = pendingTransfers.value.findIndex((t) => t.id === transfer.id);
    if (idx >= 0) pendingTransfers.value[idx] = { ...pendingTransfers.value[idx], ...transfer };
    else          pendingTransfers.value.push(transfer);
  }

  function removePending(transferId) {
    pendingTransfers.value = pendingTransfers.value.filter((t) => t.id !== transferId);
  }

  // ── Notificar nuevo despacho ────────────────────────────────────────────────
  function notifyDispatched(transfer, { sound = true } = {}) {
    const myBranchId = String(auth.branchId || "");
    const destId     = String(transfer.to_branch_id || "");
    if (!auth.isAdmin && myBranchId && destId !== myBranchId) return;  // no me corresponde
    if (sound && soundEnabled.value) playChime();
    showDesktopNotification(transfer);
  }

  // ── Polling HTTP (fallback / sync) ──────────────────────────────────────────
  async function poll(isFirstLoad = false) {
    if (!auth.isAuthed) return;
    try {
      const { data } = await listTransfers({ status: "dispatched", limit: 50, page: 1 });
      const fresh    = data.transfers || [];

      if (!isFirstLoad) {
        const known    = new Set(pendingTransfers.value.map((t) => t.id));
        const newOnes  = fresh.filter((t) => !known.has(t.id));
        newOnes.forEach((t) => notifyDispatched(t));
      }

      pendingTransfers.value = fresh;
      initialized.value      = true;
    } catch {}
  }

  // ── Socket.io ──────────────────────────────────────────────────────────────
  function joinBranchRoom() {
    const branchId = auth.branchId || (auth.isAdmin ? "admin" : null);
    if (!branchId || branchId === socketBranchId) return;
    socket.emit("join:branch", branchId);
    socketBranchId = branchId;
  }

  function setupSocketListeners() {
    // Nuevo despacho → notificar inmediatamente
    socket.on("transfer:dispatched", (data) => {
      // Hacemos una recarga liviana para obtener el objeto completo
      listTransfers({ status: "dispatched", limit: 50, page: 1 })
        .then(({ data: d }) => {
          pendingTransfers.value = d.transfers || [];
          initialized.value      = true;
          // Buscar el transfer recién llegado para notificar
          const t = (d.transfers || []).find((x) => x.id === data.id) || data;
          notifyDispatched(t);
        })
        .catch(() => {
          // Si falla la recarga, al menos agregar el stub y notificar
          upsertPending(data);
          notifyDispatched(data);
        });
    });

    // Recepcionado → quitar del banner inmediatamente
    socket.on("transfer:received", (data) => {
      removePending(data.id);
    });

    // Cancelado → quitar del banner
    socket.on("transfer:cancelled", (data) => {
      removePending(data.id);
    });

    // Al (re)conectar → unirse a la sala de nuevo y sincronizar
    socket.on("connect", () => {
      joinBranchRoom();
      poll(false);
    });
  }

  function connectSocket() {
    if (!socket.connected) socket.connect();
    joinBranchRoom();
  }

  // ── Polling management ─────────────────────────────────────────────────────
  function startPolling() {
    pollConsumers++;
    if (pollConsumers === 1) {
      poll(true);
      pollTimer = setInterval(() => poll(false), POLL_MS);
    }
  }

  function stopPolling() {
    pollConsumers = Math.max(0, pollConsumers - 1);
    if (pollConsumers === 0 && pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  function disconnectSocket() {
    // Solo desconectar si no hay otros consumidores
    if (pollConsumers <= 0 && socket.connected) {
      socket.off("transfer:dispatched");
      socket.off("transfer:received");
      socket.off("transfer:cancelled");
      socket.off("connect");
      socket.disconnect();
      socketBranchId = null;
    }
  }

  // ── Permisos de notificación de escritorio ─────────────────────────────────
  async function requestPermission() {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  onMounted(async () => {
    await requestPermission();
    setupSocketListeners();
    connectSocket();
    startPolling();
  });

  onUnmounted(() => {
    stopPolling();
    disconnectSocket();
  });

  // ── API pública ────────────────────────────────────────────────────────────
  function markSeen(transferId) {
    seenIds.value.add(transferId);
    saveSeenIds(seenIds.value);
  }
  function markAllSeen() {
    pendingForMe.value.forEach((t) => seenIds.value.add(t.id));
    saveSeenIds(seenIds.value);
  }
  function toggleSound(v) {
    soundEnabled.value = v;
    setSoundEnabled(v);
  }

  return {
    pendingForMe,
    unreadCount,
    seenIds,
    soundEnabled,
    initialized,
    markSeen,
    markAllSeen,
    toggleSound,
    playChime,
    refresh: () => poll(false),
  };
}
