<!-- src/modules/auth/components/LoginFlujo.vue -->
<!-- Flujo de automatización de la banda del login, en "plano de subte" y de izquierda a derecha:
     cuatro canales por donde entra una operación (columna izquierda), un núcleo de IA donde
     POS 360 la procesa y cuatro cosas que actualiza solo (columna derecha). Las líneas son
     tramos rectos con esquinas redondeadas que se juntan en un tronco por lado.
     Cada operación enciende su canal, el paquete viaja al núcleo y de ahí a los destinos que
     toca, en el orden en que el sistema los resuelve; el aro del núcleo se completa con cada
     paso y adentro se lee qué está haciendo. Junto al círculo activo aparece qué es ("Venta",
     "Notificación"). El asistente IA solo lee: el paquete vuelve desde stock y caja por líneas
     punteadas, esos destinos se encienden solo en el borde y la respuesta regresa al canal.
     Las acciones salen del código de la API (stock, caja, comprobante, avisos push, Mercado
     Pago, WhatsApp de la orden, asistente de solo lectura). Es una ilustración: no lee datos. -->
<template>
  <div class="fl" aria-hidden="true">
    <div class="fl-stage">
      <svg class="fl-capa" :viewBox="`0 0 ${W} ${H}`">
        <path v-for="(d, i) in lineasE" :key="'e' + i" :ref="el => (pathE[i] = el)" :d="d"
          class="fl-ln" :class="{ on: activo === i }" />
        <path v-for="(d, k) in lineasS" :key="'s' + k" :ref="el => (pathS[k] = el)" :d="d"
          class="fl-ln" :class="{ on: hechos.has(k), lee: leidos.has(k) }" />
        <circle v-show="paq.ve" class="fl-paq" :cx="paq.x" :cy="paq.y" r="4.5" />
      </svg>

      <!-- Canales -->
      <div v-for="(c, i) in CANALES" :key="c.t" class="fl-c fl-ent" :class="{ on: activo === i, resp: respondio === i }"
        :style="pos(PE[i])">
        <v-icon size="23">{{ c.ic }}</v-icon>
        <span class="fl-rot">{{ c.act }}</span>
      </div>

      <!-- Núcleo de IA -->
      <div class="fl-nucleo" :class="{ llega }" :style="{ left: HX - HR + 'px', top: HY - HR + 'px', width: HR * 2 + 'px', height: HR * 2 + 'px' }">
        <div class="fl-aura"></div>
        <svg class="fl-aro" viewBox="0 0 158 158">
          <circle class="pista" cx="79" cy="79" r="76" />
          <circle class="avance" cx="79" cy="79" r="76" pathLength="100" stroke-dasharray="100" :stroke-dashoffset="100 - avance" />
        </svg>
        <div class="fl-in">
          <div class="fl-chispa"><v-icon size="22">mdi-creation</v-icon></div>
          <span :key="paso" class="fl-paso">{{ paso }}</span>
        </div>
      </div>

      <!-- Destinos -->
      <div v-for="(d, k) in DESTINOS" :key="d.k" class="fl-c fl-dst" :class="{ on: hechos.has(k), leido: leidos.has(k) }"
        :style="pos(PD[k])">
        <v-icon size="23">{{ d.ic }}</v-icon>
        <span class="fl-rot">{{ d.rot }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, onBeforeUnmount } from "vue";

const DESTINOS = [
  { k: "stock", ic: "mdi-package-variant-closed", rot: "Stock" },
  { k: "caja", ic: "mdi-cash-multiple", rot: "Cobro" },
  { k: "comp", ic: "mdi-receipt-text-outline", rot: "Comprobante" },
  { k: "aviso", ic: "mdi-bell-outline", rot: "Notificación" },
];
const PASO = { stock: "Stock descontado", caja: "Movimiento en caja", comp: "Comprobante generado", aviso: "Aviso al dueño" };
const CANALES = [
  { ic: "mdi-cash-register", t: "Mostrador", act: "Venta", dst: ["stock", "caja", "comp", "aviso"] },
  { ic: "mdi-storefront-outline", t: "Tienda online", act: "Compra online", dst: ["caja", "stock", "aviso"],
    pasos: { caja: "Pago con Mercado Pago" } },
  { ic: "mdi-wrench-outline", t: "Servicio técnico", act: "Reparación", dst: ["comp", "aviso"],
    pasos: { comp: "Orden registrada", aviso: "WhatsApp al cliente" } },
  { ic: "mdi-forum-outline", t: "Asistente IA", act: "Consulta", dst: ["stock", "caja"], lee: true,
    pasos: { stock: "Leyendo stock", caja: "Leyendo ventas" }, fin: "Respuesta enviada" },
];

// Geometría (px del escenario; la página lo achica con zoom si falta lugar)
const W = 760, H = 420, HX = 380, HY = 210, HR = 70, DC = 28, XE = 144, GAPY = 104;
const fila = (k, n) => HY + (k - (n - 1) / 2) * GAPY;
const PE = CANALES.map((_, k) => ({ x: XE, y: fila(k, CANALES.length) }));
const PD = DESTINOS.map((_, k) => ({ x: W - XE, y: fila(k, DESTINOS.length) }));
const pos = p => ({ left: p.x - DC + "px", top: p.y - DC + "px" });
function codo(x1, y1, x2, y2, xm) {
  if (Math.abs(y2 - y1) < 1) return `M${x1} ${y1} H${x2}`;
  const r = Math.min(16, Math.abs(y2 - y1) / 2), s = y2 > y1 ? 1 : -1, d = x2 > x1 ? 1 : -1;
  return `M${x1} ${y1} H${xm - d * r} Q${xm} ${y1} ${xm} ${y1 + s * r} V${y2 - s * r} Q${xm} ${y2} ${xm + d * r} ${y2} H${x2}`;
}
const XT = (XE + DC + HX - HR) / 2;
const lineasE = PE.map(p => codo(p.x + DC, p.y, HX - HR - 9, HY, XT));
const lineasS = PD.map(p => codo(HX + HR + 9, HY, p.x - DC, p.y, W - XT));

// Estado
const pathE = [], pathS = [];
const activo = ref(-1), respondio = ref(-1), llega = ref(false), paso = ref(""), avance = ref(0);
const hechos = reactive(new Set()), leidos = reactive(new Set());
const paq = reactive({ x: 0, y: 0, ve: false });

const VIAJE = 900, TRAMO = 650, PAUSA = 120, PERIODO = 6000;
let timers = [], reloj = null, raf = 0, i = 0;
const T = (f, ms) => timers.push(setTimeout(f, ms));

function mover(path, ms, rev = false) {
  if (!path) return;
  cancelAnimationFrame(raf);
  const L = path.getTotalLength(), t0 = performance.now();
  paq.ve = true;
  const f = t => {
    const k = Math.min(1, (t - t0) / ms), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const q = path.getPointAtLength(L * (rev ? 1 - e : e));
    paq.x = q.x; paq.y = q.y;
    if (k < 1) raf = requestAnimationFrame(f); else paq.ve = false;
  };
  raf = requestAnimationFrame(f);
}

function evento(n) {
  timers.forEach(clearTimeout); timers = [];
  const c = CANALES[n];
  const orden = c.dst.map(k => DESTINOS.findIndex(d => d.k === k)), cant = orden.length;
  const rot = k => (c.pasos && c.pasos[k]) || PASO[k];
  activo.value = n; respondio.value = -1; hechos.clear(); leidos.clear(); avance.value = 0; paso.value = c.t;
  mover(pathE[n], VIAJE);
  T(() => {
    llega.value = false; requestAnimationFrame(() => (llega.value = true));
    orden.forEach((di, k) => T(() => {
      paso.value = rot(c.dst[k]);
      if (c.lee) {
        leidos.add(di);
        mover(pathS[di], TRAMO, true);
        T(() => (avance.value = ((k + 1) / cant) * 100), TRAMO);
      } else {
        mover(pathS[di], TRAMO);
        T(() => { hechos.add(di); avance.value = ((k + 1) / cant) * 100; }, TRAMO);
      }
    }, 250 + k * (TRAMO + PAUSA)));
    if (c.lee) T(() => {
      paso.value = c.fin;
      mover(pathE[n], VIAJE, true);
      T(() => (respondio.value = n), VIAJE);
    }, 250 + cant * (TRAMO + PAUSA));
  }, VIAJE);
}

function estatico() {         // sin animación: muestra la venta de mostrador ya resuelta
  const c = CANALES[0];
  activo.value = 0; paso.value = PASO.aviso; avance.value = 100;
  c.dst.forEach(k => hechos.add(DESTINOS.findIndex(d => d.k === k)));
}

onMounted(() => {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return estatico();
  evento(i);
  reloj = setInterval(() => { i = (i + 1) % CANALES.length; evento(i); }, PERIODO);
});
onBeforeUnmount(() => { clearInterval(reloj); timers.forEach(clearTimeout); cancelAnimationFrame(raf); });
</script>

<style scoped>
.fl { width: 100%; display: flex; justify-content: center; }
.fl-stage { position: relative; width: 760px; height: 420px; flex: none; color: #fff; }
.fl-capa { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }

/* Líneas: punteado tenue que corre hacia la derecha; llenas al activarse; punteadas fijas si solo se leen */
.fl-ln { fill: none; stroke: rgba(255, 255, 255, 0.18); stroke-width: 1.5; stroke-dasharray: 2 7; animation: fl-corre 1.6s linear infinite; transition: stroke 0.3s; }
.fl-ln.on { stroke: #a6d8fa; stroke-width: 2; stroke-dasharray: none; }
.fl-ln.lee { stroke: #a6d8fa; stroke-width: 2; stroke-dasharray: 5 5; animation: none; }
@keyframes fl-corre { to { stroke-dashoffset: -18px; } }
.fl-paq { fill: #fff; filter: drop-shadow(0 0 6px #6fc0f2); }

/* Círculos de canales y destinos */
.fl-c { position: absolute; width: 56px; height: 56px; border-radius: 50%; display: grid; place-items: center;
  background: rgba(255, 255, 255, 0.07); border: 1px solid rgba(255, 255, 255, 0.16); transition: border-color 0.3s, background 0.3s, box-shadow 0.3s; }
.fl-c .v-icon { color: rgba(166, 216, 250, 0.75); transition: color 0.3s; }
.fl-c.on { border-color: #6fc0f2; background: rgba(111, 192, 242, 0.18); box-shadow: 0 0 18px rgba(111, 192, 242, 0.35); }
.fl-c.on .v-icon { color: #fff; }
.fl-dst.leido { border-color: #6fc0f2; box-shadow: 0 0 12px rgba(111, 192, 242, 0.22); }
.fl-dst.leido .v-icon { color: #a6d8fa; }
.fl-ent.resp { animation: fl-resp 0.7s ease-out; }
@keyframes fl-resp { from { box-shadow: 0 0 0 0 rgba(166, 216, 250, 0.6); } to { box-shadow: 0 0 0 14px rgba(166, 216, 250, 0); } }

/* Rótulo de la actividad: solo mientras el círculo está activo */
.fl-rot { position: absolute; top: 50%; font-size: 13px; font-weight: 700; white-space: nowrap; pointer-events: none;
  opacity: 0; transition: opacity 0.35s, transform 0.35s; text-shadow: 0 1px 8px rgba(5, 15, 40, 0.6); }
.fl-ent .fl-rot { right: calc(100% + 12px); transform: translate(6px, -50%); }
.fl-dst .fl-rot { left: calc(100% + 12px); transform: translate(-6px, -50%); }
.fl-c.on .fl-rot, .fl-dst.leido .fl-rot { opacity: 1; transform: translate(0, -50%); }
.fl-dst.leido .fl-rot { color: #a6d8fa; font-weight: 600; }

/* Núcleo de IA: vidrio oscuro, brillo que respira, chispa y aro de avance */
.fl-nucleo { position: absolute; border-radius: 50%; display: grid; place-items: center; text-align: center; isolation: isolate;
  background: radial-gradient(circle at 50% 40%, rgba(20, 40, 90, 0.55), rgba(10, 20, 60, 0.75) 70%);
  border: 1px solid rgba(255, 255, 255, 0.14); backdrop-filter: blur(6px); }
.fl-nucleo.llega { animation: fl-llega 0.6s ease-out; }
@keyframes fl-llega { from { box-shadow: 0 0 0 0 rgba(166, 216, 250, 0.55); } to { box-shadow: 0 0 0 18px rgba(166, 216, 250, 0); } }
.fl-aura { position: absolute; inset: -10px; border-radius: 50%; z-index: -1; filter: blur(14px); opacity: 0.45;
  background: radial-gradient(circle, #6fc0f2, rgba(20, 136, 209, 0.35) 60%, transparent 72%); animation: fl-respira 4s ease-in-out infinite; }
@keyframes fl-respira { 50% { opacity: 0.7; transform: scale(1.04); } }
.fl-aro { position: absolute; inset: -9px; width: calc(100% + 18px); height: calc(100% + 18px); transform: rotate(-90deg); }
.fl-aro circle { fill: none; stroke-width: 3; }
.fl-aro .pista { stroke: rgba(255, 255, 255, 0.08); }
.fl-aro .avance { stroke: #a6d8fa; stroke-linecap: round; transition: stroke-dashoffset 0.5s ease; filter: drop-shadow(0 0 4px rgba(111, 192, 242, 0.6)); }
.fl-in { width: 112px; }
.fl-chispa { width: 40px; height: 40px; border-radius: 50%; margin: 0 auto 8px; display: grid; place-items: center;
  background: radial-gradient(circle, rgba(166, 216, 250, 0.35), rgba(166, 216, 250, 0.08)); box-shadow: 0 0 14px rgba(111, 192, 242, 0.5);
  animation: fl-late 2.4s ease-in-out infinite; }
.fl-chispa .v-icon { color: #a6d8fa; }
@keyframes fl-late { 50% { box-shadow: 0 0 22px rgba(111, 192, 242, 0.8); } }
.fl-paso { display: block; font-size: 12px; font-weight: 600; color: rgba(255, 255, 255, 0.85); line-height: 1.3; min-height: 32px;
  animation: fl-entra 0.3s ease-out; }
@keyframes fl-entra { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }

@media (prefers-reduced-motion: reduce) {
  .fl-ln, .fl-aura, .fl-chispa, .fl-paso, .fl-nucleo.llega { animation: none; }
}
</style>
