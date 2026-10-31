<!-- src/modules/auth/components/LoginFlujo.vue -->
<!-- Flujo de entrada para la banda del login: los canales de POS 360 a la izquierda,
     líneas que se juntan en un tronco y un haz de luz que viaja hasta un mazo de
     tarjetas que rota cada 2,4 s (venta, pedido web, orden de servicio, presupuesto).
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
        </li>
      </ul>

      <!-- Mazo de tarjetas -->
      <div class="fl-stack">
        <article v-for="(t, i) in TARJETAS" :key="t.id" class="fl-card" :style="{ '--i': i }">
          <header class="fl-chead">
            <span class="fl-cico"><v-icon size="20">{{ t.i }}</v-icon></span>
            <span class="fl-cmeta"><b>{{ t.id }}</b><small>{{ t.canal }} · Hoy, {{ t.hora }}</small></span>
            <span class="fl-ctotal m-num">{{ pesos(total(t)) }}</span>
          </header>
          <div v-for="it in t.items" :key="it.n" class="fl-item">
            <span class="fl-thumb"><v-icon size="20">{{ it.i }}</v-icon></span>
            <span class="fl-ibody">
              <span class="fl-itop"><b>{{ it.n }}</b><span class="m-num">{{ pesos(it.p) }}</span></span>
              <small>{{ it.d }}</small>
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
// Geometría: 6 canales de 56 px con 24 px entre sí; las líneas van del borde del
// canal (x 0) al mazo (x LW), juntándose en el centro vertical con curvas de radio R.
const TILE = 56, GAP = 24, N = 6, LW = 164, R = 16;
const H = N * TILE + (N - 1) * GAP;          // 456
const C = H / 2;                               // tronco
const XV = [96, 80, 64];                       // bajada de afuera hacia adentro

const PATHS = Array.from({ length: N }, (_, i) => {
  const y = i * (TILE + GAP) + TILE / 2;
  const arriba = y < C;
  const xv = XV[arriba ? i : N - 1 - i];
  return arriba
    ? `M0 ${y} L${xv - R} ${y} A${R} ${R} 0 0 1 ${xv} ${y + R} L${xv} ${C - R} A${R} ${R} 0 0 0 ${xv + R} ${C} L${LW} ${C}`
    : `M0 ${y} L${xv - R} ${y} A${R} ${R} 0 0 0 ${xv} ${y - R} L${xv} ${C + R} A${R} ${R} 0 0 1 ${xv + R} ${C} L${LW} ${C}`;
});

const CANALES = [
  { i: "mdi-cash-register", t: "Mostrador" },
  { i: "mdi-cellphone", t: "App Android" },
  { i: "mdi-storefront-outline", t: "Tienda online" },
  { i: "mdi-file-document-outline", t: "Presupuestos" },
  { i: "mdi-wrench-outline", t: "Servicio técnico" },
  { i: "mdi-swap-horizontal", t: "Derivaciones" },
];

const TARJETAS = [
  {
    id: "Venta #1043", canal: "Mostrador", hora: "19:24", i: "mdi-cash-register",
    items: [
      { n: "Auriculares bluetooth", d: "Negro · 1 u.", p: 18000, i: "mdi-headphones" },
      { n: "Cargador USB-C", d: "65 W · 1 u.", p: 9500, i: "mdi-power-plug-outline" },
      { n: "Cable HDMI", d: "2 m · 1 u.", p: 12000, i: "mdi-cable-data" },
    ],
  },
  {
    id: "Pedido web #388", canal: "Tienda online", hora: "19:31", i: "mdi-storefront-outline",
    items: [
      { n: "Zapatillas urbanas", d: "Talle 42 · 1 u.", p: 54900, i: "mdi-shoe-sneaker" },
      { n: "Medias", d: "Pack x3", p: 7200, i: "mdi-tshirt-crew-outline" },
      { n: "Envío a domicilio", d: "Capital", p: 4500, i: "mdi-truck-outline" },
    ],
  },
  {
    id: "Orden de servicio #212", canal: "Servicio técnico", hora: "19:40", i: "mdi-wrench-outline",
    items: [
      { n: "Cambio de pantalla", d: "Celular · repuesto incluido", p: 85000, i: "mdi-cellphone-cog" },
      { n: "Vidrio templado", d: "Colocado", p: 6000, i: "mdi-shield-outline" },
      { n: "Limpieza de puerto", d: "Carga", p: 5000, i: "mdi-broom" },
    ],
  },
  {
    id: "Presupuesto #77", canal: "Presupuestos", hora: "19:52", i: "mdi-file-document-outline",
    items: [
      { n: "Notebook 15\"", d: "16 GB · 512 GB", p: 820000, i: "mdi-laptop" },
      { n: "Mouse inalámbrico", d: "1 u.", p: 14500, i: "mdi-mouse" },
      { n: "Mochila para notebook", d: "1 u.", p: 32000, i: "mdi-bag-personal-outline" },
    ],
  },
];

const total = (t) => t.items.reduce((s, it) => s + it.p, 0);
const pesos = (n) => "$ " + n.toLocaleString("es-AR");
</script>

<style scoped>
.fl { width: 100%; }
.fl-stage {
  position: relative;
  width: 520px;
  height: 456px;
  max-width: 100%;
}

/* ── Líneas ── */
.fl-lines {
  position: absolute;
  left: 56px;
  top: 0;
  width: 164px;
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
  animation: fl-haz 2.4s linear calc(0.4s + var(--i) * 0.28s) infinite;
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
  z-index: 3;
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
.fl-tile .v-icon { color: #0f6fae; }

/* ── Mazo ── */
.fl-stack {
  position: absolute;
  right: 0;
  top: 50%;
  width: 300px;
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
  animation: fl-mazo 9.6s ease-in-out calc(1.4s + var(--i) * 2.4s) infinite backwards;
}
.fl-card:first-child { position: relative; }
.fl-card:not(:first-child) { position: absolute; top: 0; left: 0; right: 0; }
.fl-card > * { animation: fl-contenido 9.6s ease-in-out calc(1.4s + var(--i) * 2.4s) infinite backwards; }

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
.fl-cmeta small { font-size: 11px; color: var(--m-suave); }
.fl-ctotal { font-size: 15px; font-weight: 800; white-space: nowrap; }

.fl-item { display: flex; align-items: center; gap: 10px; }
.fl-thumb {
  width: 40px; height: 40px; flex: none;
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
  animation: fl-contorno 2.4s linear 1.6s infinite both;
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
  6% { opacity: 1; }
  44% { opacity: 1; }
  50% { stroke-dashoffset: -1; opacity: 0; }
  100% { stroke-dashoffset: -1; opacity: 0; }
}
@keyframes fl-mazo {
  0%   { transform: translateY(-20px) scale(1);    opacity: 0; z-index: 40; }
  2%   { transform: translateY(0) scale(1);        opacity: 1; z-index: 40; }
  25%  { transform: translateY(0) scale(1);        opacity: 1; z-index: 40; }
  29%  { transform: translateY(18px) scale(0.96);  opacity: 1; z-index: 30; }
  50%  { transform: translateY(18px) scale(0.96);  opacity: 1; z-index: 30; }
  54%  { transform: translateY(36px) scale(0.92);  opacity: 1; z-index: 20; }
  75%  { transform: translateY(36px) scale(0.92);  opacity: 1; z-index: 20; }
  79%  { transform: translateY(54px) scale(0.88);  opacity: 0; z-index: 10; }
  100% { transform: translateY(-20px) scale(1);    opacity: 0; z-index: 40; }
}
@keyframes fl-contenido {
  0% { opacity: 0; }
  2% { opacity: 1; }
  25% { opacity: 1; }
  26% { opacity: 0; }
  100% { opacity: 0; }
}
@keyframes fl-contorno {
  0% { stroke-dashoffset: 1; opacity: 1; }
  92% { stroke-dashoffset: 0; opacity: 1; }
  96% { stroke-dashoffset: 0; opacity: 0; }
  96.01% { stroke-dashoffset: 1; opacity: 0; }
  100% { stroke-dashoffset: 1; opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .fl-line, .fl-tile, .fl-haz, .fl-trace-rect { animation: none; }
  .fl-haz, .fl-trace-rect { opacity: 0; }
  .fl-card, .fl-card > * { animation: none; }
  .fl-card:not(:first-child) { opacity: 0; }
}
</style>
