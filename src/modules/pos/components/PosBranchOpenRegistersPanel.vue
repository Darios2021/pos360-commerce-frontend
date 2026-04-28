<template>
  <div v-if="registers.length" class="branch-open" role="region" aria-label="Cajas abiertas en la sucursal">
    <div class="branch-open__head">
      <v-icon size="14" class="branch-open__icon">mdi-eye-outline</v-icon>
      <span class="branch-open__title">
        {{ registers.length === 1 ? "Caja abierta en esta sucursal" : "Cajas abiertas en esta sucursal" }}
      </span>
      <v-chip
        size="x-small"
        color="primary"
        variant="tonal"
        class="branch-open__count"
      >
        {{ registers.length }}
      </v-chip>
      <v-chip
        size="x-small"
        variant="tonal"
        class="branch-open__mode"
        title="Modo lectura: no podés operar sobre cajas de otros usuarios"
      >
        solo lectura
      </v-chip>
    </div>

    <ul class="branch-open__list">
      <li v-for="r in rows" :key="r.id" class="branch-open__row">
        <div class="branch-open__avatar" :title="r.opened_by_name">
          {{ initialsOf(r.opened_by_name) }}
        </div>
        <div class="branch-open__info">
          <div class="branch-open__name">{{ r.opened_by_name }}</div>
          <div class="branch-open__meta">
            <span class="branch-open__meta-item">
              <v-icon size="11">mdi-clock-outline</v-icon>
              {{ r.elapsedLabel }}
            </span>
            <span v-if="r.openedAtLabel" class="branch-open__meta-item">
              <v-icon size="11">mdi-login-variant</v-icon>
              {{ r.openedAtLabel }}
            </span>
            <span class="branch-open__meta-item branch-open__meta-item--id">
              #{{ r.id }}
            </span>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

const props = defineProps({
  registers: { type: Array, default: () => [] },
});

const now = ref(Date.now());
let timer = null;

onMounted(() => {
  timer = setInterval(() => { now.value = Date.now(); }, 30 * 1000);
});
onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});

function formatTime(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function elapsedOf(openedAt) {
  if (!openedAt) return "";
  const t = new Date(openedAt).getTime();
  if (!Number.isFinite(t)) return "";
  const ms = Math.max(0, now.value - t);
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m < 1) return "recién";
  return `${m} min`;
}

function initialsOf(name) {
  const s = String(name || "").trim();
  if (!s) return "—";
  const parts = s.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "";
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase() || s.slice(0, 2).toUpperCase();
}

const rows = computed(() =>
  props.registers.map((r) => ({
    ...r,
    openedAtLabel: formatTime(r.opened_at),
    elapsedLabel: elapsedOf(r.opened_at),
  }))
);
</script>

<style scoped>
.branch-open {
  border-radius: 12px;
  padding: 10px 12px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.09);
}

.branch-open__head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.branch-open__icon { opacity: 0.65; }
.branch-open__title {
  font-size: 11.5px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.75;
}
.branch-open__count { font-weight: 500; }
.branch-open__mode {
  font-size: 10px;
  font-weight: 400;
  text-transform: lowercase;
  letter-spacing: 0.02em;
  opacity: 0.7;
  margin-left: auto;
}

.branch-open__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.branch-open__row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  padding: 6px 8px;
  border-radius: 10px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

.branch-open__avatar {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 500;
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
  flex-shrink: 0;
}

.branch-open__info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.branch-open__name {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.2;
  color: rgb(var(--v-theme-on-surface));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.branch-open__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 11px;
  opacity: 0.75;
}
.branch-open__meta-item {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-weight: 400;
}
.branch-open__meta-item :deep(.v-icon) { opacity: 0.7; }
.branch-open__meta-item--id {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10.5px;
  opacity: 0.5;
  margin-left: auto;
}
</style>
