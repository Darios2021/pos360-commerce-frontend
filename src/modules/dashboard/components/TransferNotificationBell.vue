<template>
  <div class="tnb">
    <v-menu
      v-model="open"
      :close-on-content-click="false"
      location="bottom end"
      offset="8"
      max-width="420"
    >
      <template #activator="{ props }">
        <v-btn icon variant="text" v-bind="props" @click="onOpenMenu">
          <v-badge
            v-if="pendingForMe.length > 0"
            :content="pendingForMe.length > 9 ? '9+' : String(pendingForMe.length)"
            color="warning"
            floating
          >
            <v-icon>mdi-truck-fast-outline</v-icon>
          </v-badge>
          <v-icon v-else>mdi-truck-fast-outline</v-icon>
          <v-tooltip activator="parent" location="bottom">Derivaciones pendientes</v-tooltip>
        </v-btn>
      </template>

      <v-card rounded="xl" class="tnb-panel" elevation="0">
        <!-- Header -->
        <div class="tnb-header">
          <div class="tnb-header__left">
            <div class="tnb-header__icon">
              <v-icon size="16" color="primary">mdi-truck-fast-outline</v-icon>
            </div>
            <span class="tnb-title">Paquetes en tránsito</span>
            <span v-if="pendingForMe.length" class="tnb-badge">{{ pendingForMe.length }}</span>
          </div>
          <div class="tnb-header__actions">
            <button
              class="tnb-icon-btn"
              :class="{ 'tnb-icon-btn--active': soundEnabled }"
              :title="soundEnabled ? 'Silenciar' : 'Activar sonido'"
              @click="toggleSound(!soundEnabled)"
            >
              <v-icon size="15">{{ soundEnabled ? 'mdi-volume-high' : 'mdi-volume-off' }}</v-icon>
            </button>
            <button class="tnb-icon-btn" @click="open = false">
              <v-icon size="15">mdi-close</v-icon>
            </button>
          </div>
        </div>

        <!-- Lista de paquetes pendientes -->
        <div class="tnb-list">
          <div v-if="!initialized" class="tnb-loading">
            <v-progress-circular indeterminate size="22" color="primary" />
          </div>

          <div v-else-if="!pendingForMe.length" class="tnb-empty">
            <v-icon size="36" color="success" class="mb-2">mdi-check-circle-outline</v-icon>
            <span>Sin paquetes pendientes</span>
          </div>

          <div
            v-for="t in pendingForMe"
            :key="t.id"
            class="tnb-item"
            :class="{ 'tnb-item--unread': !seenIds.has(t.id) }"
            @click="openTransfer(t)"
          >
            <div v-if="!seenIds.has(t.id)" class="tnb-item__dot" />

            <div class="tnb-item__body">
              <div class="tnb-item__top">
                <span class="tnb-item__number">{{ t.number }}</span>
                <span class="tnb-item__time">{{ timeAgo(t.dispatched_at) }}</span>
              </div>
              <div class="tnb-item__route">
                <v-icon size="12" class="tnb-route-icon">mdi-store-outline</v-icon>
                <span>{{ t.fromWarehouse?.branch?.name || "—" }}</span>
                <v-icon size="12" class="tnb-route-arrow">mdi-arrow-right</v-icon>
                <v-icon size="12" class="tnb-route-icon">mdi-store</v-icon>
                <span>{{ t.toBranch?.name || t.toWarehouse?.branch?.name || "—" }}</span>
              </div>
              <div class="tnb-item__meta">
                <v-icon size="11">mdi-package-variant</v-icon>
                <span>{{ t.items?.length || 0 }} producto{{ t.items?.length !== 1 ? "s" : "" }}</span>
                <template v-if="t.dispatcher">
                  <span class="tnb-dot-sep">·</span>
                  <v-icon size="11">mdi-account-outline</v-icon>
                  <span>{{ userName(t.dispatcher) }}</span>
                </template>
              </div>
            </div>
            <v-icon size="14" color="primary" class="tnb-item__chevron">mdi-chevron-right</v-icon>
          </div>
        </div>

        <div v-if="pendingForMe.length" class="tnb-footer">
          <router-link class="tnb-footer__link tnb-footer__link--primary" :to="{ name: 'transfers' }" @click="open = false">
            <v-icon size="13" class="mr-1">mdi-arrow-right-circle-outline</v-icon>
            Ver todas
          </router-link>
          <button class="tnb-footer__link tnb-footer__link--muted" @click="markAllSeen">
            <v-icon size="13" class="mr-1">mdi-check-all</v-icon>
            Marcar vistas
          </button>
        </div>
      </v-card>
    </v-menu>

    <!-- Dialog de detalle rápido -->
    <v-dialog v-model="showDetail" max-width="680" scrollable>
      <TransferDetail
        v-if="selected"
        :transfer="selected"
        :is-admin="auth.isAdmin"
        :is-central="isCentral"
        :current-branch-id="auth.branchId"
        @dispatch="onAction"
        @receive="onAction"
        @cancel="onAction"
        @close="showDetail = false"
      />
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useAuthStore } from "@/app/store/auth.store";
import { useTransferNotifications } from "../composables/useTransferNotifications";
import TransferDetail from "./TransferDetail.vue";

const auth = useAuthStore();

const {
  pendingForMe,
  seenIds,
  soundEnabled,
  initialized,
  markSeen,
  markAllSeen,
  toggleSound,
  refresh,
} = useTransferNotifications();

const open       = ref(false);
const showDetail = ref(false);
const selected   = ref(null);

const isCentral = computed(() =>
  auth.isAdmin || Number(auth.user?.branch_id) === 1
);

// Cantidad de items no vistos (punto azul)
const unreadCount = computed(() =>
  pendingForMe.value.filter((t) => !seenIds.value.has(t.id)).length
);

function onOpenMenu() {
  // Marcar como vistos después de 1.5 s de abrir el panel
  setTimeout(() => markAllSeen(), 1500);
}

function openTransfer(t) {
  markSeen(t.id);
  selected.value = t;
  showDetail.value = true;
  open.value = false;
}

async function onAction() {
  showDetail.value = false;
  await refresh();
}

function userName(u) {
  if (!u) return "—";
  return [u.first_name, u.last_name].filter(Boolean).join(" ") || `#${u.id}`;
}

function timeAgo(d) {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "ahora";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const days = Math.floor(h / 24);
  return `hace ${days} d`;
}
</script>

<style scoped>
/* ── Panel shell ─────────────────────────────────────────── */
.tnb-panel {
  min-width: 360px;
  max-width: 420px;
  background: rgb(var(--v-theme-surface)) !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.10) !important;
  overflow: hidden;
}

/* ── Header ──────────────────────────────────────────────── */
.tnb-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 14px 11px 12px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.tnb-header__left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.tnb-header__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(var(--v-theme-primary), 0.12);
  flex-shrink: 0;
}
.tnb-title {
  font-size: 13.5px;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: rgb(var(--v-theme-on-surface));
}
.tnb-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: rgb(var(--v-theme-primary));
  color: #fff;
  font-size: 10px;
  font-weight: 500;
  line-height: 1;
}
.tnb-header__actions {
  display: flex;
  align-items: center;
  gap: 2px;
}
.tnb-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: none;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.45);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}
.tnb-icon-btn:hover {
  background: rgba(var(--v-theme-on-surface), 0.07);
  color: rgba(var(--v-theme-on-surface), 0.85);
}
.tnb-icon-btn--active {
  color: rgb(var(--v-theme-primary));
}

/* ── List ────────────────────────────────────────────────── */
.tnb-list {
  max-height: 360px;
  overflow-y: auto;
}
.tnb-list::-webkit-scrollbar { width: 4px; }
.tnb-list::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-on-surface), 0.15);
  border-radius: 2px;
}

.tnb-loading {
  display: flex;
  justify-content: center;
  padding: 36px;
}
.tnb-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 36px 16px;
  gap: 6px;
  color: rgba(var(--v-theme-on-surface), 0.4);
  font-size: 12.5px;
  font-weight: 400;
}

/* ── Item ────────────────────────────────────────────────── */
.tnb-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px 11px 18px;
  cursor: pointer;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.055);
  transition: background 0.1s;
  position: relative;
}
.tnb-item:last-child { border-bottom: none; }
.tnb-item:hover { background: rgba(var(--v-theme-primary), 0.05); }
.tnb-item--unread { background: rgba(var(--v-theme-primary), 0.035); }

.tnb-item__dot {
  position: absolute;
  left: 7px;
  top: 50%;
  transform: translateY(-50%);
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.25);
}

.tnb-item__body { flex: 1; min-width: 0; }
.tnb-item__chevron { opacity: 0.4; flex-shrink: 0; }
.tnb-item:hover .tnb-item__chevron { opacity: 0.9; }

.tnb-item__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.tnb-item__number {
  font-size: 12.5px;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: rgb(var(--v-theme-on-surface));
}
.tnb-item__time {
  font-size: 10.5px;
  color: rgba(var(--v-theme-on-surface), 0.4);
  font-weight: 400;
}

.tnb-item__route {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), 0.78);
  margin-bottom: 4px;
}
.tnb-route-icon { opacity: 0.6; }
.tnb-route-arrow { color: rgba(var(--v-theme-primary), 0.7); }

.tnb-item__meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.45);
  font-weight: 500;
}
.tnb-dot-sep { opacity: 0.4; }

/* ── Footer ──────────────────────────────────────────────── */
.tnb-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 14px;
  background: rgba(var(--v-theme-on-surface), 0.025);
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.tnb-footer__link {
  display: inline-flex;
  align-items: center;
  font-size: 11.5px;
  font-weight: 400;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  border: none;
  background: transparent;
  cursor: pointer;
  text-decoration: none;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.12s, color 0.12s;
}
.tnb-footer__link--primary {
  color: rgb(var(--v-theme-primary));
}
.tnb-footer__link--primary:hover {
  background: rgba(var(--v-theme-primary), 0.1);
}
.tnb-footer__link--muted {
  color: rgba(var(--v-theme-on-surface), 0.45);
}
.tnb-footer__link--muted:hover {
  background: rgba(var(--v-theme-on-surface), 0.07);
  color: rgba(var(--v-theme-on-surface), 0.75);
}
</style>
