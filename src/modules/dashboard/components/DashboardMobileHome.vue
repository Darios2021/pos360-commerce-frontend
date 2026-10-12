<!--
  Inicio del teléfono (dueño), maqueta aprobada pantalla 2. Cinco bloques:
    1. Caja: número, desde cuándo, cajero y efectivo esperado. Abre la Caja.
    2. Ventas de hoy: cifra, "Ayer a esta hora" y columnas por hora.
    3. Medios de pago de hoy, en filas.
    4. Pendientes: pedidos web, derivaciones y sin stock, cada uno al listado
       filtrado.
    5. Últimas ventas, con "Ver todas".
  Sin saludo y sin tarjetas de KPI. Todos los enlaces van por nombre de ruta
  (antes apuntaban a /pos/... y el catch-all los mandaba a la tienda).
-->
<template>
  <div class="dmh m-vista">
    <div class="m-pz">
    <router-link :to="{ name: 'caja' }" class="m-it dmh-caja">
      <span class="m-ico"><v-icon size="24">mdi-cash-register</v-icon></span>
      <span class="tx">
        <b>{{ caja.abierta ? `Caja #${caja.id} abierta` : "Caja cerrada" }}</b>
        <small>{{ caja.abierta ? [caja.desde ? `Desde ${caja.desde}` : "", caja.cajero].filter(Boolean).join(" · ") : scopeLabel }}</small>
      </span>
      <span v-if="caja.abierta" class="der">
        <b class="num">{{ caja.esperado != null ? pesos(caja.esperado) : "" }}</b>
        <small>Efectivo esperado</small>
      </span>
    </router-link>
    </div>

    <div class="m-pz">
      <div class="m-pz-h">
        <h3>Ventas de hoy</h3>
        <span class="num">{{ sales.today.count === 1 ? "1 venta" : `${sales.today.count || 0} ventas` }}</span>
      </div>
      <div class="m-pz-b">
        <div class="m-cifra num">{{ pesos(sales.today.total) }}</div>
        <div v-if="ayer != null" class="m-sub num">Ayer a esta hora: {{ pesos(ayer) }}</div>
        <div class="m-cols" aria-hidden="true">
          <div v-for="h in horas" :key="h.h">
            <s :class="{ max: h.max }" :style="{ height: h.alto + '%' }"></s>
            <span class="num">{{ h.h }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="m-pz">
      <div class="m-pz-h"><h3>Medios de pago</h3><span>Hoy</span></div>
      <div class="m-pz-b">
        <div v-if="!medios.length" class="m-sub">Sin cobros</div>
        <div v-for="m in medios" :key="m.method" class="m-fila">
          <div class="l"><b>{{ m.label }}</b><span class="num">{{ pesos(m.total) }}</span></div>
          <div class="m-barra"><s :style="{ width: m.pct + '%' }"></s></div>
        </div>
      </div>
    </div>

    <template v-if="pendientes.length">
      <div class="m-rot">Pendientes</div>
      <div class="m-pz">
        <router-link v-for="p in pendientes" :key="p.key" :to="p.to" class="m-it">
          <span class="m-ico"><v-icon size="22">{{ p.icon }}</v-icon></span>
          <span class="tx"><b>{{ p.titulo }}</b><small>{{ p.sub }}</small></span>
          <span class="der"><b class="num">{{ p.n }}</b></span>
          <v-icon size="20" class="chev">mdi-chevron-right</v-icon>
        </router-link>
      </div>
    </template>

    <div class="m-rot">Últimas ventas</div>
    <div class="m-pz">
      <div v-if="!lastSales.length" class="m-it"><span class="tx"><small>Sin ventas</small></span></div>
      <router-link
        v-for="s in lastSales.slice(0, 5)"
        :key="s.id"
        :to="{ name: 'posSaleDetail', params: { id: s.id } }"
        class="m-it"
        :class="{ anulada: String(s.status || '').toUpperCase() === 'CANCELLED' }"
      >
        <span class="tx">
          <b class="num">#{{ s.id }} · {{ hora(s.sold_at) }}</b>
          <small>{{ [s.payment_label || s.method_label || "", s.seller_name || s.user_name || ""].filter(Boolean).join(" · ") || s.customer_name || "Consumidor final" }}</small>
        </span>
        <span class="der">
          <b class="num">{{ pesos(s.total) }}</b>
          <span v-if="String(s.status || '').toUpperCase() === 'CANCELLED'" class="m-est gr">Anulada</span>
        </span>
        <v-icon size="20" class="chev">mdi-chevron-right</v-icon>
      </router-link>
      <div class="m-pz-f m-centro"><router-link :to="{ name: 'posSales' }" class="m-lnk">Ver todas</router-link></div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import http from "@/app/api/http";
import { useAuthStore } from "@/app/store/auth.store";
import { useTransferNotifications } from "@/modules/dashboard/composables/useTransferNotifications";
import { getCurrentCashRegister, getCashRegisterSummary } from "@/modules/pos/services/posCashRegisters.service";

const props = defineProps({
  loading: Boolean,
  loadingAnalytics: Boolean,
  isSuperAdmin: Boolean,
  isAdmin: Boolean,
  scopeLabel: { type: String, default: "" },
  scopeIcon: { type: String, default: "" },
  roleBadge: { type: String, default: "" },
  userName: { type: String, default: "" },
  branches: { type: Array, default: () => [] },
  selectedBranch: { type: [Number, null], default: null },
  sales: { type: Object, required: true },
  stock: { type: Object, required: true },
  inv: { type: Object, required: true },
  lastSales: { type: Array, default: () => [] },
});
defineEmits(["refresh", "branch-change"]);

const router = useRouter();
const auth = useAuthStore();

function pesos(n) {
  const v = Number(n || 0);
  return `${v < 0 ? "− " : ""}$ ${Math.abs(Math.round(v)).toLocaleString("es-AR")}`;
}
function hora(v) {
  const d = v ? new Date(v) : null;
  return d && !Number.isNaN(d.getTime()) ? `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` : "";
}

// ── 1. Caja ────────────────────────────────────────────────────────────────
const caja = ref({ abierta: false, id: null, desde: "", cajero: "", esperado: null });
async function cargarCaja() {
  try {
    const res = await getCurrentCashRegister();
    const c = res?.data || null;
    if (!c?.id || String(c.status || "OPEN").toUpperCase() !== "OPEN") return;
    caja.value = { abierta: true, id: c.id, desde: hora(c.opened_at), cajero: c.opened_by_name || "", esperado: null };
    const s = await getCashRegisterSummary(c.id).catch(() => null);
    const raw = s?.data?.data || s?.data?.summary || s?.data || null;
    const esp = Number(raw?.totals?.expected_cash);
    if (Number.isFinite(esp)) caja.value.esperado = esp;
    if (!caja.value.cajero) caja.value.cajero = raw?.cash_register?.opened_by_name || "";
  } catch {
    /* sin caja */
  }
}

// ── 2. Ventas de hoy por hora y "Ayer a esta hora" ──────────────────────────
// El tablero (dashboard/overview) no trae ventas por hora del día ni la
// comparación con ayer: se arman con las ventas pagadas de hoy y de ayer.
const ventasHoy = ref([]);
const ayer = ref(null);
function inicioDelDia(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(0, 0, 0, 0);
  return d;
}
async function cargarVentasDelDia() {
  const base = {};
  if (props.selectedBranch) base.branch_id = props.selectedBranch;
  const ahora = new Date();
  const ayerMismaHora = new Date(ahora.getTime() - 24 * 3600 * 1000);
  try {
    const [hoy, prev] = await Promise.all([
      http.get("/pos/sales", { params: { ...base, status: "PAID", page: 1, limit: 200, from: inicioDelDia(0).toISOString(), to: ahora.toISOString() } }),
      http.get("/pos/sales/stats", { params: { ...base, status: "PAID", from: inicioDelDia(-1).toISOString(), to: ayerMismaHora.toISOString() } }),
    ]);
    ventasHoy.value = Array.isArray(hoy?.data?.data) ? hoy.data.data : [];
    const d = prev?.data?.data || {};
    const v = Number(d.total_sum ?? d.gross_total_sum);
    ayer.value = Number.isFinite(v) ? v : null;
  } catch {
    ventasHoy.value = [];
    ayer.value = null;
  }
}
const horas = computed(() => {
  const buckets = new Map();
  for (const s of ventasHoy.value) {
    const d = new Date(s.sold_at);
    if (Number.isNaN(d.getTime())) continue;
    buckets.set(d.getHours(), (buckets.get(d.getHours()) || 0) + Number(s.total || 0));
  }
  const usadas = [...buckets.keys()];
  const desde = Math.min(9, ...usadas, new Date().getHours());
  const hasta = Math.max(20, ...usadas);
  const lista = [];
  for (let h = desde; h <= hasta; h += 1) lista.push({ h, v: buckets.get(h) || 0 });
  const max = Math.max(0, ...lista.map((x) => x.v));
  return lista.map((x) => ({ h: x.h, alto: x.v && max ? Math.max(4, (x.v / max) * 85) : 0, max: max > 0 && x.v === max }));
});

// ── 3. Medios de pago ──────────────────────────────────────────────────────
const medios = computed(() => {
  const arr = Array.isArray(props.sales?.paymentsToday) ? props.sales.paymentsToday : [];
  const max = Math.max(1, ...arr.map((m) => Number(m.total || 0)));
  return arr
    .filter((m) => Number(m.total || 0) > 0)
    .map((m) => ({ ...m, pct: Math.max(4, (Number(m.total || 0) / max) * 100) }));
});

// ── 4. Pendientes ──────────────────────────────────────────────────────────
const { pendingForMe } = useTransferNotifications();
const pedidos = ref(0);
async function cargarPedidos() {
  if (!auth.isSuperAdmin || !router.hasRoute("shopOrders")) return;
  try {
    const { data } = await http.get("/admin/shop/orders", { params: { page: 1, limit: 1, status: "created" } });
    pedidos.value = Number(data?.meta?.total || 0) || 0;
  } catch {
    pedidos.value = 0;
  }
}
const pendientes = computed(() => {
  const out = [];
  if (pedidos.value > 0) {
    out.push({ key: "pedidos", icon: "mdi-storefront-outline", titulo: "Pedidos web", sub: "Sin preparar", n: pedidos.value, to: { name: "shopOrders", query: { status: "created" } } });
  }
  const der = pendingForMe.value.length;
  if (der > 0 && router.hasRoute("transfers")) {
    out.push({ key: "der", icon: "mdi-truck-fast-outline", titulo: "Derivaciones", sub: "Por recibir", n: der, to: { name: "transfers", query: { estado: "dispatched" } } });
  }
  const sin = Number(props.stock?.outOfStockCount || 0);
  if (sin > 0) {
    out.push({ key: "sin", icon: "mdi-package-variant-closed", titulo: "Sin stock", sub: props.scopeLabel, n: sin, to: { name: "products", query: { stock: "without" } } });
  }
  return out;
});

onMounted(() => {
  cargarCaja();
  cargarVentasDelDia();
  cargarPedidos();
});
</script>

<style scoped>
.dmh {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: transparent;
}
.dmh-caja { border-top: 0; }
</style>
