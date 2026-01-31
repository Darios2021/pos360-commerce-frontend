<!-- src/modules/shop/components/ShopSearchAutocomplete.vue -->
<template>
  <div class="ml-search">
    <v-autocomplete
      v-model="selected"
      v-model:search="text"
      :items="items"
      item-title="label"
      item-value="value"
      :loading="loading"
      :no-filter="true"
      :hide-no-data="false"
      density="comfortable"
      variant="outlined"
      clearable
      class="search"
      prepend-inner-icon="mdi-magnify"
      :placeholder="placeholder"
      :menu-props="menuProps"
      @update:search="onTyping"
      @keydown.enter.capture="onEnter"
      @click:clear="onClear"
    >
      <template #no-data>
        <div class="px-4 py-3 text-caption text-medium-emphasis">
          Escribí para buscar productos…
        </div>
      </template>

      <template #item="{ props: p, item }">
        <!-- ✅ Solo “aceptamos” selección si hubo click/tap real del usuario -->
        <v-list-item
          v-bind="p"
          class="ml-item"
          @mousedown="markClickSelect"
          @touchstart="markClickSelect"
        >
          <template #prepend>
            <v-avatar size="28" variant="tonal">
              <v-icon size="18">mdi-magnify</v-icon>
            </v-avatar>
          </template>

          <v-list-item-title class="ml-title">
            {{ item.raw.label }}
          </v-list-item-title>
          <v-list-item-subtitle class="ml-sub">
            {{ item.raw.hint }}
          </v-list-item-subtitle>
        </v-list-item>
      </template>

      <template #append-inner>
        <v-btn
          icon
          variant="text"
          :disabled="loading"
          @click="submitText()"
          :title="'Buscar'"
        >
          <v-icon>mdi-arrow-right</v-icon>
        </v-btn>
      </template>
    </v-autocomplete>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from "vue";

const props = defineProps({
  modelValue: { type: String, default: "" },
  placeholder: { type: String, default: "Buscar productos…" },

  // callback: async (text) => [{label,value,hint}]
  suggest: { type: Function, required: true },

  debounceMs: { type: Number, default: 250 },
  minChars: { type: Number, default: 2 },

  // max sugerencias
  maxItems: { type: Number, default: 8 },
});

const emit = defineEmits(["update:modelValue", "search", "clear"]);

const text = ref(String(props.modelValue || ""));
const selected = ref(null);

const loading = ref(false);
const items = ref([]);

let tmr = null;

// ✅ Guardamos lo último tipeado para restaurar si Vuetify intenta “autoseleccionar”
const lastTyped = ref(text.value);

// ✅ Flag: solo permitimos selección cuando hubo click/tap en un item
const allowSelectFromClick = ref(false);

const menuProps = computed(() => ({
  // ✅ FIX warning "Scroll target is not reachable"
  // fuerza render del menú en body y reposiciona con scroll
  attach: "body",
  maxHeight: 360,
  scrollStrategy: "reposition",
}));

function setModel(v) {
  emit("update:modelValue", v);
}

function normalize(s) {
  return String(s || "").trim();
}

function markClickSelect() {
  allowSelectFromClick.value = true;
}

function onClear() {
  text.value = "";
  selected.value = null;
  items.value = [];
  lastTyped.value = "";
  setModel("");
  emit("clear");
}

async function loadSuggestions(q) {
  const qq = normalize(q);
  if (qq.length < props.minChars) {
    items.value = [];
    return;
  }

  loading.value = true;
  try {
    const res = await props.suggest(qq);
    const arr = Array.isArray(res) ? res : [];
    items.value = arr.slice(0, Math.max(1, Number(props.maxItems || 8)));
  } catch (e) {
    console.error("❌ suggest()", e);
    items.value = [];
  } finally {
    loading.value = false;
  }
}

function onTyping(v) {
  const q = normalize(v);
  text.value = q;
  lastTyped.value = q;
  setModel(q);

  if (tmr) clearTimeout(tmr);
  tmr = setTimeout(() => loadSuggestions(q), props.debounceMs);
}

function submitText() {
  const q = normalize(text.value);
  lastTyped.value = q;
  setModel(q);
  emit("search", q);
}

// ✅ Enter = buscar SIEMPRE (no seleccionar sugerencia)
async function onEnter(e) {
  e?.preventDefault?.();
  e?.stopPropagation?.();

  // si justo había un item “activo” por teclado, evitamos que eso dispare selección
  allowSelectFromClick.value = false;

  const q = normalize(text.value || lastTyped.value);
  text.value = q;
  lastTyped.value = q;

  // por las dudas, anulamos cualquier selección que haya querido hacer Vuetify
  selected.value = null;

  submitText();

  // si el componente llegó a pisar el texto por autoselección, lo restauramos
  await nextTick();
  if (text.value !== lastTyped.value) text.value = lastTyped.value;
}

// Sync externo -> input
watch(
  () => props.modelValue,
  (v) => {
    const nv = String(v || "");
    if (nv !== text.value) {
      text.value = nv;
      lastTyped.value = nv;
    }
  }
);

// ✅ Selección SOLO por click/tap en un item
watch(selected, async (val) => {
  if (!val) return;

  if (!allowSelectFromClick.value) {
    // vino de teclado/enter/autoselect => lo ignoramos y restauramos búsqueda
    selected.value = null;
    await nextTick();
    text.value = lastTyped.value;
    return;
  }

  // click/tap confirmado
  allowSelectFromClick.value = false;

  const q = normalize(val);
  text.value = q;
  lastTyped.value = q;
  setModel(q);
  emit("search", q);
});
</script>

<style scoped>
.ml-search {
  width: 100%;
}

.search :deep(.v-field) {
  border-radius: 12px;
}

.ml-title {
  font-weight: 900;
}

.ml-sub {
  opacity: 0.75;
  font-size: 12px;
}
</style>
