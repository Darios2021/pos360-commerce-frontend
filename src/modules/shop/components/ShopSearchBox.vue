<template>
  <div class="sb-wrap" @keydown.esc.prevent="close" ref="wrap">
    <v-text-field
      v-model="text"
      variant="solo"
      density="comfortable"
      hide-details
      clearable
      class="sb-input"
      :placeholder="placeholderText"
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
    <div v-if="open && (loading || showEmpty || termSuggestions.length)" class="sb-dd">
      <div v-if="loading" class="sb-status">
        <v-icon size="14" class="sb-status-icon">mdi-loading mdi-spin</v-icon>
        Buscando…
      </div>

      <template v-else>
        <ul v-if="termSuggestions.length" class="sb-list" role="listbox">
          <!-- Row 0: buscar el término exacto -->
          <li role="option">
            <button
              class="sb-row sb-row--search"
              :class="{ active: activeIdx === -1 }"
              type="button"
              @mouseenter="activeIdx = -1"
              @mousedown.prevent="goSearch"
            >
              <v-icon size="16" class="sb-row-icon">mdi-magnify</v-icon>
              <span class="sb-row-text">
                <span class="sb-row-typed">{{ normalize(text) }}</span>
                <span class="sb-row-hint"> — buscar esto</span>
              </span>
              <v-icon size="13" class="sb-row-arr">mdi-arrow-right</v-icon>
            </button>
          </li>

          <!-- Predicciones de texto -->
          <li
            v-for="(s, i) in termSuggestions"
            :key="s.product_id + '-' + i"
            role="option"
          >
            <button
              class="sb-row"
              :class="{ active: i === activeIdx }"
              type="button"
              @mouseenter="activeIdx = i"
              @mousedown.prevent="searchTerm(s.name)"
            >
              <v-icon size="15" class="sb-row-icon">mdi-magnify</v-icon>
              <!-- eslint-disable-next-line vue/no-v-html -->
              <span class="sb-row-text" v-html="highlightCompletion(s.name)"></span>
            </button>
          </li>
        </ul>

        <!-- Empty state -->
        <div v-else-if="showEmpty" class="sb-empty">
          Sin resultados para "{{ normalize(text) }}"
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import { getSuggestions } from "@/modules/shop/service/shop.public.api";

const props = defineProps({
  branchId: { type: Number, default: 3 },
  mode: { type: String, default: "home" },
  categoryId: { type: Number, default: null },
});

// Placeholder en minúscula y compacto en mobile, normal en desktop.
const { smAndDown } = useDisplay();
const placeholderText = computed(() =>
  smAndDown.value ? "buscar productos..." : "Buscar productos..."
);

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

// Deduplicate suggestions by name (case-insensitive) and limit
const termSuggestions = computed(() => {
  const seen = new Set();
  const result = [];
  for (const s of suggestions.value) {
    const key = (s.name || "").toLowerCase().trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(s);
    if (result.length >= 8) break;
  }
  return result;
});

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
      limit: 10,
    });

    const arr = Array.isArray(r?.items) ? r.items : Array.isArray(r) ? r : [];
    suggestions.value = arr;
    open.value = true;
    activeIdx.value = -1;
  } catch (e) {
    console.warn("fetchSuggestions error", e);
    suggestions.value = [];
  } finally {
    loading.value = false;
  }
}

function onType() {
  open.value = true;
  clearTimeout(tmr);
  tmr = setTimeout(fetchSuggestions, 240);
}

// activeIdx: -1 = "Buscar X" row, 0..n = term suggestions
function move(dir) {
  if (!open.value) return;
  const max = termSuggestions.value.length - 1;
  if (max < 0) return;
  let i = activeIdx.value + dir;
  if (i < -1) i = max;
  if (i > max) i = -1;
  activeIdx.value = i;
}

function searchTerm(name) {
  const q = normalize(name);
  close();
  if (!q) return;
  router.push({ name: "shopSearch", query: { q } });
}

function goSearch() {
  const q = normalize(text.value);
  close();
  if (!q) return;
  router.push({ name: "shopSearch", query: { q } });
}

function onEnter() {
  if (open.value && activeIdx.value >= 0 && termSuggestions.value[activeIdx.value]) {
    searchTerm(termSuggestions.value[activeIdx.value].name);
    return;
  }
  const q = normalize(text.value);
  close();
  if (!q) return;
  router.push({ name: "shopSearch", query: { q } });
}

function clear() {
  text.value = "";
  suggestions.value = [];
  loading.value = false;
  close();
  const nq = { ...route.query };
  delete nq.q;
  nq.page = "1";
  router.replace({ name: route.name, params: route.params, query: nq });
}

// Bold the part that completes the typed query (ML-style)
function escHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlightCompletion(name) {
  const q = normalize(text.value).toLowerCase();
  const n = (name || "").toLowerCase();
  if (q && n.startsWith(q)) {
    const typed = escHtml(name.slice(0, q.length));
    const rest = escHtml(name.slice(q.length));
    return `${typed}<strong>${rest}</strong>`;
  }
  // fallback: bold everything after first word match
  return `<strong>${escHtml(name)}</strong>`;
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

/* INPUT */
.sb-input :deep(.v-field) {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.98) !important;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
}

.sb-input :deep(input),
.sb-input :deep(.v-field__input) {
  color: rgba(0, 0, 0, 0.92) !important;
  caret-color: rgba(0, 0, 0, 0.92) !important;
}

.sb-input :deep(input::placeholder),
.sb-input :deep(.v-field__input::placeholder) {
  color: rgba(0, 0, 0, 0.45) !important;
  opacity: 1 !important;
}

.sb-input :deep(.v-icon),
.sb-input :deep(.v-field__prepend-inner .v-icon),
.sb-input :deep(.v-field__append-inner .v-icon) {
  color: rgba(0, 0, 0, 0.45) !important;
}

/* DROPDOWN */
.sb-dd {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  right: 0;
  background: #fff !important;
  color: #222 !important;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.09);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.13);
  overflow: hidden;
  z-index: 9999;
}

/* List */
.sb-list {
  list-style: none;
  margin: 0;
  padding: 6px 0;
  max-height: min(55vh, 380px);
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

/* Status */
.sb-status {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 12px 16px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45) !important;
}
.sb-status-icon { opacity: 0.6; }

/* Empty */
.sb-empty {
  padding: 14px 16px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45) !important;
}

/* Row base */
.sb-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 16px;
  border: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
  color: #222 !important;
}
.sb-row:hover,
.sb-row.active {
  background: rgba(0, 0, 0, 0.05);
}

/* "Buscar X" row — slightly distinct */
.sb-row--search {
  background: rgba(52, 131, 250, 0.04);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  margin-bottom: 2px;
}
.sb-row--search:hover,
.sb-row--search.active {
  background: rgba(52, 131, 250, 0.1);
}

/* Icon */
.sb-row-icon {
  color: rgba(0, 0, 0, 0.35) !important;
  flex: 0 0 auto;
}
.sb-row--search .sb-row-icon {
  color: #3483fa !important;
}

/* Text */
.sb-row-text {
  flex: 1;
  font-size: 13.5px;
  line-height: 1.25;
  color: #222 !important;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sb-row-text :deep(strong) {
  font-weight: 400;
  color: #111 !important;
}

/* "buscar esto" hint */
.sb-row-typed {
  font-weight: 400;
  color: #3483fa !important;
}
.sb-row-hint {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.4) !important;
  font-weight: 400;
}

/* Arrow icon on "Buscar X" row */
.sb-row-arr {
  color: #3483fa !important;
  flex: 0 0 auto;
}

/* Mobile */
@media (max-width: 600px) {
  .sb-dd {
    border-radius: 14px;
  }
  .sb-list {
    max-height: min(50vh, 320px);
  }
  .sb-row {
    padding: 9px 14px;
    gap: 9px;
  }
  .sb-row-text {
    font-size: 13px;
  }

  /* Placeholder más chico y siempre en minúscula en mobile */
  .sb-input :deep(input::placeholder),
  .sb-input :deep(.v-field__input::placeholder) {
    font-size: 12px !important;
    text-transform: lowercase !important;
    letter-spacing: 0.1px;
    opacity: 0.55 !important;
  }
  /* Lo que escribe el usuario también queda en minúscula visualmente
     (no afecta la query, sólo el render del campo) */
  .sb-input :deep(input),
  .sb-input :deep(.v-field__input) {
    font-size: 13px !important;
    text-transform: lowercase;
  }
}
</style>
