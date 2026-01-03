<!-- src/modules/shop/components/ShopSearchBox.vue -->
<template>
  <div class="sb-wrap" @keydown.esc.prevent="close">
    <v-text-field
      v-model="text"
      variant="solo"
      density="comfortable"
      hide-details
      clearable
      class="sb-input"
      placeholder="Buscar productos, marcas y más..."
      prepend-inner-icon="mdi-magnify"
      @keydown.down.prevent="move(1)"
      @keydown.up.prevent="move(-1)"
      @keydown.enter.prevent="onEnter"
      @focus="onFocus"
      @click:clear="clear"
      @input="onType"
    />

    <!-- Dropdown -->
    <div v-if="open && suggestions.length" class="sb-dd">
      <button
        v-for="(s, i) in suggestions"
        :key="String(s.product_id) + '-' + i"
        class="sb-row"
        :class="{ active: i === activeIdx }"
        type="button"
        @mouseenter="activeIdx = i"
        @mousedown.prevent="pick(s)"
      >
        <div class="sb-title">{{ s.name }}</div>
        <div class="sb-meta">
          <span v-if="s.brand">{{ s.brand }}</span>
          <span v-if="s.model">· {{ s.model }}</span>
          <span v-if="s.subcategory_name">· {{ s.subcategory_name }}</span>
          <span v-else-if="s.category_name">· {{ s.category_name }}</span>
        </div>
      </button>

      <div class="sb-foot">
        <span class="sb-hint">Enter para buscar · Click para abrir</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getSuggestions } from "@/modules/shop/service/shop.public.api";

const props = defineProps({
  branchId: { type: Number, default: 3 },

  // "home" o "category"
  mode: { type: String, default: "home" },

  // si mode="category", pasá el parentId
  categoryId: { type: Number, default: null },
});

const router = useRouter();
const route = useRoute();

const text = ref(String(route.query.q || ""));
const open = ref(false);
const suggestions = ref([]);
const activeIdx = ref(-1);
let tmr = null;

function normalize(v) {
  return String(v || "").trim();
}

function close() {
  open.value = false;
  activeIdx.value = -1;
}

function onFocus() {
  if (suggestions.value.length) open.value = true;
}

function setQueryQ(q) {
  const nq = { ...route.query };
  if (q) nq.q = q;
  else delete nq.q;
  delete nq.page;
  router.replace({ name: route.name, params: route.params, query: nq });
}

function clear() {
  text.value = "";
  suggestions.value = [];
  close();
  setQueryQ(null);
}

async function fetchSuggestions() {
  const q = normalize(text.value);
  if (q.length < 2) {
    suggestions.value = [];
    close();
    return;
  }

  try {
    const r = await getSuggestions({
      branch_id: props.branchId,
      q,
      limit: 8,
    });

    const arr = Array.isArray(r?.items) ? r.items : Array.isArray(r) ? r : [];
    suggestions.value = arr;
    open.value = true;
    activeIdx.value = arr.length ? 0 : -1;
  } catch (e) {
    console.warn("❌ fetchSuggestions", e);
    suggestions.value = [];
    close();
  }
}

function onType() {
  const q = normalize(text.value);
  setQueryQ(q || null);

  clearTimeout(tmr);
  tmr = setTimeout(fetchSuggestions, 220);
}

function move(dir) {
  if (!open.value || !suggestions.value.length) return;
  const n = suggestions.value.length;
  let i = activeIdx.value < 0 ? 0 : activeIdx.value + dir;
  if (i < 0) i = n - 1;
  if (i >= n) i = 0;
  activeIdx.value = i;
}

function pick(s) {
  close();

  // ✅ tu ruta real es /shop/product/:id
  router.push({
    name: "shopProduct",
    params: { id: String(s.product_id) },
    query: {
      // mantenemos branch_id por si tu detalle lo usa
      branch_id: String(props.branchId),
    },
  });
}

function onEnter() {
  // si hay una sugerencia activa, abrila
  if (open.value && activeIdx.value >= 0 && suggestions.value[activeIdx.value]) {
    pick(suggestions.value[activeIdx.value]);
    return;
  }

  // sino: búsqueda normal en home o en categoría
  const q = normalize(text.value);
  close();

  if (props.mode === "category" && props.categoryId) {
    router.push({
      name: "shopCategory",
      params: { id: String(props.categoryId) },
      query: { ...route.query, q: q || undefined, page: "1" },
    });
  } else {
    router.push({
      name: "shopHome",
      query: { ...route.query, q: q || undefined, page: "1" },
    });
  }
}

// mantener sync con URL compartida/back-forward
watch(
  () => route.query.q,
  (v) => {
    text.value = String(v || "");
  }
);
</script>

<style scoped>
.sb-wrap {
  position: relative;
  width: 100%;
}

.sb-input :deep(.v-field) {
  border-radius: 14px;
}

.sb-dd {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
  overflow: hidden;
  z-index: 999;
}

.sb-row {
  width: 100%;
  text-align: left;
  border: 0;
  background: transparent;
  padding: 12px 14px;
  cursor: pointer;
}

.sb-row:hover,
.sb-row.active {
  background: rgba(0, 0, 0, 0.05);
}

.sb-title {
  font-weight: 900;
  line-height: 1.15;
}

.sb-meta {
  margin-top: 3px;
  font-size: 12px;
  opacity: 0.8;
}

.sb-foot {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  padding: 10px 14px;
  font-size: 12px;
  opacity: 0.7;
}
</style>
