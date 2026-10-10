<!-- src/modules/pos/pages/PosSalesPage.vue -->
<template>
  <div class="vt">
    <!-- ── Encabezado ───────────────────────────────────── -->
    <div class="vt-cab">
      <div class="vt-cab__txt">
        <h1 class="vt-cab__titulo">Ventas</h1>
        <span class="vt-cab__sub num">{{ subtitulo }}</span>
      </div>
      <div class="vt-cab__acciones">
        <div class="vt-periodos" role="group" aria-label="Período">
          <button
            v-for="p in PERIODOS"
            :key="p.value"
            type="button"
            class="vt-periodo"
            :class="{ 'is-activo': periodoActivo === p.value }"
            @click="elegirPeriodo(p.value)"
          >{{ p.nombre }}</button>
        </div>
        <button type="button" class="vt-filtros-btn" @click="panelAbierto = true">
          <v-icon size="20">mdi-tune-variant</v-icon>
          Filtros
          <span v-if="filtrosActivos" class="vt-filtros-btn__n num">{{ filtrosActivos }}</span>
        </button>
      </div>
    </div>

    <!-- ── Buscador y filtros activos ───────────────────── -->
    <div class="vt-busca">
      <div class="vt-busca__campo">
        <v-icon size="22" class="vt-busca__ic">mdi-magnify</v-icon>
        <input
          v-model="q"
          type="search"
          class="vt-busca__input"
          placeholder="Número de venta, cliente, documento o producto"
          @input="applyFilters"
          @keyup.enter="applyFiltersImmediate"
        />
      </div>
      <span v-for="chip in chips" :key="chip.key" class="vt-chip">
        {{ chip.label }}
        <button type="button" class="vt-chip__x" :aria-label="`Quitar ${chip.label}`" @click="quitarChip(chip.key)">
          <v-icon size="18">mdi-close</v-icon>
        </button>
      </span>
    </div>

    <!-- ── Resumen en una franja ─────────────────────────── -->
    <div class="vt-resumen">
      <div class="vt-resumen__cifras">
        <span class="num">Facturado <b>{{ plata(stats.gross_total_sum) }}</b></span>
        <span class="num">Devoluciones <b>{{ plata(stats.refunds_sum) }}</b></span>
        <span class="num">Neto <b>{{ plata(stats.total_sum) }}</b></span>
        <v-progress-circular v-if="statsLoading" indeterminate size="18" width="2" color="primary" />
      </div>
      <template v-if="medios.length">
        <span class="vt-partes">
          <span v-for="m in medios" :key="m.key" :style="{ width: m.ancho + '%', background: m.color }"></span>
        </span>
        <div class="vt-leyenda">
          <span v-for="m in medios" :key="m.key" class="num">
            <i :style="{ background: m.color }"></i>{{ m.etiqueta }} <em>{{ plata(m.total) }} · {{ m.pct }} %</em>
          </span>
        </div>
      </template>
    </div>

    <!-- ── Tabla (escritorio) ────────────────────────────── -->
    <div class="vt-tabla-caja">
      <v-progress-linear v-if="loading" indeterminate color="primary" height="3" class="vt-carga" />
      <div class="vt-tabla-scroll">
        <table class="vt-tabla">
          <thead>
            <tr>
              <th class="c-n">N°</th>
              <th class="c-fecha">Fecha</th>
              <th class="c-cajero">Cajero</th>
              <th>Productos</th>
              <th class="c-cobro">Cobro</th>
              <th class="c-total">Total</th>
              <th class="c-estado">Estado</th>
              <th class="c-ver"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in sales" :key="s.id" class="vt-fila" @click="abrirFila($event, s.id)" @auxclick="abrirFila($event, s.id)">
              <td class="c-n num"><router-link :to="rutaVenta(s.id)" class="vt-link" @click.stop>#{{ s.id }}</router-link></td>
              <td class="num"><div class="vt-b">{{ dia(s.sold_at) }}</div><div class="vt-s">{{ hora(s.sold_at) }} h</div></td>
              <td><div class="vt-b clamp1">{{ nombreCajero(s) }}</div><div class="vt-s clamp1">{{ s.branch?.name || `Sucursal #${s.branch_id}` }}</div></td>
              <td class="c-prod">
                <div class="vt-p clamp1">{{ primaryProductName(s) }}<span v-if="productExtraCount(s)" class="vt-mas"> y {{ productExtraCount(s) }} más</span></div>
                <div class="vt-s clamp1">{{ s.customer_name || 'Consumidor final' }} · {{ unidades(s) }}</div>
              </td>
              <td>
                <span class="vt-medio"><i :style="{ background: colorMedio(primaryPayment(s)?.method) }"></i>{{ methodLabel(primaryPayment(s)?.method) }}</span>
                <div class="vt-s num">{{ detalleCobro(s) }}</div>
              </td>
              <td class="c-total num">{{ plata(s.total) }}</td>
              <td><span class="vt-estado" :class="`is-${String(s.status || '').toLowerCase()}`"><i></i>{{ statusLabel(s.status) }}</span></td>
              <td class="c-ver"><router-link :to="rutaVenta(s.id)" class="vt-ver" @click.stop>Ver<v-icon size="18">mdi-chevron-right</v-icon></router-link></td>
            </tr>
            <tr v-if="!loading && !sales.length">
              <td colspan="8" class="vt-vacio">No hay ventas con estos filtros</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Teléfono: la misma venta en tarjeta, también enlace -->
      <div class="vt-tarjetas">
        <router-link v-for="s in sales" :key="s.id" :to="rutaVenta(s.id)" class="vt-tarjeta">
          <div class="vt-tarjeta__fila">
            <span class="vt-link num">#{{ s.id }}</span>
            <span class="vt-s num">{{ dia(s.sold_at) }} · {{ hora(s.sold_at) }} h</span>
            <span class="vt-tarjeta__total num">{{ plata(s.total) }}</span>
          </div>
          <div class="vt-p clamp1">{{ primaryProductName(s) }}<span v-if="productExtraCount(s)" class="vt-mas"> y {{ productExtraCount(s) }} más</span></div>
          <div class="vt-tarjeta__fila">
            <span class="vt-medio"><i :style="{ background: colorMedio(primaryPayment(s)?.method) }"></i>{{ methodLabel(primaryPayment(s)?.method) }}</span>
            <span class="vt-s clamp1">{{ nombreCajero(s) }}</span>
            <span class="vt-estado" :class="`is-${String(s.status || '').toLowerCase()}`"><i></i>{{ statusLabel(s.status) }}</span>
          </div>
        </router-link>
        <div v-if="!loading && !sales.length" class="vt-vacio">No hay ventas con estos filtros</div>
      </div>

      <div v-if="meta.total > 0" class="vt-pie">
        <span class="num vt-pie__info">{{ desde }} a {{ hasta }} de {{ miles(meta.total) }}</span>
        <v-pagination
          v-model="meta.page"
          :length="meta.pages || 1"
          :total-visible="5"
          density="comfortable"
          size="small"
          class="vt-paginas"
          @update:model-value="refreshAll"
        />
      </div>
    </div>

    <!-- ── Panel de filtros: convive con el listado, no es un modal ── -->
    <Transition name="vt-panel">
      <aside v-if="panelAbierto" class="vt-panel" aria-label="Filtros">
        <div class="vt-panel__cab">
          <span>Filtros</span>
          <button type="button" class="vt-panel__cerrar" aria-label="Cerrar filtros" @click="panelAbierto = false">
            <v-icon size="24">mdi-close</v-icon>
          </button>
        </div>

        <div class="vt-panel__cuerpo">
          <div v-for="g in grupos" :key="g.clave" class="vt-grupo">
            <span class="vt-grupo__tit">{{ g.titulo }}</span>
            <button
              v-for="o in g.opciones"
              :key="String(o.value)"
              type="button"
              class="vt-op"
              :class="{ 'is-on': o.on, 'is-cero': !o.count && !o.on }"
              @click="elegirOpcion(g.clave, o.value)"
            >
              <span class="vt-op__caja"><v-icon v-if="o.on" size="16" color="white">mdi-check</v-icon></span>
              <span class="vt-op__eti">{{ o.label }}</span>
              <span class="vt-op__n num">{{ miles(o.count) }}</span>
            </button>
          </div>

          <div class="vt-grupo">
            <span class="vt-grupo__tit">Producto vendido</span>
            <v-autocomplete
              v-model="productPick"
              :items="productItems"
              :loading="productLoading"
              placeholder="Buscar producto"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              return-object
              item-title="title"
              item-value="value"
              :no-filter="true"
              @update:search="onProductSearch"
              @update:model-value="applyFiltersImmediate"
            />
          </div>

          <div class="vt-grupo">
            <span class="vt-grupo__tit">Fechas</span>
            <div class="vt-fechas">
              <label class="vt-fecha"><span>Desde</span><input v-model="from" type="date" @change="applyFiltersImmediate" /></label>
              <label class="vt-fecha"><span>Hasta</span><input v-model="to" type="date" @change="applyFiltersImmediate" /></label>
            </div>
          </div>
        </div>

        <div class="vt-panel__pie">
          <button type="button" class="vt-panel__ver num" @click="panelAbierto = false">
            Ver {{ miles(stats.sales_count) }} {{ stats.sales_count === 1 ? 'venta' : 'ventas' }}
          </button>
        </div>
      </aside>
    </Transition>

    <v-snackbar v-model="snack.show" :timeout="3200">{{ snack.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import http from "../../../app/api/http";
import { useAuthStore } from "../../../app/store/auth.store";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

// =====================
// debounce
// =====================
function debounce(fn, wait = 250) {
  let t = null;
  const debounced = (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
  debounced.cancel = () => clearTimeout(t);
  return debounced;
}

// =====================
// Helpers ID venta
// =====================
function getSaleId(saleLike) {
  const candidates = [
    saleLike?.sale_id,
    saleLike?.saleId,
    saleLike?.id,
    saleLike?.sale?.id,
    saleLike?.sale?.sale_id,
    saleLike?.sale?.saleId,
  ];
  for (const c of candidates) {
    const n = Number(c || 0);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

// ===== Admin (UI) =====
const isAdmin = computed(() => {
  const u = auth?.user || {};
  if (u.is_admin === true || u.isAdmin === true || u.admin === true) return true;
  const roleId = Number(u.role_id || u.roleId || u.perfil_id || 0);
  if (Number.isFinite(roleId) && roleId === 1) return true;
  const raw = [];
  const push = (r) => {
    if (!r) return;
    if (typeof r === "string") raw.push(r);
    else if (typeof r?.name === "string") raw.push(r.name);
    else if (typeof r?.role === "string") raw.push(r.role);
    else if (typeof r?.role?.name === "string") raw.push(r.role.name);
  };
  if (Array.isArray(u.roles)) u.roles.forEach(push);
  if (u.role) push(u.role);
  if (u.perfil) push(u.perfil);
  const roles = raw.map((s) => String(s || "").trim().toLowerCase()).filter(Boolean);
  return roles.some((r) =>
    ["admin", "administrador", "administrator", "super_admin", "superadmin", "root", "owner", "dueño", "dueno"].includes(r),
  );
});

const userBranchId = computed(() => {
  const u = auth?.user || null;
  const id = Number(u?.branch_id || auth?.branchId || 0);
  return Number.isFinite(id) && id > 0 ? id : null;
});

const selectedBranchId = ref(null);
const effectiveBranchId = computed(() => {
  if (isAdmin.value) {
    const v = Number(selectedBranchId.value || 0);
    return Number.isFinite(v) && v > 0 ? v : null;
  }
  return userBranchId.value;
});

// ===== Branches =====
const branches = ref([]);
const branchesLoading = ref(false);

function pickArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}

const branchSelectItems = computed(() => {
  const arr = Array.isArray(branches.value) ? branches.value : [];
  return [
    { title: "Todas", value: null },
    ...arr
      .filter((b) => String(b?.is_active ?? 1) !== "0")
      .map((b) => ({ title: b.name || `Sucursal #${b.id}`, value: Number(b.id) })),
  ];
});

async function loadBranchesIfAdmin() {
  if (!isAdmin.value) return;
  branchesLoading.value = true;
  try {
    const { data } = await http.get("/branches");
    if (!data?.ok) throw new Error(data?.message || "Error listando sucursales");
    branches.value = pickArray(data) || [];
  } catch (e) {
    console.warn("No pude cargar /branches:", e?.message || e);
  } finally {
    branchesLoading.value = false;
  }
}

// ===== UI/data =====
const dense = ref(false);
const loading = ref(false);
const sales = ref([]);
const meta = ref({ page: 1, limit: 20, total: 0, pages: 1 });

const status = ref("PAID");
const from = ref("");
const to = ref("");
const fromMenu = ref(false);
const toMenu = ref(false);
const snack = ref({ show: false, text: "" });

/* Filtros avanzados (colapsable + persistencia) */
const ADV_KEY = "lp.sales.advancedOpen";
const advancedOpen = ref(false);
try {
  const saved = localStorage.getItem(ADV_KEY);
  if (saved !== null) advancedOpen.value = saved === "1";
} catch {}
function toggleAdvanced() {
  advancedOpen.value = !advancedOpen.value;
  try { localStorage.setItem(ADV_KEY, advancedOpen.value ? "1" : "0"); } catch {}
}

const q = ref("");
const sellerId = ref(null);
const productPick = ref(null);
const payMethod = ref("");
const menuOpen = ref({});

// ===== autocomplete data =====
const sellerItems = ref([]);
const sellerLoading = ref(false);
const productItems = ref([]);
const productLoading = ref(false);
const cacheSellers = ref([]);
const cacheProducts = ref([]);

// ===== stats =====
const statsLoading = ref(false);
const stats = ref({
  ready: false,
  sales_count: 0,
  total_sum: 0,
  paid_sum: 0,
  refunds_sum: 0,
  gross_total_sum: 0,
  gross_paid_sum: 0,
  net_by_method: {
    cash: 0,
    transfer: 0,
    card: 0,
    mercadopago: 0,
    credit_sjt: 0,
    other: 0,
    raw_by_method: {},
  },
});

const statusItems = [
  { title: "Todos", value: "" },
  { title: "Pagada", value: "PAID" },
  { title: "Borrador", value: "DRAFT" },
  { title: "Cancelada", value: "CANCELLED" },
  { title: "Reintegrada", value: "REFUNDED" },
];

const payMethodItems = [
  { title: "Todos", value: "" },
  { title: "Efectivo", value: "CASH" },
  { title: "Tarjeta", value: "CARD" },
  { title: "Transferencia", value: "TRANSFER" },
  { title: "Mercado Pago", value: "MERCADOPAGO" },
  { title: "San Juan Crédito", value: "CREDIT_SJT" },
  { title: "Otro", value: "OTHER" },
];

const headers = [
  { title: "Fecha", key: "sold_at", sortable: false, width: 160 },
  { title: "Cajero / Sucursal", key: "seller", sortable: false, width: 180 },
  { title: "Cliente", key: "customer", sortable: false, width: 200 },
  { title: "Producto", key: "product", sortable: false, width: 220 },
  { title: "Total", key: "total", sortable: false, width: 170 },
  { title: "Método", key: "method", sortable: false, width: 180 },
  { title: "Estado", key: "status", sortable: false, width: 120 },
  { title: "", key: "actions", sortable: false, width: 80 },
];

// ===== Active filters =====
const activeFilterChips = computed(() => {
  const chips = [];
  if (String(q.value || "").trim()) chips.push({ key: "q", label: `Buscar: "${q.value}"` });
  if (sellerId.value) {
    const s = sellerItems.value.find((x) => x.value === sellerId.value);
    chips.push({ key: "sellerId", label: `Cajero: ${s?.title || "#" + sellerId.value}` });
  }
  if (productPick.value) {
    const t = productPick.value?.title || String(productPick.value);
    chips.push({ key: "productPick", label: `Producto: ${t}` });
  }
  if (String(payMethod.value || "").trim()) {
    chips.push({ key: "payMethod", label: `Pago: ${methodLabel(payMethod.value)}` });
  }
  if (isAdmin.value && selectedBranchId.value) {
    const b = branchSelectItems.value.find((x) => x.value === selectedBranchId.value);
    chips.push({ key: "branch", label: `Suc: ${b?.title || "#" + selectedBranchId.value}` });
  }
  return chips;
});

// Cuenta solo filtros que viven en el bloque "Más filtros"
const activeAdvancedCount = computed(() => {
  let n = 0;
  if (sellerId.value) n++;
  if (productPick.value) n++;
  if (String(payMethod.value || "").trim()) n++;
  if (isAdmin.value && selectedBranchId.value) n++;
  if (from.value) n++;
  if (to.value) n++;
  return n;
});

const isToday = computed(() => {
  const t = formatLocalDate(new Date());
  return normalizeDate(from.value) === t && normalizeDate(to.value) === t;
});

function removeChip(key) {
  if (key === "q") q.value = "";
  if (key === "sellerId") sellerId.value = null;
  if (key === "productPick") productPick.value = null;
  if (key === "payMethod") payMethod.value = "";
  if (key === "branch") selectedBranchId.value = null;
  applyFiltersImmediate();
}

// ===== Helpers =====
function toast(msg) {
  snack.value = { show: true, text: String(msg || "Error") };
}
function money(val) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(val || 0));
}
function dt(val) {
  return val ? new Date(val).toLocaleString("es-AR") : "—";
}
function fullUserName(u) {
  const fn = String(u?.first_name || "").trim();
  const ln = String(u?.last_name || "").trim();
  return `${fn} ${ln}`.trim() || "";
}
function formatLocalDate(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function normalizeDate(v) {
  if (!v) return "";
  if (typeof v === "string") return v.slice(0, 10);
  return formatLocalDate(v);
}
function toStartOfDay(dateStr) {
  const d = normalizeDate(dateStr);
  if (!d) return "";
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day, 0, 0, 0, 0).toISOString();
}
function toEndOfDay(dateStr) {
  const d = normalizeDate(dateStr);
  if (!d) return "";
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day, 23, 59, 59, 999).toISOString();
}
function safeJsonParse(v) {
  if (!v) return null;
  if (typeof v === "object") return v;
  const s = String(v || "").trim();
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}
function normStr(v) {
  return String(v || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}
function detectProviderCode(payment) {
  const p = payment || {};
  const ref = String(p.reference || p.ref || "").trim().toUpperCase();
  if (ref === "SJCREDIT" || ref === "SJ_CREDIT" || ref === "SANJUANCREDITO" || ref === "SANJUAN_CREDITO") return "credit_sjt";
  const direct = p.provider_code || p.providerCode || p.provider || p.gateway || p.brand || "";
  const d1 = normStr(direct);
  if (d1) return d1;
  const noteObj = safeJsonParse(p.note);
  const c2 = normStr(noteObj?.provider_code || noteObj?.providerCode || noteObj?.provider || noteObj?.code);
  if (c2) return c2;
  const noteTxt = String(p.note || "").toLowerCase();
  if (noteTxt.includes("credit_sjt") || noteTxt.includes("creditsjt") || noteTxt.includes("sjcredit")) return "credit_sjt";
  return "";
}
function resolvePaymentMethod(payment) {
  const p = payment || {};
  const prov = detectProviderCode(p);
  if (prov === "credit_sjt") return "CREDIT_SJT";
  const up = String(p.method || "").trim().toUpperCase();
  if (up === "CASH" || up === "CARD" || up === "TRANSFER" || up === "MERCADOPAGO" || up === "QR" || up === "OTHER") {
    return up === "QR" ? "MERCADOPAGO" : up;
  }
  if (up === "CREDIT_SJT") return "CREDIT_SJT";
  return up || "OTHER";
}
function methodLabel(m) {
  const x = String(m || "").toUpperCase();
  if (x === "CASH") return "Efectivo";
  if (x === "TRANSFER") return "Transferencia";
  if (x === "CARD") return "Tarjeta";
  if (x === "MERCADOPAGO" || x === "QR") return "Mercado Pago";
  if (x === "CREDIT_SJT" || x === "CREDIT_SJ" || x === "SJCREDIT") return "San Juan Crédito";
  if (x === "OTHER") return "Otro";
  return m || "—";
}
function payColor(m) {
  const x = String(m || "").toUpperCase();
  if (x === "CASH") return "green";
  if (x === "TRANSFER") return "purple";
  if (x === "CARD") return "blue";
  if (x === "MERCADOPAGO" || x === "QR") return "orange";
  if (x === "CREDIT_SJT" || x === "CREDIT_SJ" || x === "SJCREDIT") return "teal";
  return "grey";
}
function statusLabel(s) {
  const x = String(s || "").toUpperCase();
  if (x === "PAID") return "Pagada";
  if (x === "DRAFT") return "Borrador";
  if (x === "CANCELLED") return "Anulada";
  if (x === "REFUNDED") return "Reintegrada";
  return s || "—";
}
function statusColor(s) {
  const x = String(s || "").toUpperCase();
  if (x === "PAID") return "green";
  if (x === "CANCELLED") return "red";
  if (x === "REFUNDED") return "orange";
  if (x === "DRAFT") return "blue";
  return "grey";
}
function numOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}
function parseProductIdFromText(text) {
  const s = String(text || "");
  const m1 = s.match(/SKU\s*[:#]?\s*([0-9]{2,})/i);
  if (m1?.[1]) { const n = Number(m1[1]); return Number.isFinite(n) && n > 0 ? n : null; }
  const m2 = s.match(/ID\s*[:#]?\s*([0-9]{1,})/i);
  if (m2?.[1]) { const n = Number(m2[1]); return Number.isFinite(n) && n > 0 ? n : null; }
  return null;
}
const productId = computed(() => {
  const v = productPick.value;
  if (!v) return null;
  const direct = Number(v?.value ?? v?.id ?? 0);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const raw = String(v?.title ?? v?.value ?? v ?? "");
  return parseProductIdFromText(raw);
});
function pickSaleItems(saleLike) {
  const candidates = [saleLike?.sale_items, saleLike?.saleItems, saleLike?.items, saleLike?.SaleItems];
  for (const c of candidates) if (Array.isArray(c)) return c;
  return [];
}
function primaryProduct(item) {
  const items = pickSaleItems(item);
  return items[0] || null;
}
function primaryProductName(item) {
  const it = primaryProduct(item);
  return it?.product_name_snapshot || it?.product?.name || (it?.product_id ? `Producto #${it.product_id}` : "(sin items)");
}
function primaryProductSku(item) {
  const it = primaryProduct(item);
  const sku = it?.product_sku_snapshot || it?.product?.sku || "";
  return sku ? `SKU: ${sku}` : "";
}
function productExtraCount(item) {
  return Math.max(0, (pickSaleItems(item)?.length || 0) - 1);
}
function buildParams(page, limit) {
  const hasFrom = !!normalizeDate(from.value);
  const hasTo = !!normalizeDate(to.value);
  const s = numOrNull(sellerId.value);
  const p = numOrNull(productId.value);
  const pmRaw = String(payMethod.value || "").trim();
  const pmUp = pmRaw ? pmRaw.toUpperCase() : "";
  const st = String(status.value || "").trim();
  const qq = String(q.value || "").trim();
  let pmSend = pmUp;
  if (pmSend === "QR") pmSend = "MERCADOPAGO";
  if (pmSend === "CREDIT_SJT") pmSend = "credit_sjt";
  const params = {
    page,
    limit,
    q: qq || undefined,
    status: st || undefined,
    seller_id: s ?? undefined,
    product_id: p ?? undefined,
    pay_method: pmSend || undefined,
  };
  if (effectiveBranchId.value) params.branch_id = effectiveBranchId.value;
  if (hasFrom) params.from = toStartOfDay(from.value);
  if (hasTo) params.to = toEndOfDay(to.value);
  return params;
}
function primaryPayment(saleLike) {
  const pays = Array.isArray(saleLike?.payments) ? saleLike.payments : [];
  if (!pays.length) return null;
  const sorted = [...pays].sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0));
  const p = sorted[0] || pays[0] || null;
  if (!p) return null;
  return { ...p, method: resolvePaymentMethod(p) };
}
function paymentMeta(payment) {
  const p = payment || {};
  const noteObj = safeJsonParse(p.note) || {};
  return noteObj && typeof noteObj === "object" ? noteObj : {};
}
function paymentInstallments(payment) {
  const p = payment || {};
  const meta = paymentMeta(p);
  const n = Number(p.installments ?? meta.installments ?? 0);
  return Number.isFinite(n) && n > 0 ? n : null;
}
function paymentPerInstallment(payment) {
  const meta = paymentMeta(payment);
  const n = Number(meta.per_installment_list ?? meta.perInstallmentList ?? 0);
  return Number.isFinite(n) && n > 0 ? n : null;
}
function paymentListTotal(payment) {
  const meta = paymentMeta(payment);
  const n = Number(meta.list_total ?? meta.listTotal ?? 0);
  return Number.isFinite(n) && n > 0 ? n : null;
}
function paymentReference(payment) {
  return String(payment?.reference || "").trim();
}
function paymentCardKindLabel(payment) {
  const meta = paymentMeta(payment);
  const x = String(meta.card_kind || meta.cardKind || "").trim().toUpperCase();
  if (x === "CREDIT") return "Crédito";
  if (x === "DEBIT" || x === "DEBITO" || x === "DÉBITO") return "Débito";
  return "";
}
function paymentPriceBasisLabel(payment) {
  const meta = paymentMeta(payment);
  const x = String(meta.price_basis || meta.priceBasis || "").trim().toUpperCase();
  if (x === "LIST") return "Precio lista";
  if (x === "DISCOUNT") return "Descuento";
  if (x === "RESELLER") return "Revendedor";
  return "";
}
function normalizeOptions(list) {
  const arr = Array.isArray(list) ? list : [];
  return arr.map((x) => {
    if (typeof x === "string") {
      const parsed = parseProductIdFromText(x);
      return { title: x, value: parsed ?? x, _raw: x };
    }
    const id = x?.value ?? x?.id ?? x?.user_id ?? x?.product_id ?? x?.customer_id ?? x?.seller_id ?? null;
    const title = x?.title ?? x?.name ?? x?.full_name ?? x?.label ?? x?.text ?? (id != null ? String(id) : "");
    const value = x?.value ?? (id != null ? Number(id) : title) ?? title;
    return { title: String(title || ""), value, _raw: x };
  }).filter((i) => i.title);
}
function localFilter(items, qx) {
  const term = String(qx || "").trim().toLowerCase();
  if (!term) return items.slice(0, 25);
  return items.filter((i) => String(i.title || "").toLowerCase().includes(term)).slice(0, 25);
}

// ===== Fetch =====
async function fetchSales() {
  loading.value = true;
  try {
    const { data } = await http.get("/pos/sales", { params: buildParams(meta.value.page, meta.value.limit) });
    if (!data?.ok) throw new Error(data?.message || "Error listando ventas");
    sales.value = Array.isArray(data.data) ? data.data : [];
    meta.value = data.meta || meta.value;
    const alive = new Set(sales.value.map((x) => Number(x?.id)).filter((x) => Number.isFinite(x)));
    const next = { ...(menuOpen.value || {}) };
    for (const k of Object.keys(next)) { if (!alive.has(Number(k))) delete next[k]; }
    menuOpen.value = next;
  } catch (e) {
    toast(e?.response?.data?.message || e?.message || "Error");
  } finally {
    loading.value = false;
  }
}

function normKey(k) { return String(k || "").trim().toLowerCase().replace(/[^a-z0-9]/g, ""); }
function sumKeys(obj, keys) {
  const o = obj || {};
  const map = new Map();
  for (const [k, v] of Object.entries(o)) map.set(normKey(k), Number(v || 0));
  const seen = new Set();
  let total = 0;
  for (const kk of keys) {
    const nk = normKey(kk);
    if (seen.has(nk)) continue;
    seen.add(nk);
    total += Number(map.get(nk) || 0);
  }
  return Number.isFinite(total) ? total : 0;
}
function hasOwnNumericValues(obj) {
  if (!obj || typeof obj !== "object") return false;
  return Object.entries(obj).some(([k, v]) => k !== "raw_by_method" && Number.isFinite(Number(v)));
}

async function fetchStats() {
  statsLoading.value = true;
  try {
    const base = buildParams(1, 1);
    delete base.page;
    delete base.limit;
    const { data } = await http.get("/pos/sales/stats", { params: base });
    if (!data?.ok) throw new Error(data?.message || "Error calculando stats");
    const d = data.data || {};
    const nbm = d.net_by_method || {};
    const raw = nbm.raw_by_method || d.raw_by_method || {};
    const source = hasOwnNumericValues(nbm) ? nbm : raw;
    const toNum = (v) => { const n = Number(v || 0); return Number.isFinite(n) ? n : 0; };
    const cash = sumKeys(source, ["cash", "CASH"]);
    const transfer = sumKeys(source, ["transfer", "TRANSFER"]);
    const card = sumKeys(source, ["card", "CARD"]);
    const mercadopago = sumKeys(source, ["mercadopago", "MERCADOPAGO", "mercado_pago", "mp", "MP", "qr", "QR"]);
    const credit_sjt = sumKeys(source, ["credit_sjt", "CREDIT_SJT", "creditsjt", "sjcredit", "sj_credit", "sjuancredito", "sanjuancredito"]);
    const accounted = cash + transfer + card + mercadopago + credit_sjt;
    const totalBySource = Object.entries(source || {}).reduce((acc, [k, v]) => {
      if (k === "raw_by_method") return acc;
      return acc + toNum(v);
    }, 0);
    const other = Math.max(0, totalBySource - accounted);
    stats.value = {
      ready: true,
      sales_count: toNum(d.sales_count),
      total_sum: toNum(d.total_sum),
      paid_sum: toNum(d.paid_sum),
      refunds_sum: toNum(d.refunds_sum),
      gross_total_sum: toNum(d.gross_total_sum),
      gross_paid_sum: toNum(d.gross_paid_sum),
      net_by_method: { cash, transfer, card, mercadopago, credit_sjt, other, raw_by_method: raw || {} },
    };
  } catch (e) {
    stats.value.ready = false;
    toast(e?.response?.data?.message || e?.message || "Error stats");
  } finally {
    statsLoading.value = false;
  }
}

async function refreshAll() {
  await Promise.all([fetchSales(), fetchStats(), fetchFacets()]);
}

const applyFiltersDebounced = debounce(() => { meta.value.page = 1; refreshAll(); }, 180);
function applyFilters() { applyFiltersDebounced(); }
function applyFiltersImmediate() { applyFiltersDebounced.cancel?.(); meta.value.page = 1; refreshAll(); }
onBeforeUnmount(() => { applyFiltersDebounced.cancel?.(); });

// ===== Autocomplete loaders =====
let tSeller = null;
async function onSellerSearch(qx) {
  clearTimeout(tSeller);
  tSeller = setTimeout(async () => {
    sellerLoading.value = true;
    try {
      const { data } = await http.get("/pos/sales/options/sellers", {
        params: { q: qx || "", limit: 25, ...(effectiveBranchId.value ? { branch_id: effectiveBranchId.value } : {}) },
      });
      if (data?.ok) { sellerItems.value = normalizeOptions(data.data || []); cacheSellers.value = sellerItems.value; }
      else sellerItems.value = localFilter(cacheSellers.value, qx);
    } catch { sellerItems.value = localFilter(cacheSellers.value, qx); }
    finally { sellerLoading.value = false; }
  }, 250);
}

let tProd = null;
async function onProductSearch(qx) {
  clearTimeout(tProd);
  tProd = setTimeout(async () => {
    productLoading.value = true;
    try {
      const { data } = await http.get("/pos/sales/options/products", {
        params: { q: qx || "", limit: 25, ...(effectiveBranchId.value ? { branch_id: effectiveBranchId.value } : {}) },
      });
      if (data?.ok) { productItems.value = normalizeOptions(data.data || []); cacheProducts.value = productItems.value; }
      else productItems.value = localFilter(cacheProducts.value, qx);
    } catch { productItems.value = localFilter(cacheProducts.value, qx); }
    finally { productLoading.value = false; }
  }, 250);
}

function onBranchChanged() {
  sellerId.value = null;
  productPick.value = null;
  onSellerSearch("");
  onProductSearch("");
  applyFiltersImmediate();
}

function goDetail(id, tab = "") {
  const saleId = Number(id || 0);
  if (!Number.isFinite(saleId) || saleId <= 0) return toast("ID inválido");
  router.push({ name: "posSaleDetail", params: { id: saleId }, query: tab ? { tab } : {} });
}
function onRowClick(_, row) {
  const item = row?.item;
  if (!item) return;
  goDetail(item.id);
}
function closeMenu(id) { menuOpen.value = { ...(menuOpen.value || {}), [String(id)]: false }; }
function actView(id) { closeMenu(id); goDetail(id); }
function actRefund(id) { closeMenu(id); goDetail(id, "refunds"); }
function actExchange(id) { closeMenu(id); goDetail(id, "exchanges"); }

function todayISO() { return formatLocalDate(new Date()); }
function clearDates() { from.value = ""; to.value = ""; applyFiltersImmediate(); }
function setToday() { const t = todayISO(); from.value = t; to.value = t; applyFiltersImmediate(); }
function setThisWeek() {
  const now = new Date();
  const day = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  from.value = formatLocalDate(monday);
  to.value = formatLocalDate(sunday);
  applyFiltersImmediate();
}
function setThisMonth() {
  const now = new Date();
  from.value = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1));
  to.value = formatLocalDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  applyFiltersImmediate();
}
function resetFilters() {
  q.value = "";
  sellerId.value = null;
  productPick.value = null;
  payMethod.value = "";
  status.value = "PAID";
  from.value = "";
  to.value = "";
  meta.value.page = 1;
  if (isAdmin.value) selectedBranchId.value = null;
  refreshAll();
}
function prevPage() { if (meta.value.page > 1) { meta.value.page--; refreshAll(); } }
function nextPage() { if (meta.value.page < meta.value.pages) { meta.value.page++; refreshAll(); } }
function toggleDense() { dense.value = !dense.value; }

async function copyText(txt) {
  try { if (!txt) return; await navigator.clipboard.writeText(txt); toast("Copiado"); }
  catch { toast("No se pudo copiar"); }
}

function exportCsv() {
  if (!sales.value.length) return;
  const rows = sales.value.map((s) => {
    const p = primaryPayment(s);
    return {
      id: s.id,
      sold_at: dt(s.sold_at),
      branch: s.branch?.name || s.branch_id,
      seller: s.user?.username || fullUserName(s.user) || s.user_id,
      customer_name: s.customer_name || "Consumidor Final",
      customer_doc: s.customer_doc || "",
      customer_phone: s.customer_phone || "",
      product: primaryProductName(s),
      status: statusLabel(s.status),
      total: Number(s.total || 0),
      paid_total: Number(s.paid_total || 0),
      method: methodLabel(p?.method),
      installments: paymentInstallments(p) || "",
      per_installment: paymentPerInstallment(p) || "",
      card_kind: paymentCardKindLabel(p) || "",
      price_basis: paymentPriceBasisLabel(p) || "",
      reference: paymentReference(p) || "",
    };
  });
  const header = Object.keys(rows[0]).join(",");
  const body = rows.map((r) => Object.values(r).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([header + "\n" + body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ventas_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const deletingId = ref(null);
const deleteDialog = ref({ show: false, sale: null });
function openDelete(item) { if (!isAdmin.value) return; deleteDialog.value = { show: true, sale: item }; }
async function deleteSaleConfirmed() {
  const id = getSaleId(deleteDialog.value.sale);
  if (!id) return toast("ID de venta inválido");
  deletingId.value = id;
  try {
    const { data } = await http.delete(`/pos/sales/${id}`);
    if (!data?.ok) throw new Error(data?.message || "No se pudo anular");
    toast(data?.message || "Venta anulada. Stock restaurado.");
    deleteDialog.value = { show: false, sale: null };
    await refreshAll();
  } catch (e) {
    toast(e?.response?.data?.message || e?.message || "Error eliminando");
  } finally {
    deletingId.value = null;
  }
}

// =====================
// Rediseño: período, panel de filtros, resumen y filas
// =====================
const PERIODOS = [
  { value: "hoy", nombre: "Hoy" },
  { value: "semana", nombre: "Semana" },
  { value: "mes", nombre: "Mes" },
  { value: "12m", nombre: "12 meses" },
  { value: "fechas", nombre: "Fechas" },
];
const panelAbierto = ref(false);

function rangoSemana() {
  const now = new Date();
  const day = now.getDay() || 7;
  const lunes = new Date(now);
  lunes.setDate(now.getDate() - (day - 1));
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  return [formatLocalDate(lunes), formatLocalDate(domingo)];
}
function rangoMes() {
  const now = new Date();
  return [formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1)), formatLocalDate(new Date(now.getFullYear(), now.getMonth() + 1, 0))];
}
function rango12m() {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  return [formatLocalDate(d), formatLocalDate(now)];
}
const periodoActivo = computed(() => {
  const f = normalizeDate(from.value), t = normalizeDate(to.value);
  if (!f && !t) return "";
  const hoy = formatLocalDate(new Date());
  const igual = ([a, b]) => f === a && t === b;
  if (f === hoy && t === hoy) return "hoy";
  if (igual(rangoSemana())) return "semana";
  if (igual(rangoMes())) return "mes";
  if (igual(rango12m())) return "12m";
  return "fechas";
});
function elegirPeriodo(v) {
  if (v === "fechas") { panelAbierto.value = true; return; }
  // Tocar el período activo lo quita: vuelve a "desde el inicio"
  if (periodoActivo.value === v) { from.value = ""; to.value = ""; applyFiltersImmediate(); return; }
  const r = v === "hoy" ? [formatLocalDate(new Date()), formatLocalDate(new Date())]
    : v === "semana" ? rangoSemana() : v === "mes" ? rangoMes() : rango12m();
  from.value = r[0];
  to.value = r[1];
  applyFiltersImmediate();
}

// Cantidades del panel: cada grupo contado contra los demás filtros (API /facets)
const facets = ref({ status: [], branch: [], pay_method: [], seller: [] });
async function fetchFacets() {
  try {
    const base = buildParams(1, 1);
    delete base.page;
    delete base.limit;
    const { data } = await http.get("/pos/sales/facets", { params: base });
    if (data?.ok) facets.value = { status: [], branch: [], pay_method: [], seller: [], ...(data.data || {}) };
  } catch {
    // sin cantidades el panel sigue sirviendo para filtrar
  }
}
const contar = (lista, v) => Number((lista || []).find((x) => String(x.value) === String(v))?.count || 0);

const ESTADOS_PLURAL = { PAID: "Pagadas", CANCELLED: "Anuladas", REFUNDED: "Reintegradas", DRAFT: "Borradores" };

const grupos = computed(() => {
  const g = [];
  g.push({
    clave: "status", titulo: "Estado",
    opciones: Object.entries(ESTADOS_PLURAL)
      .map(([value, label]) => ({ value, label, count: contar(facets.value.status, value), on: status.value === value }))
      .filter((o) => o.count || o.on || o.value === "PAID" || o.value === "CANCELLED"),
  });
  if (isAdmin.value) {
    const lista = (branches.value || [])
      .filter((b) => String(b?.is_active ?? 1) !== "0")
      .map((b) => ({ value: Number(b.id), label: b.name || `Sucursal #${b.id}` }));
    for (const f of facets.value.branch || []) {
      if (!lista.some((b) => b.value === Number(f.value))) lista.push({ value: Number(f.value), label: f.label });
    }
    g.push({
      clave: "branch", titulo: "Sucursal",
      opciones: lista
        .map((b) => ({ ...b, count: contar(facets.value.branch, b.value), on: Number(selectedBranchId.value) === b.value }))
        .sort((a, b) => b.count - a.count),
    });
  }
  g.push({
    clave: "pay_method", titulo: "Medio de pago",
    opciones: payMethodItems
      .filter((m) => m.value)
      .map((m) => ({ value: m.value, label: methodLabel(m.value), count: contar(facets.value.pay_method, m.value), on: String(payMethod.value || "").toUpperCase() === m.value }))
      .sort((a, b) => b.count - a.count),
  });
  const cajeros = (facets.value.seller || []).map((s) => ({ value: Number(s.value), label: s.label, count: Number(s.count || 0), on: Number(sellerId.value) === Number(s.value) }));
  if (sellerId.value && !cajeros.some((c) => c.on)) {
    cajeros.unshift({ value: Number(sellerId.value), label: nombreCajeroElegido.value, count: 0, on: true });
  }
  g.push({ clave: "seller", titulo: "Cajero", opciones: cajeros });
  return g;
});

const nombreCajeroElegido = computed(() => {
  const id = Number(sellerId.value || 0);
  if (!id) return "";
  return (facets.value.seller || []).find((s) => Number(s.value) === id)?.label
    || sellerItems.value.find((x) => Number(x.value) === id)?.title
    || `Usuario #${id}`;
});

function elegirOpcion(clave, v) {
  if (clave === "status") status.value = status.value === v ? "" : v;
  if (clave === "pay_method") payMethod.value = String(payMethod.value || "").toUpperCase() === v ? "" : v;
  if (clave === "seller") sellerId.value = Number(sellerId.value) === Number(v) ? null : v;
  if (clave === "branch") {
    selectedBranchId.value = Number(selectedBranchId.value) === Number(v) ? null : v;
    onBranchChanged();
    return;
  }
  applyFiltersImmediate();
}

const ddmmaaaa = (s) => {
  const d = normalizeDate(s);
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};
const rangoTexto = computed(() => {
  const f = normalizeDate(from.value), t = normalizeDate(to.value);
  if (!f && !t) return "desde el inicio";
  if (f && t) return f === t ? `el ${ddmmaaaa(f)}` : `${ddmmaaaa(f)} a ${ddmmaaaa(t)}`;
  return f ? `desde el ${ddmmaaaa(f)}` : `hasta el ${ddmmaaaa(t)}`;
});
const sucursalTexto = computed(() => {
  if (isAdmin.value) {
    if (!selectedBranchId.value) return "todas las sucursales";
    return branchSelectItems.value.find((x) => x.value === Number(selectedBranchId.value))?.title || `Sucursal #${selectedBranchId.value}`;
  }
  return sales.value[0]?.branch?.name || "";
});
const subtitulo = computed(() => {
  const n = Number(stats.value.sales_count || 0);
  const estado = status.value ? ` ${String(ESTADOS_PLURAL[status.value] || "").toLowerCase()}` : "";
  return [`${miles(n)} ${n === 1 ? "venta" : "ventas"}${estado}`, rangoTexto.value, sucursalTexto.value].filter(Boolean).join(" · ");
});

const chips = computed(() => {
  const c = [];
  if (status.value) c.push({ key: "status", label: `Estado: ${String(ESTADOS_PLURAL[status.value] || status.value).toLowerCase()}` });
  if (from.value || to.value) c.push({ key: "fechas", label: `Fechas: ${rangoTexto.value}` });
  if (isAdmin.value && selectedBranchId.value) c.push({ key: "branch", label: `Sucursal: ${sucursalTexto.value}` });
  if (String(payMethod.value || "").trim()) c.push({ key: "payMethod", label: `Medio: ${methodLabel(payMethod.value)}` });
  if (sellerId.value) c.push({ key: "sellerId", label: `Cajero: ${nombreCajeroElegido.value}` });
  if (productPick.value) c.push({ key: "productPick", label: `Producto: ${productPick.value?.title || productPick.value}` });
  return c;
});
const filtrosActivos = computed(() => chips.value.length);
function quitarChip(key) {
  if (key === "status") { status.value = ""; applyFiltersImmediate(); return; }
  if (key === "fechas") { clearDates(); return; }
  if (key === "branch") { selectedBranchId.value = null; onBranchChanged(); return; }
  removeChip(key);
}

// Resumen: medios de pago del período, en una barra partida
const COLOR_MEDIO = {
  MERCADOPAGO: "#0a466e", CASH: "#0f6fae", TRANSFER: "#3f8fc6", CARD: "#8cc0e3", CREDIT_SJT: "#5b7083", OTHER: "#C3C9D6",
};
function colorMedio(m) {
  const x = String(m || "").toUpperCase();
  return COLOR_MEDIO[x === "QR" ? "MERCADOPAGO" : x] || COLOR_MEDIO.OTHER;
}
const medios = computed(() => {
  const n = stats.value.net_by_method || {};
  const lista = [
    ["MERCADOPAGO", n.mercadopago], ["CASH", n.cash], ["TRANSFER", n.transfer],
    ["CARD", n.card], ["CREDIT_SJT", n.credit_sjt], ["OTHER", n.other],
  ].map(([key, v]) => ({ key, total: Number(v || 0) })).filter((m) => m.total > 0);
  const tot = lista.reduce((a, m) => a + m.total, 0);
  return lista
    .sort((a, b) => b.total - a.total)
    .map((m) => ({ ...m, etiqueta: methodLabel(m.key), color: colorMedio(m.key), pct: Math.round((m.total / tot) * 100), ancho: Math.max(1, (m.total / tot) * 100) }));
});

// Filas
const miles = (v) => Math.round(Number(v || 0)).toLocaleString("es-AR");
const plata = (v) => "$ " + Number(v || 0).toLocaleString("es-AR", { maximumFractionDigits: 2 });
function dia(v) {
  if (!v) return "—";
  const d = new Date(v);
  const dd = String(d.getDate()).padStart(2, "0"), mm = String(d.getMonth() + 1).padStart(2, "0");
  return d.getFullYear() === new Date().getFullYear() ? `${dd}/${mm}` : `${dd}/${mm}/${String(d.getFullYear()).slice(2)}`;
}
function hora(v) {
  if (!v) return "";
  return new Date(v).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
}
function nombreCajero(s) {
  return fullUserName(s.user) || s.user?.username || `Usuario #${s.user_id}`;
}
function unidades(s) {
  const n = pickSaleItems(s).reduce((a, it) => a + Number(it.quantity ?? it.qty ?? 0), 0);
  const r = Math.round(n * 100) / 100;
  return `${r.toLocaleString("es-AR")} ${r === 1 ? "unidad" : "unidades"}`;
}
function detalleCobro(s) {
  const p = primaryPayment(s);
  const partes = [];
  const cuotas = paymentInstallments(p);
  if (cuotas > 1) partes.push(`${cuotas} cuotas`);
  else if (p?.method === "CARD") partes.push("1 pago");
  const otros = (s.payments || []).length - 1;
  if (otros > 0) partes.push(`y ${otros} ${otros === 1 ? "medio más" : "medios más"}`);
  return partes.join(" · ");
}
const rutaVenta = (id) => ({ name: "posSaleDetail", params: { id } });
function abrirFila(e, id) {
  if (window.getSelection?.()?.toString()) return;
  if (e.button === 1 || e.ctrlKey || e.metaKey) {
    window.open(router.resolve(rutaVenta(id)).href, "_blank");
    return;
  }
  if (e.type === "click") router.push(rutaVenta(id));
}
const desde = computed(() => (meta.value.total ? (meta.value.page - 1) * meta.value.limit + 1 : 0));
const hasta = computed(() => Math.min(meta.value.total, (meta.value.page - 1) * meta.value.limit + sales.value.length));

onMounted(async () => {
  if (auth?.isAuthed && !auth.user && typeof auth.fetchMe === "function") {
    try { await auth.fetchMe(); } catch {}
  }
  await loadBranchesIfAdmin();
  // Filtro desde un enlace (los avisos del tablero): ?estado=CANCELLED
  const estadoUrl = String(route.query?.estado || "").toUpperCase();
  if (estadoUrl && statusItems.some((s) => s.value === estadoUrl)) status.value = estadoUrl;
  onSellerSearch("");
  onProductSearch("");
  refreshAll();
});
</script>

<style>
/* Ventas. Sin scoped: todo cuelga de .vt, y el tema oscuro se resuelve con
   .v-theme--dark .vt sin :global(). Mismos tokens que el tablero. */
.pos-container:has(.vt) {
  max-width: none !important;
  padding: 0 !important;
  margin: 0 !important;
}
.vt {
  --vt-fondo: #d6e6f3;
  --vt-caja: #ffffff;
  --vt-borde: #d3dde7;
  --vt-linea: #e3eaf1;
  --vt-texto: #0f172a;
  --vt-suave: #5a6678;
  --vt-tenue: #94a3b8;
  --vt-hover: #f3f8fc;
  --vt-banda: #0f6fae;
  --vt-banda-borde: #0d5f96;
  --vt-acento: #0f6fae;
  --vt-pista: rgba(15, 23, 42, 0.06);

  padding: 22px 28px 28px;
  min-height: calc(100vh - 72px);
  box-sizing: border-box;
  background: var(--vt-fondo);
  color: var(--vt-texto);
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.v-theme--dark .vt {
  --vt-fondo: #0b0f14;
  --vt-caja: #151c25;
  --vt-borde: #253141;
  --vt-linea: #222c39;
  --vt-texto: #e5edf5;
  --vt-suave: #9aa8b8;
  --vt-tenue: #64748b;
  --vt-hover: #1a2430;
  --vt-banda: #0f5f96;
  --vt-banda-borde: #0c4f7d;
  --vt-acento: #5aaee0;
  --vt-pista: rgba(255, 255, 255, 0.07);
}
.vt > * { max-width: 1400px; width: 100%; margin-left: auto; margin-right: auto; }
.vt .num { font-variant-numeric: tabular-nums; }
.vt .clamp1 { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* encabezado */
.vt-cab { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.vt-cab__txt { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.vt-cab__titulo { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.2; }
.vt-cab__sub { font-size: 14px; font-weight: 600; color: var(--vt-suave); }
.vt-cab__acciones { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.vt-periodos { display: flex; gap: 4px; padding: 4px; border-radius: 10px; background: var(--vt-caja); border: 1px solid var(--vt-borde); }
.vt-periodo { height: 34px; padding: 0 14px; border: 0; border-radius: 8px; font-family: inherit; font-size: 14px; font-weight: 700; background: transparent; color: var(--vt-suave); cursor: pointer; white-space: nowrap; }
.vt-periodo:hover { color: var(--vt-texto); }
.vt-periodo.is-activo { background: #0f6fae; color: #ffffff; }
.vt-filtros-btn { height: 42px; display: inline-flex; align-items: center; gap: 8px; padding: 0 16px; border: 0; border-radius: 10px; background: #0f6fae; color: #ffffff; font-family: inherit; font-size: 14px; font-weight: 800; cursor: pointer; }
.vt-filtros-btn__n { min-width: 22px; height: 22px; padding: 0 5px; border-radius: 6px; background: #ffffff; color: #0f6fae; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; box-sizing: border-box; }

/* buscador */
.vt-busca { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.vt-busca__campo { flex: 1 1 360px; height: 46px; display: flex; align-items: center; gap: 10px; padding: 0 14px; border-radius: 10px; background: var(--vt-caja); border: 1px solid var(--vt-borde); box-sizing: border-box; }
.vt-busca__campo:focus-within { border-color: #3f8fc6; box-shadow: 0 0 0 3px rgba(63, 143, 198, 0.18); }
.vt-busca__ic { color: var(--vt-suave); }
.vt-busca__input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; font-family: inherit; font-size: 15px; color: var(--vt-texto); }
.vt-busca__input::placeholder { color: var(--vt-tenue); }
.vt-chip { height: 34px; display: inline-flex; align-items: center; gap: 4px; padding: 0 4px 0 12px; border-radius: 8px; background: var(--vt-caja); border: 1px solid #8cc0e3; font-size: 14px; font-weight: 700; color: var(--vt-texto); white-space: nowrap; }
.vt-chip__x { width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 6px; background: transparent; color: var(--vt-suave); cursor: pointer; }
.vt-chip__x:hover { background: var(--vt-pista); color: var(--vt-texto); }

/* resumen */
.vt-resumen { display: flex; flex-direction: column; gap: 8px; padding: 12px 16px; border-radius: 12px; background: var(--vt-caja); border: 1px solid var(--vt-borde); box-sizing: border-box; }
.vt-resumen__cifras { display: flex; align-items: center; gap: 22px; flex-wrap: wrap; font-size: 15px; font-weight: 700; color: var(--vt-suave); }
.vt-resumen__cifras b { font-size: 20px; font-weight: 800; color: var(--vt-texto); margin-left: 4px; }
.vt-partes { display: flex; gap: 2px; height: 8px; }
.vt-partes > span { display: block; height: 8px; border-radius: 3px; }
.vt-leyenda { display: flex; align-items: center; gap: 6px 18px; flex-wrap: wrap; font-size: 13px; font-weight: 700; }
.vt-leyenda > span { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
.vt-leyenda i { width: 10px; height: 10px; border-radius: 3px; display: block; }
.vt-leyenda em { font-style: normal; color: var(--vt-suave); }

/* tabla cerrada */
.vt-tabla-caja { position: relative; border-radius: 12px; overflow: hidden; background: var(--vt-caja); border: 1px solid var(--vt-borde); box-sizing: border-box; }
.vt-carga { position: absolute; top: 0; left: 0; right: 0; z-index: 2; }
.vt-tabla-scroll { overflow-x: auto; }
.vt-tabla { width: 100%; border-collapse: collapse; table-layout: fixed; min-width: 980px; }
.vt-tabla th { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; color: #ffffff; background: var(--vt-banda); text-align: left; padding: 11px 12px; border: 1px solid var(--vt-banda-borde); border-top: 0; }
.vt-tabla th:first-child, .vt-tabla td:first-child { border-left: 0; }
.vt-tabla th:last-child, .vt-tabla td:last-child { border-right: 0; }
.vt-tabla td { padding: 9px 12px; border: 1px solid var(--vt-linea); vertical-align: middle; font-size: 14px; overflow: hidden; }
.vt-tabla .c-n { width: 78px; }
.vt-tabla .c-fecha { width: 92px; }
.vt-tabla .c-cajero { width: 180px; }
.vt-tabla .c-cobro { width: 170px; }
.vt-tabla th.c-total, .vt-tabla td.c-total { width: 120px; text-align: right; font-weight: 800; font-size: 15px; }
.vt-tabla .c-estado { width: 112px; }
.vt-tabla .c-ver { width: 72px; }
.vt-fila { cursor: pointer; }
.vt-fila:hover td { background: var(--vt-hover); }
.vt-link { font-weight: 800; color: var(--vt-acento); text-decoration: none; }
.vt-link:hover { text-decoration: underline; }
.vt-b { font-weight: 700; }
.vt-p { font-weight: 600; }
.vt-s { font-size: 12px; color: var(--vt-suave); }
.vt-mas { font-weight: 600; color: var(--vt-suave); }
.vt-medio { display: inline-flex; align-items: center; gap: 6px; font-weight: 700; white-space: nowrap; }
.vt-medio i { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; display: block; }
.vt-estado { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; white-space: nowrap; color: var(--vt-suave); }
.vt-estado i { width: 8px; height: 8px; border-radius: 9999px; background: #C3C9D6; display: block; }
.vt-estado.is-paid { color: #1f7a5f; }
.vt-estado.is-paid i { background: #2E9E7B; }
.v-theme--dark .vt-estado.is-paid { color: #5fc9a6; }
.vt-estado.is-cancelled { color: #b23b35; }
.vt-estado.is-cancelled i { background: #C4453F; }
.v-theme--dark .vt-estado.is-cancelled { color: #f08a84; }
.vt-estado.is-refunded i { background: #8cc0e3; }
.vt-ver { display: inline-flex; align-items: center; font-size: 14px; font-weight: 800; color: var(--vt-acento); text-decoration: none; white-space: nowrap; }
.vt-ver:hover { text-decoration: underline; }
.vt-vacio { text-align: center; padding: 40px 12px !important; font-size: 15px; font-weight: 600; color: var(--vt-suave); }

.vt-pie { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 16px; border-top: 1px solid var(--vt-borde); flex-wrap: wrap; }
.vt-pie__info { font-size: 14px; font-weight: 600; color: var(--vt-suave); }
.vt-paginas { margin: 0; }

/* tarjetas del teléfono */
.vt-tarjetas { display: none; }
.vt-tarjeta { display: flex; flex-direction: column; gap: 4px; padding: 12px 14px; border-bottom: 1px solid var(--vt-linea); color: var(--vt-texto); text-decoration: none; }
.vt-tarjeta__fila { display: flex; align-items: center; gap: 10px; min-width: 0; }
.vt-tarjeta__fila > .vt-s { flex: 1; min-width: 0; }
.vt-tarjeta__total { margin-left: auto; font-size: 16px; font-weight: 800; }

/* panel de filtros */
.vt-panel { position: fixed; top: 72px; right: 0; bottom: 0; width: 400px; max-width: 100vw; z-index: 1006; display: flex; flex-direction: column; background: var(--vt-caja); border-left: 2px solid #8cc4e8; box-shadow: -12px 0 32px rgba(10, 70, 110, 0.16); color: var(--vt-texto); }
.vt-panel__cab { display: flex; align-items: center; justify-content: space-between; padding: 12px 12px 12px 20px; background: #0f6fae; color: #ffffff; font-size: 18px; font-weight: 800; }
.vt-panel__cerrar { width: 40px; height: 40px; display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 8px; background: transparent; color: #ffffff; cursor: pointer; }
.vt-panel__cerrar:hover { background: rgba(255, 255, 255, 0.14); }
.vt-panel__cuerpo { flex: 1; min-height: 0; overflow-y: auto; padding: 4px 20px 12px; }
.vt-grupo { display: flex; flex-direction: column; gap: 2px; padding: 12px 0; border-bottom: 1px solid var(--vt-linea); }
.vt-grupo:last-child { border-bottom: 0; }
.vt-grupo__tit { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; color: var(--vt-suave); margin-bottom: 6px; }
.vt-op { display: flex; align-items: center; gap: 10px; width: 100%; padding: 6px 4px; border: 0; border-radius: 6px; background: transparent; font-family: inherit; color: var(--vt-texto); cursor: pointer; text-align: left; }
.vt-op:hover { background: var(--vt-hover); }
.vt-op__caja { width: 20px; height: 20px; flex-shrink: 0; border-radius: 5px; border: 2px solid #9fb3c8; box-sizing: border-box; display: flex; align-items: center; justify-content: center; }
.vt-op.is-on .vt-op__caja { background: #0f6fae; border-color: #0f6fae; }
.vt-op__eti { flex: 1; min-width: 0; font-size: 15px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.vt-op__n { font-size: 14px; font-weight: 800; }
.vt-op.is-on .vt-op__n { color: var(--vt-acento); }
.vt-op.is-cero { opacity: .5; }
.vt-fechas { display: flex; gap: 8px; }
.vt-fecha { flex: 1; display: flex; flex-direction: column; gap: 4px; font-size: 13px; font-weight: 700; color: var(--vt-suave); }
.vt-fecha input { height: 40px; padding: 0 10px; border-radius: 8px; border: 1px solid var(--vt-borde); background: var(--vt-caja); color: var(--vt-texto); font-family: inherit; font-size: 14px; }
.v-theme--dark .vt-fecha input { color-scheme: dark; }
.vt-panel__pie { padding: 14px 20px; border-top: 1px solid var(--vt-borde); }
.vt-panel__ver { width: 100%; height: 46px; border: 0; border-radius: 10px; background: #0f6fae; color: #ffffff; font-family: inherit; font-size: 15px; font-weight: 800; cursor: pointer; }
.vt-panel-enter-active, .vt-panel-leave-active { transition: transform .18s ease; }
.vt-panel-enter-from, .vt-panel-leave-to { transform: translateX(100%); }

@media (max-width: 900px) {
  .vt { padding: 16px 16px 96px; }
  .vt-tabla-scroll { display: none; }
  .vt-tarjetas { display: block; }
  .vt-cab__acciones { width: 100%; }
  .vt-periodos { flex: 1; overflow-x: auto; }
  .vt-panel { top: 0; width: 100vw; z-index: 2400; }
}
</style>
