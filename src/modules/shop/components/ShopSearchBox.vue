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
      autocomplete="new-password"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
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
        <div v-if="suggestions.length" class="sb-list">
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

          <div class="sb-foot" @mousedown.prevent="goSearch">
          <v-icon size="15" start>mdi-magnify</v-icon>
          <span>Ver todos los resultados para <strong>{{ normalize(text) }}</strong></span>
          <v-icon size="14">mdi-chevron-right</v-icon>
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
  const q = normalize(text.value);
  if (q.length >= 2) {
    clearTimeout(tmr);
    tmr = setTimeout(fetchSuggestions, 0);
  }
}

function onBlur() {
  setTimeout(() => close(), 130);
}

function onDocClick(e) {
  if (!wrap.value) return;
  if (!wrap.value.contains(e.target)) close();
}
onMounted(() => document.addEventListener("click", onDocClick));
onBeforeUnmount(() => document.removeEventListener("click", onDocClick));

function commitQueryQ(q) {
  const qq = normalize(q);
  const nq = { ...route.query };

  if (qq) nq.q = qq;
  else delete nq.q;

  nq.page = "1";
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
  open.value = true;
  clearTimeout(tmr);
  tmr = setTimeout(fetchSuggestions, 280);
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
  const q = String(s.name || "").trim();
  close();
  if (q) {
    router.push({ name: "shopSearch", query: { q } });
  } else {
    router.push({
      name: "shopProduct",
      params: { id: String(s.product_id) },
      query: { branch_id: String(props.branchId) },
    });
  }
}

function goSearch() {
  const qq = normalize(text.value);
  close();
  if (!qq) return;
  router.push({ name: "shopSearch", query: { q: qq } });
}

function onEnter() {
  if (open.value && activeIdx.value >= 0 && suggestions.value[activeIdx.value]) {
    pick(suggestions.value[activeIdx.value]);
    return;
  }
  const q = normalize(text.value);
  close();
  if (!q) return;
  router.push({ name: "shopSearch", query: { q } });
}

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

/* ===============================
   INPUT (FIX: texto no puede quedar blanco)
   Porque shop.css fuerza blanco dentro del header
================================ */
.sb-input :deep(.v-field) {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.98) !important;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
}

/* texto que tipeás */
.sb-input :deep(input),
.sb-input :deep(textarea),
.sb-input :deep(.v-field__input) {
  color: rgba(0, 0, 0, 0.92) !important;
  caret-color: rgba(0, 0, 0, 0.92) !important;
}

/* placeholder */
.sb-input :deep(input::placeholder),
.sb-input :deep(textarea::placeholder),
.sb-input :deep(.v-field__input::placeholder) {
  color: rgba(0, 0, 0, 0.55) !important;
  opacity: 1 !important;
}

/* icono lupa + clear */
.sb-input :deep(.v-icon),
.sb-input :deep(.v-field__prepend-inner .v-icon),
.sb-input :deep(.v-field__append-inner .v-icon) {
  color: rgba(0, 0, 0, 0.55) !important;
}

/* ===============================
   DROPDOWN (ya blindado)
================================ */
.sb-dd,
.sb-dd * {
  color: rgb(var(--v-theme-on-surface)) !important;
}

.sb-dd :deep(.v-icon) {
  color: rgba(var(--v-theme-on-surface), 0.72) !important;
}

.sb-dd {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;

  background: #fff !important;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.14);
  overflow: hidden;
  z-index: 9999;
}

/* scroll control */
.sb-list {
  max-height: min(50vh, 360px);
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

/* Status / empty */
.sb-status,
.sb-empty {
  padding: 10px 12px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55) !important;
}

/* Row */
.sb-row {
  width: 100%;
  text-align: left;
  border: 0;
  background: transparent;
  cursor: pointer;

  display: flex;
  align-items: center;
  gap: 8px;

  padding: 7px 9px;
  color: rgba(0, 0, 0, 0.92) !important;
}

.sb-row:hover {
  background: rgba(0, 0, 0, 0.04);
}

.sb-row.active {
  background: rgba(var(--v-theme-primary), 0.08);
}

/* Thumb */
.sb-thumb {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  overflow: hidden;
  flex: 0 0 auto;

  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(0, 0, 0, 0.02);
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
  color: rgba(0, 0, 0, 0.4) !important;
}

/* Text */
.sb-info {
  min-width: 0;
  flex: 1 1 auto;
}

.sb-title {
  font-size: 13.5px;
  font-weight: 650;
  line-height: 1.2;
  color: rgba(0, 0, 0, 0.92) !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sb-meta {
  margin-top: 2px;
  font-size: 10.8px;
  line-height: 1.15;
  color: rgba(0, 0, 0, 0.62) !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Footer */
.sb-foot {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  padding: 7px 10px;
  font-size: 10.5px;
  color: rgba(0, 0, 0, 0.55) !important;
}

/* MOBILE */
@media (max-width: 600px) {
  .sb-dd {
    border-radius: 12px;
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.12);
  }

  .sb-list {
    max-height: min(45vh, 300px);
  }

  .sb-row {
    padding: 6px 8px;
    gap: 7px;
  }

  .sb-thumb {
    width: 34px;
    height: 34px;
    border-radius: 9px;
  }

  .sb-title {
    font-size: 12.8px;
  }

  .sb-meta {
    font-size: 10px;
  }

  .sb-foot {
    font-size: 10px;
    padding: 6px 8px;
  }
}
.sb-foot {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  padding: 9px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 12.5px;
  color: #1557d0;
  font-weight: 600;
  transition: background 0.12s;
}
.sb-foot:hover {
  background: rgba(52, 131, 250, 0.07);
}
.sb-foot :deep(.v-icon) { color: #3483fa !important; }
</style>