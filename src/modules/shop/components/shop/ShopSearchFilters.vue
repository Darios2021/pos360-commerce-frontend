<!-- src/modules/shop/components/shop/ShopSearchFilters.vue -->
<template>
  <aside class="mlf-wrap" aria-label="Filtros">

    <!-- ─── CHIPS de filtros activos ────────────────────────────────── -->
    <div v-if="activeCount > 0" class="mlf-active">
      <div class="mlf-active-title">Filtros activos</div>
      <div class="mlf-active-chips">
        <button
          v-if="selectedCatId"
          class="mlf-chip"
          type="button"
          @click="$emit('update:selectedCatId', null)"
        >
          {{ catLabel }}
          <span class="mlf-chip-x">×</span>
        </button>
        <button
          v-for="b in selectedBrands"
          :key="b"
          class="mlf-chip"
          type="button"
          @click="removeBrand(b)"
        >
          {{ b }}
          <span class="mlf-chip-x">×</span>
        </button>
        <button
          v-if="priceMin !== null || priceMax !== null"
          class="mlf-chip"
          type="button"
          @click="$emit('update:price', { min: null, max: null })"
        >
          {{ priceLabel }}
          <span class="mlf-chip-x">×</span>
        </button>
      </div>
      <button class="mlf-clear-all" type="button" @click="$emit('clearAll')">
        Limpiar todo
      </button>
    </div>

    <!-- ─── CATEGORÍAS ───────────────────────────────────────────────── -->
    <section v-if="categories.length" class="mlf-sec">
      <div class="mlf-sec-head">
        <span class="mlf-sec-title">Categorías</span>
      </div>
      <ul class="mlf-cat-list">
        <li>
          <button
            class="mlf-cat-item"
            :class="{ active: !selectedCatId }"
            type="button"
            :disabled="loading"
            @click="$emit('update:selectedCatId', null)"
          >
            <span class="mlf-cat-dot" :class="{ show: !selectedCatId }"></span>
            <span class="mlf-cat-name">Ver todas</span>
            <span class="mlf-cat-count">{{ totalCount }}</span>
          </button>
        </li>
        <li v-for="c in visibleCats" :key="c.key">
          <button
            class="mlf-cat-item"
            :class="{ active: String(selectedCatId) === String(c.key) }"
            type="button"
            :disabled="loading"
            @click="$emit('update:selectedCatId', c.key)"
          >
            <span class="mlf-cat-dot" :class="{ show: String(selectedCatId) === String(c.key) }"></span>
            <span class="mlf-cat-name">{{ c.label }}</span>
            <span class="mlf-cat-count">{{ c.count }}</span>
          </button>
        </li>
      </ul>
      <button v-if="categories.length > catFold" class="mlf-more-link" type="button" @click="showMoreCats = !showMoreCats">
        {{ showMoreCats ? "Ver menos" : `Ver ${categories.length - catFold} categorías más` }}
      </button>
    </section>

    <!-- ─── MARCA ────────────────────────────────────────────────────── -->
    <section v-if="brands.length" class="mlf-sec">
      <div class="mlf-sec-head">
        <span class="mlf-sec-title">Marca</span>
        <button
          v-if="selectedBrands.length"
          class="mlf-sec-clear"
          type="button"
          @click="$emit('update:selectedBrands', [])"
        >
          Limpiar
        </button>
      </div>
      <ul class="mlf-brand-list">
        <li v-for="b in visibleBrands" :key="b.key">
          <button
            class="mlf-brand-item"
            :class="{ active: isBrandOn(b.key) }"
            type="button"
            :disabled="loading"
            @click="toggleBrand(b.key)"
          >
            <span class="mlf-cb" :class="{ checked: isBrandOn(b.key) }">
              <svg v-if="isBrandOn(b.key)" viewBox="0 0 10 8" fill="none">
                <path d="M1 4l3 3 5-6" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span class="mlf-brand-name">{{ b.label }}</span>
            <span class="mlf-brand-count">({{ b.count }})</span>
          </button>
        </li>
      </ul>
      <button v-if="brands.length > brandFold" class="mlf-more-link" type="button" @click="showMoreBrands = !showMoreBrands">
        {{ showMoreBrands ? "Ver menos marcas" : `Ver ${brands.length - brandFold} marcas más` }}
      </button>
    </section>

    <!-- ─── PRECIO ───────────────────────────────────────────────────── -->
    <section class="mlf-sec">
      <div class="mlf-sec-head">
        <span class="mlf-sec-title">Precio</span>
        <button
          v-if="priceMin !== null || priceMax !== null"
          class="mlf-sec-clear"
          type="button"
          @click="$emit('update:price', { min: null, max: null })"
        >
          Limpiar
        </button>
      </div>

      <!-- Rangos preestablecidos -->
      <ul v-if="priceRanges.length" class="mlf-price-ranges">
        <li v-for="r in priceRanges" :key="r.label">
          <button
            class="mlf-price-range-btn"
            :class="{ active: isPriceRangeActive(r) }"
            type="button"
            :disabled="loading"
            @click="applyPreset(r)"
          >
            <span class="mlf-price-dot" :class="{ show: isPriceRangeActive(r) }"></span>
            {{ r.label }}
          </button>
        </li>
      </ul>

      <!-- Input personalizado -->
      <div class="mlf-price-custom">
        <div class="mlf-price-custom-label">Rango personalizado</div>
        <div class="mlf-price-row">
          <div class="mlf-price-field">
            <span class="mlf-price-prefix">$</span>
            <input
              v-model="priceMinLocal"
              class="mlf-price-input"
              inputmode="numeric"
              placeholder="Mín"
              :disabled="loading"
              @keydown.enter="applyPrice"
            />
          </div>
          <span class="mlf-price-dash">—</span>
          <div class="mlf-price-field">
            <span class="mlf-price-prefix">$</span>
            <input
              v-model="priceMaxLocal"
              class="mlf-price-input"
              inputmode="numeric"
              placeholder="Máx"
              :disabled="loading"
              @keydown.enter="applyPrice"
            />
          </div>
          <button class="mlf-price-apply" type="button" :disabled="loading" @click="applyPrice">
            <svg viewBox="0 0 8 14" fill="none" width="8" height="14">
              <path d="M1 1l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </section>

    <!-- ─── LIMPIAR TODO ─────────────────────────────────────────────── -->
    <div v-if="activeCount > 0" class="mlf-footer">
      <button class="mlf-footer-btn" type="button" :disabled="loading" @click="$emit('clearAll')">
        Limpiar todos los filtros
      </button>
    </div>

  </aside>
</template>

<script setup>
import { ref, computed, watch } from "vue";

const props = defineProps({
  loading:        { type: Boolean, default: false },
  categories:     { type: Array,   default: () => [] },
  selectedCatId:  { type: [Number, String, null], default: null },
  totalCount:     { type: Number,  default: 0 },
  brands:         { type: Array,   default: () => [] },
  selectedBrands: { type: Array,   default: () => [] },
  priceMin:       { type: [Number, null], default: null },
  priceMax:       { type: [Number, null], default: null },
  // Rangos computados desde los ítems del padre (opcional)
  maxItemPrice:   { type: [Number, null], default: null },
});

const emit = defineEmits([
  "update:selectedCatId",
  "update:selectedBrands",
  "update:price",
  "clearAll",
]);

// ── Folds ────────────────────────────────────────────────────────────
const catFold   = 6;
const brandFold = 8;
const showMoreCats   = ref(false);
const showMoreBrands = ref(false);

const visibleCats   = computed(() => showMoreCats.value   ? props.categories : props.categories.slice(0, catFold));
const visibleBrands = computed(() => showMoreBrands.value ? props.brands     : props.brands.slice(0, brandFold));

// ── Activos ──────────────────────────────────────────────────────────
const activeCount = computed(() => {
  let n = 0;
  if (props.selectedCatId) n++;
  n += props.selectedBrands.length;
  if (props.priceMin !== null || props.priceMax !== null) n++;
  return n;
});

const catLabel = computed(() => {
  const c = props.categories.find(x => String(x.key) === String(props.selectedCatId));
  return c ? c.label : String(props.selectedCatId);
});

const priceLabel = computed(() => {
  const fmt = v => `$${Number(v).toLocaleString("es-AR")}`;
  if (props.priceMin !== null && props.priceMax !== null) return `${fmt(props.priceMin)} – ${fmt(props.priceMax)}`;
  if (props.priceMin !== null) return `Desde ${fmt(props.priceMin)}`;
  if (props.priceMax !== null) return `Hasta ${fmt(props.priceMax)}`;
  return "Precio";
});

// ── Categorías ───────────────────────────────────────────────────────
// (emits manejados inline)

// ── Marcas ───────────────────────────────────────────────────────────
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
function removeBrand(b) {
  emit("update:selectedBrands", props.selectedBrands.filter(x => x !== b));
}

// ── Precio ───────────────────────────────────────────────────────────
const priceMinLocal = ref(props.priceMin ?? "");
const priceMaxLocal = ref(props.priceMax ?? "");
watch(() => props.priceMin, v => { priceMinLocal.value = v ?? ""; });
watch(() => props.priceMax, v => { priceMaxLocal.value = v ?? ""; });

function applyPrice() {
  const min = priceMinLocal.value === "" ? null : Number(priceMinLocal.value);
  const max = priceMaxLocal.value === "" ? null : Number(priceMaxLocal.value);
  emit("update:price", {
    min: Number.isFinite(min) ? min : null,
    max: Number.isFinite(max) ? max : null,
  });
}

// Rangos preestablecidos — se calculan según el precio máximo del catálogo
const priceRanges = computed(() => {
  const max = props.maxItemPrice || 100000;
  if (max <= 5000)  return [];
  if (max <= 15000) return [
    { label: "Menos de $5.000",    min: null, max: 5000 },
    { label: "$5.000 a $10.000",   min: 5000, max: 10000 },
    { label: "Más de $10.000",     min: 10000, max: null },
  ];
  if (max <= 50000) return [
    { label: "Menos de $5.000",    min: null,  max: 5000 },
    { label: "$5.000 a $15.000",   min: 5000,  max: 15000 },
    { label: "$15.000 a $30.000",  min: 15000, max: 30000 },
    { label: "Más de $30.000",     min: 30000, max: null },
  ];
  return [
    { label: "Menos de $10.000",   min: null,   max: 10000 },
    { label: "$10.000 a $30.000",  min: 10000,  max: 30000 },
    { label: "$30.000 a $80.000",  min: 30000,  max: 80000 },
    { label: "Más de $80.000",     min: 80000,  max: null },
  ];
});

function isPriceRangeActive(r) {
  const sameMin = (r.min === null && props.priceMin === null) || r.min === props.priceMin;
  const sameMax = (r.max === null && props.priceMax === null) || r.max === props.priceMax;
  return sameMin && sameMax && (props.priceMin !== null || props.priceMax !== null);
}

function applyPreset(r) {
  if (isPriceRangeActive(r)) {
    emit("update:price", { min: null, max: null });
  } else {
    emit("update:price", { min: r.min, max: r.max });
  }
}
</script>

<style scoped>
/* ── Forzar modo claro siempre ─────────────────────────────────────── */
.mlf-wrap {
  color-scheme: light;
  width: 100%;
  font-family: inherit;
}

/* ── Chips de filtros activos ──────────────────────────────────────── */
.mlf-active {
  background: #fff;
  color: #333;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 8px;
}
.mlf-active-title {
  font-size: 11px;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #999;
  margin-bottom: 8px;
}
.mlf-active-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}
.mlf-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 1px solid #3483fa;
  border-radius: 999px;
  background: rgba(52, 131, 250, 0.08);
  color: #3483fa;
  font-size: 12px;
  font-weight: 400;
  padding: 4px 10px 4px 12px;
  cursor: pointer;
  transition: background 0.12s;
}
.mlf-chip:hover { background: rgba(52, 131, 250, 0.16); }
.mlf-chip-x { font-size: 15px; line-height: 1; margin-top: -1px; }
.mlf-clear-all {
  border: 0;
  background: transparent;
  color: #3483fa;
  font-size: 12px;
  font-weight: 400;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}

/* ── Sección base ──────────────────────────────────────────────────── */
.mlf-sec {
  background: #fff;
  color: #333;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px 16px 12px;
  margin-bottom: 8px;
}

.mlf-sec-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.mlf-sec-title {
  font-size: 14px;
  font-weight: 400;
  color: #333;
  letter-spacing: -0.1px;
}
.mlf-sec-clear {
  border: 0;
  background: transparent;
  color: #3483fa;
  font-size: 12px;
  font-weight: 400;
  cursor: pointer;
  padding: 0;
}
.mlf-sec-clear:hover { text-decoration: underline; }

/* ── Categorías ────────────────────────────────────────────────────── */
.mlf-cat-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.mlf-cat-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 0;
  background: transparent;
  padding: 7px 6px;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
  color: #333;
}
.mlf-cat-item:hover { background: #f5f5f5; }
.mlf-cat-item.active { color: #3483fa; }
.mlf-cat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid #ccc;
  flex: 0 0 auto;
  transition: border-color 0.12s, background 0.12s;
}
.mlf-cat-dot.show {
  border-color: #3483fa;
  background: #3483fa;
}
.mlf-cat-name {
  flex: 1;
  font-size: 13px;
  font-weight: 400;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mlf-cat-item.active .mlf-cat-name { font-weight: 400; }
.mlf-cat-count {
  font-size: 12px;
  color: #999;
  flex: 0 0 auto;
}
.mlf-cat-item.active .mlf-cat-count { color: #3483fa; }

/* ── Marcas ────────────────────────────────────────────────────────── */
.mlf-brand-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.mlf-brand-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 9px;
  border: 0;
  background: transparent;
  padding: 6px 6px;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
  color: #333;
}
.mlf-brand-item:hover { background: #f5f5f5; }
.mlf-brand-item.active { color: #3483fa; }

/* Checkbox custom ── */
.mlf-cb {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: 1.5px solid #c0c0c0;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.12s, background 0.12s;
  background: #fff;
}
.mlf-cb.checked {
  border-color: #3483fa;
  background: #3483fa;
}
.mlf-cb svg { display: block; }

.mlf-brand-name {
  flex: 1;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mlf-brand-item.active .mlf-brand-name { font-weight: 400; }
.mlf-brand-count {
  font-size: 12px;
  color: #999;
  flex: 0 0 auto;
}
.mlf-brand-item.active .mlf-brand-count { color: #3483fa; }

/* ── Más link ──────────────────────────────────────────────────────── */
.mlf-more-link {
  margin-top: 8px;
  border: 0;
  background: transparent;
  color: #3483fa;
  font-size: 13px;
  font-weight: 400;
  cursor: pointer;
  padding: 4px 6px;
  display: block;
}
.mlf-more-link:hover { text-decoration: underline; }

/* ── Precio ────────────────────────────────────────────────────────── */
.mlf-price-ranges {
  list-style: none;
  margin: 0 0 14px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.mlf-price-range-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 0;
  background: transparent;
  padding: 7px 6px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #333;
  text-align: left;
  transition: background 0.1s;
}
.mlf-price-range-btn:hover { background: #f5f5f5; }
.mlf-price-range-btn.active { color: #3483fa; font-weight: 400; }
.mlf-price-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid #ccc;
  flex: 0 0 auto;
  transition: border-color 0.12s, background 0.12s;
}
.mlf-price-dot.show {
  border-color: #3483fa;
  background: #3483fa;
}

.mlf-price-custom-label {
  font-size: 11px;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #aaa;
  margin-bottom: 8px;
}
.mlf-price-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.mlf-price-field {
  flex: 1;
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
  border-radius: 6px;
  overflow: hidden;
  background: #fafafa;
  transition: border-color 0.15s;
}
.mlf-price-field:focus-within { border-color: #3483fa; background: #fff; }
.mlf-price-prefix {
  padding: 0 6px;
  font-size: 13px;
  color: #999;
  font-weight: 400;
  border-right: 1px solid #eee;
  line-height: 34px;
}
.mlf-price-input {
  flex: 1;
  border: 0;
  outline: none;
  padding: 8px 8px;
  font-size: 13px;
  background: transparent;
  color: #333;
  width: 0;
  min-width: 0;
}
.mlf-price-dash { color: #bbb; font-size: 16px; font-weight: 400; flex: 0 0 auto; }
.mlf-price-apply {
  width: 34px;
  height: 34px;
  border-radius: 6px;
  border: 1px solid #ddd;
  background: #f5f5f5;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #555;
  flex: 0 0 auto;
  transition: background 0.12s, border-color 0.12s, color 0.12s;
}
.mlf-price-apply:hover { background: #3483fa; border-color: #3483fa; color: #fff; }

/* ── Footer ────────────────────────────────────────────────────────── */
.mlf-footer {
  padding: 4px 0 2px;
  text-align: center;
}
.mlf-footer-btn {
  border: 0;
  background: transparent;
  color: #666;
  font-size: 12.5px;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  cursor: pointer;
  padding: 10px 0;
  width: 100%;
  transition: color 0.12s;
}
.mlf-footer-btn:hover { color: #333; }
</style>
