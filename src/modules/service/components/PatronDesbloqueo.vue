<!-- src/modules/service/components/PatronDesbloqueo.vue
     Patron de desbloqueo como en el telefono: se apoya en un punto y se
     arrastra; la linea sigue al dedo (o al mouse) y cada punto que se cruza se
     suma. Como en Android, saltar de un extremo al otro (1 → 3) suma el del
     medio, porque el dedo pasa por encima.

     v-model: los puntos en orden, del 1 al 9 (fila por fila). Con `soloLectura`
     dibuja un patron guardado, para que el tecnico lo vea en la ficha. -->
<template>
  <div
    ref="cajaRef"
    class="patron"
    :class="{ 'patron--lectura': soloLectura }"
    :style="{ width: `${tam}px`, height: `${tam}px` }"
    :role="soloLectura ? 'img' : 'group'"
    :aria-label="soloLectura ? `Patrón ${modelValue.join('-')}` : 'Dibujar el patrón de desbloqueo'"
    @pointerdown="empezar"
    @pointermove="mover"
    @pointerup="terminar"
    @pointercancel="terminar"
  >
    <svg :width="tam" :height="tam" class="patron-trazo" aria-hidden="true">
      <polyline v-if="puntosLinea" :points="puntosLinea" fill="none" :stroke-width="grosor" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    <span
      v-for="n in 9"
      :key="n"
      class="patron-punto"
      :class="{ on: modelValue.includes(n), inicio: modelValue[0] === n }"
      :style="estiloPunto(n)"
    >
      <span v-if="!soloLectura && modelValue.includes(n)" class="patron-orden">{{ modelValue.indexOf(n) + 1 }}</span>
    </span>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  tam: { type: Number, default: 180 },
  soloLectura: { type: Boolean, default: false },
});
const emit = defineEmits(["update:modelValue"]);

const cajaRef = ref(null);
const dibujando = ref(false);
const dedo = ref(null);

const paso = computed(() => props.tam / 3);
const radio = computed(() => Math.max(5, props.tam / 9));
const grosor = computed(() => Math.max(3, props.tam / 30));

function centro(n) {
  const i = n - 1;
  return { x: (i % 3) * paso.value + paso.value / 2, y: Math.floor(i / 3) * paso.value + paso.value / 2 };
}

function estiloPunto(n) {
  const c = centro(n);
  const d = radio.value * 2;
  return { width: `${d}px`, height: `${d}px`, left: `${c.x - d / 2}px`, top: `${c.y - d / 2}px` };
}

const puntosLinea = computed(() => {
  const pts = props.modelValue.map((n) => centro(n));
  if (dibujando.value && dedo.value && pts.length) pts.push(dedo.value);
  if (pts.length < 2) return "";
  return pts.map((p) => `${p.x},${p.y}`).join(" ");
});

function posicion(e) {
  const r = cajaRef.value.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

// El punto bajo el dedo: un poco mas grande que el circulo dibujado, para que
// no haga falta apuntar fino, pero sin tocar al vecino.
function puntoEn(p) {
  const alcance = paso.value * 0.36;
  for (let n = 1; n <= 9; n++) {
    const c = centro(n);
    if (Math.hypot(c.x - p.x, c.y - p.y) <= alcance) return n;
  }
  return null;
}

function sumar(n) {
  const lista = [...props.modelValue];
  if (lista.includes(n)) return;
  const ultimo = lista[lista.length - 1];
  if (ultimo) {
    // Si entre el ultimo y este hay un punto en el medio (misma fila, columna
    // o diagonal), el dedo pasa por encima: se suma antes.
    const a = centro(ultimo);
    const b = centro(n);
    const medio = puntoEn({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    if (medio && medio !== ultimo && medio !== n && !lista.includes(medio)) lista.push(medio);
  }
  lista.push(n);
  emit("update:modelValue", lista);
}

function empezar(e) {
  if (props.soloLectura) return;
  const p = posicion(e);
  const n = puntoEn(p);
  if (!n) return;
  e.preventDefault();
  cajaRef.value.setPointerCapture?.(e.pointerId);
  // Un dibujo nuevo reemplaza al anterior, como en el telefono.
  emit("update:modelValue", [n]);
  dibujando.value = true;
  dedo.value = p;
}

function mover(e) {
  if (!dibujando.value) return;
  const p = posicion(e);
  dedo.value = p;
  const n = puntoEn(p);
  if (n) sumar(n);
}

function terminar() {
  dibujando.value = false;
  dedo.value = null;
}
</script>

<style scoped>
.patron {
  position: relative;
  flex-shrink: 0;
  touch-action: none;
  user-select: none;
  cursor: pointer;
}
.patron--lectura {
  cursor: default;
}
.patron-trazo {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.patron-trazo polyline {
  stroke: rgba(var(--v-theme-primary), 0.75);
}
.patron-punto {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(var(--v-border-color), 0.35);
  background: rgba(var(--v-theme-on-surface), 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  box-sizing: border-box;
  transition: background 0.1s, border-color 0.1s;
}
.patron-punto.on {
  background: rgb(var(--v-theme-primary));
  border-color: rgb(var(--v-theme-primary));
}
.patron-punto.inicio {
  box-shadow: 0 0 0 4px rgba(var(--v-theme-primary), 0.25);
}
.patron-orden {
  font-size: 13px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-primary));
}
.patron--lectura .patron-punto {
  border-width: 1px;
}
</style>
