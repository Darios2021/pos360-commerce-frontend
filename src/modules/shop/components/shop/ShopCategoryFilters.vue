<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/shop/ShopCategoryFilters.vue -->
<template>
  <aside class="mlf" aria-label="Filtros">
    <div class="mlf-card">
      <!-- SUBCATS -->
      <section v-if="subcats?.length" class="mlf-sec">
        <div class="mlf-title">Subcategorías</div>

        <div class="mlf-list">
          <button
            class="mlf-item"
            :class="{ on: selectedSubId == null }"
            type="button"
            :disabled="loading"
            @click="$emit('selectSub', null)"
          >
            <span class="mlf-name">Ver todas</span>
          </button>

          <button
            v-for="s in subcats"
            :key="String(s?.id)"
            class="mlf-item"
            :class="{ on: String(selectedSubId) === String(s?.id) }"
            type="button"
            :disabled="loading"
            @click="$emit('selectSub', String(s?.id))"
            :title="s?.name || ''"
          >
            <span class="mlf-name">{{ s?.name || "—" }}</span>
          </button>
        </div>
      </section>

      <!-- STOCK -->
      <section class="mlf-sec">
        <div class="mlf-title">Disponibilidad</div>

        <label class="mlf-check">
          <input
            type="checkbox"
            :checked="!!inStockOnly"
            :disabled="loading"
            @change="$emit('update:inStockOnly', $event.target.checked)"
          />
          <span>Solo con stock</span>
        </label>
      </section>

      <!-- MARCA (ML-like) -->
      <section v-if="brands?.length" class="mlf-sec">
        <div class="mlf-title">Marca</div>

        <div class="mlf-list">
          <button
            v-for="b in visibleBrands"
            :key="String(b?.key)"
            class="mlf-row"
            :class="{ on: isBrandOn(b?.key) }"
            type="button"
            :disabled="loading"
            @click="toggleBrand(b?.key)"
            :title="b?.label || ''"
          >
            <span class="mlf-row-name">{{ b?.label || "—" }}</span>
            <span class="mlf-row-count">{{ typeof b?.count === "number" ? b.count : "" }}</span>
          </button>
        </div>

        <button
          v-if="brands.length > brandFold"
          class="mlf-more"
          type="button"
          :disabled="loading"
          @click="showMoreBrands = !showMoreBrands"
        >
          {{ showMoreBrands ? "Mostrar menos" : "Mostrar más" }}
        </button>
      </section>

      <!-- ✅ MODELO (SELECT, NO INPUT) -->
      <section v-if="models?.length" class="mlf-sec">
        <div class="mlf-title">Modelo</div>

        <div class="mlf-select-wrap">
          <select
            class="mlf-select"
            :disabled="loading"
            :value="modelLocal"
            @change="onModelChange($event.target.value)"
          >
            <option value="">Ver todos</option>
            <option v-for="m in modelsVisible" :key="String(m?.key)" :value="String(m?.key)">
              {{ m?.label || m?.key }}
              {{ typeof m?.count === "number" ? `(${m.count})` : "" }}
            </option>
          </select>

          <button
            v-if="modelLocal"
            class="mlf-clear"
            type="button"
            :disabled="loading"
            @click="clearModel"
            aria-label="Limpiar modelo"
          >
            ✕
          </button>
        </div>

        <button
          v-if="models.length > modelFold"
          class="mlf-more"
          type="button"
          :disabled="loading"
          @click="showMoreModels = !showMoreModels"
        >
          {{ showMoreModels ? "Mostrar menos" : "Mostrar más" }}
        </button>
      </section>

      <!-- ✅ COLOR (opcional, estilo ML) -->
      <section v-if="colors?.length" class="mlf-sec">
        <div class="mlf-title">Color</div>

        <div class="mlf-colors">
          <button
            v-for="c in colors"
            :key="String(c?.key)"
            class="mlf-color"
            type="button"
            :disabled="loading"
            :class="{ on: isColorOn(c?.key) }"
            :title="c?.label || String(c?.key)"
            @click="toggleColor(c?.key)"
          >
            <span class="mlf-swatch" :style="{ background: String(c?.hex || c?.key || '#ddd') }" />
          </button>
        </div>
      </section>

      <!-- CAPACIDAD -->
      <section class="mlf-sec">
        <div class="mlf-title">Capacidad en volumen</div>

        <div class="mlf-minmax">
          <input
            class="mlf-mm"
            inputmode="numeric"
            placeholder="Mínimo"
            :value="String(volumeMinLocal ?? '')"
            :disabled="loading"
            @input="volumeMinLocal = $event.target.value"
          />
          <span class="mlf-sep">–</span>
          <input
            class="mlf-mm"
            inputmode="numeric"
            placeholder="Máximo"
            :value="String(volumeMaxLocal ?? '')"
            :disabled="loading"
            @input="volumeMaxLocal = $event.target.value"
          />
          <button class="mlf-go" type="button" :disabled="loading" @click="applyVolume" aria-label="Aplicar">
            <span class="mlf-go-ico">›</span>
          </button>
        </div>

        <div class="mlf-muted">Ej: 600</div>
      </section>

      <div class="mlf-bottom">
        <button class="mlf-reset" type="button" :disabled="loading" @click="$emit('clearAll')">
          LIMPIAR FILTROS
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  loading: { type: Boolean, default: false },

  subcats: { type: Array, default: () => [] },
  selectedSubId: { type: [Number, String, null], default: null },
  inStockOnly: { type: Boolean, default: false },

  // Marca facets: [{ key:'XAEA', label:'XAEA', count: 12 }]
  brands: { type: Array, default: () => [] },
  selectedBrands: { type: Array, default: () => [] },

  // ✅ Modelo facets: [{ key:'M6', label:'M6', count: 4 }]
  models: { type: Array, default: () => [] },
  model: { type: String, default: "" }, // selected model key

  // ✅ Color facets opcional: [{ key:'black', hex:'#000', label:'Negro', count: 10 }]
  colors: { type: Array, default: () => [] },
  selectedColors: { type: Array, default: () => [] },

  volumeMin: { type: [Number, String, null], default: null },
  volumeMax: { type: [Number, String, null], default: null },
});

const emit = defineEmits([
  "selectSub",
  "update:inStockOnly",
  "clearAll",
  "update:selectedBrands",
  "update:model",
  "update:selectedColors",
  "update:volume",
]);

/* ===== Marca ===== */
const brandFold = 9;
const showMoreBrands = ref(false);
const visibleBrands = computed(() => {
  const arr = Array.isArray(props.brands) ? props.brands : [];
  return showMoreBrands.value ? arr : arr.slice(0, brandFold);
});

function isBrandOn(key) {
  const k = String(key ?? "");
  return (props.selectedBrands || []).map(String).includes(k);
}
function toggleBrand(key) {
  const k = String(key ?? "");
  const set = new Set((props.selectedBrands || []).map(String));
  if (set.has(k)) set.delete(k);
  else set.add(k);
  emit("update:selectedBrands", Array.from(set));
}

/* ===== Modelo (SELECT) ===== */
const modelFold = 12;
const showMoreModels = ref(false);
const modelsVisible = computed(() => {
  const arr = Array.isArray(props.models) ? props.models : [];
  return showMoreModels.value ? arr : arr.slice(0, modelFold);
});

const modelLocal = ref(String(props.model || ""));
watch(
  () => props.model,
  (v) => {
    const nv = String(v || "");
    if (nv !== modelLocal.value) modelLocal.value = nv;
  }
);

function onModelChange(v) {
  modelLocal.value = String(v || "");
  emit("update:model", modelLocal.value);
}
function clearModel() {
  modelLocal.value = "";
  emit("update:model", "");
}

/* ===== Color (chips) ===== */
function isColorOn(key) {
  const k = String(key ?? "");
  return (props.selectedColors || []).map(String).includes(k);
}
function toggleColor(key) {
  const k = String(key ?? "");
  const set = new Set((props.selectedColors || []).map(String));
  if (set.has(k)) set.delete(k);
  else set.add(k);
  emit("update:selectedColors", Array.from(set));
}

/* ===== Volumen ===== */
const volumeMinLocal = ref(props.volumeMin ?? "");
const volumeMaxLocal = ref(props.volumeMax ?? "");

watch(
  () => props.volumeMin,
  (v) => (volumeMinLocal.value = v ?? "")
);
watch(
  () => props.volumeMax,
  (v) => (volumeMaxLocal.value = v ?? "")
);

function applyVolume() {
  const minStr = String(volumeMinLocal.value ?? "").trim();
  const maxStr = String(volumeMaxLocal.value ?? "").trim();

  const min = minStr === "" ? null : Number(minStr);
  const max = maxStr === "" ? null : Number(maxStr);

  emit("update:volume", {
    min: Number.isFinite(min) ? min : null,
    max: Number.isFinite(max) ? max : null,
  });
}
</script>

<style scoped>
/* ML-like: clean + airy + no “form vibes” */
.mlf {
  width: 100%;
}

.mlf-card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 1px 2px rgba(0,0,0,.04);
  padding: 14px 12px;
}

.mlf-sec + .mlf-sec {
  margin-top: 16px;
}

.mlf-title {
  font-weight: 900;
  font-size: 14px;
  color: #111;
  margin-bottom: 10px;
}

.mlf-list {
  display: grid;
  gap: 6px;
}

/* subcat items */
.mlf-item {
  border: 0;
  background: transparent;
  text-align: left;
  padding: 9px 10px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  color: #222;
}

.mlf-item:hover {
  background: rgba(0, 0, 0, 0.04);
}

.mlf-item.on {
  background: rgba(0, 0, 0, 0.06);
  font-weight: 900;
}

.mlf-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* rows like ML (name + count) */
.mlf-row {
  border: 0;
  background: transparent;
  width: 100%;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  font-size: 13px;
  color: #222;
}

.mlf-row:hover {
  background: rgba(0, 0, 0, 0.04);
}

.mlf-row.on {
  background: rgba(0, 0, 0, 0.06);
  font-weight: 900;
}

.mlf-row-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mlf-row-count {
  opacity: 0.7;
  flex: 0 0 auto;
}

/* ML “mostrar más” link */
.mlf-more {
  margin-top: 10px;
  border: 0;
  background: transparent;
  color: #3483fa;
  font-weight: 800;
  cursor: pointer;
  padding: 2px 2px;
  text-align: left;
}

/* checkbox ML-ish */
.mlf-check {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #222;
  user-select: none;
}
.mlf-check input {
  width: 16px;
  height: 16px;
}

/* select modelo */
.mlf-select-wrap {
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  align-items: center;
}

.mlf-select {
  width: 100%;
  border: 1px solid rgba(0,0,0,.18);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;
  background: #fff;
  outline: none;
  appearance: none;
}

.mlf-clear {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 1px solid rgba(0,0,0,.18);
  background: #fff;
  cursor: pointer;
  display: grid;
  place-items: center;
  color: rgba(0,0,0,.55);
}

/* colors ML */
.mlf-colors {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.mlf-color {
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
}
.mlf-swatch {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 1px solid rgba(0,0,0,.18);
  display: inline-block;
}
.mlf-color.on .mlf-swatch {
  outline: 2px solid #3483fa;
  outline-offset: 2px;
}

/* min/max */
.mlf-minmax {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto;
  gap: 8px;
  align-items: center;
}
.mlf-mm {
  width: 100%;
  border: 1px solid rgba(0, 0, 0, 0.18);
  background: #fff;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;
  outline: none;
}
.mlf-sep {
  opacity: 0.6;
  font-weight: 900;
}
.mlf-go {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.18);
  background: #fff;
  cursor: pointer;
  display: grid;
  place-items: center;
}
.mlf-go-ico {
  font-size: 20px;
  line-height: 1;
  margin-top: -1px;
}

.mlf-muted {
  margin-top: 8px;
  font-size: 11px;
  opacity: 0.55;
}

/* bottom reset like ML */
.mlf-bottom {
  margin-top: 16px;
}

.mlf-reset {
  width: 100%;
  border: 0;
  background: transparent;
  padding: 10px 0;
  cursor: pointer;
  font-weight: 900;
  letter-spacing: 0.4px;
  color: #111;
  text-transform: uppercase;
}
</style>
