<!--
  Ventas en el teléfono (pantalla 8 de la maqueta, aprobada el 2026-10-31 con
  la barra nueva; lienzo https://claude.ai/artifact/JyEKkAh11Y7tcGGe428aPw).
    · Chips de período: Hoy · Ayer · 7 días · Este mes · Fecha
    · Total: cifra, N ventas · N anuladas y una fila por medio de pago
    · Lista por franja horaria (por día si el período es más largo); las
      anuladas tachadas con el estado "Anulada"
    · Filtros a pantalla completa (?filtros=1): medio de pago, cajero (no para
      el cajero), estado y comprobante, con la cantidad de cada opción. Las
      cantidades salen del período cargado y suman el total. "Ver N ventas".
  El cajero ve solo su caja (la abierta; si no hay, sus ventas).
  Las ventas del período se piden de una vez (hasta 200, el tope de la API) y
  se filtran acá; si el período tiene más, se avisa.
-->
<template>
  <div class="vm m-vista">
    <!-- ══ Filtros (vista completa) ══ -->
    <template v-if="enFiltros">
      <div class="vm-fil">
        <template v-for="g in gruposFiltro" :key="g.k">
          <div class="m-rot">{{ g.t }}</div>
          <div class="vm-chips vm-chips--wrap">
            <button
              v-for="o in g.ops"
              :key="o.v"
              type="button"
              class="vm-chip"
              :class="{ on: sel[g.k].includes(o.v) }"
              @click="alternar(g.k, o.v)"
            >{{ o.t }} <span class="num">{{ o.n }}</span></button>
          </div>
        </template>
        <button v-if="hayFiltros" type="button" class="m-lnk vm-limpiar" @click="limpiar">Quitar filtros</button>
      </div>
      <div class="vm-pie">
        <button type="button" class="m-btn" @click="cerrarFiltros">Ver {{ filtradas.length === 1 ? "1 venta" : `${filtradas.length} ventas` }}</button>
      </div>
    </template>

    <!-- ══ Ventas ══ -->
    <template v-else>
      <div class="vm-cab">
        <div class="vm-chips">
          <button v-for="p in PERIODOS" :key="p.k" type="button" class="vm-chip" :class="{ on: periodo === p.k }" @click="elegir(p.k)">{{ p.t }}</button>
          <label class="vm-chip vm-fecha" :class="{ on: periodo === 'fecha' }">
            {{ periodo === 'fecha' && fecha ? fechaCorta(fecha) : "Fecha" }}
            <input type="date" :value="fecha" :max="hoyISO" @change="elegirFecha($event.target.value)" />
          </label>
        </div>
        <button type="button" class="vm-filbtn" aria-label="Filtros" @click="abrirFiltros">
          <v-icon size="22">mdi-filter-variant</v-icon>
          <span v-if="hayFiltros" class="vm-filbtn__n num">{{ nFiltros }}</span>
        </button>
      </div>

      <div v-if="cajaPill" class="vm-caja num">{{ cajaPill }}</div>

      <div class="m-pz">
        <div class="m-pz-h"><h3>Total</h3><span class="num">{{ resumen }}</span></div>
        <div class="m-pz-b">
          <div class="m-cifra num">{{ pesos(totalPagadas) }}</div>
          <div v-if="!medios.length" class="m-sub">{{ cargando ? "Cargando…" : "Sin cobros en el período" }}</div>
          <div v-for="m in medios" :key="m.k" class="m-fila">
            <div class="l">
              <span><b>{{ m.t }}</b><small class="vm-fila-sub num">{{ m.n === 1 ? "1 venta" : `${m.n} ventas` }}</small></span>
              <span class="num">{{ pesos(m.total) }}</span>
            </div>
            <div class="m-barra"><s :style="{ width: m.pct + '%' }"></s></div>
          </div>
        </div>
      </div>

      <p v-if="truncado" class="vm-nota">Se muestran las últimas 200 ventas del período. Para ver más, elegí un período más corto.</p>

      <template v-for="g in grupos" :key="g.k">
        <div class="m-rot">{{ g.t }}</div>
        <div class="m-pz">
          <router-link
            v-for="s in g.ventas"
            :key="s.id"
            :to="{ name: 'posSaleDetail', params: { id: s.id } }"
            class="m-it vm-v"
            :class="{ anulada: s._anulada }"
          >
            <span class="tx">
              <b class="num">#{{ s.id }} · {{ hhmm(s.sold_at) }}</b>
              <small>{{ [s._medioT, s._cajero].filter(Boolean).join(" · ") }}</small>
            </span>
            <span class="der">
              <b class="num">{{ pesos(s.total) }}</b>
              <span v-if="s._anulada" class="m-est no">Anulada</span>
            </span>
            <v-icon size="20" class="chev">mdi-chevron-right</v-icon>
          </router-link>
        </div>
      </template>
      <div v-if="!cargando && !filtradas.length" class="m-pz"><div class="m-it"><span class="tx"><small>No hay ventas {{ hayFiltros ? "con estos filtros" : "en el período" }}.</small></span></div></div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import http from "@/app/api/http";
import { useAuthStore } from "@/app/store/auth.store";
import { getCurrentCashRegister } from "@/modules/pos/services/posCashRegisters.service";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const esCajero = computed(() => auth.isCajero === true);

// ── Formato ────────────────────────────────────────────────────────────────
function pesos(n) {
  const v = Number(n || 0);
  return `${v < 0 ? "− " : ""}$ ${Math.abs(Math.round(v)).toLocaleString("es-AR")}`;
}
const dos = (n) => String(n).padStart(2, "0");
function hhmm(v) { const d = new Date(v); return Number.isNaN(d.getTime()) ? "" : `${dos(d.getHours())}:${dos(d.getMinutes())}`; }
function iso(d) { return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`; }
function fechaCorta(s) { const [y, m, d] = String(s).split("-"); return `${d}/${m}`; }
const hoyISO = iso(new Date());

// ── Período ────────────────────────────────────────────────────────────────
const PERIODOS = [{ k: "hoy", t: "Hoy" }, { k: "ayer", t: "Ayer" }, { k: "7d", t: "7 días" }, { k: "mes", t: "Este mes" }];
const periodo = ref("hoy");
const fecha = ref("");
function rango() {
  const ini = new Date(); ini.setHours(0, 0, 0, 0);
  const fin = new Date();
  if (periodo.value === "ayer") { ini.setDate(ini.getDate() - 1); fin.setTime(ini.getTime()); fin.setHours(23, 59, 59, 999); }
  else if (periodo.value === "7d") ini.setDate(ini.getDate() - 6);
  else if (periodo.value === "mes") ini.setDate(1);
  else if (periodo.value === "fecha" && fecha.value) {
    const [y, m, d] = fecha.value.split("-").map(Number);
    ini.setFullYear(y, m - 1, d); fin.setTime(ini.getTime()); fin.setHours(23, 59, 59, 999);
  }
  return { from: ini.toISOString(), to: fin.toISOString() };
}
const variosDias = computed(() => periodo.value === "7d" || periodo.value === "mes");
function elegir(k) { periodo.value = k; cargar(); }
function elegirFecha(v) { if (!v) return; fecha.value = v; periodo.value = "fecha"; cargar(); }

// ── Datos ──────────────────────────────────────────────────────────────────
const cargando = ref(true);
const crudas = ref([]);
const truncado = ref(false);
const cajaId = ref(null);

function medioDe(s) {
  const p = (Array.isArray(s.payments) ? s.payments : [])[0] || {};
  const ref = String(p.reference || "").toUpperCase().replace(/\s+/g, "");
  if (["SJCREDIT", "SJ_CREDIT", "SANJUANCREDITO", "SANJUAN_CREDITO"].includes(ref)) return "CREDIT_SJT";
  const up = String(p.method || "").trim().toUpperCase();
  return up === "QR" ? "MERCADOPAGO" : up || "OTHER";
}
const MEDIO = { CASH: "Efectivo", CARD: "Tarjeta", DEBIT: "Débito", CREDIT: "Crédito", TRANSFER: "Transferencia", MERCADOPAGO: "Mercado Pago", CREDIT_SJT: "San Juan Crédito", OTHER: "Otro" };
function cajeroDe(s) {
  const u = s.user || {};
  return [u.first_name, u.last_name].filter(Boolean).join(" ").trim() || u.username || "";
}
function comprobanteDe(s) {
  const modo = String(s.invoice_mode || "").toUpperCase();
  const tipo = String(s.invoice_type || "").toUpperCase();
  if (!tipo || modo === "NO_FISCAL" || tipo === "NO_FISCAL") return "No fiscal";
  return `Factura ${tipo.replace(/^FACTURA[_\s]*/, "")}`;
}

async function cargar() {
  cargando.value = true;
  const r = rango();
  try {
    const { data } = await http.get("/pos/sales", { params: { ...r, page: 1, limit: 200 } });
    let rows = Array.isArray(data?.data) ? data.data : [];
    if (esCajero.value) {
      const uid = Number(auth.user?.id || 0);
      rows = rows.filter((s) => (cajaId.value ? Number(s.cash_register_id) === Number(cajaId.value) : Number(s.user_id) === uid));
    }
    crudas.value = rows.map((s) => {
      const medio = medioDe(s);
      return {
        ...s,
        _anulada: String(s.status || "").toUpperCase() === "CANCELLED",
        _medio: medio,
        _medioT: MEDIO[medio] || medio,
        _cajero: cajeroDe(s),
        _comp: comprobanteDe(s),
      };
    });
    truncado.value = Number(data?.meta?.total || 0) > rows.length && !esCajero.value;
  } catch {
    crudas.value = [];
    truncado.value = false;
  }
  cargando.value = false;
}
onMounted(async () => {
  if (esCajero.value) {
    try {
      const r = await getCurrentCashRegister();
      const cr = r?.data?.data || r?.data || null;
      cajaId.value = cr?.id || null;
    } catch { cajaId.value = null; }
  }
  cargar();
});
const cajaPill = computed(() => (esCajero.value ? (cajaId.value ? `Caja #${cajaId.value}` : "Mis ventas") : ""));

// ── Filtros ────────────────────────────────────────────────────────────────
const sel = reactive({ medio: [], cajero: [], estado: [], comp: [] });
const ESTADO = (s) => (s._anulada ? "Anulada" : "Pagada");
const CAMPO = { medio: (s) => s._medioT, cajero: (s) => s._cajero || "Sin cajero", estado: ESTADO, comp: (s) => s._comp };
function contar(k) {
  const m = new Map();
  for (const s of crudas.value) { const v = CAMPO[k](s); m.set(v, (m.get(v) || 0) + 1); }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([v, n]) => ({ v, t: v, n }));
}
const gruposFiltro = computed(() => [
  { k: "medio", t: "Medio de pago", ops: contar("medio") },
  ...(esCajero.value ? [] : [{ k: "cajero", t: "Cajero", ops: contar("cajero") }]),
  { k: "estado", t: "Estado", ops: contar("estado") },
  { k: "comp", t: "Comprobante", ops: contar("comp") },
].filter((g) => g.ops.length));
function alternar(k, v) { const i = sel[k].indexOf(v); if (i >= 0) sel[k].splice(i, 1); else sel[k].push(v); }
function limpiar() { for (const k of Object.keys(sel)) sel[k].splice(0); }
const nFiltros = computed(() => Object.values(sel).reduce((a, x) => a + x.length, 0));
const hayFiltros = computed(() => nFiltros.value > 0);
const filtradas = computed(() =>
  crudas.value.filter((s) => Object.keys(sel).every((k) => !sel[k].length || sel[k].includes(CAMPO[k](s))))
);

// La vista de filtros va en la URL para que "atrás" del teléfono la cierre.
const enFiltros = computed(() => route.query.filtros === "1");
function abrirFiltros() { router.push({ query: { ...route.query, filtros: "1" } }); }
function cerrarFiltros() { if (enFiltros.value) router.back(); }
watch(enFiltros, (v) => { if (v) window.scrollTo(0, 0); });

// ── Total y medios ─────────────────────────────────────────────────────────
const pagadas = computed(() => filtradas.value.filter((s) => !s._anulada));
const totalPagadas = computed(() => pagadas.value.reduce((a, s) => a + Number(s.total || 0), 0));
const resumen = computed(() => {
  const n = pagadas.value.length, a = filtradas.value.length - n;
  return `${n === 1 ? "1 venta" : `${n} ventas`}${a ? ` · ${a === 1 ? "1 anulada" : `${a} anuladas`}` : ""}`;
});
const medios = computed(() => {
  const m = new Map();
  for (const s of pagadas.value) {
    const x = m.get(s._medio) || { k: s._medio, t: s._medioT, n: 0, total: 0 };
    x.n += 1; x.total += Number(s.total || 0); m.set(s._medio, x);
  }
  const arr = [...m.values()].sort((a, b) => b.total - a.total);
  const max = Math.max(1, ...arr.map((x) => x.total));
  return arr.map((x) => ({ ...x, pct: Math.max(4, (x.total / max) * 100) }));
});

// ── Lista por franja (o por día) ───────────────────────────────────────────
const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const grupos = computed(() => {
  const out = new Map();
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  for (const s of filtradas.value) {
    const d = new Date(s.sold_at);
    if (Number.isNaN(d.getTime())) continue;
    let k, t;
    if (variosDias.value) {
      const dia = new Date(d); dia.setHours(0, 0, 0, 0);
      const dif = Math.round((hoy - dia) / 86400000);
      k = iso(dia);
      t = dif === 0 ? "Hoy" : dif === 1 ? "Ayer" : `${DIAS[dia.getDay()]} ${dos(dia.getDate())}/${dos(dia.getMonth() + 1)}`;
    } else {
      const h = d.getHours();
      k = String(h); t = `${dos(h)}:00 a ${dos(h + 1)}:00`;
    }
    if (!out.has(k)) out.set(k, { k, t, ventas: [] });
    out.get(k).ventas.push(s);
  }
  return [...out.values()];
});
</script>

<style scoped>
.vm { display: flex; flex-direction: column; gap: 12px; background: transparent; }
.vm-cab { display: flex; align-items: center; gap: 8px; }
.vm-chips { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; flex: 1; min-width: 0; }
.vm-chips::-webkit-scrollbar { display: none; }
.vm-chips--wrap { flex-wrap: wrap; overflow: visible; }
.vm-chip {
  position: relative; flex: none; height: 36px; padding: 0 12px; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px;
  background: var(--m-pieza) !important; color: var(--m-tinta) !important; font-size: 14px; font-weight: 600; white-space: nowrap;
}
.vm-chip span { color: var(--m-suave); font-weight: 500; }
.vm-chip.on { background: var(--m-accion) !important; color: #fff !important; }
.vm-chip.on span { color: rgba(255, 255, 255, 0.8); }
.vm-fecha input { position: absolute; inset: 0; opacity: 0; width: 100%; cursor: pointer; }
.vm-filbtn { position: relative; flex: none; width: 44px; height: 36px; border-radius: 8px; display: grid; place-items: center; background: var(--m-pieza) !important; }
.vm-filbtn .v-icon { color: var(--m-accion-txt); }
.vm-filbtn__n { position: absolute; top: -6px; right: -6px; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px; background: var(--m-accion); color: #fff; font-size: 11px; font-weight: 700; display: grid; place-items: center; }
.vm-caja { align-self: flex-start; font-size: 13px; font-weight: 700; color: var(--m-accion-txt); background: var(--m-accion-tinte); border-radius: 6px; padding: 4px 8px; }
.vm-fila-sub { display: block; font-size: 12px; font-weight: 500; color: var(--m-suave); margin-top: 1px; }
.vm-nota { margin: 0 2px; font-size: 13px; color: var(--m-sobre-canvas); }
.vm-v .der { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }
.vm-v.anulada .der b { text-decoration: line-through; color: var(--m-suave); }
.vm-fil { display: flex; flex-direction: column; gap: 12px; padding-bottom: 96px; }
.vm-limpiar { align-self: flex-start; margin-top: 4px; }
.vm-pie {
  position: fixed; left: 0; right: 0; bottom: calc(64px + var(--m-sab, env(safe-area-inset-bottom, 0px)));
  padding: 10px 16px; background: var(--m-pieza); border-top: 1px solid var(--m-linea2); z-index: 5;
}
.vm-pie .m-btn { width: 100%; }
</style>
