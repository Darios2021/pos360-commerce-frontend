<!--
  Inicio del teléfono (plan del 2026-10-31, lienzo aprobado
  https://claude.ai/artifact/XrCjgW9EdaahSu5j8vVzEG). No es un tablero:
  arriba la banda de marca con el número del día y contadores que filtran;
  debajo, la actividad del día, lo último arriba. Uno por perfil:
    dueño   · vendido hoy (elige sucursal), Ventas · Tienda · Taller · Stock
    admin   · lo mismo, solo su sucursal
    cajero  · su turno: efectivo esperado, Ventas · Anuladas · Cobrado, y "Buscar producto"
    técnico · sus órdenes abiertas por estado
  "Sin stock" queda en el contador: no hay registro por evento para la lista.
  Reemplaza a DashboardMobileHome (tablero con caja, columnas y medios).
-->
<template>
  <div class="im m-vista">
    <!-- ══ Banda del día ══ -->
    <section class="im-banda">
      <div class="im-banda__f">
        <small>{{ banda.rotulo }}</small>
        <v-menu v-if="perfil === 'dueno' && branches.length > 1" location="bottom end">
          <template #activator="{ props: p }">
            <button v-bind="p" type="button" class="im-pill">{{ sucursalLabel }}<v-icon size="16">mdi-chevron-down</v-icon></button>
          </template>
          <v-list density="compact">
            <v-list-item :active="!selectedBranch" title="Todas" @click="$emit('branch-change', null)" />
            <v-list-item v-for="b in branches" :key="b.id" :active="Number(selectedBranch) === Number(b.id)" :title="b.name" @click="$emit('branch-change', b.id)" />
          </v-list>
        </v-menu>
        <span v-else-if="banda.pill" class="im-pill im-pill--fija">{{ banda.pill }}</span>
      </div>
      <b class="im-banda__cifra num">{{ banda.cifra }}</b>
      <span class="im-banda__cmp num">{{ banda.cmp }}</span>
      <div class="im-cns" :style="{ gridTemplateColumns: `repeat(${contadores.length}, 1fr)` }">
        <button
          v-for="c in contadores"
          :key="c.k"
          type="button"
          class="im-cn"
          :class="{ on: filtro === c.k }"
          :aria-pressed="filtro === c.k"
          @click="filtro = filtro === c.k ? null : c.k"
        >
          <b class="num">{{ c.v }}</b><span>{{ c.t }}</span>
        </button>
      </div>
    </section>

    <!-- ══ Cajero: consultar un producto ══ -->
    <router-link v-if="perfil === 'cajero' && $router.hasRoute('lector')" :to="{ name: 'lector', query: { modo: 'consultar' } }" class="m-pz m-it im-buscar">
      <span class="m-ico"><v-icon size="22">mdi-barcode-scan</v-icon></span>
      <span class="tx"><b>Buscar producto</b><small>Precio y stock por sucursal</small></span>
      <v-icon size="20" class="chev">mdi-chevron-right</v-icon>
    </router-link>

    <!-- ══ Actividad ══ -->
    <div class="m-pz">
      <div v-if="cargando && !lista.length" class="m-it"><span class="tx"><small>Cargando…</small></span></div>
      <div v-else-if="!lista.length" class="m-it"><span class="tx"><small>{{ vacio }}</small></span></div>
      <component
        :is="e.to ? 'router-link' : 'div'"
        v-for="e in lista"
        :key="e.id"
        :to="e.to"
        class="m-it im-ev"
      >
        <span class="m-ico" :class="{ 'im-ico--rojo': e.rojo }"><v-icon size="22">{{ e.icon }}</v-icon></span>
        <span class="tx"><b>{{ e.titulo }}</b><small>{{ e.sub }}</small></span>
        <span class="der">
          <b v-if="e.monto" class="num" :class="{ 'im-tach': e.rojo }">{{ e.monto }}</b>
          <small class="num">{{ e.hora }}</small>
        </span>
      </component>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import http from "@/app/api/http";
import { useAuthStore } from "@/app/store/auth.store";
import { useEsTecnico } from "@/app/composables/useEsTecnico";
import { useTransferNotifications } from "@/modules/dashboard/composables/useTransferNotifications";
import { getCurrentCashRegister, getCashRegisterSummary } from "@/modules/pos/services/posCashRegisters.service";

const props = defineProps({
  isSuperAdmin: Boolean,
  isAdmin: Boolean,
  scopeLabel: { type: String, default: "" },
  branches: { type: Array, default: () => [] },
  selectedBranch: { type: [Number, null], default: null },
  sales: { type: Object, required: true },
  stock: { type: Object, required: true },
});
defineEmits(["branch-change"]);

const auth = useAuthStore();
const { soloTecnico, listo: tecnicoListo } = useEsTecnico();

const perfil = computed(() => {
  if (soloTecnico.value) return "tecnico";
  if (props.isSuperAdmin) return "dueno";
  if (props.isAdmin) return "admin";
  return "cajero";
});

// ── Formato ────────────────────────────────────────────────────────────────
function pesos(n) {
  const v = Number(n || 0);
  return `${v < 0 ? "− " : ""}$ ${Math.abs(Math.round(v)).toLocaleString("es-AR")}`;
}
function hora(v) {
  const d = v ? new Date(v) : null;
  if (!d || Number.isNaN(d.getTime())) return "";
  const hoy = new Date();
  const hh = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  if (d.toDateString() === hoy.toDateString()) return hh;
  const dias = Math.round((new Date(hoy.toDateString()) - new Date(d.toDateString())) / 86400000);
  return dias === 1 ? "Ayer" : `Hace ${dias} días`;
}
function inicioDelDia(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(0, 0, 0, 0);
  return d;
}
const sucursalLabel = computed(() => {
  if (!props.selectedBranch) return "Todas";
  return props.branches.find((b) => Number(b.id) === Number(props.selectedBranch))?.name || "Sucursal";
});

// ── Datos ──────────────────────────────────────────────────────────────────
const cargando = ref(true);
const caja = ref({ abierta: false, id: null, desde: "", esperado: null });
const ventas = ref([]);     // pagadas de hoy
const anuladas = ref([]);   // anuladas de hoy
const ayer = ref(null);     // vendido ayer hasta esta hora
const pedidos = ref({ total: 0, items: [] });
const taller = ref({ stats: null, items: [] });
const { pendingForMe } = useTransferNotifications();

function filtroSucursal() {
  return props.selectedBranch ? { branch_id: props.selectedBranch } : {};
}
async function cargarCaja() {
  try {
    const r = await getCurrentCashRegister();
    const cr = r?.data?.data || r?.data || null;
    if (!cr?.id) { caja.value = { abierta: false }; return; }
    const d = cr.opened_at ? new Date(cr.opened_at) : null;
    caja.value = {
      abierta: true,
      id: cr.id,
      desde: d && !Number.isNaN(d.getTime()) ? `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` : "",
      esperado: null,
    };
    const s = await getCashRegisterSummary(cr.id);
    const raw = s?.data?.data || s?.data?.summary || s?.data || null;
    const esp = Number(raw?.totals?.expected_cash);
    if (Number.isFinite(esp)) caja.value.esperado = esp;
  } catch {
    caja.value = { abierta: false };
  }
}
async function cargarVentas() {
  const base = filtroSucursal();
  const ahora = new Date();
  const hoy = { from: inicioDelDia(0).toISOString(), to: ahora.toISOString(), page: 1, limit: 200 };
  try {
    const [pag, anu, prev] = await Promise.all([
      http.get("/pos/sales", { params: { ...base, ...hoy, status: "PAID" } }),
      http.get("/pos/sales", { params: { ...base, ...hoy, status: "CANCELLED", limit: 50 } }),
      perfil.value === "cajero"
        ? Promise.resolve(null)
        : http.get("/pos/sales/stats", { params: { ...base, status: "PAID", from: inicioDelDia(-1).toISOString(), to: new Date(ahora.getTime() - 86400000).toISOString() } }),
    ]);
    ventas.value = Array.isArray(pag?.data?.data) ? pag.data.data : [];
    anuladas.value = Array.isArray(anu?.data?.data) ? anu.data.data : [];
    const d = prev?.data?.data || {};
    const v = Number(d.total_sum ?? d.gross_total_sum);
    ayer.value = Number.isFinite(v) ? v : null;
  } catch {
    ventas.value = [];
    anuladas.value = [];
    ayer.value = null;
  }
}
async function cargarPedidos() {
  if (!auth.isAdmin) return;
  try {
    const { data } = await http.get("/admin/shop/orders", { params: { page: 1, limit: 5, status: "created", ...filtroSucursal() } });
    pedidos.value = { total: Number(data?.meta?.total || 0) || 0, items: Array.isArray(data?.data) ? data.data : [] };
  } catch {
    pedidos.value = { total: 0, items: [] };
  }
}
async function cargarTaller() {
  const mios = perfil.value === "tecnico" ? { mios: 1 } : {};
  try {
    const [st, ls] = await Promise.all([
      http.get("/admin/service/orders/stats", { params: mios }),
      http.get("/admin/service/orders", { params: { ...mios, page: 1, limit: perfil.value === "tecnico" ? 50 : 5, ...(perfil.value === "tecnico" ? {} : { grupo: "listos" }) } }),
    ]);
    taller.value = { stats: st?.data?.data || null, items: Array.isArray(ls?.data?.data) ? ls.data.data : [] };
  } catch {
    taller.value = { stats: null, items: [] };
  }
}
async function cargar() {
  cargando.value = true;
  await tecnicoListo;
  const tareas = [cargarTaller()];
  if (perfil.value !== "tecnico") tareas.push(cargarVentas(), cargarPedidos());
  if (perfil.value === "cajero") tareas.push(cargarCaja());
  await Promise.all(tareas);
  cargando.value = false;
}
onMounted(cargar);
watch(() => props.selectedBranch, () => { if (perfil.value !== "tecnico") { cargarVentas(); cargarPedidos(); } });

// ── Banda y contadores ────────────────────────────────────────────────────
const sum = (arr) => arr.reduce((a, s) => a + Number(s.total || 0), 0);
const ABIERTAS = ["recibido", "diagnostico", "presupuestado", "aprobado", "en_reparacion", "reparado"];
const porEstado = computed(() => taller.value.stats?.por_estado || {});
const vendidoHoy = computed(() => {
  const t = Number(props.sales?.today?.total);
  return Number.isFinite(t) && t > 0 ? t : sum(ventas.value);
});

const banda = computed(() => {
  if (perfil.value === "tecnico") {
    const abiertas = ABIERTAS.reduce((a, k) => a + Number(porEstado.value[k] || 0), 0);
    const listas = Number(porEstado.value.reparado || 0);
    return { rotulo: "Mis órdenes abiertas", pill: "Taller", cifra: String(abiertas), cmp: listas === 1 ? "1 para entregar" : `${listas} para entregar` };
  }
  if (perfil.value === "cajero") {
    if (!caja.value.abierta) return { rotulo: "Mi turno", pill: "Caja cerrada", cifra: "Caja cerrada", cmp: "Se abre en Más · Caja" };
    return {
      rotulo: caja.value.desde ? `Mi turno · desde ${caja.value.desde}` : "Mi turno",
      pill: `Caja #${caja.value.id}`,
      cifra: caja.value.esperado != null ? pesos(caja.value.esperado) : pesos(sum(ventas.value)),
      cmp: caja.value.esperado != null ? "Efectivo esperado en la caja" : "Cobrado en el turno",
    };
  }
  let cmp = "";
  if (ayer.value != null && ayer.value > 0) {
    const pct = Math.round(((vendidoHoy.value - ayer.value) / ayer.value) * 100);
    cmp = `${pct >= 0 ? "↑" : "↓"} ${Math.abs(pct)} % contra ayer a esta hora`;
  } else if (ayer.value === 0) cmp = "Ayer a esta hora no había ventas";
  return {
    rotulo: perfil.value === "dueno" ? (props.selectedBranch ? `Vendido hoy en ${sucursalLabel.value}` : "Vendido hoy · todas las sucursales") : `Vendido hoy${props.scopeLabel ? " en " + props.scopeLabel : ""}`,
    pill: perfil.value === "admin" ? props.scopeLabel : "",
    cifra: pesos(vendidoHoy.value),
    cmp,
  };
});

const contadores = computed(() => {
  if (perfil.value === "tecnico") {
    const n = (...k) => k.reduce((a, x) => a + Number(porEstado.value[x] || 0), 0);
    return [
      { k: "recibidas", t: "Recibidas", v: n("recibido", "diagnostico") },
      { k: "reparacion", t: "Reparación", v: n("aprobado", "en_reparacion") },
      { k: "presupuestadas", t: "Presup.", v: n("presupuestado") },
      { k: "reparadas", t: "Reparadas", v: n("reparado") },
    ];
  }
  if (perfil.value === "cajero") {
    const cobrado = sum(ventas.value);
    return [
      { k: "venta", t: "Ventas", v: ventas.value.length },
      { k: "anulada", t: "Anuladas", v: anuladas.value.length },
      { k: "cobrado", t: "Cobrado", v: cobrado >= 1000000 ? `$ ${(cobrado / 1000000).toLocaleString("es-AR", { maximumFractionDigits: 1 })} M` : cobrado >= 1000 ? `$ ${Math.round(cobrado / 1000)} mil` : pesos(cobrado) },
    ];
  }
  const out = [{ k: "venta", t: "Ventas", v: Number(props.sales?.today?.count || ventas.value.length) }];
  if (auth.isAdmin) out.push({ k: "tienda", t: "Tienda", v: pedidos.value.total });
  out.push({ k: "taller", t: "Taller", v: Number(taller.value.stats?.grupos?.listos || 0) + Number(taller.value.stats?.grupos?.taller || 0) });
  out.push({ k: "stock", t: "Stock", v: Number(props.stock?.outOfStockCount || 0) });
  return out;
});

// ── Actividad del día ─────────────────────────────────────────────────────
const ESTADO = {
  recibido: "recibida", diagnostico: "en diagnóstico", presupuestado: "presupuestada", aprobado: "aprobada",
  en_reparacion: "en reparación", reparado: "reparada", entregado: "entregada", sin_solucion: "sin solución", no_retirado: "sin retirar",
};
const GRUPO_TEC = {
  recibidas: ["recibido", "diagnostico"], reparacion: ["aprobado", "en_reparacion"],
  presupuestadas: ["presupuestado"], reparadas: ["reparado"],
};
function equipo(o) {
  return [o.device_brand, o.device_model].filter(Boolean).join(" ") || "Equipo";
}
const eventos = computed(() => {
  const out = [];
  const conVenta = perfil.value !== "tecnico";
  if (conVenta) {
    for (const s of ventas.value.slice(0, 30)) {
      out.push({
        id: "v" + s.id, tipo: "venta", t: s.sold_at, icon: "mdi-receipt-text-outline",
        titulo: `Venta #${s.id}`,
        sub: [s.payment_label || s.method_label, perfil.value === "cajero" ? "" : s.seller_name || s.user_name].filter(Boolean).join(" · ") || s.customer_name || "Consumidor final",
        monto: pesos(s.total), to: { name: "posSaleDetail", params: { id: s.id } },
      });
    }
    for (const s of anuladas.value.slice(0, 10)) {
      out.push({
        id: "a" + s.id, tipo: perfil.value === "cajero" ? "anulada" : "venta", t: s.updated_at || s.sold_at, icon: "mdi-receipt-text-remove-outline", rojo: true,
        titulo: `Venta #${s.id} anulada`, sub: s.cancel_reason || s.seller_name || s.user_name || "",
        monto: pesos(s.total), to: { name: "posSaleDetail", params: { id: s.id } },
      });
    }
    for (const o of pedidos.value.items) {
      out.push({
        id: "p" + o.id, tipo: "tienda", t: o.created_at, icon: "mdi-storefront-outline",
        titulo: `Pedido web #${o.public_code || o.id}`,
        sub: [String(o.customer_name || "").trim(), o.fulfillment_type === "delivery" ? "Envío" : o.branch_name ? `Retira en ${o.branch_name}` : ""].filter(Boolean).join(" · "),
        monto: pesos(o.total), to: { name: "shopOrders", query: { status: "created" } },
      });
    }
    for (const tr of pendingForMe.value || []) {
      out.push({
        id: "d" + tr.id, tipo: "stock", t: tr.dispatched_at || tr.updated_at || tr.created_at, icon: "mdi-truck-fast-outline",
        titulo: "Derivación por recibir",
        sub: `Desde ${tr.fromWarehouse?.branch?.name || tr.from_branch || "otra sucursal"}`,
        monto: tr.units_total ? `${tr.units_total} u.` : "", to: { name: "transfers", query: { estado: "dispatched" } },
      });
    }
  }
  for (const o of taller.value.items) {
    if (perfil.value === "tecnico" && !ABIERTAS.includes(o.status)) continue;
    const grupoTec = Object.keys(GRUPO_TEC).find((g) => GRUPO_TEC[g].includes(o.status));
    out.push({
      id: "o" + o.id, tipo: perfil.value === "tecnico" ? grupoTec : "taller", t: o.updated_at || o.created_at, icon: "mdi-wrench-outline",
      titulo: `Orden ${o.numero_visible || o.number || o.id} · ${ESTADO[o.status] || o.status}`,
      sub: [equipo(o), o.reported_fault ? String(o.reported_fault).slice(0, 60) : "", perfil.value === "tecnico" ? "" : o.customer_name].filter(Boolean).join(" · "),
      monto: Number(o.quoted_amount) > 0 ? pesos(o.quoted_amount) : "", to: { name: "serviceOrderEdit", params: { id: o.id } },
    });
  }
  return out
    .filter((e) => e.t)
    .sort((a, b) => new Date(b.t) - new Date(a.t))
    .map((e) => ({ ...e, hora: hora(e.t) }));
});
const filtro = ref(null);
const lista = computed(() => {
  if (!filtro.value || filtro.value === "cobrado") return eventos.value;
  return eventos.value.filter((e) => e.tipo === filtro.value);
});
const vacio = computed(() => {
  if (filtro.value === "stock" && Number(props.stock?.outOfStockCount || 0) > 0) return "Los productos sin stock están en Productos · Sin stock.";
  if (perfil.value === "tecnico") return "No tenés órdenes abiertas.";
  return filtro.value ? "Nada de esto hoy." : "Todavía no hay movimiento hoy.";
});
</script>

<style scoped>
.im { display: flex; flex-direction: column; gap: 12px; background: transparent; }

/* Banda del día: continúa la barra superior y sale de los márgenes del contenedor */
.im-banda {
  margin: -16px -16px 0;
  padding: 14px 16px 16px;
  background: linear-gradient(170deg, var(--m-banda) 0%, #121e47 100%);
  color: #fff;
}
.im-banda__f { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.im-banda__f small { font-size: 13px; color: rgba(255, 255, 255, 0.72); }
.im-pill {
  display: inline-flex; align-items: center; gap: 2px; height: 30px; padding: 0 10px; border-radius: 8px;
  background: rgba(255, 255, 255, 0.16); color: #fff; font-size: 13px; font-weight: 700; white-space: nowrap;
}
.im-pill .v-icon { color: #fff; }
.im-banda__cifra { display: block; margin-top: 2px; font-size: 30px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.15; }
.im-banda__cmp { display: block; min-height: 18px; margin-top: 4px; font-size: 13px; font-weight: 600; color: #a6d8fa; }
.im-cns { display: grid; gap: 8px; margin-top: 14px; }
.im-cn {
  display: flex; flex-direction: column; align-items: flex-start; min-width: 0; padding: 8px 10px; border-radius: 10px;
  background: rgba(255, 255, 255, 0.1) !important; color: rgba(255, 255, 255, 0.78) !important; font-size: 12px; text-align: left;
}
.im-cn b { font-size: 18px; font-weight: 800; color: #fff; line-height: 1.2; white-space: nowrap; }
.im-cn span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
.im-cn.on { background: var(--m-pieza) !important; color: var(--m-suave) !important; }
.im-cn.on b { color: var(--m-accion-txt); }

.im-buscar { border-top: 0; }

/* Actividad */
.im-ev .tx small { white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.im-ev .der { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex: none; }
.im-ev .der small { font-size: 12px; color: var(--m-suave); }
.im-ico--rojo { background: var(--m-rojo-tinte) !important; }
.im-ico--rojo .v-icon { color: var(--m-rojo) !important; }
.im-tach { text-decoration: line-through; color: var(--m-suave); }
</style>
