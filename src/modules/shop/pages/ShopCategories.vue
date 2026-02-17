<template>
  <div class="mlc" data-page="shop-categories">
    <div class="mlc-topbar">
      <button class="mlc-back" type="button" @click="goBack" aria-label="Volver">
        <v-icon size="22">mdi-arrow-left</v-icon>
      </button>
      <div class="mlc-title">Categorías</div>
      <div class="mlc-topbar-spacer" />
    </div>

    <v-alert v-if="err" type="error" variant="tonal" class="mlc-alert">
      {{ err }}
    </v-alert>

    <div class="mlc-body">
      <aside class="mlc-left" aria-label="Listado de categorías">
        <div v-if="loadingParents" class="mlc-left-loading">
          <v-progress-circular indeterminate size="18" />
          <span>Cargando…</span>
        </div>

        <button
          v-for="c in parents"
          :key="c.id"
          type="button"
          class="mlc-left-item"
          :class="{ active: Number(activeParentId) === Number(c.id) }"
          @click="selectParent(c.id)"
        >
          <span class="mlc-left-text">{{ c.name }}</span>
        </button>
      </aside>

      <main class="mlc-right" aria-label="Subcategorías">
        <div class="mlc-right-head">
          <div class="mlc-right-title">{{ activeParent?.name || "Categorías" }}</div>

          <button
            v-if="activeParentId"
            type="button"
            class="mlc-seeall"
            @click="openParentAll()"
            aria-label="Ver todo"
          >
            Ver todo
            <v-icon size="18">mdi-chevron-right</v-icon>
          </button>
        </div>

        <div v-if="loadingChildren" class="mlc-right-loading">
          <v-progress-circular indeterminate />
          <div class="text-caption" style="opacity: 0.75">Cargando categorías…</div>
        </div>

        <div v-else class="mlc-grid">
          <button
            v-for="s in children"
            :key="s.id"
            type="button"
            class="mlc-card"
            @click="openSubcategory(s.id)"
            :title="s.name"
          >
            <div class="mlc-icon">
              <span class="mlc-icon-ph" :class="{ off: !!iconForSub(s) }">
                {{ initials(s.name) }}
              </span>

              <img
                v-if="iconForSub(s)"
                :src="iconForSub(s)"
                alt=""
                loading="lazy"
                @error="onIconErr(s)"
              />
            </div>

            <div class="mlc-name">{{ s.name }}</div>
          </button>

          <div v-if="!children.length" class="mlc-empty">
            No hay subcategorías para mostrar.
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from "vue";
import { useRouter, useRoute } from "vue-router";
import { getPublicCategoriesAll, getPublicCategoryChildren } from "@/modules/shop/service/shop.taxonomy.api";
import { getCatalog } from "@/modules/shop/service/shop.public.api";

const router = useRouter();
const route = useRoute();

const loadingParents = ref(false);
const loadingChildren = ref(false);
const err = ref("");

const catsAll = ref([]);
const parents = ref([]);
const activeParentId = ref(null);

const children = ref([]);

/* =========================
   Helpers
========================= */
function norm(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function isTopLevel(c) {
  const pid = c?.parent_id ?? c?.parentId ?? c?.parent ?? null;
  const level = c?.level ?? c?.depth ?? null;
  if (level != null) return Number(level) === 0;
  return pid == null || pid === 0 || pid === "0" || pid === "";
}

function initials(name) {
  const s = String(name || "").trim();
  if (!s) return "•";
  const parts = s.split(/\s+/).filter(Boolean);
  const a = (parts[0] || "").slice(0, 1).toUpperCase();
  const b = (parts[1] || "").slice(0, 1).toUpperCase();
  return (a + b) || a || "•";
}

/* ✅ branchId para catálogo (CLAVE) */
const branchId = computed(() => {
  const v = route.query.branch_id ?? route.query.branchId ?? 3;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 3;
});

/* ✅ thumb super-robusto */
function thumbFromProduct(p) {
  const cands = [
    p?.thumbnail_url,
    p?.thumb_url,
    p?.image_thumb,
    p?.main_image_url,
    p?.product_image_url,
    p?.image_url,
    p?.photo_url,
    p?.image,
    p?.img,
    p?.cover_url,

    // ✅ comunes en APIs
    p?.media?.thumbnail,
    p?.media?.cover,
    p?.media?.image,
    p?.media?.images?.[0]?.url,
    p?.media?.images?.[0]?.src,
    p?.images?.[0]?.url,
    p?.images?.[0]?.src,
    p?.pictures?.[0]?.url,
    p?.pictures?.[0]?.src,
  ];

  const u = cands.find((x) => typeof x === "string" && x.trim().length > 0);
  return u ? u.trim() : "";
}

function cacheKey(parentId, subId) {
  return `p:${Number(parentId || 0)}|s:${Number(subId || 0)}|b:${Number(branchId.value || 0)}`;
}

/* =========================
   ✅ CACHE REACTIVO (img por subcat)
========================= */
const repImg = reactive({}); // key -> url
const repLoading = reactive({}); // key -> boolean

async function fetchRepImageForSub(parentId, subId) {
  const k = cacheKey(parentId, subId);

  if (repImg[k]) return repImg[k];
  if (repLoading[k]) return "";

  repLoading[k] = true;
  try {
    // ✅ pedimos varios y elegimos el primero con thumb real
    const r = await getCatalog({
      branch_id: branchId.value,           // ✅ CLAVE
      page: 1,
      limit: 6,                            // ✅ no 1
      category_id: Number(parentId),
      subcategory_id: Number(subId),
      include_children: 0,
      sort: "relevance",
    });

    const items = Array.isArray(r?.items) ? r.items : [];
    let url = "";

    for (const it of items) {
      const u = thumbFromProduct(it);
      if (u) {
        url = u;
        break;
      }
    }

    if (url) repImg[k] = url;
    return url || "";
  } catch {
    return "";
  } finally {
    repLoading[k] = false;
  }
}

/* limitador simple de concurrencia */
async function mapLimit(arr, limit, fn) {
  const res = [];
  let i = 0;
  const workers = new Array(Math.max(1, limit)).fill(0).map(async () => {
    while (i < arr.length) {
      const idx = i++;
      res[idx] = await fn(arr[idx], idx);
    }
  });
  await Promise.all(workers);
  return res;
}

/* ✅ icon por subcat (cache) */
function iconForSub(s) {
  const k = cacheKey(activeParentId.value, s?.id);
  return repImg[k] || "";
}

function onIconErr(s) {
  const k = cacheKey(activeParentId.value, s?.id);
  if (repImg[k]) repImg[k] = "";
}

/* =========================
   Fetch parents/children
========================= */
async function fetchParents() {
  loadingParents.value = true;
  err.value = "";
  try {
    const all = await getPublicCategoriesAll();
    catsAll.value = Array.isArray(all) ? all : [];

    const tops = catsAll.value.filter(isTopLevel);

    parents.value = tops
      .map((c) => ({ id: Number(c.id), name: String(c.name || "").trim(), _raw: c }))
      .filter((x) => x.id && x.name)
      .sort((a, b) => a.name.localeCompare(b.name, "es"));

    const tech =
      parents.value.find((p) => norm(p.name) === "tecnologia") ||
      parents.value.find((p) => norm(p.name).includes("tecnolog")) ||
      null;

    activeParentId.value = tech?.id || parents.value?.[0]?.id || null;
  } catch {
    err.value = "No se pudieron cargar las categorías.";
    parents.value = [];
    activeParentId.value = null;
  } finally {
    loadingParents.value = false;
  }
}

const PREFETCH_MAX = 18;
const PREFETCH_CONCURRENCY = 4;

async function fetchChildren(parentId) {
  loadingChildren.value = true;
  err.value = "";
  children.value = [];

  try {
    const kids = await getPublicCategoryChildren(Number(parentId));
    const arr = Array.isArray(kids) ? kids : [];

    children.value = arr
      .map((c) => ({
        id: Number(c.id),
        name: String(c.name || "").trim(),
        _raw: c,
      }))
      .filter((x) => x.id && x.name);

    // ✅ precarga fotos (solo primeras N)
    const slice = children.value.slice(0, PREFETCH_MAX);
    await mapLimit(slice, PREFETCH_CONCURRENCY, async (s) => fetchRepImageForSub(parentId, s.id));
  } catch {
    err.value = "No se pudieron cargar las subcategorías.";
    children.value = [];
  } finally {
    loadingChildren.value = false;
  }
}

function selectParent(id) {
  const pid = Number(id);
  if (!pid || pid === Number(activeParentId.value)) return;
  activeParentId.value = pid;
  fetchChildren(pid);
}

function openParentAll() {
  const pid = Number(activeParentId.value);
  if (!pid) return;

  router.push({
    name: "shopCategory",
    params: { id: String(pid) },
    query: { page: "1", branch_id: String(branchId.value) },
  });
}

function openSubcategory(subId) {
  const pid = Number(activeParentId.value);
  const sid = Number(subId);
  if (!pid || !sid) return;

  router.push({
    name: "shopCategory",
    params: { id: String(pid) },
    query: { sub: String(sid), page: "1", branch_id: String(branchId.value) },
  });
}

function goBack() {
  try {
    if (window.history.length > 1) window.history.back();
    else router.push({ name: "shopHome" });
  } catch {
    router.push({ name: "shopHome" });
  }
}

const activeParent = computed(() => parents.value.find((p) => Number(p.id) === Number(activeParentId.value)) || null);

onMounted(async () => {
  await fetchParents();
  if (activeParentId.value) await fetchChildren(activeParentId.value);
});
</script>

<style scoped>
.mlc {
  background: #f5f5f5;
  min-height: calc(100vh - 0px);
}

/* topbar */
.mlc-topbar {
  position: sticky;
  top: 0;
  z-index: 5;
  height: 46px;
  background: #ffffff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  display: grid;
  grid-template-columns: 46px 1fr 46px;
  align-items: center;
}

.mlc-back {
  width: 46px;
  height: 46px;
  border: 0;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #0e2134;
  cursor: pointer;
}

.mlc-title {
  font-weight: 800;
  color: #0e2134;
  font-size: 14px;
  letter-spacing: -0.01em;
}

.mlc-topbar-spacer {
  width: 46px;
}

.mlc-alert {
  margin: 12px 12px 0;
}

/* body */
.mlc-body {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 0;
  min-height: calc(100vh - 46px);
}

/* left */
.mlc-left {
  background: #ffffff;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.mlc-left-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  font-size: 12px;
  opacity: 0.8;
}

.mlc-left-item {
  width: 100%;
  border: 0;
  background: transparent;
  text-align: left;
  padding: 10px 10px;
  cursor: pointer;
  border-left: 3px solid transparent;
  color: #0e2134;
  font-weight: 700;
  font-size: 11.5px;
  line-height: 1.15;
  letter-spacing: -0.01em;
}

.mlc-left-item.active {
  background: #f3f7ff;
  border-left-color: rgb(var(--v-theme-primary));
  font-weight: 800;
}

.mlc-left-text {
  display: block;
  overflow-wrap: anywhere;
}

/* right */
.mlc-right {
  background: #ffffff;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.mlc-right-head {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #ffffff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.mlc-right-title {
  font-weight: 800;
  color: #0e2134;
  font-size: 13px;
}

.mlc-seeall {
  border: 0;
  background: transparent;
  color: rgb(var(--v-theme-primary));
  font-weight: 800;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.mlc-right-loading {
  min-height: 220px;
  display: grid;
  place-items: center;
  gap: 10px;
  padding: 20px;
}

/* grid */
.mlc-grid {
  padding: 14px 12px 16px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.mlc-card {
  border: 0;
  background: transparent;
  padding: 0;
  text-align: center;
  cursor: pointer;
}

/* icon */
.mlc-icon {
  width: 58px;
  height: 58px;
  border-radius: 999px;
  margin: 0 auto;
  background: #f4f6f8;
  border: 1px solid rgba(0, 0, 0, 0.08);
  display: grid;
  place-items: center;
  overflow: hidden;
  position: relative;
}

.mlc-icon-ph {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #0e2134;
  font-weight: 800;
  font-size: 13px;
}
.mlc-icon-ph.off {
  opacity: 0;
}

.mlc-icon img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center;
}

.mlc-name {
  margin-top: 8px;
  font-size: 11px;
  line-height: 1.1;
  color: #0e2134;
  font-weight: 650;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.mlc-empty {
  grid-column: 1 / -1;
  padding: 18px 6px;
  text-align: center;
  font-size: 12px;
  opacity: 0.7;
}

@media (max-width: 600px) {
  .mlc-body {
    grid-template-columns: 120px 1fr;
  }
  .mlc-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    padding-bottom: 92px;
  }
  .mlc-icon {
    width: 54px;
    height: 54px;
  }
  .mlc-left-item {
    padding: 10px 8px;
    font-size: 11.5px;
  }
}
</style>
