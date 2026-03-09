<template>
  <div class="mlc" data-page="shop-categories">
    <div class="mlc-topbar">
      <button class="mlc-back" type="button" @click="goBack" aria-label="Volver">
        <v-icon size="22">mdi-arrow-left</v-icon>
      </button>

      <div class="mlc-title-wrap">
        <div class="mlc-title">Categorías</div>
        <div class="mlc-subtitle">Explorá por rubro</div>
      </div>

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
          <div class="mlc-right-head-main">
            <div class="mlc-right-kicker">Rubro seleccionado</div>
            <div class="mlc-right-title">{{ activeParent?.name || "Categorías" }}</div>
          </div>

          <button
            v-if="activeParentId"
            type="button"
            class="mlc-seeall"
            @click="openParentAll()"
            aria-label="Ver todo"
          >
            <span>Ver todo</span>
            <v-icon size="17">mdi-chevron-right</v-icon>
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
            <div class="mlc-card-inner">
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
            </div>
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
const repImg = reactive({});
const repLoading = reactive({});

async function fetchRepImageForSub(parentId, subId) {
  const k = cacheKey(parentId, subId);

  if (repImg[k]) return repImg[k];
  if (repLoading[k]) return "";

  repLoading[k] = true;
  try {
    const r = await getCatalog({
      branch_id: branchId.value,
      page: 1,
      limit: 6,
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
  min-height: 100vh;
  background:
    linear-gradient(180deg, #f8fafc 0%, #f3f6fb 100%);
  color: #0e2134;
}

/* topbar */
.mlc-topbar {
  position: sticky;
  top: 0;
  z-index: 8;
  min-height: 58px;
  padding: 0 6px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  display: grid;
  grid-template-columns: 46px 1fr 46px;
  align-items: center;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
}

.mlc-back {
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #0e2134;
  cursor: pointer;
  transition: background 0.18s ease, transform 0.18s ease;
}

.mlc-back:active {
  transform: scale(0.96);
  background: rgba(15, 23, 42, 0.06);
}

.mlc-title-wrap {
  min-width: 0;
}

.mlc-title {
  font-weight: 900;
  color: #0f172a;
  font-size: 17px;
  line-height: 1.05;
  letter-spacing: -0.03em;
}

.mlc-subtitle {
  margin-top: 2px;
  font-size: 11.5px;
  color: #64748b;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.mlc-topbar-spacer {
  width: 40px;
}

.mlc-alert {
  margin: 12px 12px 0;
  border-radius: 14px;
}

/* body */
.mlc-body {
  display: grid;
  grid-template-columns: 132px 1fr;
  gap: 0;
  min-height: calc(100vh - 58px);
}

/* left */
.mlc-left {
  background: rgba(255, 255, 255, 0.8);
  border-right: 1px solid rgba(15, 23, 42, 0.06);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 8px 0 96px;
}

.mlc-left-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 12px;
  font-size: 12px;
  color: #475569;
}

.mlc-left-item {
  position: relative;
  width: 100%;
  border: 0;
  background: transparent;
  text-align: left;
  padding: 12px 12px 12px 14px;
  cursor: pointer;
  color: #0f172a;
  font-weight: 800;
  font-size: 12.2px;
  line-height: 1.18;
  letter-spacing: -0.015em;
  transition: background 0.18s ease, color 0.18s ease;
}

.mlc-left-item::before {
  content: "";
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  border-radius: 999px;
  background: transparent;
  transition: background 0.18s ease;
}

.mlc-left-item.active {
  background: linear-gradient(180deg, #eef4ff 0%, #e8f0ff 100%);
  color: #0a3d7a;
}

.mlc-left-item.active::before {
  background: rgb(var(--v-theme-primary));
}

.mlc-left-text {
  display: block;
  overflow-wrap: anywhere;
}

/* right */
.mlc-right {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 96px;
}

.mlc-right-head {
  position: sticky;
  top: 0;
  z-index: 3;
  background: rgba(248, 250, 252, 0.96);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(15, 23, 42, 0.05);
  padding: 12px 12px 10px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px;
}

.mlc-right-head-main {
  min-width: 0;
}

.mlc-right-kicker {
  font-size: 10.5px;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
  font-weight: 800;
  margin-bottom: 5px;
}

.mlc-right-title {
  font-weight: 900;
  color: #0f172a;
  font-size: 16px;
  line-height: 1.05;
  letter-spacing: -0.03em;
  word-break: break-word;
}

.mlc-seeall {
  border: 0;
  background: #ffffff;
  color: rgb(var(--v-theme-primary));
  font-weight: 800;
  font-size: 12px;
  min-height: 34px;
  padding: 0 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
}

.mlc-right-loading {
  min-height: 240px;
  display: grid;
  place-items: center;
  gap: 10px;
  padding: 20px;
}

/* grid */
.mlc-grid {
  padding: 14px 12px 18px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.mlc-card {
  border: 0;
  background: transparent;
  padding: 0;
  text-align: center;
  cursor: pointer;
}

.mlc-card-inner {
  height: 100%;
  min-height: 124px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(15, 23, 42, 0.05);
  box-shadow:
    0 8px 22px rgba(15, 23, 42, 0.05),
    0 2px 6px rgba(15, 23, 42, 0.04);
  padding: 14px 10px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.mlc-card:active .mlc-card-inner {
  transform: scale(0.98);
  box-shadow:
    0 5px 14px rgba(15, 23, 42, 0.05),
    0 1px 3px rgba(15, 23, 42, 0.04);
}

/* icon */
.mlc-icon {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  margin: 0 auto;
  background: linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%);
  border: 1px solid rgba(15, 23, 42, 0.06);
  display: grid;
  place-items: center;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.mlc-icon-ph {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #0f172a;
  font-weight: 900;
  font-size: 14px;
  letter-spacing: -0.02em;
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
  margin-top: 10px;
  font-size: 12.2px;
  line-height: 1.2;
  color: #0f172a;
  font-weight: 800;
  letter-spacing: -0.015em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  min-height: 29px;
}

.mlc-empty {
  grid-column: 1 / -1;
  padding: 28px 12px;
  text-align: center;
  font-size: 12.5px;
  color: #64748b;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px dashed rgba(15, 23, 42, 0.12);
}

@media (max-width: 600px) {
  .mlc-body {
    grid-template-columns: 126px 1fr;
  }

  .mlc-left-item {
    font-size: 12px;
    padding: 12px 10px 12px 14px;
  }

  .mlc-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .mlc-card-inner {
    min-height: 118px;
    padding: 13px 9px 11px;
  }

  .mlc-icon {
    width: 60px;
    height: 60px;
    border-radius: 16px;
  }
}

@media (max-width: 390px) {
  .mlc-body {
    grid-template-columns: 118px 1fr;
  }

  .mlc-grid {
    gap: 10px;
    padding: 12px 10px 18px;
  }

  .mlc-right-head {
    padding: 12px 10px 10px;
  }

  .mlc-seeall {
    font-size: 11.5px;
    padding: 0 9px;
  }

  .mlc-name {
    font-size: 11.7px;
  }
}
</style>