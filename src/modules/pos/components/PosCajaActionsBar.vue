<template>
  <div class="caja-card" :class="isCajaOpen ? 'is-open' : 'is-closed'">
    <!-- TOP -->
    <div class="caja-card__top">
      <div class="caja-card__status">
        <span class="caja-card__dot" />
        <span class="caja-card__badge">CAJA</span>
      </div>

      <div class="caja-card__mini-actions">
        <!-- REFRESH -->
        <v-btn
          icon
          size="small"
          variant="text"
          class="caja-card__icon-btn"
          :loading="loadingGlobal"
          @click="$emit('refresh')"
        >
          <v-icon size="20">mdi-refresh</v-icon>
        </v-btn>

        <!-- SUCURSAL (NEUTRO) -->
        <v-btn
          v-if="hasMultiBranches"
          icon
          size="small"
          variant="text"
          class="caja-card__icon-btn caja-card__icon-btn--branch"
          :disabled="cartCount > 0"
          @click="$emit('open-branch-switch')"
        >
          <v-icon size="20">mdi-domain-switch</v-icon>
        </v-btn>
      </div>
    </div>

    <!-- META -->
    <div v-if="isCajaOpen && showMeta" class="caja-card__meta">
      <span v-if="openedByLabel" class="caja-card__meta-item">
        <v-icon size="14">mdi-account-circle-outline</v-icon>
        <span class="caja-card__meta-text">{{ openedByLabel }}</span>
      </span>

      <span
        v-if="openedByLabel && openedAtLabel"
        class="caja-card__meta-sep"
      >
        •
      </span>

      <span v-if="openedAtLabel" class="caja-card__meta-item">
        <v-icon size="14">mdi-clock-outline</v-icon>
        <span class="caja-card__meta-text">{{ openedAtLabel }}</span>
      </span>
    </div>

    <!-- ACTION -->
    <div class="caja-card__bottom">
      <v-btn
        v-if="!isCajaOpen"
        block
        size="default"
        variant="flat"
        class="caja-card__action-btn caja-card__action-btn--open"
        @click="$emit('open-config')"
      >
        <v-icon size="18" start>mdi-play-circle</v-icon>
        Abrir caja
      </v-btn>

      <v-btn
        v-else
        block
        size="default"
        variant="flat"
        class="caja-card__action-btn caja-card__action-btn--close"
        @click="$emit('close-caja')"
      >
        <v-icon size="18" start>mdi-stop-circle</v-icon>
        Cerrar caja
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  isCajaOpen: Boolean,
  openedAt: [String, Date],
  openedBy: String,
  hasMultiBranches: Boolean,
  loadingGlobal: Boolean,
  cartCount: Number,
});

defineEmits([
  "open-config",
  "close-caja",
  "refresh",
  "open-branch-switch",
]);

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  return d.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const openedAtLabel = computed(() => formatDate(props.openedAt));
const openedByLabel = computed(() => props.openedBy || "");
const showMeta = computed(() => openedAtLabel.value || openedByLabel.value);
</script>

<style scoped>
.caja-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border-radius: 18px;
  background: rgb(var(--v-theme-surface));
}

/* BORDE */
.caja-card.is-open {
  border: 1.5px solid rgba(22, 163, 74, 0.3);
}
.caja-card.is-closed {
  border: 1.5px solid rgba(220, 38, 38, 0.3);
}

/* TOP */
.caja-card__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* STATUS */
.caja-card__status {
  display: flex;
  align-items: center;
  gap: 10px;
}

.caja-card__dot {
  width: 14px;
  height: 14px;
  border-radius: 999px;
}
.caja-card.is-open .caja-card__dot {
  background: #16a34a;
}
.caja-card.is-closed .caja-card__dot {
  background: #ef4444;
}

.caja-card__badge {
  padding: 6px 14px;
  border-radius: 999px;
  font-weight: 900;
  background: rgba(var(--v-theme-on-surface), 0.06);
}

/* ICONOS */
.caja-card__mini-actions {
  display: flex;
  gap: 8px;
}

.caja-card__icon-btn {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-on-surface), 0.06);
  color: rgba(var(--v-theme-on-surface), 0.9);
}

/* 🔥 SUCURSAL NEUTRO PERO VISIBLE */
.caja-card__icon-btn--branch {
  background: rgba(var(--v-theme-on-surface), 0.08);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.15);
}

.caja-card__icon-btn--branch:hover {
  background: rgba(var(--v-theme-on-surface), 0.12);
}

/* META */
.caja-card__meta {
  display: flex;
  gap: 6px;
  font-size: 14px;
}

/* BOTÓN PRINCIPAL */
.caja-card__action-btn {
  height: 48px;
  width: 100%;
  border-radius: 16px;
  font-weight: 900;
}

/* CERRAR */
.caja-card__action-btn--close {
  background: rgba(220, 38, 38, 0.12);
  color: #b91c1c;
}
</style>