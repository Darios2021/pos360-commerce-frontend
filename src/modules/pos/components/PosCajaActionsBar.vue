<template>
  <div class="caja-inline" :class="isCajaOpen ? 'is-open' : 'is-closed'">

    <!-- FILA SUPERIOR -->
    <div class="caja-inline__top">
      <div class="caja-inline__status">
        <span class="caja-inline__dot" />
        <span class="caja-inline__badge">
          {{ isCajaOpen ? "Caja abierta" : "Caja cerrada" }}
        </span>
      </div>

      <div class="caja-inline__actions">
        <!-- refresh -->
        <v-btn
          icon
          size="small"
          variant="text"
          class="caja-inline__icon-btn caja-inline__icon-btn--neutral"
          :loading="loadingGlobal"
          @click="$emit('refresh')"
        >
          <v-icon size="18">mdi-refresh</v-icon>
          <v-tooltip activator="parent">Actualizar</v-tooltip>
        </v-btn>

        <!-- abrir -->
        <v-btn
          v-if="!isCajaOpen"
          icon
          size="small"
          variant="text"
          class="caja-inline__icon-btn caja-inline__icon-btn--open"
          @click="$emit('open-config')"
        >
          <v-icon size="20">mdi-play</v-icon>
          <v-tooltip activator="parent">Abrir caja</v-tooltip>
        </v-btn>

        <!-- cerrar -->
        <v-btn
          v-else
          icon
          size="small"
          variant="text"
          class="caja-inline__icon-btn caja-inline__icon-btn--close"
          @click="$emit('close-caja')"
        >
          <v-icon size="20">mdi-stop</v-icon>
          <v-tooltip activator="parent">Cerrar caja</v-tooltip>
        </v-btn>
      </div>
    </div>

    <!-- FILA INFERIOR -->
    <div class="caja-inline__bottom">
      <span class="caja-inline__meta">
        <strong>Cajero:</strong> {{ openedByLabel || "—" }}
      </span>

      <span class="caja-inline__meta">
        <strong>Apertura:</strong> {{ openedAtLabel || "—" }}
      </span>
    </div>

  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  isCajaOpen: Boolean,
  openedAt: [String, Date],
  openedBy: String,
  loadingGlobal: Boolean,
});

defineEmits(["open-config", "close-caja", "refresh"]);

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  return d.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const openedAtLabel = computed(() => formatDate(props.openedAt));
const openedByLabel = computed(() => props.openedBy || "");
</script>

<style scoped>
.caja-inline {
  width: 100%;
  padding: 12px 16px;
  border-radius: 18px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-border-color), 0.6);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* ===== FILA SUPERIOR ===== */
.caja-inline__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* estado */
.caja-inline__status {
  display: flex;
  align-items: center;
  gap: 10px;
}

.caja-inline__dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.caja-inline.is-open .caja-inline__dot {
  background: #22c55e;
}
.caja-inline.is-closed .caja-inline__dot {
  background: #ef4444;
}

.caja-inline__badge {
  padding: 6px 14px;
  border-radius: 999px;
  font-weight: 800;
  font-size: 0.95rem;
}

.caja-inline.is-open .caja-inline__badge {
  color: #166534;
  background: rgba(34, 197, 94, 0.1);
}
.caja-inline.is-closed .caja-inline__badge {
  color: #dc2626;
  background: rgba(239, 68, 68, 0.1);
}

/* ===== FILA INFERIOR ===== */
.caja-inline__bottom {
  display: flex;
  gap: 20px;
  padding-left: 20px;
}

.caja-inline__meta {
  font-size: 0.85rem;
  color: rgba(var(--v-theme-on-surface), 0.75);
}

.caja-inline__meta strong {
  font-weight: 700;
  margin-right: 4px;
}

/* ===== ACCIONES ===== */
.caja-inline__actions {
  display: flex;
  gap: 8px;
}

.caja-inline__icon-btn {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-border-color), 0.4);
}

/* variantes */
.caja-inline__icon-btn--neutral {
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.caja-inline__icon-btn--open {
  background: rgba(34, 197, 94, 0.12);
  color: #16a34a;
}

.caja-inline__icon-btn--close {
  background: rgba(239, 68, 68, 0.12);
  color: #dc2626;
}

/* quitar efectos */
.caja-inline__icon-btn:deep(.v-btn__overlay),
.caja-inline__icon-btn:deep(.v-btn__underlay) {
  opacity: 0 !important;
}

/* ===== DARK MODE FIX ===== */
:global(.v-theme--dark) .caja-inline {
  background: rgb(var(--v-theme-surface));
  border-color: rgba(255, 255, 255, 0.08);
}

:global(.v-theme--dark) .caja-inline__meta {
  color: rgba(255, 255, 255, 0.75);
}

:global(.v-theme--dark) .caja-inline__icon-btn {
  color: white !important;
  border-color: rgba(255,255,255,0.15);
}

:global(.v-theme--dark) .caja-inline__icon-btn .v-icon {
  color: white !important;
}

/* responsive */
@media (max-width: 900px) {
  .caja-inline__bottom {
    flex-direction: column;
    gap: 4px;
    padding-left: 0;
  }
}
</style>