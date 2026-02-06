<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/shop/ShopCategoryFilters.vue -->
<template>
  <div class="scf">
    <div class="scf-panel">
      <!-- Subcategorías -->
      <div v-if="subcats?.length" class="scf-box">
        <div class="scf-h">Subcategorías</div>
        <div class="scf-list">
          <button
            class="scf-item"
            :class="{ 'is-active': selectedSubId == null }"
            type="button"
            :disabled="loading"
            @click="$emit('selectSub', null)"
          >
            <span>Ver todas</span>
          </button>

          <button
            v-for="s in subcats"
            :key="s?.id"
            class="scf-item"
            :class="{ 'is-active': String(selectedSubId) === String(s?.id) }"
            type="button"
            :disabled="loading"
            @click="$emit('selectSub', String(s?.id))"
          >
            <span>{{ s?.name || "—" }}</span>
          </button>
        </div>
      </div>

      <!-- Stock -->
      <div class="scf-box">
        <div class="scf-h">Disponibilidad</div>
        <label class="scf-check">
          <input
            type="checkbox"
            :checked="!!inStockOnly"
            :disabled="loading"
            @change="$emit('update:inStockOnly', $event.target.checked)"
          />
          <span>Solo con stock</span>
        </label>
      </div>

      <!-- Marca (lista tipo ML) -->
      <div v-if="brands?.length" class="scf-box">
        <div class="scf-h">Marca</div>
        <div class="scf-list">
          <button
            v-for="b in visibleBrands"
            :key="String(b?.key)"
            class="scf-row"
            :class="{ 'is-on': isBrandOn(b?.key) }"
            type="button"
            :disabled="loading"
            @click="toggleBrand(b?.key)"
            :title="b?.label || ''"
          >
            <span class="scf-row-name">{{ b?.label || "—" }}</span>
            <span class="scf-row-count">
              {{ typeof b?.count === "number" ? b.count : "" }}
            </span>
          </button>
        </div>

        <button
          v-if="brands.length > 9"
          class="scf-more"
          type="button"
          :disabled="loading"
          @click="showMoreBrands = !showMoreBrands"
        >
          {{ showMoreBrands ? "Mostrar menos" : "Mostrar más" }}
        </button>
      </div>

      <!-- Modelo (texto) -->
      <div class="scf-box">
        <div class="scf-h">Modelo</div>
        <div class="scf-model">
          <input
            class="scf-model-in"
            :value="modelLocal"
            :disabled="loading"
            placeholder="Ej: AirPods, G200, M6…"
            @input="modelLocal = $event.target.value"
            @keyup.enter="applyModel"
          />
          <button class="scf-model-go" type="button" :disabled="loading" @click="applyModel">
            <span class="scf-go-ico">›</span>
          </button>
        </div>
        <button
          v-if="modelLocal"
          class="scf-link"
          type="button"
          :disabled="loading"
          @click="clearModel"
        >
          Limpiar modelo
        </button>
      </div>

      <!-- Capacidad -->
      <div class="scf-box">
        <div class="scf-h">Capacidad en volumen</div>

        <div class="scf-minmax">
          <input
            class="scf-mm"
            inputmode="numeric"
            placeholder="Mínimo"
            :value="String(volumeMinLocal ?? '')"
            :disabled="loading"
            @input="volumeMinLocal = $event.target.value"
          />
          <span class="scf-sep">–</span>
          <input
            class="scf-mm"
            inputmode="numeric"
            placeholder="Máximo"
            :value="String(volumeMaxLocal ?? '')"
            :disabled="loading"
            @input="volumeMaxLocal = $event.target.value"
          />
          <button class="scf-go" type="button" :disabled="loading" @click="applyVolume">
            <span class="scf-go-ico">›</span>
          </button>
        </div>

        <div class="scf-muted">Ej: 600</div>
      </div>

      <div class="scf-bottom">
        <v-btn block rounded="lg" variant="text" :disabled="loading" @click="$emit('clearAll')">
          Limpiar filtros
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  loading: { type: Boolean, default: false },

  subcats: { type: Array, default: () => [] },
  selectedSubId: { type: [Number, String, null], default: null },
  inStockOnly: { type: Boolean, default: false },

  // ✅ facets de marca que le pasa la página
  // [{ key:'XAEA', label:'XAEA', count: 12 }]
  brands: { type: Array, default: () => [] },
  selectedBrands: { type: Array, default: () => [] }, // ['XAEA','Sony']

  // ✅ modelo (texto)
  model: { type: String, default: "" },

  volumeMin: { type: [Number, String, null], default: null },
  volumeMax: { type: [Number, String, null], default: null },
});

const emit = defineEmits([
  "selectSub",
  "update:inStockOnly",
  "clearAll",

  "update:selectedBrands",
  "update:model",

  "update:volume",
]);

const showMoreBrands = ref(false);
const visibleBrands = computed(() => {
  const arr = Array.isArray(props.brands) ? props.brands : [];
  return showMoreBrands.value ? arr : arr.slice(0, 9);
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

/* modelo */
const modelLocal = ref(props.model || "");
watch(
  () => props.model,
  (v) => {
    const nv = String(v || "");
    if (nv !== modelLocal.value) modelLocal.value = nv;
  }
);

function applyModel() {
  emit("update:model", String(modelLocal.value || "").trim());
}
function clearModel() {
  modelLocal.value = "";
  emit("update:model", "");
}

/* volumen */
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
.scf {
  width: 100%;
}

.scf-panel {
  background: #ffffff;
  border-radius: 14px;
  padding: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.scf-box + .scf-box {
  margin-top: 14px;
}

.scf-h {
  font-weight: 900;
  font-size: 14px;
  color: #111;
  margin-bottom: 8px;
}

.scf-list {
  display: grid;
  gap: 6px;
}

.scf-item {
  width: 100%;
  text-align: left;
  border: 0;
  background: transparent;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
  color: #1a1a1a;
  font-size: 13px;
}
.scf-item:hover {
  background: rgba(0, 0, 0, 0.05);
}
.scf-item.is-active {
  background: #f5f5f5;
  font-weight: 900;
}

.scf-row {
  width: 100%;
  border: 0;
  background: transparent;
  padding: 7px 10px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: #1a1a1a;
  font-size: 13px;
}
.scf-row:hover {
  background: rgba(0, 0, 0, 0.05);
}
.scf-row.is-on {
  background: #f5f5f5;
  font-weight: 900;
}
.scf-row-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.scf-row-count {
  opacity: 0.7;
  flex: 0 0 auto;
}

.scf-more {
  margin-top: 8px;
  border: 0;
  background: transparent;
  color: #1976d2;
  font-weight: 800;
  cursor: pointer;
  padding: 6px 2px;
  text-align: left;
}

.scf-check {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 13px;
  color: #1a1a1a;
  user-select: none;
}
.scf-check input {
  width: 16px;
  height: 16px;
}

/* Modelo */
.scf-model {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  align-items: center;
}
.scf-model-in {
  width: 100%;
  border: 1px solid rgba(0, 0, 0, 0.18);
  background: #fff;
  border-radius: 10px;
  padding: 9px 10px;
  font-size: 13px;
  outline: none;
}
.scf-model-go {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.18);
  background: #fff;
  cursor: pointer;
  display: grid;
  place-items: center;
}
.scf-link {
  margin-top: 8px;
  border: 0;
  background: transparent;
  color: #1976d2;
  font-weight: 800;
  cursor: pointer;
  padding: 4px 2px;
  text-align: left;
}

/* Min/Max */
.scf-minmax {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto;
  gap: 8px;
  align-items: center;
}
.scf-mm {
  width: 100%;
  border: 1px solid rgba(0, 0, 0, 0.18);
  background: #fff;
  border-radius: 10px;
  padding: 9px 10px;
  font-size: 13px;
  outline: none;
}
.scf-sep {
  opacity: 0.6;
  font-weight: 900;
}
.scf-go {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.18);
  background: #fff;
  cursor: pointer;
  display: grid;
  place-items: center;
}
.scf-go-ico {
  font-size: 20px;
  line-height: 1;
  margin-top: -1px;
}

.scf-muted {
  margin-top: 6px;
  font-size: 11px;
  opacity: 0.55;
}

.scf-bottom {
  margin-top: 14px;
}
</style>
