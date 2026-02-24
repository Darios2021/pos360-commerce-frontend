<!-- ✅ POS PRODUCT ROW — ULTRA COMPACT (SIN ROMPER) -->
<template>
  <div
    class="prow"
    :class="{ disabled }"
    tabindex="0"
    @click="onRowClick"
    @dblclick.stop="$emit('add', item)"
    @keyup.enter="$emit('add', item)"
  >
    <!-- IMAGE -->
    <div class="prow-img">
      <v-img v-if="image" :src="image" class="img" cover />
      <div v-else class="noimg">
        <v-icon size="20">mdi-package-variant</v-icon>
      </div>
    </div>

    <!-- MAIN -->
    <div class="prow-main">
      <div class="prow-title" :title="name">
        {{ name }}
      </div>

      <div class="prow-meta">
        <span v-if="sku" class="pill dark">SKU {{ sku }}</span>
        <span v-if="stkLabel" class="pill stock">{{ stkLabel }}</span>
        <span v-if="offLabel" class="pill off">{{ offLabel }}</span>
        <span v-if="rubroLabel" class="meta-text">{{ rubroLabel }}</span>
        <span v-if="subrubroLabel" class="meta-text">· {{ subrubroLabel }}</span>
      </div>
    </div>

    <!-- PRICE -->
    <div class="prow-price">
      <div class="price-discount">
        {{ money(priceDiscount) }}
      </div>

      <div v-if="priceList && priceList > priceDiscount" class="price-list">
        {{ money(priceList) }}
      </div>
    </div>

    <!-- ACTIONS -->
    <div class="prow-actions">
      <v-btn
        icon
        variant="tonal"
        density="compact"
        class="btn-action"
        :disabled="disabled"
        @click.stop="$emit('add', item)"
      >
        <v-icon size="18">mdi-plus</v-icon>
      </v-btn>

      <v-btn icon variant="tonal" density="compact" class="btn-action" @click.stop="$emit('details', item)">
        <v-icon size="18">mdi-eye-outline</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script setup>
defineProps({
  item: Object,
  image: String,
  name: String,
  sku: String,
  stkLabel: String,
  offLabel: String,
  rubroLabel: String,
  subrubroLabel: String,
  priceDiscount: Number,
  priceList: Number,
  disabled: Boolean,
});

defineEmits(["add", "details"]);

function onRowClick() {
  /* opcional */
}

function money(v) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(v || 0));
}
</script>

<style scoped>
/* ===========================
   ✅ ULTRA COMPACT (más filas)
=========================== */
.prow {
  display: grid;
  grid-template-columns: 64px 1fr auto auto; /* 🔽 antes 72 */
  align-items: center;
  gap: 10px; /* 🔽 antes 14 */

  padding: 7px 10px; /* 🔽 antes 10 12 */
  border-radius: 12px; /* 🔽 */
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgb(var(--v-theme-surface));

  /* ✅ sombra más liviana (sigue “card” pero no infla) */
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.055);

  transition: all 120ms ease;
  cursor: pointer;
  position: relative;
}

.prow:hover {
  border-color: rgba(var(--v-theme-primary), 0.24);
  background: rgba(var(--v-theme-primary), 0.03);
  transform: translateY(-1px);
  box-shadow:
    0 10px 22px rgba(0, 0, 0, 0.075),
    0 0 0 1px rgba(var(--v-theme-primary), 0.10);
}

.prow:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 4px rgba(var(--v-theme-primary), 0.16),
    0 10px 22px rgba(0, 0, 0, 0.075);
}

.prow.disabled {
  opacity: 0.6;
  pointer-events: none;
  transform: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

/* IMAGE */
.prow-img {
  width: 64px;   /* 🔽 */
  height: 48px;  /* 🔽 antes 56 */
  border-radius: 10px;
  overflow: hidden;
  background: rgba(var(--v-theme-on-surface), 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
}

.img {
  width: 100%;
  height: 100%;
}

.noimg {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* MAIN */
.prow-main {
  min-width: 0;
}

.prow-title {
  font-size: 13px; /* 🔽 */
  font-weight: 800;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ✅ CLAVE: meta 1 línea para que NO suba la altura */
.prow-meta {
  margin-top: 2px; /* 🔽 antes 4 */
  display: flex;
  flex-wrap: nowrap;          /* ✅ antes wrap */
  gap: 6px;
  align-items: center;

  white-space: nowrap;        /* ✅ */
  overflow: hidden;           /* ✅ */
  text-overflow: ellipsis;    /* ✅ */
  min-width: 0;
}

.meta-text {
  font-size: 11px;
  opacity: 0.62;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* CHIPS */
.pill {
  font-size: 10.25px; /* 🔽 */
  padding: 2px 7px;   /* 🔽 */
  border-radius: 999px;
  font-weight: 700;
  flex: 0 0 auto; /* ✅ no se rompen */
}

.pill.dark {
  background: rgba(var(--v-theme-on-surface), 0.08);
}

.pill.stock {
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
}

.pill.off {
  background: rgba(0, 200, 100, 0.12);
  color: #0f8a4a;
}

/* PRICE */
.prow-price {
  text-align: right;
  min-width: 96px; /* 🔽 antes 110 */
}

.price-discount {
  font-size: 14px; /* 🔽 antes 15 */
  font-weight: 900;
  line-height: 1.05;
}

.price-list {
  font-size: 11px; /* 🔽 */
  opacity: 0.6;
  text-decoration: line-through;
  margin-top: 1px;
}

/* ACTIONS */
.prow-actions {
  display: flex;
  gap: 6px; /* 🔽 antes 8 */
}

.btn-action {
  width: 34px !important; /* 🔽 antes 38 */
  height: 34px !important;
  border-radius: 12px !important;
}

/* RESPONSIVE */
@media (max-width: 960px) {
  .prow {
    grid-template-columns: 56px 1fr auto;
  }

  .prow-img {
    width: 56px;
    height: 44px;
  }

  .prow-price {
    min-width: 86px;
  }

  .prow-actions {
    grid-column: 1 / -1;
    justify-content: flex-end;
    margin-top: 6px;
  }

  /* en mobile permitimos wrap de meta para que no quede ilegible */
  .prow-meta {
    flex-wrap: wrap;
    white-space: normal;
  }
}
</style>