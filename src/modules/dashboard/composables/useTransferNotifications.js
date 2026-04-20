// src/modules/dashboard/composables/useTransferNotifications.js
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useAuthStore } from "@/app/store/auth.store";
import { listTransfers } from "../service/stockTransfer.api";

const SEEN_KEY   = "pos360_seen_transfer_ids_v2";
const SOUND_KEY  = "pos360_transfer_sound_enabled";
const POLL_MS    = 45_000; // cada 45 segundos

// ── Estado compartido (singleton por sesión) ──────────────────────────────────
const pendingTransfers = ref([]);   // derivaciones en estado "dispatched" para mi branch
const allTransfers     = ref([]);   // para la badge general (incluye borradores propios)
const initialized      = ref(false);
let   pollTimer        = null;
let   pollConsumers    = 0;

// ── Sonido con Web Audio API ──────────────────────────────────────────────────
function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [880, 1108, 1319]; // La5, Do#6, Mi6 — acorde Mayor agradable
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

// ── Notificación de escritorio ────────────────────────────────────────────────
function showDesktopNotification(transfer) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const from    = transfer.fromWarehouse?.branch?.name || "Casa Central";
  const items   = transfer.items?.length || 0;
  const sender  = transfer.dispatcher
    ? [transfer.dispatcher.first_name, transfer.dispatcher.last_name].filter(Boolean).join(" ")
    : "—";
  new Notification("📦 Nuevo paquete en camino", {
    body   : `${transfer.number} · ${items} producto${items !== 1 ? "s" : ""} desde ${from}\nDespachado por ${sender}`,
    icon   : "/favicon.ico",
    tag    : `transfer-${transfer.id}`,
    renotify: false,
  });
}

// ── Storage helpers ───────────────────────────────────────────────────────────
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
function setSoundEnabled(v) {
  localStorage.setItem(SOUND_KEY, String(v));
}

// ── Composable público ────────────────────────────────────────────────────────
export function useTransferNotifications() {
  const auth    = useAuthStore();
  const seenIds = ref(loadSeenIds());
  const soundEnabled = ref(getSoundEnabled());

  // Transfers "en tránsito" hacia mi branch que aún no vi
  const pendingForMe = computed(() =>
    pendingTransfers.value.filter((t) =>
      String(t.to_branch_id) === String(auth.branchId) || auth.isAdmin
    )
  );

  const unreadCount = computed(() =>
    pendingForMe.value.filter((t) => !seenIds.value.has(t.id)).length
  );

  async function poll(isFirstLoad = false) {
    if (!auth.isAuthed) return;
    try {
      const { data } = await listTransfers({ status: "dispatched", limit: 50, page: 1 });
      const fresh = data.transfers || [];

      if (!isFirstLoad && pendingTransfers.value.length > 0) {
        const knownIds = new Set(pendingTransfers.value.map((t) => t.id));
        const newOnes  = fresh.filter((t) => !knownIds.has(t.id));
        if (newOnes.length) {
          if (soundEnabled.value) playChime();
          newOnes.forEach(showDesktopNotification);
        }
      }

      pendingTransfers.value = fresh;
      initialized.value      = true;
    } catch {}
  }

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

  async function requestPermission() {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }

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

  onMounted(async () => {
    await requestPermission();
    startPolling();
  });
  onUnmounted(stopPolling);

  return {
    pendingForMe,
    unreadCount,
    soundEnabled,
    initialized,
    markSeen,
    markAllSeen,
    toggleSound,
    playChime,
    refresh: () => poll(false),
  };
}
