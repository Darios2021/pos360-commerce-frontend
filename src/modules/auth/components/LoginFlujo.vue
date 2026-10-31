<!-- src/modules/auth/components/LoginFlujo.vue -->
<!-- Flujo de entrada para la banda del login: los canales de POS 360 a la izquierda,
     líneas que se juntan en un tronco y una sola tarjeta "Hoy en el negocio" que recibe
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
            <stop offset="100%" stop-color="#1488d1" />
          </linearGradient>
          <filter id="flBrillo" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.2" />
          </filter>
        </defs>
        <path v-for="(d, i) in PATHS" :key="'l' + i" class="fl-line" :d="d" pathLength="1" :style="{ '--i': i }" />
        <path v-for="(d, i) in PATHS" :key="'g' + i" class="fl-haz fl-haz--brillo" :d="d" pathLength="1" :style="{ '--i': i }" />
        <path v-for="(d, i) in PATHS" :key="'c' + i" class="fl-haz fl-haz--nucleo" :d="d" pathLength="1" :style="{ '--i': i }" />
      </svg>

      <!-- Canales -->
      <ul class="fl-rail">
        <li v-for="(c, i) in CANALES" :key="c.t" class="fl-tile" :style="{ '--i': i }" :title="c.t">
          <v-icon size="26">{{ c.i }}</v-icon>
          <span class="fl-destello"><b>{{ c.t }}</b><small>{{ c.d }}</small></span>
        </li>
      </ul>

      <!-- Tarjeta que recibe y combina -->
      <div class="fl-stack">
        <article class="fl-card">
          <header class="fl-chead">
            <span class="fl-cico"><v-icon size="20">mdi-store-outline</v-icon></span>
            <span class="fl-cmeta"><b>Hoy en el negocio</b><small>Sucursal Centro · {{ hora }}</small></span>
            <span class="fl-ctotal m-num" :class="{ sube: [0, 1, 3].includes(llego) }">{{ pesos(totalVentas) }}</span>
          </header>
          <div v-for="(f, i) in filas" :key="f.t" class="fl-item" :class="{ llega: llego === i }">
            <span class="fl-thumb"><v-icon size="20">{{ CANALES[i].i }}</v-icon></span>
            <span class="fl-ibody">
              <span class="fl-itop"><b>{{ f.t }}</b><span class="m-num">{{ f.v }}</span></span>
              <small>{{ f.d }}</small>
            </span>
          </div>
        </article>
        <svg class="fl-trace" viewBox="0 0 300 100" preserveAspectRatio="none" fill="none">
          <rect x="1" y="1" width="298" height="98" rx="12" ry="12" pathLength="1" class="fl-trace-rect" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, ref, onMounted, onBeforeUnmount } from "vue";

// Geometría: 6 canales de 56 px con 24 px entre sí; las líneas van del borde del
// canal (x 0) al mazo (x LW), juntándose en el centro vertical con curvas de radio R.
const TILE = 56, GAP = 24, LW = 314, R = 20;
const N = 6;                                   // canales
const H = N * TILE + (N - 1) * GAP;          // 456
const C = H / 2;                               // tronco
const XV = [178, 154, 130];                    // bajada de afuera hacia adentro

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
  { i: "mdi-cash-register", t: "Mostrador", d: "Venta rápida, cobro y caja" },
  { i: "mdi-storefront-outline", t: "Tienda online", d: "Pedidos web con el mismo stock" },
  { i: "mdi-file-document-outline", t: "Presupuestos", d: "Cotizaciones para clientes" },
  { i: "mdi-wrench-outline", t: "Servicio técnico", d: "Órdenes de reparación" },
  { i: "mdi-swap-horizontal", t: "Derivaciones", d: "Stock entre sucursales" },
  { i: "mdi-forum-outline", t: "Asistente IA", d: "Preguntas sobre ventas, caja y cierre" },
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
const PASO = [
  () => { est.mostrador.n += 1; est.mostrador.p += 39500; },
  () => { est.tienda.n += 1; est.tienda.p += 66600; },
  () => { est.presup.n += 1; est.presup.p += 866500; },
  () => { est.servicio.n += 1; est.servicio.p += 96000; },
  () => { est.deriv.n += 1; est.deriv.u += 15; },
  () => { /* el asistente no suma: recalcula con lo que juntaron los demás */ },
];

const totalVentas = computed(() => est.mostrador.p + est.tienda.p + est.servicio.p);
const operaciones = computed(() => est.mostrador.n + est.tienda.n + est.servicio.n);
const filas = computed(() => [
  { t: "Mostrador", d: `${est.mostrador.n} ventas`, v: pesos(est.mostrador.p) },
  { t: "Tienda online", d: `${est.tienda.n} pedidos`, v: pesos(est.tienda.p) },
  { t: "Presupuestos", d: `${est.presup.n} abiertos`, v: pesos(est.presup.p) },
  { t: "Servicio técnico", d: `${est.servicio.n} órdenes`, v: pesos(est.servicio.p) },
  { t: "Derivaciones", d: `${est.deriv.n} en camino`, v: `${est.deriv.u} u.` },
  { t: "Asistente IA", d: "Ticket promedio de hoy", v: pesos(Math.round(totalVentas.value / operaciones.value)) },
]);

// Reloj de la ilustración, alineado con las animaciones CSS: el paquete del canal i
// llega a los 2,8 s + i × 3 s y la vuelta dura 18 s.
const LLEGA = 2800, RANURA = 3000, VUELTA = 18000;
const llego = ref(-1);
const minutos = ref(24);
const hora = computed(() => `19:${String(minutos.value).padStart(2, "0")}`);
let t0 = 0, ultimo = -1, timer = null;
onMounted(() => {
  t0 = performance.now();
  timer = setInterval(() => {
    const t = performance.now() - t0 - LLEGA;
    if (t < 0) return;
    const paso = Math.floor(t / RANURA);          // pasos desde el inicio
    if (paso === ultimo) return;
    ultimo = paso;
    const i = paso % CANALES.length;
    if (i === 0 && paso > 0) Object.assign(est, BASE());
    PASO[i]();
    minutos.value = 24 + (paso % CANALES.length) * 4;
    llego.value = i;
    setTimeout(() => { if (llego.value === i) llego.value = -1; }, 1400);
  }, 100);
});
onBeforeUnmount(() => clearInterval(timer));

const pesos = (n) => "$ " + n.toLocaleString("es-AR");
</script>

<style scoped>
.fl { width: 100%; }
.fl-stage {
  position: relative;
  width: 680px;
  height: 456px;
  max-width: 100%;
}

/* ── Líneas ── */
.fl-lines {
  position: absolute;
  left: 56px;
  top: 0;
  width: 314px;
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
.fl-haz {
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
  stroke-dasharray: 0.13 0.87;
  stroke-dashoffset: 0.13;
  opacity: 0;
  animation: fl-haz 18s linear calc(1s + var(--i) * 3s) infinite backwards;
}
.fl-haz--nucleo { stroke: url(#flHaz); stroke-width: 2.5; }
.fl-haz--brillo { stroke: #1488d1; stroke-width: 7; filter: url(#flBrillo); }

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
  width: 56px; height: 56px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: #fff;
  box-shadow: 0 6px 16px rgba(8, 14, 40, 0.28);
  animation: fl-pop 0.42s cubic-bezier(0.34, 1.56, 0.64, 1) calc(var(--i) * 0.07s) both;
}
.fl-tile { position: relative; }
.fl-tile .v-icon { color: #0f6fae; }

/* Secuencia, un canal por vez en ranuras de 3 s (6 canales = 18 s):
   se enciende el canal y su destello de texto, sale el paquete por su línea (1,8 s)
   y al llegar entra su tarjeta al mazo. */
.fl-tile::after {
  content: "";
  position: absolute;
  inset: -5px;
  border-radius: 14px;
  border: 2px solid #6fc0f2;
  box-shadow: 0 0 16px rgba(111, 192, 242, 0.55);
  opacity: 0;
  animation: fl-destello 18s ease-in-out calc(1s + var(--i) * 3s) infinite backwards;
  pointer-events: none;
}
.fl-destello {
  position: absolute;
  left: calc(100% + 14px);
  top: 50%;
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 8px 12px;
  border-radius: 10px;
  background: rgba(10, 30, 70, 0.92);
  border: 1px solid rgba(111, 192, 242, 0.45);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
  line-height: 1.3;
  opacity: 0;
  transform: translate(-6px, -50%);
  animation: fl-destello-tx 18s ease-in-out calc(1s + var(--i) * 3s) infinite backwards;
  pointer-events: none;
  z-index: 5;
}
.fl-destello b { font-size: 13px; font-weight: 800; color: #fff; }
.fl-destello small { font-size: 12px; color: #a6d8fa; }

/* ── Mazo ── */
.fl-stack {
  position: absolute;
  right: 0;
  top: 50%;
  width: 310px;
  transform: translateY(-50%);
  z-index: 4;
}
.fl-card {
  box-sizing: border-box;
  width: 100%;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--m-pieza);
  color: var(--m-tinta);
  border: 1px solid var(--m-linea);
  border-radius: 12px;
  box-shadow: 0 11px 24px rgba(0, 0, 0, 0.14), 0 44px 44px rgba(0, 0, 0, 0.1);
  gap: 4px;
  animation: fl-entra 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.5s both;
}

.fl-chead {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--m-linea2);
}
.fl-cico {
  width: 36px; height: 36px; flex: none;
  border-radius: 10px;
  display: grid; place-items: center;
  background: var(--m-accion);
}
.fl-cico .v-icon { color: #fff; }
.fl-cmeta { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.3; }
.fl-cmeta b { font-size: 13px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fl-cmeta small { font-size: 11px; color: var(--m-suave); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fl-ctotal { font-size: 15px; font-weight: 800; white-space: nowrap; }

.fl-chead { margin-bottom: 6px; }
.fl-item {
  display: flex; align-items: center; gap: 10px;
  margin: 0 -8px; padding: 5px 8px;
  border-radius: 10px;
  transition: background 0.5s;
}
.fl-item .m-num { transition: color 0.5s; }
/* Llega el paquete del canal: la fila se ilumina y su valor cambia */
.fl-item.llega { background: var(--m-accion-tinte); transition: background 0.15s; }
.fl-item.llega .m-num { color: var(--m-accion); font-weight: 800; transition: color 0.15s; }
.fl-item.llega .fl-thumb { background: var(--m-accion); }
.fl-item.llega .fl-thumb .v-icon { color: #fff; }
.fl-ctotal { transition: color 0.5s; }
.fl-ctotal.sube { color: var(--m-accion); transition: color 0.15s; }
.fl-thumb {
  width: 36px; height: 36px; flex: none;
  transition: background 0.3s;
  border-radius: 10px;
  display: grid; place-items: center;
  background: var(--m-variante);
}
.fl-thumb .v-icon { color: var(--m-suave); }
.fl-ibody { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.35; }
.fl-itop { display: flex; justify-content: space-between; gap: 8px; }
.fl-itop b { font-size: 12.5px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fl-itop span { font-size: 12px; white-space: nowrap; }
.fl-ibody small { font-size: 11px; color: var(--m-suave); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Contorno que se dibuja alrededor de la tarjeta de arriba */
.fl-trace {
  position: absolute;
  inset: 0;
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
  0% { stroke-dashoffset: 0.13; opacity: 0; }
  0.8% { opacity: 1; }
  9.3% { opacity: 1; }
  10% { stroke-dashoffset: -1; opacity: 0; }
  100% { stroke-dashoffset: -1; opacity: 0; }
}
@keyframes fl-entra {
  0% { opacity: 0; transform: translateY(12px); }
  100% { opacity: 1; transform: none; }
}
@keyframes fl-destello {
  0% { opacity: 0; }
  1.2% { opacity: 1; }
  14.6% { opacity: 1; }
  16.4% { opacity: 0; }
  100% { opacity: 0; }
}
@keyframes fl-destello-tx {
  0% { opacity: 0; transform: translate(-6px, -50%); }
  1.2% { opacity: 1; transform: translate(0, -50%); }
  14.6% { opacity: 1; transform: translate(0, -50%); }
  16.4% { opacity: 0; transform: translate(4px, -50%); }
  100% { opacity: 0; transform: translate(4px, -50%); }
}
@keyframes fl-contorno {
  0% { stroke-dashoffset: 1; opacity: 1; }
  92% { stroke-dashoffset: 0; opacity: 1; }
  96% { stroke-dashoffset: 0; opacity: 0; }
  96.01% { stroke-dashoffset: 1; opacity: 0; }
  100% { stroke-dashoffset: 1; opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .fl-line, .fl-tile, .fl-haz, .fl-trace-rect, .fl-tile::after, .fl-destello { animation: none; }
  .fl-haz, .fl-trace-rect { opacity: 0; }
  .fl-card { animation: none; }
}
</style>
