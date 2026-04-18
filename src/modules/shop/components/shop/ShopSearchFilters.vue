<!-- src/modules/shop/components/shop/ShopSearchFilters.vue -->
<template>
  <aside class="sf" aria-label="Filtros de búsqueda">
    <div class="sf-card">
      <!-- CATEGORÍA -->
      <section v-if="categories.length" class="sf-sec">
        <div class="sf-title">Categoría</div>
        <div class="sf-list">
          <button
            class="sf-row"
            :class="{ on: !selectedCatId }"
            type="button"
            :disabled="loading"
            @click="$emit('update:selectedCatId', null)"
          >
            <span class="sf-row-name">Ver todas</span>
            <span class="sf-row-count">{{ totalCount }}</span>
          </button>
          <button
            v-for="c in visibleCats"
            :key="c.key"
            class="sf-row"
            :class="{ on: String(selectedCatId) === String(c.key) }"
            type="button"
            :disabled="loading"
            @click="$emit('update:selectedCatId', c.key)"
          >
            <span class="sf-row-name">{{ c.label }}</span>
            <span class="sf-row-count">{{ c.count }}</span>
          </button>
        </div>
        <button
          v-if="categories.length > catFold"
          class="sf-more"
          type="button"
          @click="showMoreCats = !showMoreCats"
        >
          {{ showMoreCats ? "Mostrar menos" : `Ver ${categories.length - catFold} más` }}
        </button>
      </section>

      <!-- MARCA -->
      <section v-if="brands.length" class="sf-sec">
        <div class="sf-title">Marca</div>
        <div class="sf-list">
          <button
            v-for="b in visibleBrands"
            :key="b.key"
            class="sf-row sf-check-row"
            :class="{ on: isBrandOn(b.key) }"
            type="button"
            :disabled="loading"
            @click="toggleBrand(b.key)"
          >
            <span class="sf-check-box">
              <v-icon size="14" v-if="isBrandOn(b.key)">mdi-check</v-icon>
            </span>
            <span class="sf-row-name">{{ b.label }}</span>
            <span class="sf-row-count">{{ b.count }}</span>
          </button>
        </div>
        <button
          v-if="brands.length > brandFold"
          class="sf-more"
          type="button"
          @click="showMoreBrands = !showMoreBrands"
        >
          {{ showMoreBrands ? "Mostrar menos" : `Ver ${brands.length - brandFold} más` }}
        </button>
      </section>

      <!-- PRECIO -->
      <section class="sf-sec">
        <div class="sf-title">Precio</div>
        <div class="sf-price-row">
          <input
            v-model="priceMinLocal"
            class="sf-mm"
            inputmode="numeric"
            placeholder="Mínimo"
            :disabled="loading"
            @keydown.enter="applyPrice"
          />
          <span class="sf-sep">–</span>
          <input
            v-model="priceMaxLocal"
            class="sf-mm"
            inputmode="numeric"
            placeholder="Máximo"
            :disabled="loading"
            @keydown.enter="applyPrice"
          />
          <button class="sf-go" type="button" :disabled="loading" @click="applyPrice" aria-label="Aplicar precio">
            <span>›</span>
          </button>
        </div>
        <div v-if="priceMin !== null || priceMax !== null" class="sf-price-applied">
          Aplicado:
          {{ priceMin !== null ? `$${Number(priceMin).toLocaleString("es-AR")}` : "—" }}
          –
          {{ priceMax !== null ? `$${Number(priceMax).toLocaleString("es-AR")}` : "—" }}
        </div>
      </section>

      <div class="sf-bottom">
        <button class="sf-reset" type="button" :disabled="loading" @click="$emit('clearAll')">
          LIMPIAR FILTROS
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, watch } from "vue";

const props = defineProps({
  loading: { type: Boolean, default: false },
  categories: { type: Array, default: () => [] },
  selectedCatId: { type: [Number, String, null], default: null },
  totalCount: { type: Number, default: 0 },
  brands: { type: Array, default: () => [] },
  selectedBrands: { type: Array, default: () => [] },
  priceMin: { type: [Number, null], default: null },
  priceMax: { type: [Number, null], default: null },
});

const emit = defineEmits([
  "update:selectedCatId",
  "update:selectedBrands",
  "update:price",
  "clearAll",
]);

const catFold = 8;
const brandFold = 9;
const showMoreCats = ref(false);
const showMoreBrands = ref(false);

const visibleCats = computed(() =>
  showMoreCats.value ? props.categories : props.categories.slice(0, catFold)
);
const visibleBrands = computed(() =>
  showMoreBrands.value ? props.brands : props.brands.slice(0, brandFold)
);

function isBrandOn(key) {
  return (props.selectedBrands || []).map(String).includes(String(key));
}
function toggleBrand(key) {
  const set = new Set((props.selectedBrands || []).map(String));
  const k = String(key);
  if (set.has(k)) set.delete(k);
  else set.add(k);
  emit("update:selectedBrands", Array.from(set));
}

const priceMinLocal = ref(props.priceMin ?? "");
const priceMaxLocal = ref(props.priceMax ?? "");
watch(() => props.priceMin, (v) => { priceMinLocal.value = v ?? ""; });
watch(() => props.priceMax, (v) => { priceMaxLocal.value = v ?? ""; });

function applyPrice() {
  const minRaw = String(priceMinLocal.value ?? "").trim();
  const maxRaw = String(priceMaxLocal.value ?? "").trim();
  const min = minRaw === "" ? null : Number(minRaw);
  const max = maxRaw === "" ? null : Number(maxRaw);
  emit("update:price", {
    min: Number.isFinite(min) ? min : null,
    max: Number.isFinite(max) ? max : null,
  });
}
</script>

<style scoped>
.sf { width: 100%; }

.sf-card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  padding: 16px 14px;
}

.sf-sec + .sf-sec { margin-top: 20px; }

.sf-title {
  font-weight: 900;
  font-size: 14px;
  color: #111;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.sf-list { display: grid; gap: 2px; }

.sf-row {
  border: 0;
  background: transparent;
  width: 100%;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #222;
  text-align: left;
  transition: background 0.12s;
}
.sf-row:hover { background: rgba(0, 0, 0, 0.04); }
.sf-row.on { background: rgba(52, 131, 250, 0.08); font-weight: 700; color: #1557d0; }

.sf-check-box {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1.5px solid rgba(0, 0, 0, 0.25);
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  background: #fff;
}
.sf-row.on .sf-check-box {
  border-color: #3483fa;
  background: #3483fa;
}
.sf-row.on .sf-check-box :deep(.v-icon) { color: #fff !important; }

.sf-row-name {
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sf-row-count {
  flex: 0 0 auto;
  font-size: 11.5px;
  opacity: 0.6;
  background: rgba(0, 0, 0, 0.05);
  padding: 1px 6px;
  border-radius: 999px;
}

.sf-more {
  margin-top: 8px;
  border: 0;
  background: transparent;
  color: #3483fa;
  font-weight: 700;
  cursor: pointer;
  padding: 2px 10px;
  font-size: 12.5px;
}

.sf-price-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto;
  gap: 8px;
  align-items: center;
}
.sf-mm {
  width: 100%;
  border: 1px solid rgba(0, 0, 0, 0.18);
  border-radius: 10px;
  padding: 9px 12px;
  font-size: 13px;
  outline: none;
  background: #fff;
  transition: border-color 0.15s;
}
.sf-mm:focus { border-color: #3483fa; }
.sf-sep { opacity: 0.5; font-weight: 700; }
.sf-go {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.18);
  background: #fff;
  cursor: pointer;
  display: grid;
  place-items: center;
  font-size: 20px;
  line-height: 1;
  transition: background 0.12s, border-color 0.12s;
}
.sf-go:hover { background: #3483fa; border-color: #3483fa; color: #fff; }
.sf-price-applied {
  margin-top: 8px;
  font-size: 11px;
  color: #3483fa;
  font-weight: 600;
}

.sf-bottom { margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(0, 0, 0, 0.06); }
.sf-reset {
  width: 100%;
  border: 0;
  background: transparent;
  padding: 10px 0;
  cursor: pointer;
  font-weight: 900;
  letter-spacing: 0.5px;
  color: #555;
  text-transform: uppercase;
  font-size: 12px;
  transition: color 0.12s;
}
.sf-reset:hover { color: #111; }
</style>
