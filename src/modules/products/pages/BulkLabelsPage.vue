<!--
  BulkLabelsPage — Impresión masiva de etiquetas con código de barras.

  Flujo:
   1. El usuario busca productos y los agrega al lote.
   2. Cada producto tiene un selector de cantidad de copias.
   3. Elige tamaño global de etiqueta (small / medium / large).
   4. Activa/desactiva el logo del shop.
   5. Ve el preview en pantalla con el layout exacto de la hoja A4.
   6. Imprime → window.print() con CSS @page que oculta toda la UI y
      deja solo la hoja con las etiquetas.

  Layouts A4 (con márgenes de seguridad):
    small  (50×30 mm): 4 cols × 9 rows = 36 por hoja
    medium (70×50 mm): 3 cols × 5 rows = 15 por hoja
    large  (100×60 mm): 2 cols × 4 rows = 8 por hoja
-->
<template>
  <div class="blp">
    <AppPageHeader
      icon="mdi-printer-pos"
      title="Imprimir etiquetas"
      subtitle="Códigos de barras para góndola en hoja A4"
    >
      <v-btn
        variant="tonal"
        size="small"
        rounded="lg"
        prepend-icon="mdi-trash-can-outline"
        :disabled="!items.length"
        @click="clearAll"
      >
        Vaciar
      </v-btn>
      <v-btn
        color="primary"
        variant="flat"
        size="small"
        rounded="lg"
        prepend-icon="mdi-printer"
        :disabled="!totalCopies"
        @click="doPrint"
      >
        Imprimir ({{ totalCopies }})
      </v-btn>
    </AppPageHeader>

    <div class="blp-body">
      <!-- ── COLUMNA IZQ: configuración + selección ── -->
      <aside class="blp-side">
        <!-- Tamaño -->
        <section class="blp-card">
          <div class="blp-card__title">
            <v-icon size="16">mdi-resize</v-icon> Tamaño
          </div>
          <div class="blp-sizes">
            <button
              v-for="s in SIZES"
              :key="s.value"
              type="button"
              class="blp-size"
              :class="{ 'is-active': size === s.value }"
              @click="size = s.value"
            >
              <div class="blp-size__shape" :style="`--w:${s.previewW}px;--h:${s.previewH}px`" />
              <div class="blp-size__label">{{ s.label }}</div>
              <div class="blp-size__sub">{{ s.dim }}</div>
              <div class="blp-size__capacity">{{ s.cols * s.rows }} / hoja</div>
            </button>
          </div>
        </section>

        <!-- Sucursal: aparece impresa en cada etiqueta -->
        <section class="blp-card">
          <div class="blp-card__title">
            <v-icon size="16">mdi-storefront-outline</v-icon> Sucursal
          </div>
          <v-select
            v-model="branchId"
            :items="branchSelectItems"
            item-title="title"
            item-value="value"
            density="compact"
            variant="outlined"
            hide-details
            placeholder="Sin sucursal"
            :loading="branchesLoading"
          />
          <div class="blp-hint">
            <v-icon size="12">mdi-information-outline</v-icon>
            Se imprime en cada etiqueta junto al SKU.
          </div>
        </section>

        <!-- Selección de productos -->
        <section class="blp-card blp-card--grow">
          <div class="blp-card__title">
            <v-icon size="16">mdi-package-variant-closed</v-icon>
            Productos
            <span class="blp-card__count" v-if="items.length">{{ items.length }}</span>
          </div>

          <!-- Buscador para agregar productos -->
          <div class="blp-search">
            <v-text-field
              v-model="searchQ"
              placeholder="Buscar por nombre, SKU o código…"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              prepend-inner-icon="mdi-magnify"
              :loading="searching"
              @input="onSearch"
              @click:clear="searchResults = []"
            />
          </div>

          <!-- Resultados de búsqueda — quedan visibles para selección múltiple.
               Cada item ya agregado muestra el contador de copias y permite
               sumar más con un clic. -->
          <div v-if="searchQ && searchResults.length" class="blp-search-results">
            <div class="blp-search-results__head">
              <span>{{ searchResults.length }} resultado{{ searchResults.length === 1 ? '' : 's' }}</span>
              <button type="button" class="blp-search-results__clear" @click="clearSearch">
                Limpiar
              </button>
            </div>
            <button
              v-for="p in searchResults"
              :key="p.id"
              type="button"
              class="blp-result"
              :class="{ 'is-added': isAdded(p.id) }"
              @click="addProduct(p)"
            >
              <div class="blp-result__main">
                <div class="blp-result__name">{{ p.name }}</div>
                <div class="blp-result__sku" v-if="p.sku || p.barcode">
                  {{ [p.sku, p.barcode].filter(Boolean).join(' · ') }}
                </div>
              </div>
              <span v-if="isAdded(p.id)" class="blp-result__badge">
                ×{{ getCopies(p.id) }}
              </span>
              <v-icon size="18" :color="isAdded(p.id) ? 'success' : 'primary'">
                {{ isAdded(p.id) ? 'mdi-check-circle' : 'mdi-plus-circle' }}
              </v-icon>
            </button>
          </div>

          <!-- Lista de items seleccionados -->
          <div v-if="items.length" class="blp-list">
            <div v-for="(it, idx) in items" :key="it.product.id" class="blp-item">
              <div class="blp-item__main">
                <div class="blp-item__name">{{ it.product.name }}</div>
                <div class="blp-item__sub">
                  <span v-if="it.product.sku">{{ it.product.sku }}</span>
                  <span v-if="!it.product.barcode" class="blp-item__warn">
                    <v-icon size="11">mdi-alert</v-icon> sin código
                  </span>
                </div>
              </div>
              <div class="blp-item__qty">
                <button class="blp-qty-btn" :disabled="it.copies <= 1" @click="changeCopies(idx, -1)">
                  <v-icon size="14">mdi-minus</v-icon>
                </button>
                <input
                  type="number"
                  class="blp-qty-input"
                  v-model.number="it.copies"
                  min="1"
                  max="200"
                  @change="it.copies = Math.max(1, Math.min(200, Number(it.copies) || 1))"
                />
                <button class="blp-qty-btn" @click="changeCopies(idx, 1)">
                  <v-icon size="14">mdi-plus</v-icon>
                </button>
              </div>
              <button class="blp-item__del" @click="removeItem(idx)" aria-label="Quitar">
                <v-icon size="16">mdi-close</v-icon>
              </button>
            </div>
          </div>

          <div v-else class="blp-empty">
            <v-icon size="36" color="medium-emphasis">mdi-package-variant</v-icon>
            <div class="blp-empty__title">Lista vacía</div>
            <div class="blp-empty__sub">Buscá productos para agregar etiquetas a la hoja.</div>
          </div>

          <!-- Tip masivo: agregar productos del filtro actual -->
          <div class="blp-bulk-tip" v-if="items.length">
            <span>{{ totalCopies }} etiqueta{{ totalCopies === 1 ? '' : 's' }}</span>
            <span class="blp-bulk-tip__sep">·</span>
            <span>{{ pages.length }} hoja{{ pages.length === 1 ? '' : 's' }} A4</span>
          </div>
        </section>
      </aside>

      <!-- ── COLUMNA DER: preview de la hoja A4 ── -->
      <main class="blp-preview-wrap">
        <div class="blp-preview-meta" v-if="pages.length">
          <v-icon size="14">mdi-file-document-outline</v-icon>
          {{ pages.length }} hoja{{ pages.length === 1 ? '' : 's' }} A4 ·
          {{ totalCopies }} etiqueta{{ totalCopies === 1 ? '' : 's' }}
        </div>

        <div class="blp-sheets" id="blp-print-area">
          <div
            v-for="(page, pIdx) in pages"
            :key="`p-${pIdx}`"
            class="blp-sheet"
            :style="sheetStyle"
          >
            <div class="blp-grid" :style="gridStyle">
              <div
                v-for="(slot, sIdx) in page"
                :key="`s-${pIdx}-${sIdx}`"
                class="blp-cell"
              >
                <BarcodeLabel
                  v-if="slot"
                  :product="slot"
                  :size="size"
                  :logo-url="effectiveLogo"
                  :branch-name="selectedBranchName"
                />
              </div>
            </div>
          </div>
        </div>

        <div v-if="!pages.length" class="blp-preview-empty">
          <v-icon size="48" color="medium-emphasis">mdi-printer-off</v-icon>
          <div>Agregá productos para ver el preview.</div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useProductsStore } from "@/app/store/products.store";
import AppPageHeader from "@/app/components/AppPageHeader.vue";
import BarcodeLabel from "@/modules/products/components/label/BarcodeLabel.vue";
import { getShopBranding } from "@/modules/shop/service/admin.shopBranding.api";
import http from "@/app/api/http";

const products = useProductsStore();

/* ── Tamaños disponibles ────────────────────────────────────────── */
const SIZES = [
  {
    value: "small",
    label: "Chico",
    dim: "50 × 30 mm",
    cellW: 50, cellH: 30,
    cols: 4, rows: 9,
    gapX: 2, gapY: 2,
    previewW: 38, previewH: 24,
  },
  {
    value: "medium",
    label: "Mediano",
    dim: "70 × 50 mm",
    cellW: 70, cellH: 50,
    cols: 3, rows: 5,
    gapX: 0, gapY: 0,
    previewW: 50, previewH: 36,
  },
  {
    value: "large",
    label: "Grande",
    dim: "100 × 60 mm",
    cellW: 100, cellH: 60,
    cols: 2, rows: 4,
    gapX: 5, gapY: 5,
    previewW: 60, previewH: 38,
  },
];

const size = ref("medium");

/* Logo: se carga automáticamente desde Tienda > Branding.
   Si no hay branding configurado, fallback al logo POS 360. */
const DEFAULT_LOGO =
  "https://storage-files.cingulado.org/pos360/media/1777400527242-60fdb9fd89279d42.webp";
const brandingLogoUrl = ref("");

function absLogo(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  // Resuelve URL relativa contra el origen del API
  try {
    const base = http.defaults?.baseURL || window.location.origin;
    const u = new URL(base);
    return `${u.origin}${url.startsWith("/") ? "" : "/"}${url}`;
  } catch {
    return url;
  }
}

const effectiveLogo = computed(() => brandingLogoUrl.value || DEFAULT_LOGO);

onMounted(async () => {
  try {
    const b = await getShopBranding();
    if (b?.logo_url) brandingLogoUrl.value = absLogo(b.logo_url);
  } catch {
    // Si falla (permisos, sin branding configurado, etc.) usa el default
    brandingLogoUrl.value = "";
  }
  loadBranches();
});

/* ── Sucursales ─────────────────────────────────────────────────── */
const branches = ref([]);
const branchesLoading = ref(false);
const branchId = ref(null);

async function loadBranches() {
  if (typeof products.fetchBranches !== "function") return;
  branchesLoading.value = true;
  try {
    const arr = await products.fetchBranches();
    branches.value = Array.isArray(arr) ? arr : [];
  } catch {
    branches.value = [];
  } finally {
    branchesLoading.value = false;
  }
}

const branchSelectItems = computed(() => {
  const list = (branches.value || [])
    .map((b) => ({
      title: String(b?.name || `Sucursal #${b?.id}`),
      value: Number(b?.id),
    }))
    .filter((x) => x.value > 0)
    .sort((a, b) => a.value - b.value);
  return [{ title: "Sin sucursal", value: null }, ...list];
});

const selectedBranchName = computed(() => {
  const id = Number(branchId.value || 0);
  if (!id) return "";
  const found = (branches.value || []).find((b) => Number(b?.id) === id);
  return found ? String(found.name || "").trim() : "";
});

/* ── Items: lista de {product, copies} ──────────────────────────── */
const items = ref([]);

function addProduct(p) {
  if (!p?.id) return;
  const exists = items.value.find((it) => it.product.id === p.id);
  if (exists) {
    exists.copies = Math.min(200, exists.copies + 1);
  } else {
    items.value.push({ product: p, copies: 1 });
  }
  // Mantener búsqueda y resultados intactos para permitir selección múltiple.
}
function removeItem(idx) { items.value.splice(idx, 1); }
function changeCopies(idx, delta) {
  const it = items.value[idx];
  it.copies = Math.max(1, Math.min(200, it.copies + delta));
}
function clearAll() { items.value = []; }

/* Helpers para el listado de resultados (feedback de ya agregado) */
function isAdded(id) {
  return items.value.some((it) => it.product.id === id);
}
function getCopies(id) {
  const it = items.value.find((x) => x.product.id === id);
  return it ? it.copies : 0;
}
function clearSearch() {
  searchQ.value = "";
  searchResults.value = [];
}

const totalCopies = computed(() =>
  items.value.reduce((acc, it) => acc + Math.max(1, it.copies), 0),
);

/* ── Búsqueda ───────────────────────────────────────────────────── */
const searchQ = ref("");
const searchResults = ref([]);
const searching = ref(false);
let searchTimer = null;

function onSearch() {
  clearTimeout(searchTimer);
  if (!searchQ.value || String(searchQ.value).trim().length < 2) {
    searchResults.value = [];
    return;
  }
  searchTimer = setTimeout(runSearch, 250);
}
async function runSearch() {
  searching.value = true;
  try {
    const r = await products.fetchList({ q: searchQ.value.trim(), limit: 12 });
    const list = (r?.items || r?.data || (Array.isArray(r) ? r : [])) ?? [];
    searchResults.value = list.slice(0, 12);
  } catch {
    searchResults.value = [];
  } finally {
    searching.value = false;
  }
}

/* ── Layout de páginas: distribuye copias en hojas A4 ───────────── */
const currentLayout = computed(() => SIZES.find((s) => s.value === size.value) || SIZES[1]);

const pages = computed(() => {
  const lay = currentLayout.value;
  const capacity = lay.cols * lay.rows;
  // Expande items en flat de productos repetidos según copies
  const flat = [];
  for (const it of items.value) {
    for (let i = 0; i < Math.max(1, it.copies); i++) {
      flat.push(it.product);
    }
  }
  const result = [];
  for (let i = 0; i < flat.length; i += capacity) {
    const slice = flat.slice(i, i + capacity);
    // Padding para que el grid llene la página visualmente
    while (slice.length < capacity) slice.push(null);
    result.push(slice);
  }
  return result;
});

const sheetStyle = computed(() => {
  const lay = currentLayout.value;
  return {
    "--cols": lay.cols,
    "--rows": lay.rows,
    "--cell-w": `${lay.cellW}mm`,
    "--cell-h": `${lay.cellH}mm`,
    "--gap-x": `${lay.gapX}mm`,
    "--gap-y": `${lay.gapY}mm`,
  };
});
const gridStyle = computed(() => {
  const lay = currentLayout.value;
  return {
    gridTemplateColumns: `repeat(${lay.cols}, ${lay.cellW}mm)`,
    gridTemplateRows: `repeat(${lay.rows}, ${lay.cellH}mm)`,
    columnGap: `${lay.gapX}mm`,
    rowGap: `${lay.gapY}mm`,
  };
});

/* ── Imprimir ─────────────────────────────────────────────────────
   Estrategia: clonamos el área de impresión al <body> dentro de un
   contenedor dedicado (#blp-print-portal) y ocultamos el resto de la
   app vía la clase `is-printing` en <body>. Esto evita que aparezcan
   restos de la UI (sidebar, header, etc.) en el PDF.
   El portal se elimina al terminar (afterprint o fallback timeout). */
function doPrint() {
  const src = document.getElementById("blp-print-area");
  if (!src) return;

  // Limpieza previa por si quedó un portal de un intento anterior
  const old = document.getElementById("blp-print-portal");
  if (old) old.remove();

  const portal = document.createElement("div");
  portal.id = "blp-print-portal";
  portal.appendChild(src.cloneNode(true));
  document.body.appendChild(portal);
  document.body.classList.add("is-printing");

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    document.body.classList.remove("is-printing");
    portal.remove();
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  // Fallback por si afterprint no dispara (algunos browsers)
  setTimeout(cleanup, 30000);

  setTimeout(() => window.print(), 80);
}
</script>

<style scoped>
.blp { display: flex; flex-direction: column; min-height: 0; }

.blp-body {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 16px;
  align-items: start;
}

@media (max-width: 960px) {
  .blp-body { grid-template-columns: 1fr; }
}

/* ── Cards de configuración ── */
.blp-side {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: sticky;
  top: 0;
}
.blp-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  border-radius: 14px;
  padding: 14px;
}
.blp-card--grow { display: flex; flex-direction: column; gap: 10px; }
.blp-card__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.65);
  margin-bottom: 10px;
}
.blp-card__count {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  border-radius: 999px;
  background: #1488d1;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
}

/* Tamaños */
.blp-sizes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.blp-size {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 6px;
  border: 1.5px solid rgba(var(--v-theme-on-surface), 0.10);
  border-radius: 12px;
  background: transparent;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.blp-size:hover { background: rgba(20, 136, 209, 0.04); }
.blp-size.is-active {
  border-color: #1488d1;
  background: rgba(20, 136, 209, 0.06);
}
.blp-size__shape {
  width: var(--w);
  height: var(--h);
  border: 1.5px dashed rgba(var(--v-theme-on-surface), 0.30);
  border-radius: 4px;
  margin-bottom: 4px;
}
.blp-size.is-active .blp-size__shape { border-color: #1488d1; }
.blp-size__label {
  font-size: 12.5px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
}
.blp-size.is-active .blp-size__label { color: #1488d1; }
.blp-size__sub {
  font-size: 10.5px;
  color: rgba(var(--v-theme-on-surface), 0.55);
}
.blp-size__capacity {
  margin-top: 2px;
  font-size: 10px;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.45);
}

/* Buscador y resultados */
.blp-search {
  margin-bottom: 4px;
}
.blp-search-results {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 320px;
  overflow-y: auto;
  padding: 6px;
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  margin-bottom: 6px;
}
.blp-search-results__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 6px 4px;
  font-size: 11px;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.55);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  margin-bottom: 4px;
}
.blp-search-results__clear {
  background: none;
  border: none;
  color: #1488d1;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
}
.blp-search-results__clear:hover { text-decoration: underline; }

.blp-result {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: 1px solid transparent;
  background: rgb(var(--v-theme-surface));
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.12s, border-color 0.12s;
}
.blp-result:hover { background: rgba(20, 136, 209, 0.08); }
.blp-result.is-added {
  background: rgba(0, 166, 80, 0.06);
  border-color: rgba(0, 166, 80, 0.30);
}
.blp-result.is-added:hover { background: rgba(0, 166, 80, 0.12); }

.blp-result__main {
  flex: 1 1 auto;
  min-width: 0;
}
.blp-result__name {
  font-size: 12.5px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.blp-result__sku {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.55);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.blp-result__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  background: #00a650;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

/* Hint inline (sucursal, etc.) */
.blp-hint {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.55);
  line-height: 1.3;
}

/* Items seleccionados */
.blp-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 380px;
  overflow-y: auto;
}
.blp-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.04);
}
.blp-item__main { flex: 1 1 auto; min-width: 0; }
.blp-item__name {
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.blp-item__sub {
  display: flex;
  gap: 6px;
  margin-top: 2px;
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.55);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.blp-item__warn {
  color: #f59e0b;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-family: inherit;
}

.blp-item__qty {
  display: inline-flex;
  align-items: center;
  background: rgb(var(--v-theme-surface));
  border-radius: 999px;
  padding: 2px;
}
.blp-qty-btn {
  width: 24px; height: 24px;
  border-radius: 50%;
  border: none;
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.blp-qty-btn:hover { background: rgba(20, 136, 209, 0.10); }
.blp-qty-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.blp-qty-input {
  width: 36px;
  text-align: center;
  background: transparent;
  border: none;
  outline: none;
  font-size: 12.5px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: rgb(var(--v-theme-on-surface));
}
.blp-item__del {
  width: 26px; height: 26px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.45);
  cursor: pointer;
}
.blp-item__del:hover { background: rgba(239, 68, 68, 0.10); color: #ef4444; }

.blp-empty {
  text-align: center;
  padding: 28px 12px;
  color: rgba(var(--v-theme-on-surface), 0.55);
}
.blp-empty__title {
  font-size: 13px;
  font-weight: 500;
  margin-top: 6px;
}
.blp-empty__sub { font-size: 11.5px; margin-top: 2px; }

.blp-bulk-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(20, 136, 209, 0.08);
  color: #1488d1;
  font-size: 11.5px;
  font-weight: 500;
  margin-top: 4px;
  justify-content: center;
}
.blp-bulk-tip__sep { opacity: 0.5; }

/* ── Preview ── */
.blp-preview-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.blp-preview-meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.75);
}
.blp-sheets {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.blp-sheet {
  width: 210mm;
  min-height: 297mm;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.10);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.10);
  padding: 8mm;
  box-sizing: border-box;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  page-break-after: always;
}
.blp-grid {
  display: grid;
  justify-content: center;
}
.blp-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.blp-preview-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 80px 16px;
  color: rgba(var(--v-theme-on-surface), 0.45);
  text-align: center;
}
</style>

<!-- ──────────────────────────────────────────────────────────────
     PRINT (no scoped): cuando se hace clic en "Imprimir", el área
     #blp-print-area se clona dentro de #blp-print-portal en <body>
     y se agrega la clase .is-printing al body. Eso permite ocultar
     el resto de la UI sin pelear con scopes ni teleports.
     ────────────────────────────────────────────────────────────── -->
<style>
@media print {
  @page {
    size: A4;
    margin: 0;
  }

  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
  }

  /* Modo impresión: ocultar TODO menos el portal con las hojas */
  body.is-printing > *:not(#blp-print-portal) {
    display: none !important;
  }
  body.is-printing #blp-print-portal {
    display: block !important;
    margin: 0;
    padding: 0;
    position: static;
  }

  /* Reset de wrappers heredados del clon */
  #blp-print-portal .blp-sheets {
    display: block !important;
    gap: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  #blp-print-portal .blp-sheet {
    border: none !important;
    box-shadow: none !important;
    margin: 0 !important;
    width: 210mm !important;
    height: 297mm !important;
    min-height: 297mm !important;
    padding: 8mm !important;
    box-sizing: border-box !important;
    display: flex !important;
    align-items: flex-start !important;
    justify-content: center !important;
    page-break-after: always;
    background: #fff !important;
  }
  #blp-print-portal .blp-sheet:last-child {
    page-break-after: auto;
  }
  #blp-print-portal .blp-grid {
    display: grid !important;
    justify-content: center !important;
  }
  #blp-print-portal .blp-cell {
    display: flex !important;
    align-items: stretch !important;
    justify-content: stretch !important;
  }
}
</style>
