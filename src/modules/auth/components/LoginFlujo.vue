<!-- src/modules/auth/components/LoginFlujo.vue -->
<!-- Flujo de entrada para la banda del login: los canales de POS 360 a la izquierda,
     líneas que se juntan en un tronco y una sola tarjeta horizontal "Hoy en el negocio" (grilla de 3 × 2) que recibe
     los paquetes de todos los canales y los combina. Un canal por vez cada 3 s: se
     enciende con un destello que dice qué hace, manda su paquete y al llegar su fila de
     la tarjeta suma el dato; el total y el ticket promedio (Asistente IA) se recalculan.
     Forma y animación tomadas del hero de fu.do (slide 01); colores de la marca POS 360
     y radios del kit (techo 14). Datos de ejemplo: es una ilustración, no lee el sistema. -->
<template>
  <div class="fl" aria-hidden="true">
    <div class="fl-stage">
      <!-- Líneas y haces -->
      <svg class="fl-lines" :viewBox="`0 0 ${LW} ${H}`" preserveAspectRatio="none" fill="none">
        <defs>
          <linearGradient id="flHaz" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stop-color="#a6d8fa" />
            <stop offset="100%" stop-color="#ffffff" />
          </linearGradient>
          <filter id="flBrillo" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.2" />
          </filter>
        </defs>
        <path v-for="(d, i) in PATHS" :key="'l' + i" class="fl-line" :d="d" pathLength="1" :style="{ '--i': i }" />
        <!-- Línea encendida mientras viaja su paquete -->
        <path v-for="(d, i) in PATHS" :key="'a' + i" class="fl-activa" :d="d" :style="{ '--i': i }" />
        <!-- Paquete: estela con halo, estela clara y cabeza blanca que recorre la misma línea -->
        <path v-for="(d, i) in PATHS" :key="'g' + i" class="fl-haz fl-haz--brillo" :d="d" pathLength="1" :style="{ '--i': i }" />
        <path v-for="(d, i) in PATHS" :key="'c' + i" class="fl-haz fl-haz--nucleo" :d="d" pathLength="1" :style="{ '--i': i }" />
        <circle
          v-for="(d, i) in PATHS"
          :key="'p' + i"
          class="fl-cabeza"
          r="4.5"
          :style="{ '--i': i, offsetPath: `path('${d}')` }"
        />
        <!-- Llegada a la tarjeta -->
        <circle class="fl-llegada" :cx="LW" :cy="C" r="6" />
      </svg>

      <!-- Canales -->
      <ul class="fl-rail">
        <li v-for="(c, i) in CANALES" :key="c.t" class="fl-tile" :style="{ '--i': i }" :title="c.t">
          <span class="fl-tile__ico"><v-icon size="22">{{ c.i }}</v-icon></span>
          <span class="fl-tile__tx"><b>{{ c.t }}</b><small>{{ c.d }}</small></span>
        </li>
      </ul>

      <!-- Tarjeta que recibe y combina -->
      <div class="fl-stack">
        <article ref="cardEl" class="fl-card">
          <header class="fl-chead">
            <span class="fl-cico"><v-icon size="20">mdi-store-outline</v-icon></span>
            <span class="fl-cmeta"><b>Hoy en el negocio</b><small>Sucursal Centro · {{ hora }}</small></span>
            <span class="fl-ctotal" :class="{ sube: [0, 1, 3].includes(llego) }">
              <small>Ventas de hoy</small>
              <b class="m-num">{{ pesos(totalVentas) }}</b>
            </span>
          </header>

          <div class="fl-grilla">
            <div v-for="(f, i) in filas" :key="f.t" class="fl-celda" :class="{ llega: llego === i }">
              <span class="fl-celda__rot"><v-icon size="15">{{ CANALES[i].i }}</v-icon>{{ f.t }}</span>
              <span class="fl-celda__v m-num">{{ f.v }}</span>
              <small class="fl-celda__det">{{ f.d }}</small>
              <em v-if="llego === i && delta" class="fl-celda__delta m-num">{{ delta }}</em>
            </div>
          </div>

          <footer class="fl-cpie">
            <span class="fl-cpie__punto" :class="{ on: llego >= 0 }"></span>
            <span v-if="ultimaEntrada">Última entrada: <b>{{ ultimaEntrada }}</b> · {{ hora }}</span>
            <span v-else>Recibe de 6 canales</span>
          </footer>
        </article>
        <!-- Contorno medido sobre la tarjeta real (sin estirar), así sigue su radio de 12 px -->
        <svg v-if="caja.w" class="fl-trace" :viewBox="`0 0 ${caja.w} ${caja.h}`" fill="none">
          <rect x="1" y="1" :width="caja.w - 2" :height="caja.h - 2" rx="11" ry="11" pathLength="1" class="fl-trace-rect" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, ref, onMounted, onBeforeUnmount } from "vue";

// Geometría: 6 canales de 56 px con 24 px entre sí; las líneas van del borde del
// canal (x 0) al mazo (x LW), juntándose en el centro vertical con curvas de radio R.
const TILE = 56, GAP = 24, LW = 140, R = 16;
const N = 6;                                   // canales
const H = N * TILE + (N - 1) * GAP;          // 456
const C = H / 2;                               // tronco
const XV = [80, 66, 52];                    // bajada de afuera hacia adentro

const PATHS = Array.from({ length: N }, (_, i) => {
  const y = i * (TILE + GAP) + TILE / 2;
  if (y === C) return `M0 ${y} L${LW} ${C}`;   // el del medio va derecho
  const arriba = y < C;
  const xv = XV[arriba ? i : N - 1 - i];
  return arriba
    ? `M0 ${y} L${xv - R} ${y} A${R} ${R} 0 0 1 ${xv} ${y + R} L${xv} ${C - R} A${R} ${R} 0 0 0 ${xv + R} ${C} L${LW} ${C}`
    : `M0 ${y} L${xv - R} ${y} A${R} ${R} 0 0 0 ${xv} ${y - R} L${xv} ${C + R} A${R} ${R} 0 0 1 ${xv + R} ${C} L${LW} ${C}`;
});

const CANALES = [
  { i: "mdi-cash-register", t: "Mostrador", d: "Venta, cobro y caja" },
  { i: "mdi-storefront-outline", t: "Tienda online", d: "Pedidos web" },
  { i: "mdi-file-document-outline", t: "Presupuestos", d: "Cotizaciones" },
  { i: "mdi-wrench-outline", t: "Servicio técnico", d: "Órdenes de reparación" },
  { i: "mdi-swap-horizontal", t: "Derivaciones", d: "Stock entre sucursales" },
  { i: "mdi-forum-outline", t: "Asistente IA", d: "Consultas del negocio" },
];

// Estado de la tarjeta. Cada llegada suma un movimiento del canal; al terminar la
// vuelta (18 s) vuelve al punto de partida para que los números no crezcan sin fin.
const BASE = () => ({
  mostrador: { n: 17, p: 257300 },
  tienda: { n: 4, p: 48900 },
  presup: { n: 2, p: 214000 },
  servicio: { n: 3, p: 118000 },
  deriv: { n: 1, u: 8 },
});
const est = reactive(BASE());
// Cada paso suma lo que trae el paquete y devuelve el texto del cambio.
const PASO = [
  () => { est.mostrador.n += 1; est.mostrador.p += 39500; return "+ $ 39.500"; },
  () => { est.tienda.n += 1; est.tienda.p += 66600; return "+ $ 66.600"; },
  () => { est.presup.n += 1; est.presup.p += 866500; return "+ 1"; },
  () => { est.servicio.n += 1; est.servicio.p += 96000; return "+ $ 96.000"; },
  () => { est.deriv.n += 1; est.deriv.u += 15; return "+ 15 u."; },
  () => "recalculado", // el asistente no suma: recalcula con lo que juntaron los demás
];

const totalVentas = computed(() => est.mostrador.p + est.tienda.p + est.servicio.p);
const operaciones = computed(() => est.mostrador.n + est.tienda.n + est.servicio.n);
const filas = computed(() => [
  { t: "Mostrador", d: `${est.mostrador.n} ventas`, v: pesos(est.mostrador.p) },
  { t: "Tienda online", d: `${est.tienda.n} pedidos`, v: pesos(est.tienda.p) },
  { t: "Presupuestos", d: `${est.presup.n} abiertos`, v: pesos(est.presup.p) },
  { t: "Servicio técnico", d: `${est.servicio.n} órdenes`, v: pesos(est.servicio.p) },
  { t: "Derivaciones", d: `${est.deriv.n} en camino`, v: `${est.deriv.u} u.` },
  { t: "Asistente IA", d: "Ticket promedio", v: pesos(Math.round(totalVentas.value / operaciones.value)) },
]);

// Reloj de la ilustración, alineado con las animaciones CSS: el paquete del canal i
// llega a los 2,8 s + i × 3 s y la vuelta dura 18 s.
const LLEGA = 2800, RANURA = 3000, VUELTA = 18000;
const llego = ref(-1);
const cardEl = ref(null);
const caja = reactive({ w: 0, h: 0 });
let ro = null;
const delta = ref("");
const ultimaEntrada = ref("");
const minutos = ref(24);
const hora = computed(() => `19:${String(minutos.value).padStart(2, "0")}`);
let t0 = 0, ultimo = -1, timer = null;
onMounted(() => {
  // Tamaño real de la tarjeta para el contorno (cambia con el zoom y la fuente).
  ro = new ResizeObserver(([e]) => {
    caja.w = Math.round(e.target.offsetWidth);
    caja.h = Math.round(e.target.offsetHeight);
  });
  if (cardEl.value) ro.observe(cardEl.value);
  t0 = performance.now();
  timer = setInterval(() => {
    const t = performance.now() - t0 - LLEGA;
    if (t < 0) return;
    const paso = Math.floor(t / RANURA);          // pasos desde el inicio
    if (paso === ultimo) return;
    ultimo = paso;
    const i = paso % CANALES.length;
    if (i === 0 && paso > 0) Object.assign(est, BASE());
    delta.value = PASO[i]();
    ultimaEntrada.value = CANALES[i].t;
    minutos.value = 24 + (paso % CANALES.length) * 4;
    llego.value = i;
    setTimeout(() => { if (llego.value === i) llego.value = -1; }, 1800);
  }, 100);
});
onBeforeUnmount(() => { clearInterval(timer); ro?.disconnect(); });

const pesos = (n) => "$ " + n.toLocaleString("es-AR");
</script>

<style scoped>
.fl { width: 100%; }
.fl-stage {
  position: relative;
  width: 792px;
  height: 456px;
  max-width: 100%;
}

/* ── Líneas ── */
.fl-lines {
  position: absolute;
  left: 196px;
  top: 0;
  width: 140px;
  height: 456px;
  overflow: visible;
  z-index: 1;
}
.fl-line {
  stroke: rgba(255, 255, 255, 0.2);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
  stroke-dasharray: 1;
  animation: fl-trazo 0.55s ease-out calc(0.35s + var(--i) * 0.07s) both;
}
/* Línea del canal que está mandando: se enciende durante el viaje */
.fl-activa {
  stroke: #a6d8fa;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
  opacity: 0;
  animation: fl-activa 18s ease-in-out calc(1s + var(--i) * 3s) infinite backwards;
}

/* Paquete. La estela y la cabeza usan los mismos tiempos (0 a 10 % de la vuelta,
   lineal) para que la cabeza vaya siempre en la punta de la estela. */
.fl-haz {
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
  stroke-dasharray: 0.16 0.84;
  stroke-dashoffset: 0.16;
  opacity: 0;
  animation: fl-haz 18s linear calc(1s + var(--i) * 3s) infinite backwards;
}
.fl-haz--nucleo { stroke: url(#flHaz); stroke-width: 3; }
.fl-haz--brillo { stroke: #6fc0f2; stroke-width: 10; filter: url(#flBrillo); }
.fl-cabeza {
  fill: #fff;
  offset-rotate: 0deg;
  offset-distance: 0%;
  opacity: 0;
  filter: drop-shadow(0 0 4px #fff) drop-shadow(0 0 10px #6fc0f2);
  animation: fl-cabeza 18s linear calc(1s + var(--i) * 3s) infinite backwards;
}
/* Anillo en la entrada de la tarjeta cuando llega cada paquete (cada 3 s) */
.fl-llegada {
  fill: none;
  stroke: #a6d8fa;
  stroke-width: 2;
  transform-box: fill-box;
  transform-origin: center;
  opacity: 0;
  animation: fl-llegada 3s ease-out 2.8s infinite both;
}

/* ── Canales ── */
.fl-rail {
  position: absolute;
  left: 0; top: 0;
  margin: 0; padding: 0; list-style: none;
  display: flex;
  flex-direction: column;
  gap: 24px;
  z-index: 5;
}
.fl-tile {
  position: relative;
  width: 196px; height: 56px;
  box-sizing: border-box;
  padding: 0 12px 0 14px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  animation:
    fl-pop 0.42s cubic-bezier(0.34, 1.56, 0.64, 1) calc(var(--i) * 0.07s) both,
    fl-tile-on 18s ease-in-out calc(1s + var(--i) * 3s) infinite backwards;
}
.fl-tile__ico { flex: none; display: grid; place-items: center; }
.fl-tile__ico .v-icon { color: #a6d8fa; }
.fl-tile__tx { display: flex; flex-direction: column; min-width: 0; line-height: 1.3; }
.fl-tile__tx b { font-size: 13px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fl-tile__tx small {
  font-size: 11.5px; color: rgba(255, 255, 255, 0.55); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  animation: fl-destello-desc 18s ease-in-out calc(1s + var(--i) * 3s) infinite backwards;
}

/* Canal que manda (ranuras de 3 s, 6 canales = 18 s): se aclara el fondo, el borde
   pasa a celeste y su descripción también. Sale el paquete y al llegar suma en la tarjeta. */

/* ── Tarjeta que recibe y combina ── */
.fl-stack {
  position: absolute;
  right: 0;
  top: 50%;
  width: 456px;
  transform: translateY(-50%);
  z-index: 4;
}
.fl-card {
  box-sizing: border-box;
  width: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--m-pieza);
  color: var(--m-tinta);
  border-radius: 12px;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.6) inset, 0 12px 28px rgba(4, 10, 35, 0.28), 0 40px 60px rgba(4, 10, 35, 0.22);
  animation: fl-entra 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.5s both;
}

/* Encabezado */
.fl-chead { display: flex; align-items: center; gap: 12px; }
.fl-cico {
  width: 40px; height: 40px; flex: none;
  border-radius: 10px;
  display: grid; place-items: center;
  background: var(--m-accion);
}
.fl-cico .v-icon { color: #fff; }
.fl-cmeta { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.3; }
.fl-cmeta b { font-size: 15px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fl-cmeta small { font-size: 12px; color: var(--m-suave); font-variant-numeric: tabular-nums; }
.fl-ctotal { display: flex; flex-direction: column; align-items: flex-end; line-height: 1.2; }
.fl-ctotal small { font-size: 11px; font-weight: 600; color: var(--m-suave); }
.fl-ctotal b { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; transition: color 0.6s; }
.fl-ctotal.sube b { color: var(--m-accion); transition: color 0.15s; }

/* Grilla de canales */
.fl-grilla {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
.fl-celda {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 10px 12px 10px;
  border-radius: 10px;
  background: var(--m-variante);
  box-shadow: inset 0 0 0 1px transparent;
  transition: background 0.6s, box-shadow 0.6s;
}
.fl-celda__rot {
  display: flex; align-items: center; gap: 5px; min-width: 0;
  font-size: 11.5px; font-weight: 600; color: var(--m-suave);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.fl-celda__rot .v-icon { color: var(--m-suave); flex: none; transition: color 0.6s; }
.fl-celda__v { font-size: 17px; font-weight: 800; letter-spacing: -0.01em; white-space: nowrap; transition: color 0.6s; }
.fl-celda__det { font-size: 11px; color: var(--m-suave); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
/* Lo que trajo el paquete, arriba a la derecha de la celda */
.fl-celda__delta {
  position: absolute; top: -9px; right: 8px;
  padding: 2px 7px;
  border-radius: 6px;
  background: var(--m-accion);
  color: #fff;
  font-style: normal; font-size: 10.5px; font-weight: 800; white-space: nowrap;
  box-shadow: 0 4px 10px rgba(15, 111, 174, 0.3);
  animation: fl-delta 1.8s ease-out both;
}
/* Llega el paquete del canal: la celda se enciende y su cifra cambia */
.fl-celda.llega {
  background: var(--m-pieza);
  box-shadow: inset 0 0 0 2px var(--m-accion), 0 6px 16px rgba(15, 111, 174, 0.18);
  transition: background 0.15s, box-shadow 0.15s;
}
.fl-celda.llega .fl-celda__v,
.fl-celda.llega .fl-celda__rot .v-icon { color: var(--m-accion); transition: color 0.15s; }

/* Pie: qué fue lo último que entró */
.fl-cpie {
  display: flex; align-items: center; gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--m-linea2);
  font-size: 12px; color: var(--m-suave);
  font-variant-numeric: tabular-nums;
}
.fl-cpie b { color: var(--m-tinta); font-weight: 700; }
.fl-cpie__punto { width: 6px; height: 6px; border-radius: 50%; background: var(--m-gris); flex: none; transition: background 0.3s; }
.fl-cpie__punto.on { background: var(--m-accion); }

/* Contorno que se dibuja alrededor de la tarjeta de arriba */
.fl-trace {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
  z-index: 50;
}
.fl-trace-rect {
  stroke: #6fc0f2;
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: fl-contorno 3s linear 2.8s infinite both;
}

/* ── Animaciones (mismos tiempos que el original) ── */
@keyframes fl-pop {
  0% { opacity: 0; transform: scale(0.4) translateY(6px); }
  100% { opacity: 1; transform: none; }
}
@keyframes fl-trazo {
  0% { stroke-dashoffset: 1; }
  100% { stroke-dashoffset: 0; }
}
@keyframes fl-haz {
  0% { stroke-dashoffset: 0.16; opacity: 0; }
  0.4% { opacity: 1; }
  10% { stroke-dashoffset: -0.84; opacity: 1; }
  11% { stroke-dashoffset: -0.84; opacity: 0; }
  100% { stroke-dashoffset: -0.84; opacity: 0; }
}
@keyframes fl-cabeza {
  0% { offset-distance: 0%; opacity: 0; }
  0.4% { opacity: 1; }
  10% { offset-distance: 100%; opacity: 1; }
  11% { offset-distance: 100%; opacity: 0; }
  100% { offset-distance: 100%; opacity: 0; }
}
@keyframes fl-activa {
  0% { opacity: 0; }
  2% { opacity: 0.55; }
  10% { opacity: 0.55; }
  14% { opacity: 0; }
  100% { opacity: 0; }
}
@keyframes fl-llegada {
  0% { opacity: 0.9; transform: scale(0.4); }
  35% { opacity: 0; transform: scale(2.6); }
  100% { opacity: 0; transform: scale(2.6); }
}
@keyframes fl-delta {
  0% { opacity: 0; transform: translateY(4px); }
  15% { opacity: 1; transform: none; }
  80% { opacity: 1; }
  100% { opacity: 0; }
}
@keyframes fl-entra {
  0% { opacity: 0; transform: translateY(12px); }
  100% { opacity: 1; transform: none; }
}
@keyframes fl-destello-desc {
  0% { color: rgba(255, 255, 255, 0.55); }
  1.2% { color: #a6d8fa; }
  14.6% { color: #a6d8fa; }
  16.4% { color: rgba(255, 255, 255, 0.55); }
  100% { color: rgba(255, 255, 255, 0.55); }
}
@keyframes fl-tile-on {
  0% { background: rgba(255, 255, 255, 0.06); border-color: rgba(255, 255, 255, 0.12); }
  1.2% { background: rgba(255, 255, 255, 0.12); border-color: #6fc0f2; }
  14.6% { background: rgba(255, 255, 255, 0.12); border-color: #6fc0f2; }
  16.4% { background: rgba(255, 255, 255, 0.06); border-color: rgba(255, 255, 255, 0.12); }
  100% { background: rgba(255, 255, 255, 0.06); border-color: rgba(255, 255, 255, 0.12); }
}
@keyframes fl-contorno {
  0% { stroke-dashoffset: 1; opacity: 1; }
  92% { stroke-dashoffset: 0; opacity: 1; }
  96% { stroke-dashoffset: 0; opacity: 0; }
  96.01% { stroke-dashoffset: 1; opacity: 0; }
  100% { stroke-dashoffset: 1; opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .fl-line, .fl-tile, .fl-haz, .fl-cabeza, .fl-activa, .fl-llegada, .fl-trace-rect, .fl-tile__tx small { animation: none; }
  .fl-haz, .fl-cabeza, .fl-activa, .fl-llegada, .fl-trace-rect { opacity: 0; }
  .fl-card { animation: none; }
}
</style>
