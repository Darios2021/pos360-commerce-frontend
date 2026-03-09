<template>
  <div class="mlc" data-page="shop-categories">
    <div class="mlc-topbar">
      <button class="mlc-back" type="button" @click="goBack" aria-label="Volver">
        <v-icon size="20">mdi-arrow-left</v-icon>
      </button>

      <div class="mlc-title-wrap">
        <div class="mlc-title">Categorías</div>
      </div>

      <div class="mlc-topbar-spacer" />
    </div>

    <v-alert v-if="err" type="error" variant="tonal" class="mlc-alert">
      {{ err }}
    </v-alert>

    <div class="mlc-body">
      <aside class="mlc-left" aria-label="Listado de categorías">
        <div v-if="loadingParents" class="mlc-left-loading">
          <v-progress-circular indeterminate size="16" />
          <span>Cargando…</span>
        </div>

        <button
          v-for="c in parents"
          :key="c.id"
          type="button"
          class="mlc-left-item"
          :class="{ active: Number(activeParentId) === Number(c.id) }"
          @click="selectParent(c.id)"
          :title="c.name"
        >
          <span class="mlc-left-text">{{ shortLeftName(c.name) }}</span>
        </button>
      </aside>

      <main class="mlc-right" aria-label="Subcategorías">
        <div class="mlc-right-head">
          <div class="mlc-right-head-main">
            <div class="mlc-right-eyebrow">Categoría</div>
            <div class="mlc-right-title">{{ activeParent?.name || "Categorías" }}</div>
          </div>

          <button
            v-if="activeParentId"
            type="button"
            class="mlc-seeall"
            @click="openParentAll()"
            aria-label="Ver todo"
          >
            Ver todo
            <v-icon size="15">mdi-chevron-right</v-icon>
          </button>
        </div>

        <div v-if="loadingChildren" class="mlc-right-loading">
          <v-progress-circular indeterminate size="22" />
          <div class="mlc-loading-text">Cargando categorías…</div>
        </div>

        <div v-else class="mlc-list">
          <button
            v-for="s in children"
            :key="s.id"
            type="button"
            class="mlc-row"
            @click="openSubcategory(s.id)"
            :title="s.name"
          >
            <div class="mlc-row-media">
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

            <div class="mlc-row-body">
              <div class="mlc-row-name">{{ s.name }}</div>
            </div>

            <div class="mlc-row-arrow">
              <v-icon size="16">mdi-chevron-right</v-icon>
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

/* ✅ abreviaciones suaves solo para panel izquierdo */
function shortLeftName(name) {
  const s = String(name || "").trim();
  const n = norm(s);

  const map = {
    "seguridad electronica": "SEG. ELECTRÓNICA",
    "hogar / electro": "HOGAR / ELECTRO",
    "salud / belleza": "SALUD / BELLEZA",
    "entretenimiento": "ENTRETEN.",
    "computacion": "COMPUTACIÓN",
    "informatica": "INFORMÁTICA",
  };

  return map[n] || s.toUpperCase();
}

const branchId = computed(() => {
  const v = route.query.branch_id ?? route.query.branchId ?? 3;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 3;
});

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

const activeParent = computed(
  () => parents.value.find((p) => Number(p.id) === Number(activeParentId.value)) || null
);

onMounted(async () => {
  await fetchParents();
  if (activeParentId.value) await fetchChildren(activeParentId.value);
});
</script>
<style scoped>

.mlc{
min-height:100vh;
background:#f7f8fa;
color:#142136;
}

/* TOPBAR */

.mlc-topbar{
position:sticky;
top:0;
z-index:8;
min-height:48px;
padding:0 8px;
background:#ffffff;
border-bottom:1px solid rgba(0,0,0,0.06);
display:grid;
grid-template-columns:36px 1fr 36px;
align-items:center;
}

.mlc-back{
width:32px;
height:32px;
border:0;
background:transparent;
display:flex;
align-items:center;
justify-content:center;
cursor:pointer;
}

.mlc-title{
font-size:13px;
font-weight:600;
color:#1f2b3a;
}

.mlc-topbar-spacer{
width:32px;
}

/* LAYOUT */

.mlc-body{
display:grid;
grid-template-columns:104px 1fr;
min-height:calc(100vh - 48px);
}

/* LEFT PANEL */

.mlc-left{
background:#fbfcfd;
border-right:1px solid rgba(0,0,0,0.05);
overflow-y:auto;
padding:4px 0;
}

.mlc-left-item{
width:100%;
border:0;
background:transparent;
text-align:left;
padding:8px 8px 8px 10px;
cursor:pointer;

font-size:10px;
line-height:1.15;
color:#2a3646;
font-weight:500;

min-height:36px;

display:flex;
align-items:center;

transition:background .15s ease;
}

.mlc-left-item:hover{
background:#f2f5f8;
}

.mlc-left-item.active{
background:#eaf2fb;
color:#0f4a8a;
font-weight:600;
}

.mlc-left-text{
display:block;
white-space:normal;
word-break:break-word;
}

/* RIGHT PANEL */

.mlc-right{
overflow-y:auto;
background:#ffffff;
padding:0 10px; /* 👈 aire lateral */
}

/* HEADER */

.mlc-right-head{
position:sticky;
top:0;
z-index:3;

background:#ffffff;
border-bottom:1px solid rgba(0,0,0,0.05);

padding:10px 2px;

display:flex;
align-items:center;
justify-content:space-between;
}

.mlc-right-eyebrow{
font-size:9px;
text-transform:uppercase;
color:#7a8795;
letter-spacing:.05em;
}

.mlc-right-title{
font-size:12px;
font-weight:600;
color:#1c2736;
margin-top:2px;
}

.mlc-seeall{
border:0;
background:transparent;
font-size:11px;
color:rgb(var(--v-theme-primary));
cursor:pointer;

display:flex;
align-items:center;
gap:2px;
}

/* LIST */

.mlc-list{
display:flex;
flex-direction:column;
padding:4px 2px 12px;
}

/* ITEM */

.mlc-row{
width:100%;
border:0;
background:#ffffff;

border-bottom:1px solid rgba(0,0,0,0.06);

padding:10px 14px; /* 👈 aire lateral */

display:grid;
grid-template-columns:36px 1fr 18px;
align-items:center;
gap:12px;

cursor:pointer;

transition:background .15s ease;
}

.mlc-row:hover{
background:#fafbfc;
}

.mlc-row:first-child{
border-top:1px solid rgba(0,0,0,0.06);
}

/* ICON */

.mlc-row-media{
width:36px;
height:36px;

border-radius:8px;

background:#f5f7fa;

border:1px solid rgba(0,0,0,0.05);

overflow:hidden;

display:flex;
align-items:center;
justify-content:center;
}

.mlc-row-media img{
width:100%;
height:100%;
object-fit:cover;
}

.mlc-icon-ph{
font-size:10px;
font-weight:600;
color:#3c4958;
}

.mlc-icon-ph.off{
opacity:0;
}

/* NAME */

.mlc-row-name{
font-size:12px;
font-weight:600;
color:#1d2a3a;
letter-spacing:-0.01em;
}

/* ARROW */

.mlc-row-arrow{
display:flex;
justify-content:flex-end;
color:#8a96a3;
}

/* EMPTY */

.mlc-empty{
padding:18px;
text-align:center;
font-size:11px;
color:#7a8795;
}

/* MOBILE */

@media(max-width:600px){

.mlc-body{
grid-template-columns:100px 1fr;
}

.mlc-left-item{
font-size:9.5px;
min-height:34px;
}

.mlc-row{
padding:9px 12px;
grid-template-columns:34px 1fr 18px;
}

.mlc-row-media{
width:34px;
height:34px;
}

.mlc-row-name{
font-size:11.5px;
}

}

</style>