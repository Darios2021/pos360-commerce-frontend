<!-- src/modules/products/pages/ProductsListPage.vue -->

<template>
  <div class="pl">
    <!-- ── Encabezado ───────────────────────────────────── -->
    <div class="pl-cab">
      <div class="pl-cab__txt">
        <h1 class="pl-cab__titulo">Productos</h1>
        <span class="pl-cab__sub num">{{ subtitulo }}</span>
      </div>
      <v-btn v-if="smAndUp" color="primary" variant="flat" prepend-icon="mdi-plus" class="pl-nuevo" @click="openCreate">
        Nuevo producto
      </v-btn>
    </div>

    <!-- FAB "+ Nuevo" solo en mobile -->
    <button v-if="!smAndUp" type="button" class="lp-fab-new" aria-label="Nuevo producto" @click="openCreate">
      <v-icon size="24">mdi-plus</v-icon>
    </button>

    <!-- ── Buscador, filtros activos y vista ────────────── -->
    <div class="pl-busca">
      <div class="pl-busca__campo">
        <v-icon size="22" class="pl-busca__ic">mdi-magnify</v-icon>
        <input
          v-model="f.q"
          type="search"
          class="pl-busca__input"
          placeholder="Nombre, SKU, código de barras o marca"
          @input="debouncedSearch"
          @keyup.enter="applyFilters"
        />
        <button v-if="!smAndUp" type="button" class="pl-busca__scan" aria-label="Escanear código" @click="lpScanOpen = true">
          <v-icon size="20">mdi-barcode-scan</v-icon>
        </button>
        <button type="button" class="pl-busca__filtros" @click="panelAbierto = true">
          <v-icon size="18">mdi-tune-variant</v-icon>Filtros
          <span v-if="activeFilterChips.length" class="pl-busca__n num">{{ activeFilterChips.length }}</span>
        </button>
      </div>
      <span v-for="chip in activeFilterChips" :key="chip.key" class="pl-chip">
        {{ chip.label }}
        <button type="button" class="pl-chip__x" :aria-label="`Quitar ${chip.label}`" @click="removeFilter(chip.key)">
          <v-icon size="18">mdi-close</v-icon>
        </button>
      </span>
      <span class="pl-esp" />
      <div v-if="smAndUp" class="pl-vista" role="group" aria-label="Vista">
        <button type="button" :class="{ 'is-on': viewMode === 'grid' }" aria-label="Vista en grilla" @click="viewMode = 'grid'"><v-icon size="20">mdi-view-grid-outline</v-icon></button>
        <button type="button" :class="{ 'is-on': viewMode === 'list' }" aria-label="Vista en lista" @click="viewMode = 'list'"><v-icon size="20">mdi-format-list-bulleted</v-icon></button>
      </div>
      <v-menu v-if="smAndUp && isAdmin" location="bottom end">
        <template #activator="{ props: btnProps }">
          <button v-bind="btnProps" type="button" class="pl-mas" aria-label="Más acciones" :disabled="bulkPromoBusy">
            <v-icon size="20">mdi-dots-horizontal</v-icon>
          </button>
        </template>
        <v-list density="compact" class="lp-promo-menu">
          <v-list-item prepend-icon="mdi-pause-circle-outline" title="Pausar todas las promos" @click="onPauseAllPromos" />
          <v-list-item prepend-icon="mdi-play-circle-outline" title="Reactivar promos configuradas" @click="onResumeAllPromos" />
          <v-divider />
          <v-list-item prepend-icon="mdi-currency-usd" title="Actualizar precios en dólares" @click="onRepriceUsd" />
        </v-list>
      </v-menu>
    </div>

    <BarcodeScannerDialog v-if="!smAndUp" v-model="lpScanOpen" title="Buscar producto" />

    <!-- Actualizar precios en dólares: se confirma acá mismo, no en una ventana -->
    <div v-if="usdConfirm" class="pl-usd">
      <span class="pl-usd__txt num">
        <b>Actualizar precios en dólares</b>
        Dólar oficial de hoy $ {{ Number(usdConfirm.rate).toLocaleString("es-AR") }}. Se recalcula la lista de los productos con costo en dólares y % de ganancia; contado y revendedor no cambian.
      </span>
      <a href="#" class="pl-link pl-link--chico pl-link--suave" @click.prevent="usdConfirm = null">No actualizar</a>
      <v-btn color="primary" variant="flat" :loading="bulkPromoBusy" @click="confirmarUsd">Actualizar</v-btn>
    </div>

    <!-- ── Resumen en una franja (clic en una parte filtra) ── -->
    <div class="pl-resumen">
      <div class="pl-resumen__cifras">
        <span class="num">Inventario <b>$ {{ millones(stats.stock_value) }}</b> a precio de venta</span>
        <span class="num"><b>{{ fmtInt(stats.stock_units) }}</b> unidades</span>
        <v-progress-circular v-if="statsLoading" indeterminate size="18" width="2" color="primary" />
        <span class="pl-esp" />
        <span class="pl-leyenda num">
          <button type="button" :class="{ 'is-on': f.stock === 'with' }" @click="filtroRapido('stock', 'with')"><i class="c-bien"></i>{{ fmtInt(stats.ok_stock) }} bien</button>
          <button type="button" :class="{ 'is-on': f.stock === 'low' }" @click="filtroRapido('stock', 'low')"><i class="c-bajo"></i>{{ fmtInt(stats.low_stock) }} bajo</button>
          <button type="button" :class="{ 'is-on': f.stock === 'without' }" @click="filtroRapido('stock', 'without')"><i class="c-sin"></i>{{ fmtInt(stats.without_stock) }} sin stock</button>
          <button v-if="stats.without_price" type="button" :class="{ 'is-on': f.price_presence === 'without' }" @click="filtroRapido('price_presence', 'without')"><i class="c-precio"></i>{{ fmtInt(stats.without_price) }} sin precio</button>
        </span>
      </div>
      <span class="pl-partes">
        <span class="c-bien" :style="{ width: parte(stats.ok_stock) }"></span>
        <span class="c-bajo" :style="{ width: parte(stats.low_stock) }"></span>
        <span class="c-sin" :style="{ width: parte(stats.without_stock) }"></span>
      </span>
    </div>

    <!-- ── Selección masiva ─────────────────────────────── -->
    <div v-if="selectedIds.length" class="pl-masiva">
      <label class="pl-masiva__sel" @click.stop>
        <v-checkbox-btn :model-value="allSelected" :indeterminate="someSelected" density="compact" hide-details @update:modelValue="toggleSelectAll" />
        <span><strong>{{ selectedIds.length }}</strong> {{ selectedIds.length === 1 ? 'seleccionado' : 'seleccionados' }}</span>
      </label>
      <a href="#" class="pl-masiva__no" @click.prevent="selectedIds = []">Quitar selección</a>
      <v-btn :color="isAdmin ? 'error' : 'warning'" variant="flat" size="small" :prepend-icon="isAdmin ? 'mdi-delete-outline' : 'mdi-eye-off-outline'" @click="bulkDisableOrDelete">
        {{ isAdmin ? 'Eliminar' : 'Inactivar' }} {{ selectedIds.length }}
      </v-btn>
    </div>

    <v-alert v-if="products.error" type="error" variant="tonal" density="compact">{{ products.error }}</v-alert>

    <!-- ── Contenido ────────────────────────────────────── -->
    <div class="pl-contenido" :class="{ 'is-cargando': loading && items.length }">
      <div v-if="loading && !items.length" class="pl-grilla">
        <div v-for="n in 12" :key="n" class="pl-card pl-card--esqueleto" />
      </div>

      <div v-else-if="!loading && !items.length" class="pl-vacio">
        <v-icon size="44">mdi-package-variant-closed</v-icon>
        <span>No hay productos con estos filtros</span>
        <a href="#" class="pl-link" @click.prevent="clearFilters">Quitar los filtros</a>
      </div>

      <!-- Grilla -->
      <div v-else-if="viewMode === 'grid' || !smAndUp" class="pl-grilla">
        <div
          v-for="item in items"
          :key="item.id"
          class="pl-card"
          :class="{ 'is-inactivo': isInactive(item), 'is-sel': selectedIds.includes(item.id) }"
          @click="abrirTarjeta($event, item.id)"
          @auxclick="abrirTarjeta($event, item.id)"
        >
          <div class="pl-card__foto">
            <img v-if="getProductImage(item)" :src="getProductImage(item)" :alt="item.name" loading="lazy" />
            <v-icon v-else size="38">mdi-package-variant-closed</v-icon>
            <span class="pl-card__check" @click.stop>
              <v-checkbox-btn :model-value="selectedIds.includes(item.id)" density="compact" hide-details @update:modelValue="toggleSelect(item.id)" />
            </span>
            <span v-if="isInactive(item)" class="pl-marca">Inactivo</span>
            <span v-else-if="Number(item.is_kit) === 1 || item.is_kit === true" class="pl-marca">Kit</span>
          </div>
          <div class="pl-card__info">
            <span v-if="rubro(item)" class="pl-rubro clamp1">{{ rubro(item) }}</span>
            <router-link :to="{ name: 'productView', params: { id: item.id } }" class="pl-card__nombre" @click.stop>{{ item.name }}</router-link>
            <span class="pl-s clamp1 num">{{ [item.brand, item.sku || item.code].filter(Boolean).join(' · ') }}</span>
            <span class="pl-card__stock num" :class="nivel(item)">
              <i></i>{{ stockTexto(item) }}
              <span class="pl-esp" />
              <span v-for="b in sucursalesCortas(item)" :key="b.id" class="pl-suc" :title="b.name">{{ b.ini }}</span>
            </span>
            <span class="pl-esp-v" />
            <span class="pl-card__pie">
              <span class="pl-card__precios">
                <span class="pl-card__precio num">{{ precioContado(item) ? `$ ${fmtPrice(precioContado(item))}` : 'Sin precio' }}</span>
                <span v-if="Number(item.price_list) > precioContado(item)" class="pl-s num">lista $ {{ fmtPrice(item.price_list) }}</span>
              </span>
              <router-link :to="{ name: 'productEdit', params: { id: item.id } }" class="pl-link pl-link--chico" @click.stop>Editar<v-icon size="18">mdi-chevron-right</v-icon></router-link>
            </span>
          </div>
        </div>
      </div>

      <!-- Lista: tabla cerrada -->
      <div v-else class="pl-tabla-caja">
        <table class="pl-tabla">
          <thead>
            <tr>
              <th class="c-check"><v-checkbox-btn :model-value="allSelected" :indeterminate="someSelected" density="compact" hide-details @update:modelValue="toggleSelectAll" /></th>
              <th class="c-foto"></th>
              <th>Producto</th>
              <th class="c-rubro">Rubro</th>
              <th class="c-stock">Stock</th>
              <th class="c-suc">Sucursales</th>
              <th class="c-plata">Contado</th>
              <th class="c-plata">Lista</th>
              <th class="c-plata">Revendedor</th>
              <th class="c-ver"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in items"
              :key="item.id"
              :class="{ 'is-inactivo': isInactive(item) }"
              @click="abrirTarjeta($event, item.id)"
              @auxclick="abrirTarjeta($event, item.id)"
            >
              <td class="c-check" @click.stop><v-checkbox-btn :model-value="selectedIds.includes(item.id)" density="compact" hide-details @update:modelValue="toggleSelect(item.id)" /></td>
              <td class="c-foto"><span class="pl-mini"><img v-if="getProductImage(item)" :src="getProductImage(item)" alt="" loading="lazy" /><v-icon v-else size="20">mdi-package-variant-closed</v-icon></span></td>
              <td>
                <router-link :to="{ name: 'productView', params: { id: item.id } }" class="pl-b clamp1 pl-tabla__nombre" @click.stop>{{ item.name }}</router-link>
                <div class="pl-s clamp1 num">{{ [item.brand, item.sku || item.code].filter(Boolean).join(' · ') }}<template v-if="isInactive(item)"> · inactivo</template></div>
              </td>
              <td><div class="pl-b clamp1">{{ item.category?.name || item.rubro || '—' }}</div><div class="pl-s clamp1">{{ item.subcategory?.name || item.subrubro || '' }}</div></td>
              <td class="num"><span class="pl-card__stock" :class="nivel(item)"><i></i>{{ getStockQty(item) }}</span></td>
              <td><span v-for="b in sucursalesCortas(item)" :key="b.id" class="pl-suc" :title="b.name">{{ b.ini }}</span></td>
              <td class="c-plata num pl-b">{{ precioContado(item) ? `$ ${fmtPrice(precioContado(item))}` : '—' }}</td>
              <td class="c-plata num pl-suave">{{ Number(item.price_list) > 0 ? `$ ${fmtPrice(item.price_list)}` : '—' }}</td>
              <td class="c-plata num pl-suave">{{ Number(item.price_reseller) > 0 ? `$ ${fmtPrice(item.price_reseller)}` : '—' }}</td>
              <td class="c-ver"><router-link :to="{ name: 'productEdit', params: { id: item.id } }" class="pl-link pl-link--chico" @click.stop>Editar<v-icon size="18">mdi-chevron-right</v-icon></router-link></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── Paginación ───────────────────────────────────── -->
    <div v-if="meta.total > 0" class="pl-pie">
      <span class="num pl-pie__info">{{ desde }} a {{ hasta }} de {{ fmtInt(meta.total) }}</span>
      <v-pagination v-model="page" :length="meta.pages || 1" :total-visible="smAndUp ? 7 : 4" density="comfortable" size="small" @update:modelValue="fetchNow" />
    </div>

    <!-- ── Panel de filtros: convive con el listado, no es un modal ── -->
    <Transition name="pl-panel">
      <aside v-if="panelAbierto" class="pl-panel" aria-label="Filtros">
        <div class="pl-panel__cab">
          <span>Filtros</span>
          <button type="button" class="pl-panel__cerrar" aria-label="Cerrar filtros" @click="panelAbierto = false"><v-icon size="24">mdi-close</v-icon></button>
        </div>
        <div class="pl-panel__cuerpo">
          <div v-for="g in gruposFiltro" :key="g.clave" class="pl-grupo">
            <span class="pl-grupo__tit">{{ g.titulo }}</span>
            <button
              v-for="o in g.opciones"
              :key="String(o.value)"
              type="button"
              class="pl-op"
              :class="{ 'is-on': o.on, 'is-cero': o.count === 0 && !o.on }"
              @click="elegirFiltro(g.clave, o.value)"
            >
              <span class="pl-op__caja"><v-icon v-if="o.on" size="16" color="white">mdi-check</v-icon></span>
              <span class="pl-op__eti">{{ o.label }}</span>
              <span v-if="o.count !== null" class="pl-op__n num">{{ fmtInt(o.count) }}</span>
            </button>
          </div>

          <div class="pl-grupo">
            <span class="pl-grupo__tit">Rubro</span>
            <v-select v-model="f.category_id" :items="categoryItems" item-title="title" item-value="value" placeholder="Todos los rubros" variant="outlined" density="compact" hide-details clearable @update:modelValue="onCategoryChange" />
            <v-select v-if="f.category_id" v-model="f.subcategory_id" :items="subcategoryItems" item-title="title" item-value="value" placeholder="Todos los subrubros" variant="outlined" density="compact" hide-details clearable class="mt-2" @update:modelValue="applyFilters" />
          </div>

          <div class="pl-grupo">
            <span class="pl-grupo__tit">Precio de lista</span>
            <div class="pl-rango">
              <input v-model="f.price_min" type="number" inputmode="numeric" placeholder="Desde $" @change="applyFilters" />
              <input v-model="f.price_max" type="number" inputmode="numeric" placeholder="Hasta $" @change="applyFilters" />
            </div>
          </div>

          <div class="pl-grupo">
            <span class="pl-grupo__tit">Por página</span>
            <div class="pl-porpag">
              <button v-for="n in [12, 24, 48, 96]" :key="n" type="button" :class="{ 'is-on': limit === n }" @click="limit = n; onLimitChange()">{{ n }}</button>
            </div>
          </div>
        </div>
        <div class="pl-panel__pie">
          <button type="button" class="pl-panel__ver num" @click="panelAbierto = false">
            Ver {{ fmtInt(meta.total) }} {{ meta.total === 1 ? 'producto' : 'productos' }}
          </button>
        </div>
      </aside>
    </Transition>

    <!-- Confirmación de acción masiva sobre promos (aviso trivial y reversible) -->
    <v-dialog v-model="bulkPromoDialog.open" max-width="440" persistent>
      <v-card rounded="lg" class="pa-2">
        <v-card-title class="pt-4 px-4 font-weight-black">{{ bulkPromoDialog.title }}</v-card-title>
        <v-card-text class="px-4 pb-2 text-body-2">{{ bulkPromoDialog.message }}</v-card-text>
        <v-card-actions class="justify-end px-4 pb-4">
          <a href="#" class="pl-link pl-link--chico pl-link--suave mr-4" @click.prevent="bulkPromoDialog.open = false">Volver</a>
          <v-btn :color="bulkPromoDialog.action === 'pause' ? 'warning' : 'success'" variant="flat" :loading="bulkPromoBusy" @click="confirmBulkPromo">
            {{ bulkPromoDialog.action === 'pause' ? 'Pausar' : 'Reactivar' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="disableOpen" max-width="460">
      <v-card rounded="lg">
        <v-card-title class="font-weight-bold pt-5 px-5">Inactivar producto</v-card-title>
        <v-card-text class="px-5">
          ¿Inactivar <b>{{ disableItem?.name }}</b>?
          <div class="text-caption text-medium-emphasis mt-1">Se oculta del catálogo y del POS. No se borra.</div>
        </v-card-text>
        <v-card-actions class="justify-end px-5 pb-5">
          <a href="#" class="pl-link pl-link--chico pl-link--suave mr-4" @click.prevent="disableOpen = false">Volver</a>
          <v-btn color="warning" variant="flat" :loading="products.loading" @click="doDisable">Inactivar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteOpen" max-width="460">
      <v-card rounded="lg">
        <v-card-title class="font-weight-bold pt-5 px-5">Eliminar producto</v-card-title>
        <v-card-text class="px-5">
          ¿Eliminar <b>{{ deleteItem?.name }}</b>?
          <div class="text-caption text-medium-emphasis mt-1">Si tiene ventas relacionadas, se inactiva automáticamente.</div>
        </v-card-text>
        <v-card-actions class="justify-end px-5 pb-5">
          <a href="#" class="pl-link pl-link--chico pl-link--suave mr-4" @click.prevent="deleteOpen = false">Volver</a>
          <v-btn color="error" variant="flat" :loading="products.loading" @click="doDelete">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :timeout="3500" location="bottom right">{{ snack.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import { useProductsStore } from "@/app/store/products.store";
import { useAuthStore } from "@/app/store/auth.store";
import { useCategoriesStore } from "@/app/store/categories.store";
import BarcodeScannerDialog from "@/app/components/BarcodeScannerDialog.vue";
import http from "@/app/api/http";
import { fetchOfficialUsdRate } from "@/modules/budgets/services/fx.service";

const router = useRouter();
const route = useRoute();
const products = useProductsStore();
const auth = useAuthStore();
const categories = useCategoriesStore();
const { smAndUp } = useDisplay();

const isAdmin = computed(() => {
  const r = auth.roles || [];
  return r.includes("admin") || r.includes("super_admin");
});

const loading = ref(false);
const items = computed(() => (Array.isArray(products.items) ? products.items : []));

/* Stats agregadas */
const statsLoading = ref(false);
const stats = ref({
  ready: false,
  total: 0,
  active: 0,
  inactive: 0,
  with_stock: 0,
  without_stock: 0,
  with_price: 0,
  without_price: 0,
  with_images: 0,
  without_images: 0,
  promo_active: 0,
  low_stock: 0,
  ok_stock: 0,
  stock_units: 0,
  stock_value: 0,
});
function fmtInt(n) {
  return Number(n || 0).toLocaleString('es');
}
function pct(part, whole) {
  const w = Number(whole || 0);
  if (!w) return '0%';
  const p = Math.round((Number(part || 0) / w) * 100);
  return `${p}%`;
}

const meta = ref({ page: 1, limit: 24, total: 0, pages: 1 });
const page = ref(1);
const limit = ref(24);
const selectedIds = ref([]);

const deleteOpen = ref(false);
const deleteItem = ref(null);
const disableOpen = ref(false);
const disableItem = ref(null);

const snack = ref({ show: false, text: "" });
function toast(text) {
  snack.value = { show: true, text: String(text || "") };
}

function rowRaw(slotItem) {
  return slotItem?.raw ?? slotItem ?? {};
}
function isInactive(it) {
  return it?.is_active === false || Number(it?.is_active) === 0;
}

/* Branches */
const branches = ref([]);
async function loadBranchesSafe() {
  if (typeof products.fetchBranches !== "function") return;
  try {
    const arr = await products.fetchBranches();
    branches.value = Array.isArray(arr) ? arr : [];
  } catch {}
}
function branchName(id) {
  const bid = Number(id || 0);
  if (!bid) return "—";
  const found = branches.value.find((b) => Number(b?.id) === bid);
  return found?.name || `Sucursal #${bid}`;
}
function branchColor(id) {
  const bid = Number(id || 0);
  if (!bid) return "grey";
  if (bid === 1) return "primary";
  if (bid === 2) return "green";
  if (bid === 3) return "deep-purple";
  return "blue-grey";
}
const branchItems = computed(() => {
  const out = [{ title: "Todas", value: null }];
  (branches.value || [])
    .map((b) => ({ title: b?.name || `Sucursal #${b?.id}`, value: Number(b?.id) }))
    .filter((x) => x.value > 0)
    .sort((a, b) => a.value - b.value)
    .forEach((x) => out.push(x));
  return out;
});

/* Multi-sucursal chips */
function branchInitials(name) {
  const s = String(name || "").trim();
  if (!s) return "—";
  const parts = s.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "";
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase() || s.slice(0, 2).toUpperCase();
}
function enabledBranches(it) {
  const gc = String(it?.branches_gc || "").trim();
  if (!gc) return [];
  return gc
    .split("|")
    .map((pair) => {
      const idx = pair.indexOf(":");
      if (idx <= 0) return null;
      const id = Number(pair.slice(0, idx));
      const name = String(pair.slice(idx + 1) || "").trim();
      if (!id) return null;
      return { id, name: name || branchName(id) };
    })
    .filter(Boolean)
    .sort((a, b) => a.id - b.id);
}
function visibleBranches(list) {
  return (list || []).slice(0, 4);
}
function hiddenBranchesCount(list) {
  const n = (list || []).length;
  return n > 4 ? n - 4 : 0;
}
function hiddenBranchesText(list) {
  const rest = (list || []).slice(4).map((b) => b.name).filter(Boolean);
  return rest.length ? rest.join(" · ") : "—";
}

/* Categories */
async function loadCategoriesSafe() {
  try {
    if (typeof categories.fetchAll === "function") await categories.fetchAll(true);
  } catch {}
}
const parentList = computed(() => (Array.isArray(categories.parents) ? categories.parents : []));
const categoryItems = computed(() => {
  const out = [{ title: "Todos", value: null }];
  parentList.value
    .map((c) => ({ id: Number(c?.id || 0), name: String(c?.name || "").trim() }))
    .filter((x) => x.id > 0 && x.name)
    .sort((a, b) => a.name.localeCompare(b.name, "es"))
    .forEach((x) => out.push({ title: x.name, value: x.id }));
  return out;
});
const subcategoryItems = computed(() => {
  const out = [{ title: "Todos", value: null }];
  const pid = Number(f.value.category_id || 0);
  if (!pid) return out;

  const kids = Array.isArray(categories.children) ? categories.children : [];
  kids
    .filter((x) => Number(x?.category_id || x?.parent_id || 0) === pid || Number(x?.parent_id || 0) === pid)
    .map((x) => ({ id: Number(x?.id || 0), name: String(x?.name || "").trim() }))
    .filter((x) => x.id > 0 && x.name)
    .sort((a, b) => a.name.localeCompare(b.name, "es"))
    .forEach((x) => out.push({ title: x.name, value: x.id }));

  return out;
});

/* Filtros */
const f = ref({
  q: "",
  branch_id: null,
  category_id: null,
  subcategory_id: null,
  stock: "all",
  price_presence: "all",
  status: "active",
  price_min: null,
  price_max: null,
  images: "all",
  promo: "all",
});

const stockItems = [
  { title: "Todos", value: "all" },
  { title: "Con stock", value: "with" },
  { title: "Sin stock", value: "without" },
  { title: "Stock bajo (3 o menos)", value: "low" },
];
const pricePresenceItems = [
  { title: "Todos", value: "all" },
  { title: "Con precio", value: "with" },
  { title: "Sin precio (0)", value: "without" },
];
const imagesItems = [
  { title: "Todas", value: "all" },
  { title: "Con imágenes", value: "with" },
  { title: "Sin imágenes", value: "without" },
];
const promoItems = [
  { title: "Todos",          value: "all" },
  { title: "En promo (vigente)", value: "active" },
  { title: "En promo (todas)",   value: "any" },
  { title: "Sin promo",      value: "none" },
  { title: "Promo programada", value: "scheduled" },
  { title: "Promo vencida",  value: "expired" },
];
const statusItems = computed(() => {
  if (!isAdmin.value) {
    return [
      { title: "Activos", value: "active" },
      { title: "Inactivos", value: "inactive" },
    ];
  }
  return [
    { title: "Todos (activos + inactivos)", value: "all" },
    { title: "Activos", value: "active" },
    { title: "Inactivos", value: "inactive" },
  ];
});

function onCategoryChange() {
  f.value.subcategory_id = null;
  applyFilters();
}
function onLimitChange() {
  page.value = 1;
  fetchNow();
}
async function applyFilters() {
  page.value = 1;
  selectedIds.value = [];
  await fetchNow();
}
async function clearFilters() {
  f.value = {
    q: "",
    branch_id: null,
    category_id: null,
    subcategory_id: null,
    stock: "all",
    price_presence: "all",
    status: "active",
    price_min: null,
    price_max: null,
    images: "all",
    promo: "all",
  };
  page.value = 1;
  selectedIds.value = [];
  await fetchNow();
}

/* Fetch stats (mismos filtros base que el listado) */
async function fetchStats() {
  if (!auth.isAuthed) return;
  statsLoading.value = true;
  try {
    const params = {
      q: String(f.value.q || "").trim(),
      branch_id: isAdmin.value ? (f.value.branch_id ? Number(f.value.branch_id) : null) : null,
      category_id: f.value.category_id ? Number(f.value.category_id) : null,
      subcategory_id: f.value.subcategory_id ? Number(f.value.subcategory_id) : null,
    };
    if (String(f.value.status) === "all") {
      params.include_inactive = 1;
    } else if (String(f.value.status) === "inactive") {
      params.is_active = 0;
    }

    const data = await products.fetchStats(params);
    if (data) {
      stats.value = {
        ready: true,
        total: Number(data.total || 0),
        active: Number(data.active || 0),
        inactive: Number(data.inactive || 0),
        with_stock: Number(data.with_stock || 0),
        without_stock: Number(data.without_stock || 0),
        with_price: Number(data.with_price || 0),
        without_price: Number(data.without_price || 0),
        with_images: Number(data.with_images || 0),
        without_images: Number(data.without_images || 0),
        promo_active: Number(data.promo_active || 0),
        low_stock: Number(data.low_stock || 0),
        ok_stock: Number(data.ok_stock || 0),
        stock_units: Number(data.stock_units || 0),
        stock_value: Number(data.stock_value || 0),
      };
    } else {
      stats.value.ready = false;
    }
  } finally {
    statsLoading.value = false;
  }
}

/* Fetch */
async function fetchNow() {
  if (!auth.isAuthed) return;
  if (loading.value) return;

  loading.value = true;
  try {
    const params = {
      page: Number(page.value || 1),
      limit: Number(limit.value || 24),
      q: String(f.value.q || "").trim(),

      branch_id: isAdmin.value ? (f.value.branch_id ? Number(f.value.branch_id) : null) : null,

      category_id: f.value.category_id ? Number(f.value.category_id) : null,
      subcategory_id: f.value.subcategory_id ? Number(f.value.subcategory_id) : null,

      stock: f.value.stock,
      price_presence: f.value.price_presence,
      price_min: f.value.price_min !== "" && f.value.price_min != null ? Number(f.value.price_min) : null,
      price_max: f.value.price_max !== "" && f.value.price_max != null ? Number(f.value.price_max) : null,
      images: f.value.images,
      promo: f.value.promo && f.value.promo !== "all" ? f.value.promo : null,
    };

    if (String(f.value.status) === "all") {
      params.include_inactive = 1;
    } else if (String(f.value.status) === "inactive") {
      params.is_active = 0;
    } else if (String(f.value.status) === "active") {
      // backend default
    }

    const r = await products.fetchList(params);

    const m =
      (r && r.meta) ||
      (r && r.data && r.meta) ||
      products.meta ||
      {
        page: params.page,
        limit: params.limit,
        total: Array.isArray(products.items) ? products.items.length : 0,
        pages: products.pages || 1,
      };

    meta.value = {
      page: Number(m.page || params.page),
      limit: Number(m.limit || params.limit),
      total: Number(m.total || 0),
      pages: Number(m.pages || 1) || 1,
    };

    if (page.value > meta.value.pages) page.value = meta.value.pages;
  } finally {
    loading.value = false;
  }
  // refresh stats agregadas en paralelo (no bloquea UI)
  fetchStats();
}

function onRowClick(e, row) {
  const item = row?.item?.raw ?? row?.item ?? row;
  const t = e?.target;
  if (t?.closest?.("button, a, input, label, textarea, select, .v-btn, .v-selection-control, .v-menu")) return;
  openView(item?.id);
}

const headers = computed(() => {
  const base = [
    { title: "Nombre", key: "name", sortable: false, width: 520 },
    { title: "Rubro", key: "rubro", sortable: false, width: 260 },
    { title: "Subrubro", key: "subrubro", sortable: false, width: 260 },
    { title: "", key: "actions", sortable: false, align: "end", width: 96 },
  ];
  if (!isAdmin.value) return base;

  const out = [...base];
  out.splice(1, 0, { title: "Sucursal dueña", key: "branch", sortable: false, width: 220 });
  out.splice(2, 0, { title: "Sucursales", key: "branches", sortable: false, width: 190 });
  return out;
});

function openView(id) {
  const pid = Number(id || 0);
  if (!pid) return;
  router.push({ name: "productView", params: { id: pid } });
}
function openEdit(id) {
  const pid = Number(id || 0);
  if (!pid || !auth.isAuthed) return;
  router.push({ name: "productEdit", params: { id: pid } });
}
function openCreate() {
  router.push({ name: "productNew" });
}

/* Click en KPI "Promos activas" → toggle filtro promo=active */
function onPromoActiveKpiClick() {
  if (f.value.promo === "active") {
    f.value.promo = "all";
  } else {
    f.value.promo = "active";
  }
  applyFilters();
}

/* ── Bulk promo (pausar / reactivar todas) ── */
const bulkPromoBusy = ref(false);
const bulkPromoDialog = ref({
  open: false,
  action: "",       // 'pause' | 'resume'
  title: "",
  message: "",
});

function onPauseAllPromos() {
  bulkPromoDialog.value = {
    open: true,
    action: "pause",
    title: "Pausar todas las promociones",
    message: "Vas a apagar el flag de promoción en TODOS los productos que lo tengan activo. La configuración (precio promo, fechas, reglas) se mantiene — solo se apaga la visualización en la tienda.",
  };
}

function onResumeAllPromos() {
  bulkPromoDialog.value = {
    open: true,
    action: "resume",
    title: "Reactivar promos configuradas",
    message: "Se va a prender el flag de promoción en los productos que tengan precio promo, ventana o regla por cantidad configurada y no estén activas hoy. No se afectan productos sin configuración previa.",
  };
}

const usdConfirm = ref(null);
async function confirmarUsd() {
  if (!usdConfirm.value?.rate) return;
  bulkPromoBusy.value = true;
  try {
    const { data } = await http.post("/products/usd-reprice", { rate: usdConfirm.value.rate });
    const n = Number(data?.data?.updated || 0);
    toast(n > 0 ? `${n} ${n === 1 ? "precio actualizado" : "precios actualizados"} al dólar de hoy` : "No hay productos con costo en dólares");
    usdConfirm.value = null;
    await Promise.all([fetchNow(), fetchStats()]);
  } catch (e) {
    toast(`⚠️ ${e?.response?.data?.message || e?.message || "No se pudo actualizar"}`);
  } finally {
    bulkPromoBusy.value = false;
  }
}
// Lista de los productos con costo en dólares, a la cotización oficial de hoy
async function onRepriceUsd() {
  bulkPromoBusy.value = true;
  try {
    const fx = await fetchOfficialUsdRate();
    usdConfirm.value = { rate: fx.rate };
  } catch (e) {
    toast(`⚠️ ${e?.message || "No se pudo traer la cotización"}`);
  } finally {
    bulkPromoBusy.value = false;
  }
}

async function confirmBulkPromo() {
  const action = bulkPromoDialog.value.action;
  if (!action) return;
  bulkPromoBusy.value = true;
  try {

    const res = action === "pause"
      ? await products.pauseAllPromos()
      : await products.resumeAllPromos();

    if (!res) {
      toast(`⚠️ ${products.error || "No se pudo completar la acción"}`);
      return;
    }

    const n = action === "pause" ? Number(res.paused || 0) : Number(res.resumed || 0);
    if (action === "pause") {
      toast(n > 0 ? `⏸️ ${n} promoción${n === 1 ? "" : "es"} pausada${n === 1 ? "" : "s"}` : "No había promos activas para pausar");
    } else {
      toast(n > 0 ? `▶️ ${n} promoción${n === 1 ? "" : "es"} reactivada${n === 1 ? "" : "s"}` : "No se encontraron promos configuradas para reactivar");
    }

    bulkPromoDialog.value.open = false;
    // Refrescar listado y stats para reflejar el cambio
    await Promise.all([fetchNow(), fetchStats()]);
  } finally {
    bulkPromoBusy.value = false;
  }
}
function askDelete(item) {
  deleteItem.value = item;
  deleteOpen.value = true;
}
function askDisable(item) {
  disableItem.value = item;
  disableOpen.value = true;
}

function normalizeRemoveResult(r) {
  if (typeof r === "boolean") return { ok: r, code: r ? null : "DELETE_FAILED", message: r ? null : "No se pudo eliminar" };
  if (r && typeof r === "object") return { ok: !!r.ok, code: r.code || null, message: r.message || null };
  return { ok: false, code: "DELETE_FAILED", message: "No se pudo eliminar" };
}
async function callRemoveProduct(id) {
  const fn =
    (products && typeof products.remove === "function" && products.remove) ||
    (products && typeof products.delete === "function" && products.delete) ||
    (products && typeof products.destroy === "function" && products.destroy) ||
    null;

  if (!fn) return { ok: false, code: "CLIENT_NO_METHOD", message: "Store: falta método remove/delete/destroy" };

  try {
    const out = await fn(id);
    return normalizeRemoveResult(out);
  } catch (e) {
    const msg = e?.response?.data?.message || e?.message || "No se pudo eliminar";
    const code = e?.response?.data?.code || e?.code || "DELETE_FAILED";
    return { ok: false, code, message: msg };
  }
}

async function doDisable() {
  if (!disableItem.value?.id) return;
  try {
    const updated = await products.update(disableItem.value.id, { is_active: false });
    if (!updated?.id) throw new Error(products.error || "No se pudo inactivar");
    toast("Producto inactivado");
  } catch (e) {
    toast(e?.message || "No se pudo inactivar");
  } finally {
    disableOpen.value = false;
    disableItem.value = null;
    await fetchNow();
  }
}
async function doDelete() {
  if (!deleteItem.value?.id) return;
  const id = Number(deleteItem.value.id);
  let needRefetch = false;
  try {
    const r = await callRemoveProduct(id);
    if (r.ok) {
      toast("Producto eliminado");
      return;
    }
    if (String(r.code || "").toUpperCase() === "FK_CONSTRAINT") {
      const updated = await products.update(id, { is_active: false });
      if (!updated?.id) throw new Error(products.error || "No se pudo inactivar (fallback FK)");
      toast("No se pudo borrar (FK). Se inactivó.");
      needRefetch = true;
      return;
    }
    throw new Error(r.message || products.error || "No se pudo eliminar");
  } catch (e) {
    toast(e?.message || "No se pudo eliminar");
    needRefetch = true;
  } finally {
    deleteOpen.value = false;
    deleteItem.value = null;
    if (needRefetch) await fetchNow();
  }
}

async function bulkDisableOrDelete() {
  if (!selectedIds.value?.length) return;

  const ids = [...selectedIds.value].map((x) => Number(x)).filter((x) => x > 0);

  let deleted = 0;
  let inactivated = 0;
  let failed = 0;

  for (const id of ids) {
    try {
      if (isAdmin.value) {
        const r = await callRemoveProduct(id);
        if (r.ok) deleted++;
        else if (String(r.code || "").toUpperCase() === "FK_CONSTRAINT") {
          const updated = await products.update(id, { is_active: false });
          if (updated?.id) inactivated++;
          else failed++;
        } else failed++;
      } else {
        const updated = await products.update(id, { is_active: false });
        if (updated?.id) inactivated++;
        else failed++;
      }
    } catch {
      failed++;
    }
  }

  selectedIds.value = [];
  toast(isAdmin.value ? `Eliminados: ${deleted} · Inactivados(FK): ${inactivated} · Fallidos: ${failed}` : `Inactivados: ${inactivated} · Fallidos: ${failed}`);
  await fetchNow();
}

async function reload() {
  if (!auth.isAuthed) return;
  await loadCategoriesSafe();
  await loadBranchesSafe();
  await fetchNow();
}

// Filtros desde un enlace (los avisos del tablero): ?stock=without,
// ?precio=without, ?sucursal=3. Quedan como chips quitables del panel.
function filtrosDeLaUrl() {
  const q = route.query || {};
  if (["with", "without", "low"].includes(q.stock)) f.value.stock = q.stock;
  if (q.precio === "with" || q.precio === "without") f.value.price_presence = q.precio;
  const suc = parseInt(String(q.sucursal || ""), 10);
  if (suc > 0) f.value.branch_id = suc;
}

onMounted(() => {
  filtrosDeLaUrl();
  reload();
});

watch(
  () => auth.isAuthed,
  (v) => {
    if (v) reload();
  },
  { immediate: true }
);

watch(
  () => [page.value],
  () => {
    selectedIds.value = [];
  }
);

/* ── Rediseño: franja, panel de filtros y tarjetas ── */
const panelAbierto = ref(false);

const subtitulo = computed(() => {
  const n = Number(stats.value.active || 0);
  let suc = "todas las sucursales";
  if (f.value.branch_id) suc = branchName(f.value.branch_id);
  else if (!isAdmin.value && auth.user?.branch_id) suc = branchName(auth.user.branch_id);
  return `${fmtInt(n)} ${n === 1 ? "activo" : "activos"} · ${suc}`;
});
function millones(v) {
  const n = Number(v || 0);
  if (n >= 1e6) return (n / 1e6).toLocaleString("es-AR", { maximumFractionDigits: 1 }) + " M";
  return Math.round(n).toLocaleString("es-AR");
}
function parte(n) {
  const tot = Number(stats.value.with_stock || 0) + Number(stats.value.without_stock || 0);
  return tot ? `${Math.max(0.5, (Number(n || 0) / tot) * 100)}%` : "0%";
}
function filtroRapido(clave, valor) {
  f.value[clave] = f.value[clave] === valor ? "all" : valor;
  applyFilters();
}
function abrirTarjeta(e, id) {
  if (window.getSelection?.()?.toString()) return;
  const ruta = { name: "productView", params: { id } };
  if (e.button === 1 || e.ctrlKey || e.metaKey) { window.open(router.resolve(ruta).href, "_blank"); return; }
  if (e.type === "click") router.push(ruta);
}
function rubro(item) {
  return [item?.category?.name || item?.rubro, item?.subcategory?.name || item?.subrubro].filter(Boolean).join(" › ");
}
function nivel(item) {
  const n = getStockQty(item);
  return n <= 0 ? "is-sin" : n <= 3 ? "is-bajo" : "is-bien";
}
function stockTexto(item) {
  const n = getStockQty(item);
  if (n <= 0) return "sin stock";
  return `${fmtInt(n)} en stock${n <= 3 ? " · bajo" : ""}`;
}
function sucursalesCortas(item) {
  const lista = enabledBranches(item);
  const base = lista.length ? lista : (Number(item?.branch_id || 0) > 0 ? [{ id: Number(item.branch_id), name: branchName(item.branch_id) }] : []);
  return base.map((b) => ({ ...b, ini: branchInitials(b.name) }));
}
function precioContado(item) {
  return Number(item?.price_discount || 0) || Number(item?.price_list || 0) || 0;
}
const desde = computed(() => (meta.value.total ? (page.value - 1) * Number(limit.value || 24) + 1 : 0));
const hasta = computed(() => Math.min(meta.value.total, (page.value - 1) * Number(limit.value || 24) + items.value.length));

// Grupos del panel. Las cantidades salen de las stats, que respetan búsqueda,
// sucursal, rubro y estado; null = sin cantidad para esa opción.
const gruposFiltro = computed(() => {
  const s = stats.value;
  const op = (clave, value, label, count) => ({ value, label, count, on: f.value[clave] === value });
  const g = [];
  g.push({
    clave: "status", titulo: "Estado",
    opciones: [
      op("status", "active", "Activos", s.active),
      op("status", "inactive", "Inactivos", s.inactive),
    ],
  });
  g.push({
    clave: "stock", titulo: "Stock",
    opciones: [
      op("stock", "with", "Con stock", s.with_stock),
      op("stock", "low", "Stock bajo (3 o menos)", s.low_stock),
      op("stock", "without", "Sin stock", s.without_stock),
    ],
  });
  g.push({ clave: "price_presence", titulo: "Precio", opciones: [op("price_presence", "with", "Con precio", s.with_price), op("price_presence", "without", "Sin precio", s.without_price)] });
  g.push({ clave: "images", titulo: "Fotos", opciones: [op("images", "with", "Con fotos", s.with_images), op("images", "without", "Sin fotos", s.without_images)] });
  g.push({
    clave: "promo", titulo: "Promoción",
    opciones: [
      op("promo", "active", "En promo vigente", s.promo_active),
      op("promo", "scheduled", "Promo programada", null),
      op("promo", "expired", "Promo vencida", null),
      op("promo", "none", "Sin promo", null),
    ],
  });
  if (isAdmin.value) {
    g.push({
      clave: "branch_id", titulo: "Sucursal",
      opciones: branchItems.value.filter((b) => b.value).map((b) => ({ value: b.value, label: b.title, count: null, on: Number(f.value.branch_id) === b.value })),
    });
  }
  return g;
});
const DEFAULTS_FILTRO = { status: "active", stock: "all", price_presence: "all", images: "all", promo: "all", branch_id: null };
function elegirFiltro(clave, valor) {
  const actual = f.value[clave];
  const igual = clave === "branch_id" ? Number(actual) === Number(valor) : actual === valor;
  f.value[clave] = igual ? DEFAULTS_FILTRO[clave] : valor;
  applyFilters();
}

/* ── UI HELPERS ── */
const viewMode = ref('grid');
let _searchTimer = null;
function debouncedSearch() { clearTimeout(_searchTimer); _searchTimer = setTimeout(() => applyFilters(), 400); }
function clearSearch() { f.value.q = ''; applyFilters(); }

/* Filtros avanzados (colapsable + persistencia) */
const ADV_KEY = "lp.products.advancedOpen.v2";
const advancedOpen = ref(false);

/* Scanner cámara (mobile): abre lector y navega al producto encontrado */
const lpScanOpen = ref(false);
try {
  const saved = localStorage.getItem(ADV_KEY);
  if (saved !== null) advancedOpen.value = saved === "1";
} catch {}
function toggleAdvanced() {
  advancedOpen.value = !advancedOpen.value;
  try { localStorage.setItem(ADV_KEY, advancedOpen.value ? "1" : "0"); } catch {}
}

const activeFiltersCount = computed(() => {
  let n = 0;
  if (f.value.branch_id) n++;
  if (f.value.category_id) n++;
  if (f.value.subcategory_id) n++;
  if (f.value.stock !== 'all') n++;
  if (f.value.price_presence !== 'all') n++;
  if (f.value.images !== 'all') n++;
  if (f.value.price_min) n++;
  if (f.value.price_max) n++;
  const defStatus = isAdmin.value ? 'all' : 'active';
  if (f.value.status !== defStatus) n++;
  return n;
});

// Cuenta solo filtros que viven dentro del bloque "Más filtros"
const activeAdvancedCount = computed(() => {
  let n = 0;
  if (f.value.branch_id) n++;
  if (f.value.category_id) n++;
  if (f.value.subcategory_id) n++;
  if (f.value.stock !== 'all') n++;
  if (f.value.price_presence !== 'all') n++;
  if (f.value.images !== 'all') n++;
  if (f.value.promo !== 'all') n++;
  if (f.value.price_min) n++;
  if (f.value.price_max) n++;
  return n;
});

const activeFilterChips = computed(() => {
  const chips = [];
  if (f.value.branch_id) { const b = branchItems.value.find(x => x.value === f.value.branch_id); chips.push({ key: 'branch_id', label: `Sucursal: ${b?.title || f.value.branch_id}` }); }
  if (f.value.category_id) { const c = categoryItems.value.find(x => x.value === f.value.category_id); chips.push({ key: 'category_id', label: `Rubro: ${c?.title || f.value.category_id}` }); }
  if (f.value.subcategory_id) { const s = subcategoryItems.value.find(x => x.value === f.value.subcategory_id); chips.push({ key: 'subcategory_id', label: `Subrubro: ${s?.title || f.value.subcategory_id}` }); }
  if (f.value.stock !== 'all') chips.push({ key: 'stock', label: stockItems.find(x => x.value === f.value.stock)?.title });
  if (f.value.price_presence !== 'all') chips.push({ key: 'price_presence', label: pricePresenceItems.find(x => x.value === f.value.price_presence)?.title });
  if (f.value.images !== 'all') chips.push({ key: 'images', label: imagesItems.find(x => x.value === f.value.images)?.title });
  if (f.value.promo !== 'all') chips.push({ key: 'promo', label: `Promo: ${promoItems.find(x => x.value === f.value.promo)?.title}` });
  if (f.value.price_min) chips.push({ key: 'price_min', label: `Mín $${f.value.price_min}` });
  if (f.value.price_max) chips.push({ key: 'price_max', label: `Máx $${f.value.price_max}` });
  const defStatus = isAdmin.value ? 'all' : 'active';
  if (f.value.status !== defStatus) { const s = statusItems.value.find(x => x.value === f.value.status); chips.push({ key: 'status', label: s?.title }); }
  return chips.filter(c => c.label);
});

function removeFilter(key) {
  const defaults = { branch_id: null, category_id: null, subcategory_id: null, stock: 'all', price_presence: 'all', images: 'all', promo: 'all', price_min: null, price_max: null, status: 'active' };
  f.value[key] = defaults[key];
  if (key === 'category_id') f.value.subcategory_id = null;
  applyFilters();
}

function toggleSelect(id) {
  const idx = selectedIds.value.indexOf(id);
  if (idx >= 0) selectedIds.value.splice(idx, 1);
  else selectedIds.value.push(id);
}

const allSelected = computed(() => items.value.length > 0 && items.value.every(it => selectedIds.value.includes(it.id)));
const someSelected = computed(() => selectedIds.value.length > 0 && !allSelected.value);
function toggleSelectAll(val) { selectedIds.value = val ? items.value.map(it => it.id) : []; }

const CAT_COLORS = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316','#06b6d4'];
function getCategoryColor(item) { const id = Number(item?.category_id || 0); return id ? CAT_COLORS[id % CAT_COLORS.length] : '#6b7280'; }

function getProductImage(item) {
  const imgs = item?.images;
  if (Array.isArray(imgs) && imgs.length) { const f = imgs[0]; return typeof f === 'string' ? f : f?.url || f?.thumbnail || null; }
  return item?.thumbnail || item?.image_url || item?.image || null;
}

function fmtPrice(v) { const n = Number(v||0); if(!n) return '—'; return new Intl.NumberFormat('es-AR').format(Math.round(n)); }

function getStockClass(item) {
  const qty = Number(item?.stock_total ?? item?.stock_qty ?? item?.stock ?? item?.qty ?? -1);
  if (qty < 0) return 'st-unknown'; if (qty === 0) return 'st-zero'; return 'st-ok';
}
function getStockLabel(item) {
  const qty = Number(item?.stock_total ?? item?.stock_qty ?? item?.stock ?? item?.qty ?? -1);
  if (qty < 0) return '—'; if (qty === 0) return 'Sin stock'; return `${qty} uds`;
}
function getStockQty(item) {
  const qty = Number(item?.stock_total ?? item?.stock_qty ?? item?.stock ?? item?.qty ?? 0);
  return Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 0;
}
function stockLevelClass(item) {
  const n = getStockQty(item);
  if (n <= 0) return 'level-out';
  if (n < 5) return 'level-low';
  if (n <= 10) return 'level-mid';
  return 'level-high';
}
function branchCssColor(id) {
  const bid = Number(id || 0);
  if (bid === 1) return 'rgb(var(--v-theme-primary))';
  if (bid === 2) return '#16a34a';
  if (bid === 3) return '#7c3aed';
  return '#6b7280';
}
</script>

<style scoped>
/* ============================================================
   LIST PAGE — patrón estandarizado (lp-*)
   Compartido con PosSalesPage. Mantener sincronizado.
   ============================================================ */

.lp {
  --lp-gap: 14px;
  --lp-radius: 14px;
  --lp-radius-sm: 12px;
  --lp-card-pad: 16px;
  --lp-card-bg: rgb(var(--v-theme-surface));
  --lp-card-border: rgba(var(--v-border-color), var(--v-border-opacity));
  --lp-muted: rgba(var(--v-theme-on-surface), 0.55);
  --lp-strong: rgba(var(--v-theme-on-surface), 0.9);

  display: flex;
  flex-direction: column;
  gap: var(--lp-gap);
  min-width: 0;
}

/* ── HEADER ─────────────────────────────────────────────── */
.lp-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 4px 2px 0;
}
.lp-header__left  { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.lp-header__right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

.lp-title {
  font-size: 22px;
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin: 0;
}
.lp-meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--lp-muted);
}
.lp-meta__strong {
  font-weight: 500;
  color: var(--lp-strong);
  font-feature-settings: "tnum";
}
.lp-meta__sep { opacity: 0.4; }

.lp-view-toggle { border: 1px solid var(--lp-card-border); }

/* ── STATS KPI ──────────────────────────────────────────── */
.lp-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.lp-kpi {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: var(--lp-radius);
  background: var(--lp-card-bg);
  border: 1px solid var(--lp-card-border);
}
.lp-kpi__badge {
  width: 36px; height: 36px;
  border-radius: 10px;
  flex-shrink: 0;
  display: grid; place-items: center;
  margin-top: 2px;
}
.lp-kpi__badge--primary { background: rgb(var(--v-theme-primary)); }
.lp-kpi__badge--green   { background: rgb(var(--v-theme-success)); }
.lp-kpi__badge--orange  { background: var(--pos-kpi-color-1, #f57c00); }
.lp-kpi__badge--indigo  { background: var(--pos-kpi-color-2, #5c6bc0); }
.lp-kpi__body  { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.lp-kpi__lbl   {
  font-size: 11px; font-weight: 400;
  opacity: 0.5;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.lp-kpi__val   {
  font-size: 20px; font-weight: 500;
  line-height: 1.2;
  margin-top: 4px;
  font-feature-settings: "tnum";
}
.lp-kpi__sub   { font-size: 11px; opacity: 0.4; margin-top: 3px; }
.lp-kpi__skel  {
  height: 22px;
  border-radius: 6px;
  background: rgba(var(--v-theme-on-surface), 0.08);
  margin-top: 4px;
  animation: lp-pulse 1.4s ease infinite;
}

/* ── METHOD CARDS ──────────────────────────────────────── */
.lp-methods {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}
.lp-mc {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  border-radius: var(--lp-radius-sm);
  background: var(--lp-card-bg);
  border: 1px solid var(--lp-card-border);
}
.lp-mc__badge {
  width: 30px; height: 30px;
  border-radius: 8px;
  flex-shrink: 0;
  display: grid; place-items: center;
}
.lp-mc__badge--cash     { background: rgb(var(--v-theme-success)); }
.lp-mc__badge--transfer { background: var(--pos-kpi-color-3, #9c27b0); }
.lp-mc__badge--card     { background: rgb(var(--v-theme-info)); }
.lp-mc__badge--mp       { background: var(--pos-kpi-color-1, #f57c00); }
.lp-mc__badge--sjt      { background: var(--pos-kpi-color-4, #009688); }
.lp-mc__badge--promo    {
  background: linear-gradient(135deg, #ff5722 0%, #ff9100 100%);
  box-shadow: 0 2px 6px rgba(255, 87, 34, 0.35);
}
.lp-mc__badge--other    { background: rgba(var(--v-theme-on-surface), 0.35); }

/* KPI clickeable (filtra) */
.lp-mc--clickable {
  cursor: pointer;
  border: 1px solid var(--lp-card-border);
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
  text-align: left;
  font-family: inherit;
}
.lp-mc--clickable:hover {
  border-color: rgba(255, 87, 34, 0.45);
  box-shadow: 0 2px 10px rgba(255, 87, 34, 0.12);
}
.lp-mc--clickable.is-active {
  border-color: rgb(255, 87, 34);
  background: rgba(255, 87, 34, 0.06);
  box-shadow: 0 0 0 1px rgba(255, 87, 34, 0.30);
}
.lp-mc__body { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.lp-mc__lbl  {
  font-size: 10px; font-weight: 400;
  opacity: 0.45;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.lp-mc__val  {
  font-size: 14px; font-weight: 500;
  margin-top: 2px;
  font-feature-settings: "tnum";
}

/* ── FILTER BAR ─────────────────────────────────────────── */
.lp-filters {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--lp-radius);
  background: var(--lp-card-bg);
  border: 1px solid var(--lp-card-border);
}

.lp-filters__primary {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.lp-filters__search { flex: 1 1 280px; min-width: 220px; }
.lp-filters__search :deep(.v-field) { border-radius: 10px; }
.lp-filters__primary-field { flex: 0 0 160px; min-width: 140px; }

.lp-filters__more {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  height: 38px;
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px solid var(--lp-card-border);
  color: rgba(var(--v-theme-on-surface), 0.78);
  font-size: 12.5px;
  font-weight: 400;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: background 0.14s, border-color 0.14s, color 0.14s;
  user-select: none;
}
.lp-filters__more:hover {
  background: rgba(var(--v-theme-on-surface), 0.07);
  color: var(--lp-strong);
}
.lp-filters__more--open {
  background: rgba(var(--v-theme-primary), 0.1);
  border-color: rgba(var(--v-theme-primary), 0.4);
  color: rgb(var(--v-theme-primary));
}
.lp-filters__more-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 6px;
  border-radius: 999px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-size: 10.5px;
  font-weight: 500;
  line-height: 1;
  font-feature-settings: "tnum";
}
.lp-filters__more-chev {
  transition: transform 0.18s ease;
  opacity: 0.7;
}
.lp-filters__more--open .lp-filters__more-chev { transform: rotate(180deg); }

/* Grid filtros avanzados */
.lp-filters__advanced {
  padding-top: 4px;
  border-top: 1px dashed rgba(var(--v-theme-on-surface), 0.08);
}
.lp-filters__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px 12px;
  align-items: start;
  padding-top: 12px;
}
.lp-filters__cell { min-width: 0; }
.lp-filters__cell--range {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 6px;
  align-items: center;
  grid-column: span 2;
}
.lp-filters__range-sep {
  font-size: 12px;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.35);
  line-height: 1;
}
.lp-filters__cell--per-page { max-width: 160px; }

/* Chips activos */
.lp-filters__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  padding-top: 8px;
  border-top: 1px dashed rgba(var(--v-theme-on-surface), 0.08);
}
.lp-filters__chip { font-size: 11px !important; }
.lp-filters__chips-clear {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 8px;
  background: transparent;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  color: rgba(var(--v-theme-on-surface), 0.65);
  font-size: 11px;
  font-weight: 400;
  cursor: pointer;
  transition: background 0.14s, color 0.14s, border-color 0.14s;
}
.lp-filters__chips-clear:hover {
  background: rgba(var(--v-theme-error), 0.08);
  color: rgb(var(--v-theme-error));
  border-color: rgba(var(--v-theme-error), 0.3);
}

/* ── BULK BAR ───────────────────────────────────────────── */
.lp-bulk {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 14px;
  border-radius: var(--lp-radius-sm);
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid var(--lp-card-border);
  min-height: 52px;
  transition: background 0.18s, border-color 0.18s, box-shadow 0.18s;
}
.lp-bulk--active {
  background: rgba(var(--v-theme-primary), 0.08);
  border-color: rgba(var(--v-theme-primary), 0.36);
  box-shadow: 0 4px 14px rgba(var(--v-theme-primary), 0.14);
}
.lp-bulk__select {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  min-width: 0;
}
.lp-bulk__label {
  font-size: 13px;
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), 0.75);
}
.lp-bulk__label strong {
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
  font-feature-settings: "tnum";
}
.lp-bulk__actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

/* ── ALERT ──────────────────────────────────────────────── */
.lp-alert { margin-bottom: 0 !important; }

/* ── CONTENT WRAPPER ───────────────────────────────────── */
.lp-content {
  border-radius: var(--lp-radius);
  background: var(--lp-card-bg);
  border: 1px solid var(--lp-card-border);
  overflow: hidden;
}
.lp-content__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--lp-card-border);
  background: rgba(var(--v-theme-on-surface), 0.015);
}
.lp-content__head-left { display: flex; align-items: center; gap: 8px; }
.lp-content__title { font-size: 13px; font-weight: 500; letter-spacing: 0.01em; }
.lp-content__body { padding: 12px; transition: opacity 0.2s; }
.lp-content__body--loading { opacity: 0.5; pointer-events: none; }

/* ── PAGINATION ─────────────────────────────────────────── */
.lp-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding: 4px 6px 8px;
}
.lp-pagination__info {
  font-size: 12px;
  font-weight: 400;
  color: var(--lp-muted);
  font-feature-settings: "tnum";
}

/* ── EMPTY / SKELETON ──────────────────────────────────── */
.lp-skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}
.lp-skeleton-card {
  height: 240px;
  border-radius: var(--lp-radius-sm);
  background: rgba(var(--v-theme-on-surface), 0.06);
  animation: lp-pulse 1.4s ease infinite;
}
@keyframes lp-pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

.lp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  gap: 8px;
  text-align: center;
}
.lp-empty__title { font-size: 16px; font-weight: 500; }
.lp-empty__sub { font-size: 13px; opacity: 0.55; }

/* ============================================================
   PRODUCTOS — específico (grid de tarjetas + lista)
   ============================================================ */

/* GRID */
.plp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
}

.plp-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-radius: var(--lp-radius-sm);
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: border-color 0.14s, box-shadow 0.14s, transform 0.14s;
}
.plp-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.45);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}
.plp-card--inactive { opacity: 0.6; }

.plp-card-media {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  overflow: hidden;
}
.plp-card-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.plp-card-noimg {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  color: rgba(var(--v-theme-on-surface), 0.3);
}

.plp-stock-badge {
  position: absolute;
  top: 6px; left: 6px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 8px;
  border-radius: 8px;
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.2;
  font-feature-settings: "tnum";
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.22);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  z-index: 2;
}
.plp-stock-badge.level-high { background: rgb(var(--v-theme-success)); }
.plp-stock-badge.level-mid  { background: rgb(var(--v-theme-warning)); }
.plp-stock-badge.level-low,
.plp-stock-badge.level-out  { background: rgb(var(--v-theme-error)); }

.plp-card-check {
  position: absolute;
  top: 4px; right: 4px;
  z-index: 2;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 6px;
  backdrop-filter: blur(4px);
  padding: 2px;
}

.plp-inactive-badge {
  position: absolute;
  bottom: 6px; left: 6px;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(var(--v-theme-error), 0.9);
  color: #fff;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.24);
  z-index: 2;
}

.plp-card-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 9px 10px 10px;
  flex: 1 1 auto;
  min-height: 0;
}

.plp-card-name {
  font-size: 12.5px;
  font-weight: 400;
  line-height: 1.2;
  letter-spacing: -0.005em;
  color: rgb(var(--v-theme-on-surface));
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
  min-height: 2.4em;
}

.plp-card-sku {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: 6px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.16);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10.5px;
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), 0.75);
  letter-spacing: 0.02em;
  width: fit-content;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.plp-card-sku :deep(.v-icon) {
  color: rgb(var(--v-theme-primary));
  opacity: 0.8;
  flex-shrink: 0;
}

.plp-card-meta { display: flex; flex-wrap: wrap; gap: 4px; }

.meta-chip {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.01em;
  text-transform: uppercase;
  line-height: 1.4;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.meta-chip--brand {
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
}
.meta-chip--muted {
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.72);
  text-transform: none;
}
.meta-chip--cat {
  background: rgba(var(--v-theme-on-surface), 0.05);
  color: rgba(var(--v-theme-on-surface), 0.62);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  text-transform: none;
}

.plp-card-branches { display: flex; flex-wrap: wrap; gap: 3px; }

.plp-br-pill {
  --br-color: rgb(var(--v-theme-primary));
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 1px 5px 1px 4px;
  border-radius: 5px;
  background: color-mix(in srgb, var(--br-color) 14%, transparent);
  color: var(--br-color);
  font-size: 9.5px;
  font-weight: 500;
  letter-spacing: 0.02em;
  line-height: 1.4;
  white-space: nowrap;
}
.plp-br-pill :deep(.v-icon) { opacity: 0.72; }
.plp-br-pill--more {
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.plp-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-top: auto;
  padding-top: 4px;
}

.plp-card-price {
  font-size: 15px;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: rgb(var(--v-theme-success));
  font-feature-settings: "tnum";
}
.plp-card-price::before { content: "$ "; opacity: 0.72; font-weight: 400; }
.plp-card-price--none {
  font-size: 11px;
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), 0.4);
  font-style: italic;
}
.plp-card-price--none::before { content: ""; }

.plp-card-actions { display: flex; align-items: center; gap: 0; flex-shrink: 0; }
.plp-card-actions :deep(.v-btn) {
  width: 26px !important;
  height: 26px !important;
  min-width: 26px !important;
}

/* STOCK DOT */
.st-dot { width: 7px; height: 7px; border-radius: 999px; flex-shrink: 0; }
.st-ok .st-dot { background: rgb(var(--v-theme-success)); }
.st-zero .st-dot { background: rgba(var(--v-theme-on-surface), 0.25); }
.st-unknown .st-dot { background: rgba(var(--v-theme-on-surface), 0.15); }
.st-ok { color: rgb(var(--v-theme-success)); }
.st-zero { opacity: 0.5; }
.st-unknown { opacity: 0.35; }

/* LIST */
.plp-list-wrap {
  border-radius: var(--lp-radius-sm);
  overflow: hidden;
  border: 1px solid var(--lp-card-border);
  background: rgb(var(--v-theme-surface));
}
.plp-list-head, .plp-list-row { display: grid; align-items: center; gap: 8px; padding: 10px 14px; }
.plp-list-head {
  grid-template-columns: 32px 1fr 180px 140px 90px 80px 64px;
  background: rgba(var(--v-theme-surface-variant), 0.4);
  border-bottom: 1px solid var(--lp-card-border);
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.7;
}
.plp-list-row {
  grid-template-columns: 32px 1fr 180px 140px 90px 80px 64px;
  cursor: pointer;
  border-bottom: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.6));
  transition: background 0.12s;
}
.plp-list-row:last-child { border-bottom: none; }
.plp-list-row:hover { background: rgba(var(--v-theme-on-surface), 0.035); }
.plp-list-row--inactive { opacity: 0.5; }

.plp-lh-check { display: flex; align-items: center; justify-content: center; }
.plp-lh-name, .plp-row-name { min-width: 0; }
.plp-row-name-text {
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.plp-row-sku { font-size: 10px; opacity: 0.45; font-family: monospace; }
.plp-row-cat { display: flex; flex-wrap: wrap; gap: 3px; min-width: 0; }
.plp-row-branches { display: flex; flex-wrap: wrap; gap: 3px; }
.plp-row-price .plp-price-val { font-size: 13px; font-weight: 500; color: rgb(var(--v-theme-success)); }
.plp-row-stock { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 400; }
.plp-row-actions { display: flex; align-items: center; justify-content: flex-end; gap: 0; }

.plp-tag {
  display: inline-flex;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 400;
  line-height: 1.4;
}
.plp-tag--cat {
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}
.plp-tag--sub {
  background: rgba(var(--v-theme-on-surface), 0.06);
  color: rgba(var(--v-theme-on-surface), 0.65);
}
.plp-more { font-size: 10px; opacity: 0.5; font-weight: 400; }

/* List sin sucursales (cuando no es admin) */
.plp-list-head:not(:has(.plp-lh-branches)),
.plp-list-row:not(:has(.plp-row-branches)) {
  grid-template-columns: 32px 1fr 200px 100px 90px 64px;
}

/* ── RESPONSIVE ─────────────────────────────────────────── */
@media (max-width: 1200px) {
  .lp-methods { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 960px) {
  .lp { gap: 12px; }
  .lp-filters { padding: 10px 12px; }
  .lp-filters__cell--range { grid-column: auto; }
  .lp-stats   { grid-template-columns: repeat(2, 1fr); }
  .lp-methods { grid-template-columns: repeat(3, 1fr); }
}
/* ── FAB Nuevo producto (solo mobile) ──────────────────────────── */
.lp-fab-new {
  position: fixed;
  right: 16px;
  bottom: calc(82px + env(safe-area-inset-bottom, 0px));
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: #1488d1;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.35);
  z-index: 1004;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.15s, background 0.15s;
}
.lp-fab-new:active {
  transform: scale(0.95);
  background: #0e6ba8;
}

/* Botón cámara inline en el buscador (solo mobile) */
.lp-filters__scan {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: none;
  background: #1488d1;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.15s, background 0.15s;
}
.lp-filters__scan:active {
  transform: scale(0.92);
  background: #0e6ba8;
}

@media (max-width: 600px) {
  /* MOBILE — App-style: limpio, denso, sin redundancias.
     Ocultamos lo que no agrega valor en pantalla chica. */
  .lp-stats,
  .lp-methods,
  .lp-bulk,                            /* selector "todos de la página" */
  .lp-content__head,                   /* "Resultados X de Y" (ya está en el header) */
  .plp-card-check,                     /* checkbox sobre la imagen */
  .plp-card-actions,                   /* iconos eye/edit/dots */
  .plp-card-meta,                      /* chips RING/ILUMINACION/etc */
  .plp-card-branches { display: none !important; }

  /* MOBILE: filtros simplificados — solo buscador + cámara. */
  .lp-filters__primary-field,
  .lp-filters__more,
  .lp-filters__advanced,
  .lp-filters__chips { display: none !important; }

  .lp-filters__primary {
    grid-template-columns: 1fr auto !important;
    gap: 8px;
  }

  .lp-view-toggle { display: none !important; }

  /* Cards más densas y minimalistas */
  .lp-content { gap: 8px; }
  .plp-grid { gap: 10px !important; padding: 0 !important; }
  .plp-card {
    border-radius: 14px !important;
    overflow: hidden;
  }
  .plp-card-info {
    padding: 8px 10px 10px !important;
    gap: 4px;
  }
  .plp-card-name {
    font-size: 13px !important;
    line-height: 1.25;
    font-weight: 600;
    letter-spacing: -0.005em;
  }
  .plp-card-sku {
    font-size: 10.5px;
    opacity: 0.55;
    margin-top: 1px;
  }
  .plp-card-footer { padding-top: 4px; }
  .plp-card-price {
    font-size: 15px !important;
    font-weight: 700;
    letter-spacing: -0.01em;
  }
  .plp-stock-badge {
    top: 6px !important;
    left: 6px !important;
    padding: 2px 6px !important;
    font-size: 10.5px !important;
    border-radius: 6px !important;
  }
}

@media (max-width: 768px) {
  .plp-grid { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
  .plp-list-head, .plp-list-row { grid-template-columns: 32px 1fr 120px 70px 64px; }
  .plp-lh-cat, .plp-row-cat { display: none; }
  .lp-bulk { padding: 8px 12px; min-height: 48px; }
  .lp-bulk__label { font-size: 12.5px; }
  .lp-filters__primary-field { flex: 0 0 100%; }
}

@media (max-width: 480px) {
  .lp-title { font-size: 18px; }
  .plp-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
  .plp-card-name { font-size: 12px; }
  .plp-card-price { font-size: 14px; }
  .lp-pagination { flex-direction: column; align-items: center; gap: 6px; }
  .lp-content__body { padding: 10px; }
  /* En mobile el botón "Promos" ocupa demasiado: lo reducimos a icono */
  .lp-cta-promos .v-btn__content,
  .lp-promo-btn-text { display: none; }
}

/* Mobile pequeño: 2 columnas siempre (la app debe sentirse densa pero usable) */
@media (max-width: 360px) {
  .plp-grid { grid-template-columns: 1fr 1fr; gap: 6px; }
  .plp-card-info { padding: 8px; }
  .plp-card-meta { display: none; }
  .plp-card-branches { display: none; }
}

/* ── KIT badges ── */
.plp-kit-badge {
  position: absolute;
  bottom: 8px; left: 8px;
  display: inline-flex; align-items: center; gap: 3px;
  background: linear-gradient(135deg, #7c3aed, #9333ea);
  color: #fff;
  font-size: 9.5px; font-weight: 600; letter-spacing: 0.5px;
  padding: 3px 7px; border-radius: 4px;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.45);
  text-transform: uppercase;
}
.plp-kit-pill {
  display: inline-flex; align-items: center; gap: 2px;
  background: linear-gradient(135deg, #7c3aed, #9333ea);
  color: #fff;
  font-size: 9px; font-weight: 600; letter-spacing: 0.4px;
  padding: 2px 6px; border-radius: 4px;
  text-transform: uppercase;
  margin-right: 6px;
  vertical-align: 1px;
}
</style>

<style>
/* Productos (rediseño). Sin scoped: todo cuelga de .pl; tema oscuro con
   :is(.v-theme--dark, .v-theme--adminDark) .pl. Mismos tokens que Ventas y el tablero. */
.pos-container:has(.pl) { max-width: none !important; padding: 0 !important; margin: 0 !important; }
.pl {
  --pl-fondo: #d6e6f3; --pl-caja: #ffffff; --pl-borde: #d3dde7; --pl-linea: #e3eaf1; --pl-texto: #0f172a;
  --pl-suave: #5a6678; --pl-tenue: #94a3b8; --pl-acento: #0f6fae; --pl-banda: #0f6fae; --pl-banda-borde: #0d5f96;
  --pl-rubro: #3f8fc6; --pl-hover: #f3f8fc; --pl-foto: #ffffff; --pl-suc: #eef5fb; --pl-suc-txt: #0a466e;
  padding: 20px 28px 32px; min-height: calc(100vh - 56px); box-sizing: border-box; background: var(--pl-fondo); color: var(--pl-texto);
  display: flex; flex-direction: column; gap: 14px;
}
:is(.v-theme--dark, .v-theme--adminDark) .pl {
  --pl-fondo: #0b0f14; --pl-caja: #151c25; --pl-borde: #253141; --pl-linea: #222c39; --pl-texto: #e5edf5;
  --pl-suave: #9aa8b8; --pl-tenue: #64748b; --pl-acento: #5aaee0; --pl-banda: #0f5f96; --pl-banda-borde: #0c4f7d;
  --pl-rubro: #6fb3e0; --pl-hover: #1a2430; --pl-foto: #ffffff; --pl-suc: #1f2b3a; --pl-suc-txt: #9cc9ea;
}
.pl > * { max-width: 1500px; width: 100%; margin-left: auto; margin-right: auto; box-sizing: border-box; }
.pl .num { font-variant-numeric: tabular-nums; }
.pl .clamp1 { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pl-esp { flex: 1; }
.pl-s { font-size: 12px; color: var(--pl-suave); }
.pl-b { font-weight: 700; }
.pl-suave { color: var(--pl-suave); }
.pl-link { display: inline-flex; align-items: center; font-size: 15px; font-weight: 800; color: var(--pl-acento); text-decoration: none; white-space: nowrap; }
.pl-link:hover { text-decoration: underline; }
.pl-link--chico { font-size: 13px; }
.pl-link--suave { color: var(--pl-suave); font-weight: 700; }

.pl-cab { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; }
.pl-cab__txt { display: flex; flex-direction: column; gap: 2px; }
.pl-cab__titulo { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.2; }
.pl-cab__sub { font-size: 14px; font-weight: 600; color: var(--pl-suave); }
.pl-nuevo { height: 42px !important; border-radius: 10px !important; font-weight: 800 !important; text-transform: none !important; letter-spacing: 0 !important; }

.pl-busca { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.pl-busca__campo { flex: 1 1 380px; height: 46px; display: flex; align-items: center; gap: 10px; padding: 0 6px 0 14px; border-radius: 10px; background: var(--pl-caja); border: 1px solid var(--pl-borde); box-sizing: border-box; }
.pl-busca__campo:focus-within { border-color: #3f8fc6; box-shadow: 0 0 0 3px rgba(63, 143, 198, 0.18); }
.pl-busca__ic { color: var(--pl-suave); }
.pl-busca__input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; font-family: inherit; font-size: 15px; color: var(--pl-texto); }
.pl-busca__input::placeholder { color: var(--pl-tenue); }
.pl-busca__scan { width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border: 0; border-radius: 8px; background: transparent; color: var(--pl-suave); }
.pl-busca__filtros { height: 34px; display: inline-flex; align-items: center; gap: 6px; padding: 0 12px; border-radius: 8px; border: 1px solid #8cc0e3; background: transparent; font-family: inherit; font-size: 14px; font-weight: 800; color: var(--pl-acento); cursor: pointer; white-space: nowrap; }
.pl-busca__n { min-width: 20px; height: 20px; padding: 0 4px; border-radius: 6px; background: #0f6fae; color: #ffffff; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; box-sizing: border-box; }
.pl-chip { height: 34px; display: inline-flex; align-items: center; gap: 4px; padding: 0 4px 0 12px; border-radius: 8px; background: var(--pl-caja); border: 1px solid #8cc0e3; font-size: 14px; font-weight: 700; white-space: nowrap; }
.pl-chip__x { width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 6px; background: transparent; color: var(--pl-suave); cursor: pointer; }
.pl-vista { display: flex; gap: 2px; padding: 4px; border-radius: 10px; background: var(--pl-caja); border: 1px solid var(--pl-borde); }
.pl-vista button { width: 36px; height: 34px; display: flex; align-items: center; justify-content: center; border: 0; border-radius: 8px; background: transparent; color: var(--pl-suave); cursor: pointer; }
.pl-vista button.is-on { background: #0f6fae; color: #ffffff; }
.pl-mas { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 10px; border: 1px solid var(--pl-borde); background: var(--pl-caja); color: var(--pl-suave); cursor: pointer; }

.pl-resumen { display: flex; flex-direction: column; gap: 8px; padding: 12px 16px; border-radius: 12px; background: var(--pl-caja); border: 1px solid var(--pl-borde); }
.pl-resumen__cifras { display: flex; align-items: center; gap: 6px 22px; flex-wrap: wrap; font-size: 15px; font-weight: 700; color: var(--pl-suave); }
.pl-resumen__cifras b { font-size: 20px; font-weight: 800; color: var(--pl-texto); }
.pl-leyenda { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.pl-leyenda button { display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 8px; border: 1px solid transparent; border-radius: 8px; background: transparent; font-family: inherit; font-size: 13px; font-weight: 700; color: var(--pl-texto); cursor: pointer; }
.pl-leyenda button:hover { background: var(--pl-hover); }
.pl-leyenda button.is-on { border-color: #8cc0e3; background: var(--pl-hover); }
.pl-leyenda i { width: 10px; height: 10px; border-radius: 3px; display: block; }
.pl .c-bien { background: #2E9E7B; } .pl .c-bajo { background: #8cc0e3; } .pl .c-sin { background: #C3C9D6; } .pl .c-precio { background: #f0b429; }
.pl-partes { display: flex; gap: 2px; height: 8px; }
.pl-partes > span { display: block; height: 8px; border-radius: 3px; }

.pl-usd { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; padding: 12px 16px; border-radius: 12px; background: var(--pl-caja); border: 1px solid #8cc0e3; }
.pl-usd__txt { flex: 1; min-width: 260px; display: flex; flex-direction: column; gap: 2px; font-size: 13px; color: var(--pl-suave); }
.pl-usd__txt b { font-size: 15px; color: var(--pl-texto); }
.pl-masiva { display: flex; align-items: center; gap: 16px; padding: 8px 14px; border-radius: 10px; background: var(--pl-caja); border: 1px solid #8cc0e3; }
.pl-masiva__sel { display: flex; align-items: center; gap: 6px; font-size: 14px; cursor: pointer; }
.pl-masiva__no { margin-left: auto; font-size: 13px; font-weight: 700; color: var(--pl-suave); }

.pl-contenido.is-cargando { opacity: .6; transition: opacity .15s; }
.pl-vacio { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 48px 16px; border-radius: 12px; background: var(--pl-caja); border: 1px solid var(--pl-borde); color: var(--pl-suave); font-size: 15px; font-weight: 600; }

/* grilla */
.pl-grilla { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }
.pl-card { display: flex; flex-direction: column; border-radius: 12px; overflow: hidden; background: var(--pl-caja); border: 1px solid var(--pl-borde); cursor: pointer; transition: border-color .15s, box-shadow .15s; }
.pl-card:hover { border-color: #8cc0e3; box-shadow: 0 6px 18px rgba(10, 70, 110, 0.10); }
.pl-card.is-sel { border-color: #0f6fae; box-shadow: 0 0 0 2px rgba(15, 111, 174, 0.25); }
.pl-card.is-inactivo { opacity: .6; }
.pl-card--esqueleto { height: 330px; background: linear-gradient(90deg, var(--pl-caja), var(--pl-hover), var(--pl-caja)); }
.pl-card__foto { position: relative; height: 160px; display: flex; align-items: center; justify-content: center; background: var(--pl-foto); border-bottom: 1px solid var(--pl-linea); color: #94a3b8; }
.pl-card__foto img { max-width: 100%; height: 160px; object-fit: contain; }
.pl-card__check { position: absolute; top: 6px; right: 6px; border-radius: 8px; background: rgba(255, 255, 255, 0.92); }
.pl-marca { position: absolute; top: 8px; left: 8px; height: 22px; padding: 0 8px; border-radius: 6px; background: #334155; color: #ffffff; font-size: 11px; font-weight: 800; display: flex; align-items: center; text-transform: uppercase; letter-spacing: .04em; }
.pl-card__info { flex: 1; padding: 10px 12px 12px; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.pl-rubro { font-size: 10px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--pl-rubro); }
.pl-card__nombre { font-size: 14px; font-weight: 800; line-height: 1.2; min-height: 34px; color: var(--pl-texto); text-decoration: none; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.pl-card__nombre:hover { text-decoration: underline; }
.pl-card__stock { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: var(--pl-suave); }
.pl-card__stock i { width: 8px; height: 8px; border-radius: 9999px; display: block; flex-shrink: 0; background: #C3C9D6; }
.pl-card__stock.is-bien { color: #1f7a5f; } .pl-card__stock.is-bien i { background: #2E9E7B; }
.pl-card__stock.is-bajo { color: var(--pl-suc-txt); } .pl-card__stock.is-bajo i { background: #8cc0e3; }
:is(.v-theme--dark, .v-theme--adminDark) .pl-card__stock.is-bien { color: #5fc9a6; }
.pl-suc { height: 20px; padding: 0 6px; border-radius: 5px; background: var(--pl-suc); color: var(--pl-suc-txt); font-size: 11px; font-weight: 800; display: inline-flex; align-items: center; margin-left: 3px; }
.pl-esp-v { flex: 1; }
.pl-card__pie { display: flex; align-items: flex-end; justify-content: space-between; gap: 6px; margin-top: 4px; }
.pl-card__precios { display: flex; flex-direction: column; min-width: 0; }
.pl-card__precio { font-size: 18px; font-weight: 800; }

/* lista: tabla cerrada */
.pl-tabla-caja { border-radius: 12px; overflow: auto; background: var(--pl-caja); border: 1px solid var(--pl-borde); }
.pl-tabla { width: 100%; border-collapse: collapse; table-layout: fixed; min-width: 1040px; }
.pl-tabla th { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; color: #ffffff; background: var(--pl-banda); text-align: left; padding: 10px 12px; border: 1px solid var(--pl-banda-borde); border-top: 0; }
.pl-tabla td { padding: 6px 12px; border: 1px solid var(--pl-linea); vertical-align: middle; font-size: 14px; overflow: hidden; }
.pl-tabla th:first-child, .pl-tabla td:first-child { border-left: 0; }
.pl-tabla th:last-child, .pl-tabla td:last-child { border-right: 0; }
.pl-tabla tbody tr { cursor: pointer; }
.pl-tabla tbody tr:hover td { background: var(--pl-hover); }
.pl-tabla tr.is-inactivo td { opacity: .6; }
.pl-tabla .c-check { width: 48px; padding: 0 6px; }
.pl-tabla .c-foto { width: 60px; padding: 4px 8px; }
.pl-tabla .c-rubro { width: 170px; }
.pl-tabla .c-stock { width: 80px; }
.pl-tabla .c-suc { width: 130px; }
.pl-tabla .c-plata { width: 112px; text-align: right; white-space: nowrap; }
.pl-tabla .c-ver { width: 80px; }
.pl-tabla__nombre { display: block; color: var(--pl-texto); text-decoration: none; }
.pl-tabla__nombre:hover { text-decoration: underline; }
.pl-mini { width: 44px; height: 44px; border-radius: 8px; border: 1px solid var(--pl-linea); display: flex; align-items: center; justify-content: center; overflow: hidden; background: var(--pl-foto); color: #94a3b8; }
.pl-mini img { width: 44px; height: 44px; object-fit: contain; }

.pl-pie { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.pl-pie__info { font-size: 14px; font-weight: 600; color: var(--pl-suave); }

/* panel de filtros */
.pl-panel { position: fixed; top: 56px; right: 0; bottom: 0; width: 400px; max-width: 100vw; z-index: 1006; display: flex; flex-direction: column; background: var(--pl-caja); border-left: 2px solid #8cc4e8; box-shadow: -12px 0 32px rgba(10, 70, 110, 0.16); color: var(--pl-texto); }
.pl-panel__cab { display: flex; align-items: center; justify-content: space-between; padding: 12px 12px 12px 20px; background: #0f6fae; color: #ffffff; font-size: 18px; font-weight: 800; }
.pl-panel__cerrar { width: 40px; height: 40px; display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 8px; background: transparent; color: #ffffff; cursor: pointer; }
.pl-panel__cuerpo { flex: 1; min-height: 0; overflow-y: auto; padding: 4px 20px 12px; }
.pl-grupo { display: flex; flex-direction: column; gap: 2px; padding: 12px 0; border-bottom: 1px solid var(--pl-linea); }
.pl-grupo:last-child { border-bottom: 0; }
.pl-grupo__tit { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; color: var(--pl-suave); margin-bottom: 6px; }
.pl-op { display: flex; align-items: center; gap: 10px; width: 100%; padding: 6px 4px; border: 0; border-radius: 6px; background: transparent; font-family: inherit; color: var(--pl-texto); cursor: pointer; text-align: left; }
.pl-op:hover { background: var(--pl-hover); }
.pl-op__caja { width: 20px; height: 20px; flex-shrink: 0; border-radius: 5px; border: 2px solid #9fb3c8; box-sizing: border-box; display: flex; align-items: center; justify-content: center; }
.pl-op.is-on .pl-op__caja { background: #0f6fae; border-color: #0f6fae; }
.pl-op__eti { flex: 1; font-size: 15px; font-weight: 600; }
.pl-op__n { font-size: 14px; font-weight: 800; }
.pl-op.is-on .pl-op__n { color: var(--pl-acento); }
.pl-op.is-cero { opacity: .5; }
.pl-rango { display: flex; gap: 8px; }
.pl-rango input { flex: 1; min-width: 0; height: 40px; padding: 0 10px; border-radius: 8px; border: 1px solid var(--pl-borde); background: var(--pl-caja); color: var(--pl-texto); font-family: inherit; font-size: 14px; }
.pl-porpag { display: flex; gap: 6px; }
.pl-porpag button { flex: 1; height: 36px; border-radius: 8px; border: 1px solid var(--pl-borde); background: var(--pl-caja); color: var(--pl-texto); font-family: inherit; font-size: 14px; font-weight: 700; cursor: pointer; }
.pl-porpag button.is-on { background: #0f6fae; border-color: #0f6fae; color: #ffffff; }
.pl-panel__pie { padding: 14px 20px; border-top: 1px solid var(--pl-borde); }
.pl-panel__ver { width: 100%; height: 46px; border: 0; border-radius: 10px; background: #0f6fae; color: #ffffff; font-family: inherit; font-size: 15px; font-weight: 800; cursor: pointer; }
.pl-panel-enter-active, .pl-panel-leave-active { transition: transform .18s ease; }
.pl-panel-enter-from, .pl-panel-leave-to { transform: translateX(100%); }

@media (max-width: 900px) {
  .pl { padding: 14px 12px 96px; }
  .pl-grilla { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .pl-card__foto, .pl-card__foto img { height: 130px; }
  .pl-resumen__cifras b { font-size: 18px; }
  .pl-panel { top: 0; width: 100vw; z-index: 2400; }
}
</style>
