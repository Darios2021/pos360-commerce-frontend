<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/pos/components/PosProductsPanel.vue -->
<template>
  <div class="pos-products-panel">
    <v-card class="rounded-xl pos-toolbar pos-surface" elevation="1">
      <v-card-text class="py-3">
        <v-row dense class="align-center">
          <v-col cols="12" md="6">
            <v-text-field
              ref="searchRef"
              :model-value="q"
              @update:model-value="$emit('update:q', $event)"
              label="Buscar productos"
              placeholder="Nombre / SKU / Código / Barcode / Marca / Modelo"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              @keyup.enter="$emit('search')"
              @click:clear="$emit('clear')"
            />
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-select
              ref="rubroRef"
              :model-value="rubroId"
              @update:model-value="$emit('update:rubroId', $event)"
              :items="rubroItems"
              item-title="title"
              item-value="value"
              label="Rubro"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              no-data-text="No hay rubros"
            />
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-select
              ref="subrubroRef"
              :model-value="subrubroId"
              @update:model-value="$emit('update:subrubroId', $event)"
              :items="subrubroItems"
              item-title="title"
              item-value="value"
              label="Subrubro"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              :disabled="!rubroId || subrubroItems.length === 0"
              no-data-text="No hay subrubros"
            />
          </v-col>
        </v-row>

        <div class="d-flex justify-space-between flex-wrap ga-2 mt-2">
          <div class="text-caption text-medium-emphasis">
            Mostrando {{ shown }} de {{ total }}
          </div>

          <div class="d-flex ga-2">
            <v-btn size="small" variant="tonal" @click="$emit('prev')" :disabled="page <= 1">
              <v-icon start>mdi-chevron-left</v-icon>
              Anterior
            </v-btn>
            <v-btn size="small" variant="tonal" @click="$emit('next')" :disabled="page >= pages">
              Siguiente
              <v-icon end>mdi-chevron-right</v-icon>
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- ✅ LISTA: ocupa el resto del alto y scrollea adentro -->
    <div class="pos-products mt-3 pos-surface">
      <div v-if="loading" class="d-flex justify-center align-center py-12">
        <v-progress-circular indeterminate />
      </div>

      <v-row v-else dense class="pos-grid">
        <!-- ✅ Más columnas + cards compactas -->
        <v-col
          v-for="p in items"
          :key="p.id"
          cols="4"
          sm="3"
          md="2"
          lg="2"
          xl="1"
          class="pos-col"
        >
          <PosProductCard
            :item="p"
            :image="productImage(p) || ''"
            :rubro-label="rubroName(p) || ''"
            :subrubro-label="subrubroName(p) || ''"
            :price-discount="resolveUnitPrice(p, 'DISCOUNT')"
            :price-list="resolveUnitPrice(p, 'LIST')"
            price-label="Descuento"
            @add="$emit('add', p)"
            @details="$emit('details', p)"
          />
        </v-col>
      </v-row>

      <div v-if="!loading && items.length === 0" class="text-center py-12 text-medium-emphasis">
        <v-icon size="56" class="mb-2">mdi-text-box-search-outline</v-icon>
        <div class="text-h6">No se encontraron productos listos para vender</div>
        <div class="text-caption">Solo se muestran productos con stock y precio &gt; 0.</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineExpose } from "vue";
import PosProductCard from "./PosProductCard.vue";

defineProps({
  q: { type: String, default: "" },
  rubroId: { type: [Number, String], default: null },
  subrubroId: { type: [Number, String], default: null },
  rubroItems: { type: Array, default: () => [] },
  subrubroItems: { type: Array, default: () => [] },
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  shown: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  page: { type: Number, default: 1 },
  pages: { type: Number, default: 1 },

  productImage: { type: Function, required: true },
  resolveUnitPrice: { type: Function, required: true },
  rubroName: { type: Function, required: true },
  subrubroName: { type: Function, required: true },
});

defineEmits([
  "update:q",
  "update:rubroId",
  "update:subrubroId",
  "search",
  "clear",
  "prev",
  "next",
  "add",
  "details",
]);

const searchRef = ref(null);
const rubroRef = ref(null);
const subrubroRef = ref(null);

function focusSearch() {
  const comp = searchRef.value;
  if (!comp) return;
  if (typeof comp.focus === "function") return comp.focus();
  const el = comp?.$el || comp;
  el?.querySelector?.("input")?.focus?.();
}

defineExpose({ focusSearch, searchRef, rubroRef, subrubroRef });
</script>

<style scoped>
.pos-surface {
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
}

/* ✅ CRÍTICO: hace que el panel sea "alto fijo" y el scroll quede adentro */
.pos-products-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: calc(100vh - 160px); /* ajusta si tu top ocupa más/menos */
}

/* toolbar no scrollea */
.pos-toolbar {
  flex: 0 0 auto;
  position: sticky;
  top: 12px;
  z-index: 3;
}

/* lista ocupa el resto */
.pos-products {
  flex: 1 1 auto;
  min-height: 0;
  border-radius: 16px;
  padding: 8px;
  overflow: auto;
  scrollbar-gutter: stable;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.10);
}

/* más compacto */
.pos-col {
  padding: 4px !important;
}

@media (max-width: 960px) {
  .pos-products-panel {
    height: auto;
    min-height: auto;
  }
  .pos-toolbar {
    position: relative;
    top: auto;
  }
  .pos-products {
    overflow: visible;
  }
}
</style>