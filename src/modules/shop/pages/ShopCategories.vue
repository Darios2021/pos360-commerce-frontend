<template>
  <div class="mlc" data-page="shop-categories">
    <div class="mlc-topbar">
      <button class="mlc-back" type="button" @click="goBack" aria-label="Volver">
        <v-icon size="20">mdi-arrow-left</v-icon>
      </button>

      <!-- Buscador interno estilo ML — filtra rubros y subrubros visibles -->
      <label class="mlc-search">
        <v-icon size="18" class="mlc-search-icon">mdi-magnify</v-icon>
        <input
          v-model="searchTerm"
          type="search"
          inputmode="search"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
          placeholder="buscar categoría..."
        />
        <button
          v-if="searchTerm"
          type="button"
          class="mlc-search-clear"
          aria-label="Limpiar"
          @click="searchTerm = ''"
        >
          <v-icon size="14">mdi-close</v-icon>
        </button>
      </label>
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
          v-for="c in filteredParents"
          :key="c.id"
          type="button"
          class="mlc-left-item"
          :class="{ active: Number(activeParentId) === Number(c.id) }"
          @click="selectParent(c.id)"
          :title="c.name"
        >
          <span class="mlc-left-text">{{ shortLeftName(c.name) }}</span>
        </button>

        <div v-if="!loadingParents && !filteredParents.length" class="mlc-left-empty">
          Sin coincidencias
        </div>
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
            <v-icon size="14">mdi-chevron-right</v-icon>
          </button>
        </div>

        <div v-if="loadingChildren && !children.length && !previewProducts.length" class="mlc-right-loading">
          <v-progress-circular indeterminate size="22" />
          <div class="mlc-loading-text">Cargando…</div>
        </div>

        <template v-else>
          <!-- ── Listado de subrubros (si los hay) ── -->
          <div v-if="children.length" class="mlc-list">
            <button
              v-for="s in filteredChildren"
              :key="s.id"
              type="button"
              class="mlc-row"
              @click="openSubcategory(s.id)"
              :title="s.name"
            >
              <div class="mlc-row-media" :class="{ 'mlc-row-media--withImg': !!iconForSub(s) }">
                <img
                  v-if="iconForSub(s)"
                  :src="iconForSub(s)"
                  alt=""
                  loading="lazy"
                  @error="onIconErr(s)"
                />
                <span v-else class="mlc-icon-ph">
                  {{ initials(s.name) }}
                </span>
              </div>

              <div class="mlc-row-body">
                <div class="mlc-row-name">{{ s.name }}</div>
              </div>

              <div class="mlc-row-arrow">
                <v-icon size="16">mdi-chevron-right</v-icon>
              </div>
            </button>

            <div v-if="!filteredChildren.length" class="mlc-empty">
              No hay subrubros con "{{ searchTerm }}".
            </div>
          </div>

          <!-- ── Productos destacados del rubro ── -->
          <!-- Se muestran SIEMPRE: como contenido principal cuando no hay
               subrubros, o como bloque "Destacados" al final cuando sí los hay. -->
          <div
            v-if="previewProducts.length || loadingProducts"
            class="mlc-products"
            :class="{ 'mlc-products--main': !children.length }"
          >
            <div v-if="children.length" class="mlc-products-head">
              <div class="mlc-right-eyebrow">Destacados</div>
              <div class="mlc-right-title">Más vendidos en {{ activeParent?.name }}</div>
            </div>

            <div v-if="loadingProducts && !previewProducts.length" class="mlc-products-skel">
              <div v-for="n in 6" :key="n" class="mlc-prod-card mlc-prod-card--skel" />
            </div>

            <div v-else class="mlc-products-grid">
              <button
                v-for="p in previewProducts"
                :key="p.id"
                type="button"
                class="mlc-prod-card"
                @click="openProduct(p.id)"
                :title="p.name"
              >
                <div class="mlc-prod-media">
                  <img
                    v-if="p.thumb"
                    :src="p.thumb"
                    :alt="p.name"
                    loading="lazy"
                  />
                  <div v-else class="mlc-prod-noimg">
                    <v-icon size="28">mdi-package-variant-closed</v-icon>
                  </div>
                  <span v-if="p.offPct > 0" class="mlc-prod-badge">{{ p.offPct }}% OFF</span>
                </div>
                <div class="mlc-prod-body">
                  <div class="mlc-prod-name">{{ p.name }}</div>
                  <div class="mlc-prod-price-row">
                    <span v-if="p.priceList && p.priceList > p.price" class="mlc-prod-price-old">
                      ${{ fmtMoney(p.priceList) }}
                    </span>
                    <span class="mlc-prod-price">${{ fmtMoney(p.price) }}</span>
                  </div>
                </div>
              </button>
            </div>

            <button
              v-if="previewProducts.length && activeParentId"
              type="button"
              class="mlc-products-more"
              @click="openParentAll"
            >
              Ver todos los productos
              <v-icon size="14">mdi-arrow-right</v-icon>
            </button>
          </div>

          <!-- ── Empty real: ni subrubros ni productos ── -->
          <div
            v-else-if="!children.length && !loadingChildren && !loadingProducts"
            class="mlc-empty"
          >
            <v-icon size="36" color="medium-emphasis">mdi-package-variant-closed</v-icon>
            <div class="mlc-empty-title">Sin productos disponibles</div>
            <div class="mlc-empty-sub">
              Probá con otra categoría o usá el buscador.
            </div>
          </div>
        </template>
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
const loadingProducts = ref(false);
const err = ref("");

const catsAll = ref([]);
const parents = ref([]);
const activeParentId = ref(null);
const children = ref([]);

// Preview de productos del rubro elegido. Se carga en paralelo a los
// children y se muestra:
//   - como bloque secundario debajo de la lista de subrubros, o
//   - como contenido principal cuando el rubro no tiene subrubros
//     (en lugar del estado vacío).
const previewProducts = ref([]);

// Buscador interno (filtra rubros y subrubros visibles).
const searchTerm = ref("");

const filteredParents = computed(() => {
  const q = norm(searchTerm.value);
  if (!q) return parents.value;
  return parents.value.filter((c) => norm(c?.name).includes(q));
});

const filteredChildren = computed(() => {
  const q = norm(searchTerm.value);
  if (!q) return children.value;
  return children.value.filter((c) => norm(c?.name).includes(q));
});

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

async function fetchPreviewProducts(parentId) {
  loadingProducts.value = true;
  try {
    const r = await getCatalog({
      branch_id: branchId.value,
      page: 1,
      limit: 8,
      category_id: Number(parentId),
      include_children: 1,
      sort: "relevance",
    });
    const items = Array.isArray(r?.items) ? r.items : [];
    previewProducts.value = items
      .map((p) => ({
        id: Number(p?.id || 0),
        name: String(p?.name || p?.title || "").trim(),
        price: priceOf(p),
        priceList: priceListOf(p),
        offPct: offPctOf(p),
        thumb: thumbFromProduct(p),
      }))
      .filter((p) => p.id);
  } catch {
    previewProducts.value = [];
  } finally {
    loadingProducts.value = false;
  }
}

function priceOf(p) {
  const cands = [
    p?.price,
    p?.price_final,
    p?.final_price,
    p?.price_offer,
    p?.price_now,
    p?.price_list,
  ];
  for (const v of cands) {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
}
function priceListOf(p) {
  const cands = [p?.price_list, p?.original_price, p?.price_old];
  for (const v of cands) {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
}
function offPctOf(p) {
  const final = priceOf(p);
  const list = priceListOf(p);
  if (!list || !final || list <= final) return 0;
  return Math.round(((list - final) / list) * 100);
}
function fmtMoney(n) {
  return new Intl.NumberFormat("es-AR").format(Math.round(Number(n || 0)));
}

function openProduct(productId) {
  if (!productId) return;
  router.push({
    name: "shopProduct",
    params: { id: String(productId) },
    query: { branch_id: String(branchId.value) },
  });
}

function selectParent(id) {
  const pid = Number(id);
  if (!pid || pid === Number(activeParentId.value)) return;
  activeParentId.value = pid;
  // Children y productos en paralelo — la vista nunca queda vacía.
  fetchChildren(pid);
  fetchPreviewProducts(pid);
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
  if (activeParentId.value) {
    fetchChildren(activeParentId.value);
    fetchPreviewProducts(activeParentId.value);
  }
});
</script>
<style scoped>

.mlc{
min-height:100vh;
background:#f7f8fa;
color:#142136;
}

/* TOPBAR — botón volver + buscador estilo ML */

.mlc-topbar{
position:sticky;
top:0;
z-index:8;
min-height:52px;
padding:8px 10px;
background:#ffffff;
border-bottom:1px solid rgba(0,0,0,0.06);
display:flex;
align-items:center;
gap:8px;
}

.mlc-back{
width:36px;
height:36px;
border:0;
background:transparent;
display:flex;
align-items:center;
justify-content:center;
cursor:pointer;
flex-shrink:0;
border-radius:50%;
transition:background .15s ease;
}
.mlc-back:active{
background:rgba(0,0,0,0.06);
}

/* Buscador estilo ML — pill-shape, fondo gris claro */
.mlc-search{
flex:1 1 auto;
display:flex;
align-items:center;
gap:6px;
padding:6px 12px;
height:36px;
background:#eef0f3;
border-radius:999px;
border:1px solid transparent;
transition:background .15s ease, border-color .15s ease;
min-width:0;
}
.mlc-search:focus-within{
background:#fff;
border-color:#3483fa;
box-shadow:0 0 0 2px rgba(52,131,250,0.18);
}
.mlc-search-icon{
color:#7a8795;
flex-shrink:0;
}
.mlc-search input{
flex:1 1 auto;
border:0;
outline:0;
background:transparent;
font:inherit;
font-size:13px;
font-weight:500;
color:#1c2736;
text-transform:lowercase;
min-width:0;
padding:0;
}
.mlc-search input::placeholder{
color:#8a96a3;
font-size:12.5px;
font-weight:500;
text-transform:lowercase;
letter-spacing:.1px;
}
.mlc-search input::-webkit-search-cancel-button{
display:none;
}
.mlc-search-clear{
border:0;
background:transparent;
width:22px;
height:22px;
display:flex;
align-items:center;
justify-content:center;
border-radius:50%;
color:#7a8795;
cursor:pointer;
flex-shrink:0;
}
.mlc-search-clear:active{
background:rgba(0,0,0,0.06);
}

/* LAYOUT */

.mlc-body{
display:grid;
grid-template-columns:118px 1fr;
min-height:calc(100vh - 52px);
}

/* LEFT PANEL — lista de rubros */

.mlc-left{
background:#f4f6f8;
border-right:1px solid rgba(0,0,0,0.05);
overflow-y:auto;
padding:6px 0 100px;
}

.mlc-left-item{
position:relative;
width:100%;
border:0;
background:transparent;
text-align:left;
padding:10px 8px 10px 14px;
cursor:pointer;

font-size:11px;
line-height:1.25;
color:#3a4858;
font-weight:500;

min-height:42px;

display:flex;
align-items:center;

transition:background .15s ease, color .15s ease;
}

.mlc-left-item:hover{
background:#eaeef2;
}

/* Active estilo ML: fondo blanco "elegido", barra azul lateral */
.mlc-left-item.active{
background:#ffffff;
color:#1d2a3a;
font-weight:700;
}
.mlc-left-item.active::before{
content:"";
position:absolute;
left:0;
top:6px;
bottom:6px;
width:3px;
border-radius:0 3px 3px 0;
background:#3483fa;
}

.mlc-left-text{
display:block;
white-space:normal;
word-break:break-word;
}

.mlc-left-empty{
padding:14px 10px;
font-size:11px;
color:#8a96a3;
text-align:center;
}

/* RIGHT PANEL — subrubros del rubro elegido */

.mlc-right{
overflow-y:auto;
background:#ffffff;
padding:0 12px 100px;
}

/* HEADER del panel derecho */

.mlc-right-head{
position:sticky;
top:0;
z-index:3;

background:#ffffff;
border-bottom:1px solid rgba(0,0,0,0.05);

padding:12px 4px 10px;

display:flex;
align-items:center;
justify-content:space-between;
gap:8px;
}

.mlc-right-eyebrow{
font-size:9.5px;
text-transform:uppercase;
color:#8a96a3;
letter-spacing:.08em;
font-weight:700;
}

.mlc-right-title{
font-size:14px;
font-weight:700;
color:#1c2736;
margin-top:2px;
letter-spacing:-0.01em;
}

.mlc-seeall{
border:0;
background:transparent;
font-size:12px;
color:#3483fa;
cursor:pointer;
font-weight:600;

display:flex;
align-items:center;
gap:2px;
padding:6px 8px;
border-radius:8px;
}
.mlc-seeall:active{
background:rgba(52,131,250,0.08);
}

/* LIST */

.mlc-list{
display:flex;
flex-direction:column;
padding:4px 0 12px;
}

/* ROW — card de subrubro */

.mlc-row{
width:100%;
border:0;
background:#ffffff;

border-bottom:1px solid rgba(0,0,0,0.05);

padding:12px 4px;

display:grid;
grid-template-columns:48px 1fr 18px;
align-items:center;
gap:14px;

cursor:pointer;

transition:background .15s ease;
}

.mlc-row:hover{
background:#fafbfc;
}
.mlc-row:active{
background:#f4f6f8;
}

.mlc-row:last-child{
border-bottom:none;
}

/* MEDIA — icono cuadrado tipo ML categoría */

.mlc-row-media{
width:48px;
height:48px;

border-radius:10px;

background:#f4f6f8;

overflow:hidden;

display:flex;
align-items:center;
justify-content:center;

flex-shrink:0;
}

/* Cuando hay imagen real, sin fondo gris ni borde — la imagen manda */
.mlc-row-media--withImg{
background:#ffffff;
border:1px solid rgba(0,0,0,0.06);
}

.mlc-row-media img{
width:100%;
height:100%;
object-fit:cover;
display:block;
}

.mlc-icon-ph{
font-size:13px;
font-weight:800;
color:#3483fa;
letter-spacing:0.5px;
}

/* NAME */

.mlc-row-body{
min-width:0;
}

.mlc-row-name{
font-size:13.5px;
font-weight:600;
color:#1d2a3a;
letter-spacing:-0.01em;
line-height:1.3;
overflow:hidden;
text-overflow:ellipsis;
display:-webkit-box;
-webkit-line-clamp:2;
-webkit-box-orient:vertical;
}

/* ARROW */

.mlc-row-arrow{
display:flex;
justify-content:flex-end;
color:#b3bcc6;
}

/* EMPTY */

.mlc-empty{
padding:24px 18px;
text-align:center;
font-size:12.5px;
color:#7a8795;

display:flex;
flex-direction:column;
align-items:center;
gap:6px;
}
.mlc-empty-title{
font-size:13px;
font-weight:700;
color:#3a4858;
margin-top:4px;
}
.mlc-empty-sub{
font-size:11.5px;
color:#7a8795;
}

/* PRODUCTOS DESTACADOS — grid de cards mini */

.mlc-products{
padding:8px 0 24px;
}
.mlc-products--main{
padding-top:14px;
}
.mlc-products-head{
padding:14px 4px 8px;
border-bottom:1px solid rgba(0,0,0,0.04);
margin-bottom:10px;
}

.mlc-products-grid{
display:grid;
grid-template-columns:repeat(2, 1fr);
gap:10px;
}

.mlc-prod-card{
display:flex;
flex-direction:column;
text-align:left;
border:0;
padding:0;
border-radius:10px;
background:#ffffff;
border:1px solid rgba(0,0,0,0.06);
overflow:hidden;
cursor:pointer;
transition:border-color .14s ease, box-shadow .14s ease, transform .14s ease;
}
.mlc-prod-card:hover{
border-color:rgba(52,131,250,0.32);
box-shadow:0 6px 14px rgba(15,23,42,0.08);
transform:translateY(-1px);
}
.mlc-prod-card:active{
transform:translateY(0) scale(0.99);
}

.mlc-prod-media{
position:relative;
width:100%;
aspect-ratio:1 / 1;
background:#f7f8fa;
overflow:hidden;
}
.mlc-prod-media img{
position:absolute;
inset:0;
width:100%;
height:100%;
object-fit:contain;
padding:8px;
box-sizing:border-box;
}
.mlc-prod-noimg{
position:absolute;
inset:0;
display:grid;
place-items:center;
color:#b3bcc6;
}
.mlc-prod-badge{
position:absolute;
top:6px;
left:6px;
padding:2px 6px;
border-radius:4px;
background:#16a34a;
color:#ffffff;
font-size:9.5px;
font-weight:800;
letter-spacing:0.4px;
line-height:1.2;
}

.mlc-prod-body{
padding:8px 9px 10px;
display:flex;
flex-direction:column;
gap:4px;
min-height:64px;
}
.mlc-prod-name{
font-size:11.5px;
font-weight:600;
color:#1d2a3a;
line-height:1.3;
display:-webkit-box;
-webkit-line-clamp:2;
-webkit-box-orient:vertical;
overflow:hidden;
}
.mlc-prod-price-row{
display:flex;
flex-direction:column;
gap:1px;
margin-top:auto;
}
.mlc-prod-price-old{
font-size:10.5px;
color:#8a96a3;
text-decoration:line-through;
line-height:1;
}
.mlc-prod-price{
font-size:14px;
font-weight:800;
color:#1d2a3a;
letter-spacing:-0.2px;
line-height:1.1;
}

/* Skeleton */
.mlc-products-skel{
display:grid;
grid-template-columns:repeat(2, 1fr);
gap:10px;
}
.mlc-prod-card--skel{
height:200px;
background:linear-gradient(90deg,#eef0f3 0%,#f7f8fa 50%,#eef0f3 100%);
background-size:200% 100%;
border-radius:10px;
animation:mlcShimmer 1.4s ease infinite;
border:0;
}
@keyframes mlcShimmer{
0%{ background-position:0% 0%; }
100%{ background-position:-200% 0%; }
}

/* CTA "Ver todos los productos" */
.mlc-products-more{
margin:14px auto 0;
display:flex;
align-items:center;
justify-content:center;
gap:5px;
border:0;
background:transparent;
font-size:12.5px;
font-weight:700;
color:#3483fa;
padding:10px 14px;
border-radius:8px;
cursor:pointer;
width:100%;
text-align:center;
}
.mlc-products-more:active{
background:rgba(52,131,250,0.08);
}

/* MOBILE — pequeñas correcciones de densidad */

@media(max-width:600px){

.mlc-body{
grid-template-columns:108px 1fr;
}

.mlc-left-item{
font-size:11px;
padding:10px 8px 10px 12px;
min-height:40px;
}

.mlc-right{
padding:0 10px 100px;
}

.mlc-right-title{
font-size:13px;
}

.mlc-row{
padding:11px 2px;
grid-template-columns:44px 1fr 16px;
gap:12px;
}

.mlc-row-media{
width:44px;
height:44px;
border-radius:9px;
}

.mlc-row-name{
font-size:13px;
}

}

@media(max-width:380px){
.mlc-body{
grid-template-columns:96px 1fr;
}
.mlc-left-item{
font-size:10.5px;
padding:9px 6px 9px 10px;
}
.mlc-row{
grid-template-columns:40px 1fr 16px;
gap:10px;
}
.mlc-row-media{
width:40px;
height:40px;
}
.mlc-row-name{
font-size:12.5px;
}

/* En pantallas muy chicas, los productos quedan más cómodos a 1 col */
.mlc-products-grid,
.mlc-products-skel{
grid-template-columns:repeat(2, 1fr);
gap:8px;
}
.mlc-prod-name{
font-size:11px;
}
.mlc-prod-price{
font-size:13.5px;
}
}

</style>