<template>
  <div class="sb-wrap" @keydown.esc.prevent="close" ref="wrap">
    <v-text-field
      v-model="text"
      variant="solo"
      density="comfortable"
      hide-details
      clearable
      class="sb-input"
      placeholder="Buscar productos..."
      prepend-inner-icon="mdi-magnify"
      @keydown.down.prevent="move(1)"
      @keydown.up.prevent="move(-1)"
      @keydown.enter.prevent="onEnter"
      @focus="onFocus"
      @blur="onBlur"
      @click:clear="clear"
      @input="onType"
    />

    <!-- Dropdown -->
    <div v-if="open && (loading || showEmpty || suggestions.length)" class="sb-dd">
      <div v-if="loading" class="sb-status">Buscando…</div>

      <template v-else>
        <div v-if="suggestions.length">
          <button
            v-for="(s, i) in suggestions"
            :key="String(s.product_id) + '-' + i"
            class="sb-row"
            :class="{ active: i === activeIdx }"
            type="button"
            @mouseenter="activeIdx = i"
            @mousedown.prevent="pick(s)"
          >
            <!-- ✅ THUMB -->
            <div class="sb-thumb" aria-hidden="true">
              <img
                v-if="thumbOf(s)"
                :src="thumbOf(s)"
                :alt="s.name || 'Producto'"
                loading="lazy"
                @error="onThumbErr"
              />
              <div v-else class="sb-thumb-ph">
                <v-icon size="18">mdi-image-outline</v-icon>
              </div>
            </div>

            <!-- TEXT -->
            <div class="sb-info">
              <div class="sb-title">{{ s.name }}</div>
              <div class="sb-meta">
                <span v-if="s.brand">{{ s.brand }}</span>
                <span v-if="s.model">· {{ s.model }}</span>
                <span v-if="s.subcategory_name">· {{ s.subcategory_name }}</span>
                <span v-else-if="s.category_name">· {{ s.category_name }}</span>
              </div>
            </div>
          </button>

          <div class="sb-foot">
            <span class="sb-hint">Enter para buscar · Click para abrir</span>
          </div>
        </div>

        <!-- ✅ Empty state -->
        <div v-else-if="showEmpty" class="sb-empty">
          No encontramos resultados para “{{ normalize(text) }}”.
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getSuggestions } from "@/modules/shop/service/shop.public.api";

const props = defineProps({
  branchId: { type: Number, default: 3 },
  mode: { type: String, default: "home" },
  categoryId: { type: Number, default: null },
});

const router = useRouter();
const route = useRoute();

const wrap = ref(null);

const text = ref(String(route.query.q || ""));
const open = ref(false);
const suggestions = ref([]);
const activeIdx = ref(-1);
const loading = ref(false);

let tmr = null;

function normalize(v) {
  return String(v || "").trim();
}

const showEmpty = computed(() => {
  const q = normalize(text.value);
  return open.value && !loading.value && q.length >= 2 && suggestions.value.length === 0;
});

function close() {
  open.value = false;
  activeIdx.value = -1;
}

function onFocus() {
  open.value = true;
  // si ya hay texto, refrescamos para que aparezca dropdown
  const q = normalize(text.value);
  if (q.length >= 2) {
    clearTimeout(tmr);
    tmr = setTimeout(fetchSuggestions, 0);
  }
}

function onBlur() {
  // delay para permitir click en suggestions
  setTimeout(() => close(), 130);
}

// cerrar si clic afuera
function onDocClick(e) {
  if (!wrap.value) return;
  if (!wrap.value.contains(e.target)) close();
}
onMounted(() => document.addEventListener("click", onDocClick));
onBeforeUnmount(() => document.removeEventListener("click", onDocClick));

/**
 * ✅ IMPORTANTE:
 * NO tocar la URL mientras tipeás.
 * La URL se escribe SOLO en commit:
 * - Enter (buscar)
 * - pick (click sugerencia)
 * - clear (limpia)
 */
function commitQueryQ(q) {
  const qq = normalize(q);
  const nq = { ...route.query };

  if (qq) nq.q = qq;
  else delete nq.q;

  nq.page = "1"; // cuando se busca, siempre arranca en 1
  router.replace({ name: route.name, params: route.params, query: nq });
}

function clear() {
  text.value = "";
  suggestions.value = [];
  loading.value = false;
  close();
  commitQueryQ(null);
}

async function fetchSuggestions() {
  const q = normalize(text.value);
  if (q.length < 2) {
    suggestions.value = [];
    loading.value = false;
    return;
  }

  loading.value = true;
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
  } finally {
    loading.value = false;
  }
}

function onType() {
  const q = normalize(text.value);

  // ✅ abrimos dropdown mientras escribe
  open.value = true;

  clearTimeout(tmr);
  tmr = setTimeout(fetchSuggestions, 280);

  // ✅ NO setQueryQ acá (antes te escribía la URL letra por letra)
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
  // ✅ acá sí escribimos q (commit) si querés, pero opcional
  const q = normalize(text.value);
  if (q) commitQueryQ(q);

  close();
  router.push({
    name: "shopProduct",
    params: { id: String(s.product_id) },
    query: { branch_id: String(props.branchId) },
  });
}

function onEnter() {
  if (open.value && activeIdx.value >= 0 && suggestions.value[activeIdx.value]) {
    pick(suggestions.value[activeIdx.value]);
    return;
  }

  const q = normalize(text.value);
  close();

  // ✅ commit a URL solo al Enter
  commitQueryQ(q || null);

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

/* ✅ toma miniatura desde cualquier key común */
function thumbOf(s) {
  const cands = [
    s?.thumbnail_url,
    s?.thumb_url,
    s?.image_thumb,
    s?.image_url,
    s?.photo_url,
    s?.image,
    s?.img,
    s?.cover_url,
    s?.main_image_url,
    s?.product_image_url,
  ];
  const u = cands.find((x) => typeof x === "string" && x.trim().length > 0);
  return u ? u.trim() : "";
}

function onThumbErr(ev) {
  const img = ev?.target;
  if (img) img.style.display = "none";
}

// si cambian el q desde otro lado (ej: volver atrás), actualizamos input
watch(
  () => route.query.q,
  (v) => {
    const nv = String(v || "");
    if (nv !== String(text.value || "")) text.value = nv;
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

/* Dropdown theme-safe */
.sb-dd {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;

  background: rgba(var(--v-theme-surface), 0.98);
  color: rgb(var(--v-theme-on-surface));
  border-radius: 14px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
  overflow: hidden;
  z-index: 999;
}

.sb-status {
  padding: 12px 14px;
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.65);
}

.sb-empty {
  padding: 14px;
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.65);
}

/* Row layout */
.sb-row {
  width: 100%;
  text-align: left;
  border: 0;
  background: transparent;
  padding: 10px 12px;
  cursor: pointer;

  display: flex;
  align-items: center;
  gap: 12px;

  color: rgb(var(--v-theme-on-surface));
}

.sb-row:hover {
  background: rgba(var(--v-theme-on-surface), 0.06);
}
.sb-row.active {
  background: rgba(var(--v-theme-primary), 0.12);
}

/* Thumb */
.sb-thumb {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  overflow: hidden;
  flex: 0 0 auto;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgba(var(--v-theme-on-surface), 0.03);
  display: grid;
  place-items: center;
}

.sb-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.sb-thumb-ph {
  color: rgba(var(--v-theme-on-surface), 0.55);
}

/* Text block */
.sb-info {
  min-width: 0;
  flex: 1 1 auto;
}

.sb-title {
  font-weight: 900;
  line-height: 1.15;
  color: rgb(var(--v-theme-on-surface));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sb-meta {
  margin-top: 3px;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.72);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sb-foot {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  padding: 10px 14px;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.65);
}
</style>
