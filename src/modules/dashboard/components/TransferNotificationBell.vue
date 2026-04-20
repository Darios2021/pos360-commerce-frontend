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

      <v-card rounded="xl" class="tnb-panel" elevation="8">
        <!-- Header -->
        <div class="tnb-header">
          <div class="tnb-header__left">
            <v-icon size="18" color="primary" class="mr-2">mdi-truck-fast-outline</v-icon>
            <span class="tnb-title">Paquetes en tránsito</span>
            <v-chip
              v-if="pendingForMe.length"
              size="x-small"
              color="primary"
              class="ml-2"
            >{{ pendingForMe.length }}</v-chip>
          </div>
          <div class="tnb-header__actions">
            <v-btn
              icon size="x-small" variant="text"
              :color="soundEnabled ? 'primary' : 'secondary'"
              :title="soundEnabled ? 'Silenciar' : 'Activar sonido'"
              @click="toggleSound(!soundEnabled)"
            >
              <v-icon size="16">{{ soundEnabled ? 'mdi-volume-high' : 'mdi-volume-off' }}</v-icon>
            </v-btn>
            <v-btn icon size="x-small" variant="text" @click="open = false">
              <v-icon size="16">mdi-close</v-icon>
            </v-btn>
          </div>
        </div>
        <v-divider />

        <!-- Lista de paquetes pendientes -->
        <div class="tnb-list">
          <div v-if="!initialized" class="tnb-loading">
            <v-progress-circular indeterminate size="24" color="primary" />
          </div>

          <div v-else-if="!pendingForMe.length" class="tnb-empty">
            <v-icon size="40" color="success" class="mb-2">mdi-check-circle-outline</v-icon>
            <p>Sin paquetes pendientes</p>
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
                <v-icon size="13">mdi-store-outline</v-icon>
                <span>{{ t.fromWarehouse?.branch?.name || "—" }}</span>
                <v-icon size="13" class="mx-1">mdi-arrow-right</v-icon>
                <v-icon size="13">mdi-store</v-icon>
                <span>{{ t.toBranch?.name || t.toWarehouse?.branch?.name || "—" }}</span>
              </div>
              <div class="tnb-item__meta">
                <v-icon size="12" class="mr-1">mdi-package-variant</v-icon>
                <span>{{ t.items?.length || 0 }} producto{{ t.items?.length !== 1 ? "s" : "" }}</span>
                <template v-if="t.dispatcher">
                  <span class="mx-1">·</span>
                  <v-icon size="12" class="mr-1">mdi-account-outline</v-icon>
                  <span>{{ userName(t.dispatcher) }}</span>
                </template>
              </div>
            </div>
            <v-icon size="16" color="primary" class="flex-shrink-0">mdi-chevron-right</v-icon>
          </div>
        </div>

        <v-divider v-if="pendingForMe.length" />
        <div v-if="pendingForMe.length" class="tnb-footer">
          <v-btn variant="text" size="small" :to="{ name: 'transfers' }" @click="open = false">
            Ver todas las derivaciones
          </v-btn>
          <v-btn variant="text" size="small" color="secondary" @click="markAllSeen">
            Marcar como vistas
          </v-btn>
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
import { useRouter } from "vue-router";
import { useAuthStore } from "@/app/store/auth.store";
import { useTransferNotifications } from "../composables/useTransferNotifications";
import TransferDetail from "./TransferDetail.vue";

const auth   = useAuthStore();
const router = useRouter();

const { pendingForMe, unreadCount, soundEnabled, initialized, markSeen, markAllSeen, toggleSound, refresh } =
  useTransferNotifications();

const open       = ref(false);
const showDetail = ref(false);
const selected   = ref(null);

// seenIds expuesto para el template
const seenIds = computed(() => {
  const s = new Set();
  pendingForMe.value.filter((t) => unreadCount.value === 0 || true).forEach(() => {});
  // Re-usar la misma lógica del composable: un transfer es "seen" si no está en unread
  // Simplificamos: lo marcamos en markSeen()
  return s;
});

const isCentral = computed(() =>
  auth.isAdmin || Number(auth.user?.branch_id) === 1
);

function onOpenMenu() {
  // Al abrir, marcar todos como vistos después de 1.5s
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
.tnb-panel { min-width: 360px; max-width: 420px; }

.tnb-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px;
}
.tnb-header__left  { display: flex; align-items: center; }
.tnb-header__actions { display: flex; gap: 4px; }
.tnb-title { font-size: 14px; font-weight: 700; }

.tnb-list { max-height: 380px; overflow-y: auto; }

.tnb-loading { display: flex; justify-content: center; padding: 32px; }
.tnb-empty  {
  display: flex; flex-direction: column; align-items: center;
  padding: 32px 16px; color: rgba(var(--v-theme-on-surface), .4);
  font-size: 13px;
}

.tnb-item {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px; cursor: pointer;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), .06);
  transition: background .12s; position: relative;
}
.tnb-item:hover { background: rgba(var(--v-theme-primary), .05); }
.tnb-item--unread { background: rgba(var(--v-theme-primary), .04); }

.tnb-item__dot {
  position: absolute; left: 6px; top: 50%; transform: translateY(-50%);
  width: 6px; height: 6px; border-radius: 50%;
  background: rgb(var(--v-theme-primary));
}

.tnb-item__body { flex: 1; min-width: 0; }
.tnb-item__top  { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.tnb-item__number { font-size: 13px; font-weight: 700; }
.tnb-item__time   { font-size: 11px; color: rgba(var(--v-theme-on-surface), .45); }
.tnb-item__route  {
  display: flex; align-items: center; gap: 4px;
  font-size: 12px; color: rgba(var(--v-theme-on-surface), .75);
  margin-bottom: 3px;
}
.tnb-item__meta {
  display: flex; align-items: center; font-size: 11px;
  color: rgba(var(--v-theme-on-surface), .5);
}

.tnb-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 12px;
}
</style>
