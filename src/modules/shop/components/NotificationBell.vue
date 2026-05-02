<!-- Centro de notificaciones del cliente — campanita en el header del shop. -->
<template>
  <div class="nb">
    <v-menu v-model="open" :close-on-content-click="false" location="bottom end" max-width="360" min-width="320" offset="10">
      <template #activator="{ props: pp }">
        <button v-bind="pp" type="button" class="nb-btn" :aria-label="`Notificaciones${unread ? ` (${unread} sin leer)` : ''}`">
          <v-icon size="22">mdi-bell-outline</v-icon>
          <span v-if="unread > 0" class="nb-badge">{{ unreadDisplay }}</span>
        </button>
      </template>

      <div class="nb-panel">
        <div class="nb-head">
          <div class="nb-title">Notificaciones</div>
          <button v-if="store.hasUnread" type="button" class="nb-mark-all" @click="onMarkAll">
            Marcar todas como leídas
          </button>
        </div>

        <div v-if="store.loading && !store.items.length" class="nb-empty">
          <v-progress-circular indeterminate size="22" />
          <div class="nb-empty-text">Cargando…</div>
        </div>

        <div v-else-if="!store.items.length" class="nb-empty">
          <v-icon size="32" color="rgba(0,0,0,0.25)">mdi-bell-outline</v-icon>
          <div class="nb-empty-text">No hay notificaciones por ahora</div>
        </div>

        <ul v-else class="nb-list">
          <li
            v-for="n in store.items"
            :key="n.id"
            class="nb-item"
            :class="{ 'is-unread': !n.read_at }"
            @click="onClick(n)"
          >
            <div class="nb-ico" :data-type="iconKind(n)">
              <v-icon size="18">{{ iconFor(n) }}</v-icon>
            </div>
            <div class="nb-body">
              <div class="nb-row">
                <span class="nb-name">{{ n.title }}</span>
                <span class="nb-date">{{ shortDate(n.created_at) }}</span>
              </div>
              <div v-if="n.body" class="nb-desc">{{ n.body }}</div>
            </div>
            <span v-if="!n.read_at" class="nb-dot" aria-hidden="true" />
          </li>
        </ul>

        <div v-if="store.items.length" class="nb-foot">
          <RouterLink to="/shop/account/notifications" class="nb-see-all" @click="open = false">
            Ver todas
          </RouterLink>
        </div>
      </div>
    </v-menu>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useRouter, RouterLink } from "vue-router";
import { useNotificationsStore } from "@/modules/shop/store/notifications.store";
import { useShopAuthStore } from "@/modules/shop/service/shopAuth.store";

const router = useRouter();
const auth = useShopAuthStore();
const store = useNotificationsStore();

const open = ref(false);

const unread = computed(() => store.unread);
const unreadDisplay = computed(() => (store.unread > 99 ? "99+" : String(store.unread)));

watch(open, (v) => {
  if (v) store.loadFirstPage({ force: true });
});

watch(
  () => auth.isLogged,
  (logged) => {
    if (logged) {
      store.startPolling();
    } else {
      store.stopPolling();
      store.reset();
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (auth.isLogged) store.startPolling();
});
onBeforeUnmount(() => {
  store.stopPolling();
});

function shortDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD} d`;
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function iconKind(n) {
  const t = String(n?.type || "").toLowerCase();
  if (t.startsWith("payment")) return "payment";
  if (t.startsWith("order_cancelled")) return "cancel";
  if (t.startsWith("order_delivered")) return "ok";
  if (t.startsWith("order_ready")) return "ok";
  if (t.startsWith("order_processing")) return "info";
  if (t.startsWith("order")) return "info";
  return "default";
}
function iconFor(n) {
  const k = iconKind(n);
  switch (k) {
    case "payment": return "mdi-credit-card-check-outline";
    case "cancel": return "mdi-close-circle-outline";
    case "ok": return "mdi-check-circle-outline";
    case "info": return "mdi-package-variant-closed";
    default: return "mdi-bell-ring-outline";
  }
}

async function onClick(n) {
  if (!n.read_at) await store.markAsRead(n.id);
  if (n.link) {
    open.value = false;
    router.push(n.link).catch(() => {});
  }
}

async function onMarkAll() {
  await store.markAllAsRead();
}
</script>

<style scoped>
.nb {
  position: relative;
}
.nb-btn {
  appearance: none;
  background: transparent;
  border: 0;
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  position: relative;
  color: inherit;
  transition: background 0.16s ease;
}
.nb-btn:hover {
  background: rgba(255, 255, 255, 0.12);
}
.nb-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  display: grid;
  place-items: center;
  line-height: 1;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.85);
}

.nb-panel {
  width: 360px;
  max-width: calc(100vw - 24px);
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  font-family: "Inter", system-ui, sans-serif;
}
.nb-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.nb-title {
  font-weight: 540;
  font-size: 14px;
  color: rgba(17, 24, 39, 0.92);
  letter-spacing: -0.005em;
}
.nb-mark-all {
  appearance: none;
  background: transparent;
  border: 0;
  cursor: pointer;
  font-size: 12px;
  font-weight: 460;
  color: rgb(var(--v-theme-primary));
}
.nb-mark-all:hover {
  text-decoration: underline;
}

.nb-empty {
  padding: 32px 14px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.nb-empty-text {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.5);
}

.nb-list {
  list-style: none;
  margin: 0;
  padding: 4px 0;
  max-height: 50vh;
  overflow-y: auto;
}
.nb-item {
  display: grid;
  grid-template-columns: 32px 1fr auto;
  gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.14s ease;
  align-items: flex-start;
  position: relative;
}
.nb-item:hover {
  background: rgba(0, 0, 0, 0.03);
}
.nb-item.is-unread {
  background: rgba(21, 101, 192, 0.04);
}

.nb-ico {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(21, 101, 192, 0.10);
  color: rgb(var(--v-theme-primary));
  flex: 0 0 auto;
}
.nb-ico[data-type="payment"] { background: rgba(0, 153, 102, 0.12); color: #009966; }
.nb-ico[data-type="cancel"]  { background: rgba(239, 68, 68, 0.12);  color: #ef4444; }
.nb-ico[data-type="ok"]      { background: rgba(0, 153, 102, 0.12); color: #009966; }
.nb-ico[data-type="info"]    { background: rgba(245, 158, 11, 0.12); color: #b45309; }

.nb-body {
  min-width: 0;
}
.nb-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.nb-name {
  font-weight: 540;
  font-size: 13.5px;
  color: rgba(17, 24, 39, 0.92);
  line-height: 1.25;
}
.nb-date {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.45);
  white-space: nowrap;
  flex: 0 0 auto;
}
.nb-desc {
  font-size: 12.5px;
  color: rgba(0, 0, 0, 0.55);
  margin-top: 2px;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.nb-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgb(var(--v-theme-primary));
  align-self: center;
  flex: 0 0 auto;
}

.nb-foot {
  padding: 8px 14px 12px;
  text-align: center;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}
.nb-see-all {
  font-size: 12.5px;
  font-weight: 460;
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}
.nb-see-all:hover {
  text-decoration: underline;
}
</style>
