<template>
  <div class="tb">
    <div class="tb-cab">
      <div class="tb-cab__txt">
        <h1 class="tb-cab__titulo">Tablero</h1>
        <span class="tb-cab__sub">{{ rangoTexto }} · {{ scopeLabel.toLowerCase() }}</span>
      </div>
      <div class="tb-cab__acciones">
        <div class="tb-periodos" role="group" aria-label="Período">
          <button
            v-for="p in PERIODOS"
            :key="p.value"
            type="button"
            class="tb-periodo"
            :class="{ 'is-activo': period === p.value }"
            @click="$emit('period-change', p.value)"
          >{{ p.nombre }}</button>
        </div>

        <v-menu v-if="isSuperAdmin && branches.length" location="bottom end">
          <template #activator="{ props: mp }">
            <button type="button" class="tb-suc" v-bind="mp">
              <v-icon size="20" class="tb-suc__ic">mdi-store-outline</v-icon>
              {{ scopeLabel }}
              <v-icon size="20" class="tb-suc__flecha">mdi-chevron-down</v-icon>
            </button>
          </template>
          <v-list density="compact" min-width="220" class="pa-1">
            <v-list-item :active="!selectedBranch" color="primary" @click="$emit('branch-change', null)">
              <v-list-item-title class="font-weight-bold">Todas las sucursales</v-list-item-title>
            </v-list-item>
            <v-divider class="my-1" />
            <v-list-item
              v-for="b in branches"
              :key="b.id"
              :active="Number(selectedBranch) === Number(b.id)"
              color="primary"
              @click="$emit('branch-change', b.id)"
            >
              <v-list-item-title>{{ b.name }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <span v-else class="tb-suc tb-suc--fija">
          <v-icon size="20" class="tb-suc__ic">mdi-store-outline</v-icon>
          {{ scopeLabel }}
        </span>
      </div>
    </div>

    <v-progress-linear v-if="loading || loadingAnalytics" indeterminate color="primary" height="3" class="tb-carga" />

    <div class="tb-grilla">
      <!-- 1. Ventas en el tiempo : columnas -->
      <section class="tb-bloque">
        <div class="tb-bloque__tit"><span class="tb-h">1. {{ serie.titulo }}</span><span class="tb-nota">{{ serie.nota }}</span></div>
        <div class="tb-caja">
          <div class="tb-banda"><span>Facturado</span><span class="num">{{ plata(totalPeriodo) }} · {{ miles(ventasPeriodo) }} ventas</span></div>
          <div class="tb-cols" :class="{ 'tb-cols--densa': serie.cols.length > 16 }">
            <div v-for="(c, i) in serie.cols" :key="i" class="tb-col">
              <span class="tb-col__cifra num">{{ c.cifra }}</span>
              <span class="tb-col__barra" :style="{ height: c.alto + 'px', background: c.color }"></span>
              <span class="tb-col__eti">{{ c.etiqueta }}</span>
              <span v-if="c.sub" class="tb-col__sub num">{{ c.sub }}</span>
            </div>
            <div v-if="!serie.cols.length" class="tb-vacio">Sin ventas en el período</div>
          </div>
        </div>
      </section>

      <!-- 2. Por sucursal : filas -->
      <section v-if="!selectedBranch" class="tb-bloque">
        <div class="tb-bloque__tit"><span class="tb-h">2. Por sucursal</span><span class="tb-nota">parte de lo facturado</span></div>
        <div class="tb-caja">
          <div class="tb-banda"><span>Sucursales</span><span>{{ sucursales.length }} sucursales, {{ sucursales.filter(s => s.total > 0).length }} con ventas</span></div>
          <div class="tb-filas">
            <div v-for="(f, i) in sucursales" :key="f.id || i" class="tb-fila">
              <div class="tb-fila__linea">
                <span class="tb-fila__cifra num" :style="{ color: f.total ? R[Math.min(i, 3)] : 'var(--tb-tenue)' }">{{ f.total ? pct(f.total, totalPeriodo) + ' %' : '0' }}</span>
                <span class="tb-fila__txt"><span class="tb-fila__eti">{{ f.nombre }}</span><span class="tb-fila__sub num">{{ f.total ? miles(f.count) + ' ventas' : 'sin ventas en el período' }}</span></span>
                <span class="tb-fila__dato num">{{ f.total ? plata(f.total) : '' }}</span>
              </div>
              <span class="tb-pista"><span class="tb-pista__barra" :style="{ width: ancho(f.total, maxSucursal) + '%', background: f.total ? R[Math.min(i, 3)] : GRIS }"></span></span>
            </div>
          </div>
        </div>
      </section>

      <!-- 3. Cómo se cobró : dona -->
      <section class="tb-bloque">
        <div class="tb-bloque__tit"><span class="tb-h">{{ n('pagos') }}. Cómo se cobró</span><span class="tb-nota">una venta mixta suma en cada medio</span></div>
        <div class="tb-caja">
          <div class="tb-banda"><span>Medios de pago</span><span class="num">{{ plata(totalPagos) }} cobrados</span></div>
          <div v-if="pagos.length" class="tb-dona-caja">
            <div class="tb-dona" :style="{ background: dona }">
              <div class="tb-dona__centro">
                <span class="tb-dona__cifra num">$ {{ corto(totalPagos) }}</span>
                <span class="tb-dona__sub">{{ pagos.length }} {{ pagos.length === 1 ? 'medio' : 'medios' }}</span>
              </div>
            </div>
            <div class="tb-leyenda">
              <div v-for="p in pagos" :key="p.etiqueta" class="tb-leyenda__fila">
                <span class="tb-cuadro" :style="{ background: p.color }"></span>
                <span class="tb-fila__txt"><span class="tb-leyenda__eti">{{ p.etiqueta }}</span><span class="tb-fila__sub num">{{ plata(p.total) }} · {{ miles(p.count) }} cobros</span></span>
                <span class="tb-leyenda__cifra num">{{ pct(p.total, totalPagos) }} %</span>
              </div>
            </div>
          </div>
          <div v-else class="tb-vacio tb-vacio--caja">Sin cobros en el período</div>
        </div>
      </section>

      <!-- 4. Por cajero : filas -->
      <section class="tb-bloque">
        <div class="tb-bloque__tit"><span class="tb-h">{{ n('cajeros') }}. Por cajero</span><span class="tb-nota">parte de lo facturado</span></div>
        <div class="tb-caja">
          <div class="tb-banda"><span>Cajeros</span><span>{{ cajerosCabecera }}</span></div>
          <div class="tb-filas">
            <div v-for="(f, i) in cajeros" :key="i" class="tb-fila tb-fila--chica">
              <div class="tb-fila__linea">
                <span class="tb-fila__cifra num" :style="{ color: f.otros ? 'var(--tb-tenue)' : R[Math.min(i, 3)] }">{{ pct(f.total, totalPeriodo) }} %</span>
                <span class="tb-fila__txt"><span class="tb-fila__eti clamp1">{{ f.nombre }}</span><span class="tb-fila__sub num">{{ f.sub }}</span></span>
                <span class="tb-fila__dato num">{{ plata(f.total) }}</span>
              </div>
              <span class="tb-pista"><span class="tb-pista__barra" :style="{ width: ancho(f.total, maxCajero) + '%', background: f.otros ? GRIS : R[Math.min(i, 3)] }"></span></span>
            </div>
            <div v-if="!cajeros.length" class="tb-vacio">Sin ventas en el período</div>
          </div>
        </div>
      </section>

      <!-- 5. Horario : columnas -->
      <section class="tb-bloque">
        <div class="tb-bloque__tit"><span class="tb-h">{{ n('horas') }}. A qué hora se vende</span><span class="tb-nota">hora de San Juan, cantidad de ventas</span></div>
        <div class="tb-caja">
          <div class="tb-banda"><span>Ventas por hora</span><span>{{ horaPico ? `pico ${horaPico.hour} h · ${miles(horaPico.count)} ventas` : 'sin ventas' }}</span></div>
          <div class="tb-cols tb-cols--horas">
            <div v-for="h in horas" :key="h.hour" class="tb-col">
              <span class="tb-col__cifra num">{{ h.count || '' }}</span>
              <span class="tb-col__barra" :style="{ height: h.alto + 'px', background: h.color }"></span>
              <span class="tb-col__eti num">{{ h.hour }}</span>
            </div>
            <div v-if="!horas.length" class="tb-vacio">Sin ventas en el período</div>
          </div>
        </div>
      </section>

      <!-- 6. Ticket promedio por día : columnas -->
      <section class="tb-bloque">
        <div class="tb-bloque__tit"><span class="tb-h">{{ n('dias') }}. Ticket promedio por día</span><span class="tb-nota">debajo, cantidad de ventas</span></div>
        <div class="tb-caja">
          <div class="tb-banda"><span>Ticket promedio</span><span class="num">{{ plata(ventasPeriodo ? totalPeriodo / ventasPeriodo : 0) }} en el período</span></div>
          <div class="tb-cols tb-cols--dias">
            <div v-for="d in dias" :key="d.dow" class="tb-col">
              <span class="tb-col__cifra num">{{ d.avgTicket ? corto(d.avgTicket) : '' }}</span>
              <span class="tb-col__barra" :style="{ height: d.alto + 'px', background: d.color }"></span>
              <span class="tb-col__eti">{{ d.etiqueta }}</span>
              <span class="tb-col__sub num">{{ miles(d.count) }} ventas</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 7. Stock por sucursal : partes -->
      <section class="tb-bloque">
        <div class="tb-bloque__tit"><span class="tb-h">{{ n('stock') }}. Stock por sucursal</span><span class="tb-nota">bajo = {{ stock.lowThreshold || 3 }} unidades o menos</span></div>
        <div class="tb-caja">
          <div class="tb-banda">
            <span>Productos con stock</span>
            <span class="tb-claves">
              <span><i :style="{ background: VERDE }"></i>bien</span>
              <span><i :style="{ background: R[3] }"></i>bajo</span>
              <span><i :style="{ background: GRIS }"></i>sin stock</span>
            </span>
          </div>
          <div class="tb-filas">
            <div v-for="f in stockFilas" :key="f.branch_id" class="tb-fila">
              <div class="tb-fila__linea">
                <span class="tb-fila__cifra num">{{ miles(f.tot) }}</span>
                <span class="tb-fila__txt"><span class="tb-fila__eti">{{ f.branch_name }}</span><span class="tb-fila__sub num">{{ miles(f.ok) }} bien · {{ miles(f.low) }} bajo · {{ miles(f.out) }} sin stock</span></span>
                <span class="tb-fila__dato tb-fila__dato--chico num">{{ pct(f.out, f.tot) }} % sin stock</span>
              </div>
              <span class="tb-partes">
                <span :style="tramo(VERDE, f.ok, f.tot)"></span><span :style="tramo(R[3], f.low, f.tot)"></span><span :style="tramo(GRIS, f.out, f.tot)"></span>
              </span>
            </div>
            <div v-if="!stockFilas.length" class="tb-vacio">Sin stock cargado</div>
          </div>
        </div>
      </section>

      <!-- 8. Lo más vendido : filas -->
      <section class="tb-bloque">
        <div class="tb-bloque__tit"><span class="tb-h">{{ n('productos') }}. Lo más vendido</span><span class="tb-nota">unidades en el período</span></div>
        <div class="tb-caja">
          <div class="tb-banda"><span>Productos</span><span>top {{ productos.length }} por unidades</span></div>
          <div class="tb-filas">
            <div v-for="(f, i) in productos" :key="f.product_id || i" class="tb-fila tb-fila--mini">
              <div class="tb-fila__linea">
                <span class="tb-fila__cifra tb-fila__cifra--chica num">{{ miles(f.units) }}</span>
                <span class="tb-fila__eti tb-fila__eti--chica clamp1">{{ f.product_name }}</span>
                <span class="tb-fila__dato tb-fila__dato--chico num">{{ plata(f.total) }}</span>
              </div>
              <span class="tb-pista"><span class="tb-pista__barra" :style="{ width: ancho(f.units, maxUnidades) + '%', background: i === 0 ? R[0] : R[1] }"></span></span>
            </div>
            <div v-if="!productos.length" class="tb-vacio">Sin ventas en el período</div>
          </div>
        </div>
      </section>

      <!-- 9. Valor del inventario : filas -->
      <section class="tb-bloque">
        <div class="tb-bloque__tit"><span class="tb-h">{{ n('inventario') }}. Valor del inventario</span><span class="tb-nota">a precio de lista, hoy</span></div>
        <div class="tb-caja">
          <div class="tb-banda"><span>Inventario</span><span class="num">{{ plata(totalInventario) }} · {{ miles(unidadesInventario) }} unidades</span></div>
          <div class="tb-filas">
            <div v-for="(f, i) in inventario" :key="f.nombre" class="tb-fila">
              <div class="tb-fila__linea">
                <span class="tb-fila__cifra num" :style="{ color: R[Math.min(i, 3)] }">{{ pctChico(f.valor, totalInventario) }}</span>
                <span class="tb-fila__txt"><span class="tb-fila__eti">{{ f.nombre }}</span><span class="tb-fila__sub num">{{ miles(f.unidades) }} unidades · {{ miles(f.productos) }} productos</span></span>
                <span class="tb-fila__dato num">$ {{ corto(f.valor) }}</span>
              </div>
              <span class="tb-pista"><span class="tb-pista__barra" :style="{ width: ancho(f.valor, maxInventario) + '%', background: R[Math.min(i, 3)] }"></span></span>
            </div>
            <div v-if="!inventario.length" class="tb-vacio">Sin stock cargado</div>
          </div>
        </div>
      </section>

      <!-- 10. Para revisar : lista con enlace al listado filtrado -->
      <section class="tb-bloque">
        <div class="tb-bloque__tit"><span class="tb-h">{{ n('avisos') }}. Para revisar</span><span class="tb-nota">cada uno abre su listado filtrado</span></div>
        <div class="tb-caja">
          <div class="tb-banda"><span>Pendientes</span><span>{{ avisos.length }} {{ avisos.length === 1 ? 'tema' : 'temas' }}</span></div>
          <div class="tb-avisos">
            <router-link v-for="a in avisos" :key="a.clave" :to="a.to" class="tb-aviso">
              <span class="tb-aviso__cifra num" :class="{ 'is-rojo': a.rojo }">{{ a.cifra }}</span>
              <span class="tb-fila__txt"><span class="tb-aviso__eti">{{ a.etiqueta }}</span><span class="tb-fila__sub">{{ a.sub }}</span></span>
              <span class="tb-aviso__verbo" :class="{ 'is-rojo': a.rojo }">{{ a.verbo }}<v-icon size="18">mdi-chevron-right</v-icon></span>
            </router-link>
            <div v-if="!avisos.length" class="tb-vacio">Nada pendiente</div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { adminListCashRegisters } from "@/modules/pos/services/posCashRegisters.service";

const props = defineProps({
  loading: { type: Boolean, default: false },
  loadingAnalytics: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  isSuperAdmin: { type: Boolean, default: false },
  scopeLabel: { type: String, default: "Todas las sucursales" },
  period: { type: String, default: "12m" },
  branches: { type: Array, default: () => [] },
  selectedBranch: { type: [Number, String], default: null },
  sales: { type: Object, default: () => ({}) },
  analytics: { type: Object, default: null },
  stock: { type: Object, default: () => ({}) },
  inventory: { type: Object, default: () => ({}) },
});
defineEmits(["period-change", "branch-change"]);

const PERIODOS = [
  { value: "7d", nombre: "7 días" },
  { value: "30d", nombre: "30 días" },
  { value: "90d", nombre: "90 días" },
  { value: "12m", nombre: "12 meses" },
];

// Paleta monocromática del tablero; el rojo se usa una sola vez por pantalla.
const R = ["#0a466e", "#0f6fae", "#3f8fc6", "#8cc0e3", "#c9e1f2"];
const VERDE = "#2E9E7B";
const GRIS = "#C3C9D6";

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DIAS_JS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const num = (v) => Number(v || 0);
const miles = (v) => Math.round(num(v)).toLocaleString("es-AR");
const plata = (v) => "$ " + miles(v);
const corto = (v) => {
  const x = num(v);
  if (x >= 1e6) return (x / 1e6).toLocaleString("es-AR", { maximumFractionDigits: 1 }) + " M";
  if (x >= 1e3) return Math.round(x / 1e3) + " k";
  return String(Math.round(x));
};
const pct = (a, b) => (num(b) ? Math.round((num(a) / num(b)) * 100) : 0);
const pctChico = (a, b) => {
  const p = num(b) ? (num(a) / num(b)) * 100 : 0;
  return p > 0 && p < 1 ? "< 1 %" : Math.round(p) + " %";
};
const ancho = (a, max) => (num(a) > 0 && num(max) > 0 ? Math.max(4, (num(a) / num(max)) * 100) : 0);
const tramo = (color, v, tot) => ({ background: color, width: (v && tot ? Math.max(1.5, (v / tot) * 100) : 0) + "%" });

const ymdLocal = (s) => {
  const [y, m, d] = String(s || "").slice(0, 10).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
const ddmm = (dt) => `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}`;
const ddmmyyyy = (s) => {
  if (!s) return "";
  const dt = ymdLocal(s);
  return `${ddmm(dt)}/${dt.getFullYear()}`;
};

const rangoTexto = computed(() => {
  const d = props.sales?.periodFrom, h = props.sales?.periodTo;
  return d && h ? `${ddmmyyyy(d)} a ${ddmmyyyy(h)}` : "";
});

// ── Serie diaria del período ────────────────────────────────────────────────
const diario = computed(() => (props.sales?.salesByPeriodDaily || []).map((r) => ({ date: String(r.date), total: num(r.total), count: num(r.count) })));
const totalPeriodo = computed(() => diario.value.reduce((a, r) => a + r.total, 0));
const ventasPeriodo = computed(() => diario.value.reduce((a, r) => a + r.count, 0));

// Bloque 1: 12 meses por mes, 90 días por semana, 30 y 7 días por día.
const serie = computed(() => {
  const filas = diario.value;
  let grupos = [];
  let titulo = "Ventas por día";
  let nota = "el día de hoy va claro";
  if (props.period === "12m") {
    titulo = "Ventas por mes";
    nota = "el mes en curso va claro";
    const m = new Map();
    for (const r of filas) {
      const k = r.date.slice(0, 7);
      const g = m.get(k) || { total: 0, count: 0 };
      g.total += r.total; g.count += r.count;
      m.set(k, g);
    }
    grupos = [...m.entries()].slice(-12).map(([k, g]) => ({ etiqueta: MESES[Number(k.slice(5, 7)) - 1], ...g }));
  } else if (props.period === "90d") {
    titulo = "Ventas por semana";
    nota = "debajo, el lunes de cada semana";
    const m = new Map();
    for (const r of filas) {
      const dt = ymdLocal(r.date);
      const lunes = new Date(dt);
      lunes.setDate(dt.getDate() - ((dt.getDay() + 6) % 7));
      const k = ddmm(lunes);
      const g = m.get(k) || { total: 0, count: 0 };
      g.total += r.total; g.count += r.count;
      m.set(k, g);
    }
    grupos = [...m.entries()].map(([k, g]) => ({ etiqueta: k, ...g }));
  } else {
    grupos = filas.map((r) => {
      const dt = ymdLocal(r.date);
      return { etiqueta: props.period === "7d" ? DIAS_JS[dt.getDay()] : String(dt.getDate()), total: r.total, count: r.count };
    });
  }
  if (!grupos.some((g) => g.total > 0)) return { titulo, nota, cols: [] };
  const max = Math.max(...grupos.map((g) => g.total));
  const densa = grupos.length > 16;
  const cols = grupos.map((g, i) => {
    const ultimo = i === grupos.length - 1;
    const color = ultimo ? R[3] : g.total === max ? R[0] : g.total ? R[1] : GRIS;
    return {
      etiqueta: g.etiqueta,
      // En las series densas, solo el pico lleva cifra arriba
      cifra: g.total && (!densa || g.total === max) ? corto(g.total) : "",
      sub: densa ? "" : g.count ? `${g.count} v.` : "sin ventas",
      alto: g.total ? Math.max(6, (g.total / max) * 190) : 4,
      color,
    };
  });
  return { titulo, nota, cols };
});

// ── Bloque 2: sucursales ────────────────────────────────────────────────────
const sucursales = computed(() => {
  const filas = (props.sales?.salesByBranchPeriod || props.sales?.salesByBranch || []).map((r) => ({
    id: r.branch_id, nombre: r.branch_name, total: num(r.total), count: num(r.count),
  }));
  const vistas = new Set(filas.map((f) => Number(f.id)));
  for (const b of props.branches) {
    if (!vistas.has(Number(b.id))) filas.push({ id: b.id, nombre: b.name, total: 0, count: 0 });
  }
  return filas.sort((a, b) => b.total - a.total);
});
const maxSucursal = computed(() => Math.max(0, ...sucursales.value.map((s) => s.total)));
const sucursalesSinVentas = computed(() => sucursales.value.filter((s) => !s.total));

// Numeración corrida: si el bloque de sucursales no se muestra, los demás no saltan un número.
const ORDEN = ["pagos", "cajeros", "horas", "dias", "stock", "productos", "inventario", "avisos"];
const n = (clave) => ORDEN.indexOf(clave) + (props.selectedBranch ? 2 : 3);

// ── Bloque 3: medios de pago (se juntan los renglones con la misma etiqueta) ──
const pagos = computed(() => {
  const m = new Map();
  for (const r of props.sales?.salesByPaymentPeriod || []) {
    const k = r.label || r.method || "Otro";
    const g = m.get(k) || { etiqueta: k, total: 0, count: 0 };
    g.total += num(r.total); g.count += num(r.count);
    m.set(k, g);
  }
  const lista = [...m.values()].filter((p) => p.total > 0).sort((a, b) => b.total - a.total);
  const colores = [R[0], R[1], R[2], R[3], R[4]];
  return lista.map((p, i) => ({ ...p, color: i < colores.length && p.etiqueta !== "Otro" ? colores[i] : GRIS }));
});
const totalPagos = computed(() => pagos.value.reduce((a, p) => a + p.total, 0));
const dona = computed(() => {
  const tot = totalPagos.value;
  if (!tot) return GRIS;
  let ang = 0;
  const tramos = [];
  for (const p of pagos.value) {
    const a = (p.total / tot) * 360;
    const fin = ang + Math.max(0.5, a - (pagos.value.length > 1 ? 2.5 : 0));
    tramos.push(`${p.color} ${ang.toFixed(2)}deg ${fin.toFixed(2)}deg`, `var(--tb-caja) ${fin.toFixed(2)}deg ${(ang + a).toFixed(2)}deg`);
    ang += a;
  }
  return `conic-gradient(${tramos.join(", ")})`;
});

// ── Bloque 4: cajeros (de la sexta en adelante van juntos en "Otros") ────────
const cajeros = computed(() => {
  const filas = (props.sales?.topCashiersPeriod || []).filter((r) => num(r.total) > 0);
  const sub = (r) => [r.branch_name, `${miles(r.count)} ventas`].filter(Boolean).join(" · ");
  if (filas.length <= 6) return filas.map((r) => ({ nombre: r.user_label, total: num(r.total), sub: sub(r) }));
  const top = filas.slice(0, 5).map((r) => ({ nombre: r.user_label, total: num(r.total), sub: sub(r) }));
  const resto = filas.slice(5);
  top.push({
    otros: true,
    nombre: `Otros ${resto.length} usuarios`,
    total: resto.reduce((a, r) => a + num(r.total), 0),
    sub: `${resto[0].user_label} y ${resto.length - 1} más · ${miles(resto.reduce((a, r) => a + num(r.count), 0))} ventas`,
  });
  return top;
});
const maxCajero = computed(() => Math.max(0, ...cajeros.value.map((c) => c.total)));
const cajerosCabecera = computed(() => {
  const k = (props.sales?.topCashiersPeriod || []).filter((r) => num(r.total) > 0).length;
  if (!k) return "sin ventas";
  return k >= 10 ? "los 10 que más vendieron" : `${k} ${k === 1 ? "usuario vendió" : "usuarios vendieron"}`;
});

// ── Bloque 5: horas (se recortan las horas vacías de las puntas) ────────────
const horas = computed(() => {
  const h = (props.sales?.salesByHour || []).map((r) => ({ hour: num(r.hour), count: num(r.count) }));
  const conVentas = h.filter((r) => r.count > 0);
  if (!conVentas.length) return [];
  const desde = conVentas[0].hour, hasta = conVentas[conVentas.length - 1].hour;
  const max = Math.max(...conVentas.map((r) => r.count));
  return h.filter((r) => r.hour >= desde && r.hour <= hasta).map((r) => ({
    ...r,
    alto: r.count ? Math.max(4, (r.count / max) * 200) : 4,
    color: !r.count ? GRIS : r.count === max ? R[0] : r.count >= max * 0.4 ? R[1] : R[3],
  }));
});
const horaPico = computed(() => {
  const h = props.sales?.salesByHour || [];
  return h.reduce((m, r) => (num(r.count) > num(m?.count) ? r : m), null);
});

// ── Bloque 6: ticket promedio por día (la API da 0 = lunes, hora local) ─────
const dias = computed(() => {
  const filas = props.analytics?.avgTicketByDow || [];
  const max = Math.max(0, ...filas.map((r) => num(r.avgTicket)));
  return DIAS.map((etiqueta, dow) => {
    const r = filas.find((x) => num(x.dow) === dow) || {};
    const t = num(r.avgTicket);
    return {
      dow, etiqueta, avgTicket: t, count: num(r.count),
      alto: t && max ? Math.max(6, (t / max) * 190) : 4,
      color: !t ? GRIS : t === max ? R[0] : R[1],
    };
  });
});

// ── Bloque 7: stock por sucursal ─────────────────────────────────────────────
const stockFilas = computed(() =>
  (props.stock?.stockByBranch || [])
    .map((r) => ({ ...r, ok: num(r.ok), low: num(r.low), out: num(r.out), tot: num(r.ok) + num(r.low) + num(r.out) }))
    .filter((r) => r.tot > 0)
    .sort((a, b) => b.tot - a.tot)
);

// ── Bloque 8: más vendidos ───────────────────────────────────────────────────
const productos = computed(() => (props.sales?.topProductsPeriod || []).filter((r) => num(r.units) > 0).slice(0, 8));
const maxUnidades = computed(() => Math.max(0, ...productos.value.map((p) => num(p.units))));

// ── Bloque 9: inventario por sucursal, a precio de lista ────────────────────
const inventario = computed(() => {
  const m = new Map();
  for (const r of props.stock?.inventoryValue || []) {
    const k = r.branch_name || r.warehouse_name || "Sin sucursal";
    const g = m.get(k) || { nombre: k, valor: 0, unidades: 0, productos: 0 };
    g.valor += num(r.price_list_value); g.unidades += num(r.total_units); g.productos += num(r.products_count);
    m.set(k, g);
  }
  return [...m.values()].filter((g) => g.valor > 0).sort((a, b) => b.valor - a.valor);
});
const totalInventario = computed(() => inventario.value.reduce((a, g) => a + g.valor, 0));
const unidadesInventario = computed(() => inventario.value.reduce((a, g) => a + g.unidades, 0));
const maxInventario = computed(() => Math.max(0, ...inventario.value.map((g) => g.valor)));

// ── Bloque 10: avisos ────────────────────────────────────────────────────────
const cajasAbiertas = ref([]);
async function cargarCajas() {
  if (!props.isAdmin) { cajasAbiertas.value = []; return; }
  try {
    const res = await adminListCashRegisters({ status: "OPEN", branch_id: props.selectedBranch || "", limit: 50 });
    cajasAbiertas.value = Array.isArray(res?.data) ? res.data : [];
  } catch { cajasAbiertas.value = []; }
}
onMounted(cargarCajas);
watch(() => [props.selectedBranch, props.isAdmin], cargarCajas);

const diasDesde = (iso) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);

const avisos = computed(() => {
  const lista = [];
  const conSuc = (q) => (props.selectedBranch ? { ...q, sucursal: String(props.selectedBranch) } : q);

  // Cajas abiertas desde hace más de un día: la más vieja va en rojo
  const viejas = cajasAbiertas.value
    .filter((c) => c.opened_at && diasDesde(c.opened_at) >= 1)
    .sort((a, b) => new Date(a.opened_at) - new Date(b.opened_at));
  if (viejas.length) {
    const c = viejas[0];
    lista.push({
      clave: "caja", rojo: true,
      cifra: `${diasDesde(c.opened_at)} d`,
      etiqueta: viejas.length === 1 ? `Caja #${c.id} de ${c.branch_name || "sucursal"} abierta` : `${viejas.length} cajas abiertas hace más de un día`,
      sub: viejas.length === 1 ? (c.opened_by_name || "") : `la más vieja, #${c.id} de ${c.branch_name || "sucursal"}`,
      verbo: "Hacer el arqueo",
      to: { name: "adminCashRegisters", query: { estado: "abiertas" } },
    });
  }

  const sin = num(props.stock?.outOfStockCount);
  if (sin) {
    const porSuc = stockFilas.value.filter((r) => r.out).slice(0, 2).map((r) => `${miles(r.out)} en ${r.branch_name}`).join(", ");
    lista.push({ clave: "sin", cifra: miles(sin), etiqueta: "Productos sin stock", sub: porSuc, verbo: "Ver los sin stock", to: { name: "products", query: conSuc({ stock: "without" }) } });
  }
  const bajo = num(props.stock?.lowStockCount);
  if (bajo) {
    lista.push({ clave: "bajo", cifra: miles(bajo), etiqueta: "Con stock bajo", sub: `${props.stock?.lowThreshold || 3} unidades o menos`, verbo: "Ver los de stock bajo", to: { name: "products", query: conSuc({ stock: "low" }) } });
  }
  const sinPrecio = num(props.inventory?.noPriceProducts);
  if (sinPrecio) {
    lista.push({ clave: "precio", cifra: miles(sinPrecio), etiqueta: "Productos sin precio", sub: "no se pueden vender", verbo: "Ver los sin precio", to: { name: "products", query: conSuc({ precio: "without" }) } });
  }
  const anuladas = props.analytics?.cancelled;
  if (num(anuladas?.count)) {
    lista.push({ clave: "anuladas", cifra: miles(anuladas.count), etiqueta: "Ventas anuladas", sub: `${plata(anuladas.total)} en el período`, verbo: "Ver las anuladas", to: { name: "posSales", query: { estado: "CANCELLED" } } });
  }
  if (!props.selectedBranch && props.isAdmin && sucursalesSinVentas.value.length && sucursales.value.length > sucursalesSinVentas.value.length) {
    const nombres = sucursalesSinVentas.value.map((s) => s.nombre);
    lista.push({
      clave: "sucursales", cifra: String(nombres.length),
      etiqueta: nombres.length === 1 ? "Sucursal sin ventas" : "Sucursales sin ventas",
      sub: nombres.length <= 2 ? `${nombres.join(" y ")}, en el período` : `${nombres.slice(0, 2).join(", ")} y ${nombres.length - 2} más`,
      verbo: "Ver sucursales", to: { name: "adminBranches" },
    });
  }
  return lista;
});
</script>

<style>
/* Tokens del tablero. Sin scoped: todo cuelga de .tb, así el tema oscuro
   se resuelve con .v-theme--dark .tb sin :global(). */
.tb {
  --tb-fondo: #d6e6f3;
  --tb-caja: #ffffff;
  --tb-borde: #d3dde7;
  --tb-linea: #eef2f6;
  --tb-texto: #0f172a;
  --tb-suave: #5a6678;
  --tb-tenue: #94a3b8;
  --tb-pista: rgba(15, 23, 42, 0.06);
  --tb-banda: #0f6fae;
  --tb-rojo: #c4453f;
  --tb-acento: #0f6fae;
}
.v-theme--dark .tb {
  --tb-fondo: #0b0f14;
  --tb-caja: #151c25;
  --tb-borde: #253141;
  --tb-linea: #1f2937;
  --tb-texto: #e5edf5;
  --tb-suave: #9aa8b8;
  --tb-tenue: #64748b;
  --tb-pista: rgba(255, 255, 255, 0.07);
  --tb-banda: #0f5f96;
  --tb-acento: #5aaee0;
}

/* El tablero ocupa el ancho entero del área de trabajo, con su propio fondo */
.pos-container:has(.tb) {
  max-width: none !important;
  padding: 0 !important;
  margin: 0 !important;
}
.dash:has(> .tb) { gap: 0; padding-bottom: 0; }

.tb {
  padding: 24px 28px 40px;
  min-height: calc(100vh - 72px);
  background: var(--tb-fondo);
  color: var(--tb-texto);
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-sizing: border-box;
}
.tb .num { font-variant-numeric: tabular-nums; }
.tb .clamp1 { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.tb-cab { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; max-width: 1300px; width: 100%; margin: 0 auto; }
.tb-cab__txt { display: flex; flex-direction: column; gap: 2px; }
.tb-cab__titulo { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.2; }
.tb-cab__sub { font-size: 14px; font-weight: 600; color: var(--tb-suave); }
.tb-cab__acciones { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

.tb-periodos { display: flex; gap: 4px; padding: 4px; border-radius: 10px; background: var(--tb-caja); border: 1px solid var(--tb-borde); }
.tb-periodo { height: 34px; padding: 0 14px; border: 0; border-radius: 8px; font: 700 14px inherit; font-family: inherit; background: transparent; color: var(--tb-suave); cursor: pointer; }
.tb-periodo.is-activo { background: #0f6fae; color: #ffffff; }

.tb-suc { height: 42px; display: inline-flex; align-items: center; gap: 8px; padding: 0 14px; border-radius: 10px; border: 1px solid var(--tb-borde); background: var(--tb-caja); font-weight: 700; font-size: 14px; color: var(--tb-texto); cursor: pointer; font-family: inherit; }
.tb-suc--fija { cursor: default; }
.tb-suc__ic { color: var(--tb-acento); }
.tb-suc__flecha { color: var(--tb-suave); }

.tb-carga { max-width: 1300px; margin: -12px auto 0; border-radius: 4px; }

.tb-grilla { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; max-width: 1300px; width: 100%; margin: 0 auto; }
@media (max-width: 1100px) { .tb-grilla { grid-template-columns: minmax(0, 1fr); } }

.tb-bloque { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.tb-bloque__tit { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.tb-h { font-size: 22px; font-weight: 800; }
.tb-nota { font-size: 13px; color: var(--tb-suave); }
.tb-caja { border-radius: 12px; overflow: hidden; background: var(--tb-caja); border: 1px solid var(--tb-borde); flex: 1; }
.tb-banda { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 16px; background: var(--tb-banda); color: #ffffff; font-size: 14px; font-weight: 700; }
.tb-banda > span:first-child { font-size: 15px; font-weight: 800; }

/* columnas */
.tb-cols { height: 300px; display: flex; align-items: flex-end; gap: 4px; padding: 16px 16px 12px; box-sizing: border-box; }
.tb-cols--horas { gap: 3px; }
.tb-cols--dias { gap: 6px; justify-content: space-around; }
.tb-cols--densa { gap: 2px; }
.tb-col { flex: 1; min-width: 0; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 6px; }
.tb-col__cifra { font-size: 12px; font-weight: 800; white-space: nowrap; }
.tb-col__barra { display: block; width: 100%; max-width: 46px; border-radius: 6px 6px 2px 2px; }
.tb-col__eti { font-size: 13px; font-weight: 700; white-space: nowrap; }
.tb-col__sub { font-size: 11px; color: var(--tb-suave); white-space: nowrap; }
.tb-cols--densa .tb-col__eti { font-size: 10px; font-weight: 600; }
.tb-cols--dias .tb-col__cifra { font-size: 13px; }
.tb-cols--dias .tb-col__eti { font-size: 14px; }
.tb-cols--dias .tb-col__sub { font-size: 12px; }

/* filas */
.tb-filas { display: flex; flex-direction: column; padding: 4px 16px 12px; }
.tb-fila { display: flex; flex-direction: column; gap: 8px; padding: 14px 0; border-bottom: 1px solid var(--tb-linea); }
.tb-fila--chica { gap: 6px; padding: 10px 0; }
.tb-fila--mini { gap: 6px; padding: 9px 0; }
.tb-fila:last-child { border-bottom: 0; }
.tb-fila__linea { display: flex; align-items: center; gap: 14px; }
.tb-fila__cifra { width: 64px; flex-shrink: 0; font-size: 24px; font-weight: 800; }
.tb-fila__cifra--chica { width: 44px; font-size: 22px; }
.tb-fila__txt { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.tb-fila__eti { font-size: 16px; font-weight: 700; }
.tb-fila__eti--chica { flex: 1; min-width: 0; font-size: 15px; }
.tb-fila__sub { font-size: 13px; color: var(--tb-suave); }
.tb-fila__dato { font-size: 16px; font-weight: 800; white-space: nowrap; }
.tb-fila__dato--chico { font-size: 15px; }
.tb-pista { display: block; height: 8px; border-radius: 9999px; background: var(--tb-pista); }
.tb-pista__barra { display: block; height: 8px; border-radius: 9999px; }
.tb-partes { display: flex; gap: 2px; height: 8px; }
.tb-partes > span { display: block; height: 8px; border-radius: 3px; }
.tb-claves { display: flex; align-items: center; gap: 12px; font-size: 13px; }
.tb-claves > span { display: flex; align-items: center; gap: 5px; }
.tb-claves i { width: 10px; height: 10px; border-radius: 3px; display: block; }

/* dona */
.tb-dona-caja { display: flex; align-items: center; gap: 24px; padding: 20px 20px 24px; }
.tb-dona { position: relative; width: 210px; height: 210px; flex-shrink: 0; border-radius: 9999px; }
.tb-dona__centro { position: absolute; inset: 15%; border-radius: 9999px; background: var(--tb-caja); display: flex; flex-direction: column; align-items: center; justify-content: center; }
.tb-dona__cifra { font-size: 26px; font-weight: 800; }
.tb-dona__sub { font-size: 13px; color: var(--tb-suave); }
.tb-leyenda { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 10px; }
.tb-leyenda__fila { display: flex; align-items: center; gap: 10px; }
.tb-leyenda__eti { font-size: 15px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tb-leyenda__cifra { font-size: 18px; font-weight: 800; }
.tb-cuadro { width: 14px; height: 14px; flex-shrink: 0; border-radius: 4px; }

/* avisos */
.tb-avisos { display: flex; flex-direction: column; padding: 4px 8px 8px; }
.tb-aviso { display: flex; align-items: center; gap: 14px; padding: 12px 8px; border-bottom: 1px solid var(--tb-linea); text-decoration: none; color: var(--tb-texto); border-radius: 8px; }
.tb-aviso:last-child { border-bottom: 0; }
.tb-aviso:hover { background: var(--tb-pista); }
.tb-aviso__cifra { width: 64px; flex-shrink: 0; font-size: 24px; font-weight: 800; }
.tb-aviso__eti { font-size: 15px; font-weight: 700; }
.tb-aviso__verbo { flex-shrink: 0; display: flex; align-items: center; gap: 2px; font-size: 14px; font-weight: 800; color: var(--tb-acento); }
.tb-aviso .is-rojo, .tb-aviso__cifra.is-rojo, .tb-aviso__verbo.is-rojo { color: var(--tb-rojo); }

.tb-vacio { flex: 1; align-self: center; text-align: center; font-size: 14px; font-weight: 600; color: var(--tb-suave); padding: 24px 0; }
.tb-vacio--caja { padding: 60px 0; }

@media (max-width: 700px) {
  .tb { padding: 16px; }
  .tb-dona-caja { flex-direction: column; }
}
</style>
