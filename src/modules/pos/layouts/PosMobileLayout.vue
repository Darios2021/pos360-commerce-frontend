<!--
  PosMobileLayout: Vender en el teléfono (maqueta aprobada, pantalla 4).

  - Buscador con el ícono del escáner adentro (el escáner ya no es un botón
    central de la barra).
  - Chips de rubro.
  - Lista de productos: tocar una fila suma una unidad y el badge muestra la
    cantidad. Los productos sin stock aparecen apagados y no se pueden tocar.
  - Barra fija sobre la navegación con la cantidad, el total y un único botón
    Cobrar. Tocar el total abre la venta en curso (/app/pos/venta).

  El escritorio no usa este archivo (PosGridLayout). El carrito, la caja y el
  cobro son los mismos de siempre (pos.store y usePosSalesFlow).
-->
<template>
  <div class="vn m-vista">
    <!-- Vista completa (maqueta diseno-cargador): Vender salió de la barra
         inferior; se entra desde Inicio o Más y se vuelve con la flecha. -->
    <header class="mv-tb mv-tb--atras">
      <button type="button" class="mv-ib" aria-label="Volver" @click="volver"><v-icon size="24">mdi-chevron-left</v-icon></button>
      <h2 class="mv-tit">Vender</h2>
      <router-link :to="{ name: 'caja' }" class="m-pill" :class="{ cerrada: !isCajaOpen }">
        <i></i><span>{{ isCajaOpen ? (currentCashRegisterId ? `Caja #${currentCashRegisterId}` : "Caja abierta") : "Caja cerrada" }}</span>
      </router-link>
    </header>
    <div class="vn-cu">
      <label class="m-bus">
        <v-icon size="20">mdi-magnify</v-icon>
        <input
          v-model="q"
          type="search"
          enterkeyhint="search"
          placeholder="Buscar producto o código"
          aria-label="Buscar producto o código"
          @input="onTyping"
          @keyup.enter="onEnter"
        />
        <button type="button" class="cam" aria-label="Escanear" @click.prevent="scannerOpen = true">
          <v-icon size="24">mdi-barcode-scan</v-icon>
        </button>
      </label>

      <div v-if="rubros.length" class="m-chips">
        <button type="button" class="m-chip" :class="{ on: !rubroId }" @click="elegirRubro(null)">Todos</button>
        <button
          v-for="c in rubros"
          :key="c.id"
          type="button"
          class="m-chip"
          :class="{ on: Number(rubroId) === Number(c.id) }"
          @click="elegirRubro(c.id)"
        >{{ c.name }}</button>
      </div>

      <div class="m-pz">
        <div v-if="loading && !items.length" class="m-vacio">Cargando…</div>
        <div v-else-if="!items.length" class="m-vacio">Sin resultados</div>
        <button
          v-for="p in items"
          :key="p.id"
          type="button"
          class="m-it"
          :disabled="sinStock(p)"
          @click="agregar(p)"
        >
          <span class="m-foto">
            <img v-if="productImage(p)" :src="productImage(p)" alt="" loading="lazy" />
            <v-icon v-else size="24">mdi-package-variant-closed</v-icon>
            <span v-if="enCarrito(p)" class="q num">{{ enCarrito(p) }}</span>
          </span>
          <span class="tx">
            <b>{{ p.name }}</b>
            <small class="num">{{ [sinStock(p) ? "" : `${cant(p.stock_qty)} u.`, p.barcode || p.sku || p.code].filter(Boolean).join(" · ") }}</small>
          </span>
          <span class="der">
            <b class="num">{{ pesos(precio(p)) }}</b>
            <span v-if="sinStock(p)" class="m-est gr">Sin stock</span>
          </span>
        </button>
        <div v-if="pages > 1" class="vn-pag">
          <button type="button" class="m-lnk" :disabled="page <= 1" @click="prevPage">Anteriores</button>
          <span class="m-sub num">{{ page }} de {{ pages }}</span>
          <button type="button" class="m-lnk" :disabled="page >= pages" @click="nextPage">Siguientes</button>
        </div>
      </div>
    </div>

    <div class="vn-carro">
      <router-link :to="{ name: 'posCarrito' }" class="vn-carro__tt" aria-label="Venta en curso">
        <small>{{ cantidadRotulo }}</small>
        <b class="num">{{ pesos(totalCarrito) }}</b>
      </router-link>
      <router-link v-if="!isCajaOpen" :to="{ name: 'cajaAbrir' }" class="m-btn vn-carro__btn">Abrir caja</router-link>
      <button v-else type="button" class="m-btn vn-carro__btn" :disabled="!cartCount" @click="openCheckoutSafe">Cobrar</button>
    </div>

    <!-- Escáner: suma a la venta y sigue leyendo -->
    <BarcodeScannerDialog
      v-model="scannerOpen"
      mode="emit-product"
      continuous
      title="Escanear"
      @product="onScanProduct"
    />
    <MovilAviso alto="140px" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import http from "@/app/api/http";
import BarcodeScannerDialog from "@/app/components/BarcodeScannerDialog.vue";
import MovilAviso from "@/app/components/movil/MovilAviso.vue";
import { usePosSalesFlow } from "../containers/usePosSalesFlow";
import { usePosProductSearch } from "../composables/usePosProductSearch";
import { usePosImages } from "../composables/usePosImages";
import { pesos } from "../utils/cobroReglas";

const {
  posStore,
  cartItems,
  cartCount,
  isCajaOpen,
  currentCashRegisterId,
  activeBranchId,
  openCheckoutSafe,
  handleAddConsultaToCart,
  toast,
} = usePosSalesFlow();

const { productImage, prefetchImagesForVisible } = usePosImages();

// Búsqueda propia del teléfono: trae también los sin stock, para mostrarlos
// apagados (maqueta). El mostrador de escritorio sigue con la suya.
const {
  q,
  rubroId,
  page,
  pages,
  items,
  loading,
  searchNow,
  onTyping,
  onEnter,
  prevPage,
  nextPage,
  setRubro,
} = usePosProductSearch({
  branchId: activeBranchId,
  warehouseId: computed(() => Number(posStore?.warehouse_id || 0) || null),
  initialLimit: 40,
  inStock: false,
  sellable: true,
  minSearchLength: 2,
  debounceMs: 400,
  autoSearch: true,
  keepResultsOnShortQuery: true,
});

const scannerOpen = ref(false);
const route = useRoute();
const router = useRouter();
function volver() {
  if (window.history.state?.back) router.back();
  else router.replace({ name: "home" });
}

// "Agregar a la venta" desde la consulta de producto: /app/pos?agregar=<id>.
async function agregarDesdeConsulta() {
  const id = Number(route.query.agregar || 0);
  if (!id) return;
  router.replace({ query: { ...route.query, agregar: undefined } });
  // La caja se carga en paralelo: se espera a saber si está abierta (hasta 4 s).
  if (!isCajaOpen.value) {
    await new Promise((listo) => {
      const corte = setTimeout(() => { parar(); listo(); }, 4000);
      const parar = watch(isCajaOpen, (v) => { if (v) { clearTimeout(corte); parar(); listo(); } });
    });
  }
  try {
    const params = { ids: String(id), limit: 1 };
    if (activeBranchId?.value) params.branch_id = activeBranchId.value;
    const { data } = await http.get("/pos/products", { params });
    const filas = Array.isArray(data) ? data : data?.data || data?.items || [];
    const p = filas.find((x) => Number(x.id) === id);
    if (p) agregar(p);
    else toast("Sin stock para vender");
  } catch {
    toast("Sin conexión");
  }
}
const categorias = ref([]);
const rubros = computed(() =>
  (categorias.value || []).filter((c) => c && c.id && c.name && c.is_active !== false && !c.parent_id)
);

function cant(n) {
  const v = Number(n || 0);
  return Number.isInteger(v) ? String(v) : v.toLocaleString("es-AR", { maximumFractionDigits: 3 });
}
function sinStock(p) {
  return Number(p?.stock_qty ?? p?.qty ?? 0) <= 0;
}
function precio(p) {
  return Number(p?.price_discount || p?.effective_price || p?.price || p?.price_list || 0);
}
const porProducto = computed(() => {
  const m = new Map();
  for (const it of cartItems.value || []) {
    const id = Number(it?.id ?? it?.product_id ?? 0);
    if (id) m.set(id, (m.get(id) || 0) + Number(it?.qty || 0));
  }
  return m;
});
function enCarrito(p) {
  return porProducto.value.get(Number(p.id)) || 0;
}
const totalCarrito = computed(() => (cartItems.value || []).reduce((a, it) => a + Number(it.subtotal || 0), 0));
const cantidadRotulo = computed(() => (cartCount.value === 1 ? "1 artículo" : `${cant(cartCount.value)} artículos`));

function agregar(p) {
  if (sinStock(p)) return;
  const img = productImage(p);
  handleAddConsultaToCart(img ? { ...p, image: img } : p);
}
function onScanProduct(p) {
  if (p) handleAddConsultaToCart(p);
  else toast("Código no encontrado");
}
function elegirRubro(id) {
  const actual = rubroId.value ? Number(rubroId.value) : null;
  const nuevo = id ? Number(id) : null;
  if (actual !== nuevo) setRubro(nuevo);
}

// Avisos del store (stock insuficiente) en el aviso breve, sin emojis.
watch(
  () => posStore.toast?.show && posStore.toast?.text,
  (t) => {
    if (!t) return;
    toast(String(t).replace(/^[^\p{L}\p{N}$]+/u, "").trim());
    posStore.toast.show = false;
  }
);

watch(
  () => [page.value, items.value.length],
  () => prefetchImagesForVisible?.(items.value),
  { flush: "post" }
);
watch(
  () => activeBranchId?.value,
  (n, o) => { if (n && n !== o) searchNow({ force: true, resetPage: true }); }
);

onMounted(async () => {
  try {
    const { data } = await http.get("/categories");
    categorias.value = Array.isArray(data) ? data : data?.items || data?.data || data?.rows || [];
  } catch {
    categorias.value = [];
  }
  await searchNow({ force: true });
  agregarDesdeConsulta();
});
</script>

<style scoped>
.vn {
  position: fixed;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--m-canvas);
}
.vn-cu {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overscroll-behavior: contain;
}
.vn-cu > * { flex-shrink: 0; }
.vn-pag { display: flex; align-items: center; justify-content: space-between; padding: 4px 16px; border-top: 1px solid var(--m-linea2); }
.vn-pag .m-lnk[disabled] { opacity: 0.4; }
.vn-carro {
  flex: none;
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--m-pieza);
  border-top: 1px solid var(--m-linea);
  padding: 10px 16px;
}
.vn-carro__tt { flex: 1; min-width: 0; text-decoration: none; color: var(--m-tinta); }
.vn-carro__tt small { display: block; font-size: 13px; color: var(--m-suave); }
.vn-carro__tt b { font-size: 20px; font-weight: 800; }
.vn-carro__btn { width: 150px; flex: none; }
</style>
