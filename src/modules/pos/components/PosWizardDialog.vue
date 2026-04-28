<!--
  PosWizardDialog — Onboarding interactivo del POS.

  Tres etapas:
    1. WELCOME  → bienvenida prominente con CTAs "Empezar tour" / "Saltar".
                  Aparece automáticamente la primera vez (flag localStorage).
    2. TOUR     → tour guiado con spotlight sobre cada componente real,
                  emulando el flujo de una venta de prueba paso a paso.
                  Cada paso muestra qué hacer y un "demo" del resultado.
    3. COMPLETED→ pantalla final "Venta de prueba completada" con resumen.

  Targets esperados (ya marcados con data-tour="..." en el DOM):
     [data-tour="topbar"]   barra superior con F-keys
     [data-tour="search"]   buscador / scanner
     [data-tour="catalog"]  grid de productos
     [data-tour="caja"]     panel estado de caja
     [data-tour="cart"]     panel del carrito
     [data-tour="checkout"] botón Cobrar (F9)
-->
<template>
  <Teleport to="body">
    <Transition name="posw-fade">
      <div v-if="open" class="posw" role="dialog" aria-modal="true">

        <!-- ════════════════ MODO 1: WELCOME ════════════════ -->
        <template v-if="mode === 'welcome'">
          <div class="posw__scrim" />
          <div class="posw__welcome" role="dialog">
            <div class="posw__welcome-glow" aria-hidden="true" />

            <div class="posw__welcome-icon">
              <v-icon size="38">mdi-school-outline</v-icon>
            </div>

            <div class="posw__welcome-eyebrow">Bienvenido al Punto de Venta</div>
            <h2 class="posw__welcome-title">
              ¿Querés un tour rápido?
            </h2>
            <p class="posw__welcome-text">
              Te muestro cómo funciona el POS con una <b>venta de prueba</b>:
              vas a recorrer cada zona (buscador, catálogo, caja, carrito y cobro)
              y al final sabrás operar el sistema sin tocar nada real.
            </p>

            <div class="posw__welcome-features">
              <div class="posw__feat">
                <v-icon size="18" class="posw__feat-icon">mdi-clock-fast</v-icon>
                <div class="posw__feat-text">
                  <b>2 minutos</b><br />guiado paso a paso
                </div>
              </div>
              <div class="posw__feat">
                <v-icon size="18" class="posw__feat-icon">mdi-shield-check-outline</v-icon>
                <div class="posw__feat-text">
                  <b>Sin afectar datos</b><br />es solo una simulación
                </div>
              </div>
              <div class="posw__feat">
                <v-icon size="18" class="posw__feat-icon">mdi-keyboard-outline</v-icon>
                <div class="posw__feat-text">
                  <b>Aprendés los atajos</b><br />operás sin mouse
                </div>
              </div>
            </div>

            <div class="posw__welcome-actions">
              <v-btn
                size="large"
                variant="text"
                rounded="lg"
                @click="finish"
              >
                Saltar tour
              </v-btn>
              <v-btn
                size="large"
                color="primary"
                variant="flat"
                rounded="lg"
                prepend-icon="mdi-play"
                class="posw__welcome-cta"
                @click="startTour"
              >
                Empezar tour rápido
              </v-btn>
            </div>

            <button v-if="firstRun" type="button" class="posw__skip-tiny" @click="finish">
              No volver a mostrar
            </button>
          </div>
        </template>

        <!-- ════════════════ MODO 2: TOUR ════════════════ -->
        <template v-else-if="mode === 'tour'">
          <!-- Overlay con agujero (spotlight) sobre el target -->
          <div
            class="posw__overlay"
            :style="overlayClipStyle"
          />

          <!-- Anillo brillante alrededor del target -->
          <div
            v-if="hasTarget"
            class="posw__ring"
            :style="ringStyle"
            aria-hidden="true"
          />

          <!-- Etiqueta demo sobre el target (ej: "↓ Acá aparece tu producto") -->
          <div
            v-if="hasTarget && currentStep.demoLabel"
            class="posw__demo-label"
            :style="demoLabelStyle"
          >
            <v-icon size="16" class="mr-1">{{ currentStep.demoLabel.icon || 'mdi-cursor-default-click-outline' }}</v-icon>
            {{ currentStep.demoLabel.text }}
          </div>

          <!-- Tooltip flotante -->
          <div
            ref="tooltipRef"
            class="posw__tooltip"
            :class="`posw__tooltip--${placement}`"
            :style="tooltipStyle"
          >
            <div class="posw__head">
              <div class="posw__head-icon">
                <v-icon size="20">{{ currentStep.icon }}</v-icon>
              </div>
              <div class="posw__head-text">
                <div class="posw__eyebrow">
                  Venta de prueba · Paso {{ stepIndex + 1 }} de {{ steps.length }}
                </div>
                <div class="posw__title">{{ currentStep.title }}</div>
              </div>
              <button type="button" class="posw__close" aria-label="Cerrar tour" @click="finish">
                <v-icon size="18">mdi-close</v-icon>
              </button>
            </div>

            <div class="posw__body">
              <p class="posw__desc">{{ currentStep.description }}</p>

              <!-- "Demo simulado" del resultado del paso -->
              <div v-if="currentStep.simulation" class="posw__sim">
                <div class="posw__sim-head">
                  <v-icon size="14" class="mr-1">mdi-eye-outline</v-icon>
                  <span>Ejemplo</span>
                </div>
                <div class="posw__sim-body">
                  <component :is="currentStep.simulation" />
                </div>
              </div>

              <ul v-if="currentStep.tips?.length" class="posw__tips">
                <li v-for="(t, i) in currentStep.tips" :key="i" class="posw__tip">
                  <v-icon size="14" class="posw__tip-icon">{{ t.icon || 'mdi-check-circle-outline' }}</v-icon>
                  <span class="posw__tip-text">{{ t.text }}</span>
                  <v-chip v-if="t.shortcut" size="x-small" variant="tonal" class="posw__tip-chip">
                    {{ t.shortcut }}
                  </v-chip>
                </li>
              </ul>
            </div>

            <div class="posw__foot">
              <div class="posw__dots">
                <button
                  v-for="(s, i) in steps"
                  :key="s.id"
                  type="button"
                  class="posw__dot"
                  :class="{ 'is-active': i === stepIndex, 'is-done': i < stepIndex }"
                  :aria-label="`Ir al paso ${i + 1}`"
                  @click="goTo(i)"
                />
              </div>

              <div class="posw__actions">
                <v-btn
                  v-if="stepIndex > 0"
                  variant="text"
                  size="small"
                  rounded="lg"
                  @click="prev"
                >
                  Anterior
                </v-btn>
                <v-btn
                  v-if="stepIndex < steps.length - 1"
                  color="primary"
                  variant="flat"
                  size="small"
                  rounded="lg"
                  append-icon="mdi-chevron-right"
                  @click="next"
                >
                  Siguiente
                </v-btn>
                <v-btn
                  v-else
                  color="success"
                  variant="flat"
                  size="small"
                  rounded="lg"
                  prepend-icon="mdi-check"
                  @click="goCompleted"
                >
                  Completar venta de prueba
                </v-btn>
              </div>
            </div>
          </div>
        </template>

        <!-- ════════════════ MODO 3: COMPLETED ════════════════ -->
        <template v-else-if="mode === 'completed'">
          <div class="posw__scrim" />
          <div class="posw__done">
            <div class="posw__done-check">
              <v-icon size="44" color="white">mdi-check-bold</v-icon>
            </div>
            <div class="posw__done-eyebrow">Tour finalizado</div>
            <h2 class="posw__done-title">¡Venta de prueba completada!</h2>
            <p class="posw__done-text">
              Ya conocés todas las zonas del POS. La próxima venta es real:
              cargá productos, abrí caja, cobrá y emití comprobante.
            </p>

            <div class="posw__done-summary">
              <div v-for="s in steps" :key="s.id" class="posw__done-row">
                <v-icon size="16" color="success" class="mr-2">mdi-check-circle</v-icon>
                <v-icon size="14" class="posw__done-row-icon">{{ s.icon }}</v-icon>
                <span>{{ s.title }}</span>
              </div>
            </div>

            <div class="posw__done-actions">
              <v-btn
                size="large"
                color="primary"
                variant="flat"
                rounded="lg"
                prepend-icon="mdi-cash-register"
                @click="finish"
              >
                Empezar a vender
              </v-btn>
            </div>
          </div>
        </template>

      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, h, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useDisplay } from "vuetify";

const { mobile } = useDisplay();

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  firstRun: { type: Boolean, default: false },
});
const emit = defineEmits(["update:modelValue"]);

const open = computed({
  get: () => !!props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

// modo: welcome | tour | completed
const mode = ref("welcome");
const stepIndex = ref(0);
const targetRect = ref(null);
const placement = ref("bottom");
const tooltipRef = ref(null);

// ── Mini "vistas previas" inline (componentes funcionales) ───────────────
const SimSearchHit = () => h("div", { class: "sim-row" }, [
  h("div", { class: "sim-thumb sim-thumb--blue" }, "USB"),
  h("div", { class: "sim-info" }, [
    h("div", { class: "sim-title" }, "Cable USB-C 1m"),
    h("div", { class: "sim-meta" }, "SKU 0012 · Stock 24"),
  ]),
  h("div", { class: "sim-price" }, "$ 4.500"),
]);

const SimCartLine = () => h("div", { class: "sim-cart" }, [
  h("div", { class: "sim-cart-row" }, [
    h("div", { class: "sim-cart-name" }, "Cable USB-C 1m"),
    h("div", { class: "sim-cart-qty" }, "x 2"),
    h("div", { class: "sim-cart-sub" }, "$ 9.000"),
  ]),
  h("div", { class: "sim-cart-total" }, [
    h("span", "Total"),
    h("b", "$ 9.000"),
  ]),
]);

const SimCheckout = () => h("div", { class: "sim-pay" }, [
  h("div", { class: "sim-pay-row" }, [
    h("v-icon", { size: 16 }, () => "mdi-cash"),
    h("span", "Efectivo"),
    h("b", "$ 9.000"),
  ]),
  h("div", { class: "sim-pay-row sim-pay-row--ok" }, [
    h("v-icon", { size: 16 }, () => "mdi-check-circle"),
    h("span", "Pago confirmado"),
  ]),
]);

// ── Definición de pasos del tour ──────────────────────────────────────
// Pasos para DESKTOP (con F-keys, paneles, etc.)
const stepsDesktop = [
  {
    id: "topbar",
    target: '[data-tour="topbar"]',
    icon: "mdi-keyboard-outline",
    title: "Barra superior · Atajos",
    description:
      "Acá tenés los accesos por teclado. Cada botón = una tecla F. Memorizalas y operás todo sin tocar el mouse.",
    tips: [
      { text: "Ayuda y atajos",        shortcut: "F1" },
      { text: "Buscar / consultar",    shortcut: "F2" },
      { text: "Refrescar catálogo",    shortcut: "F5" },
      { text: "Toggle del carrito",    shortcut: "F6" },
    ],
    demoLabel: { icon: "mdi-arrow-up-bold", text: "Estos son tus atajos rápidos" },
  },
  {
    id: "search",
    target: '[data-tour="search"]',
    icon: "mdi-magnify",
    title: "1. Buscar producto",
    description:
      "Empezamos la venta de prueba: imaginá que escribís 'cable usb' o que pasás el lector por el código de barras.",
    simulation: SimSearchHit,
    tips: [
      { icon: "mdi-barcode-scan", text: "Si hay un único match, el producto entra solo al carrito." },
      { text: "Saltar al buscador", shortcut: "Ctrl + K" },
    ],
    demoLabel: { icon: "mdi-cursor-default-click-outline", text: "Click acá o escaneá un código" },
  },
  {
    id: "catalog",
    target: '[data-tour="catalog"]',
    icon: "mdi-view-grid-outline",
    title: "2. Elegir del catálogo",
    description:
      "También podés tocar una tarjeta del catálogo. Pagina con PgUp / PgDn. Solo se ven productos de la sucursal activa.",
    tips: [
      { icon: "mdi-package-variant-closed", text: "Stock visible por sucursal." },
      { icon: "mdi-tag-outline", text: "Las promos muestran el precio rebajado." },
    ],
    demoLabel: { icon: "mdi-cursor-default-click-outline", text: "Click en la tarjeta para sumarlo" },
  },
  {
    id: "caja",
    target: '[data-tour="caja"]',
    icon: "mdi-cash-register",
    title: "3. Estado de caja",
    description:
      "Para cobrar necesitás la caja abierta. Acá ves quién la opera y desde acá la abrís con el saldo inicial del turno.",
    tips: [
      { icon: "mdi-lock-open-variant-outline", text: "Botón para abrir caja con monto inicial." },
      { icon: "mdi-clipboard-text-outline",    text: "Al cerrar caja se hace el arqueo automático." },
    ],
    demoLabel: { icon: "mdi-information-outline", text: "Estado actual de la caja" },
  },
  {
    id: "cart",
    target: '[data-tour="cart"]',
    icon: "mdi-cart-outline",
    title: "4. Tu carrito",
    description:
      "El producto agregado aparece acá con cantidad, precio y subtotal. Editás inline sin perder el resto del carrito.",
    simulation: SimCartLine,
    tips: [
      { text: "Toggle del carrito", shortcut: "F6" },
      { icon: "mdi-pencil-outline", text: "Click en cantidad/precio para editar." },
    ],
    demoLabel: { icon: "mdi-cart-arrow-down", text: "Tu producto cae acá" },
  },
  {
    id: "checkout",
    target: '[data-tour="checkout"]',
    icon: "mdi-cash-multiple",
    title: "5. Cobrar (F9)",
    description:
      "El último paso: presioná F9 (o este botón) y se abre el checkout con medios de pago, descuentos y comprobante.",
    simulation: SimCheckout,
    tips: [
      { text: "Abrir checkout", shortcut: "F9" },
      { icon: "mdi-credit-card-multiple-outline", text: "Pago combinado: efectivo + tarjeta + QR." },
    ],
    demoLabel: { icon: "mdi-arrow-down-bold", text: "Click para cobrar" },
  },
];

// Pasos para MOBILE (sin F-keys, con FAB y bottom-sheets)
const stepsMobile = [
  {
    id: "topbar",
    target: '[data-tour="topbar"]',
    icon: "mdi-cellphone-cog",
    title: "Barra superior",
    description:
      "Acá ves el estado de la caja y los accesos rápidos: refrescar catálogo, buscador y ayuda.",
    tips: [
      { icon: "mdi-magnify", text: "Tocá la lupa para abrir el buscador avanzado." },
      { icon: "mdi-help-circle-outline", text: "Tocá el signo de pregunta para volver a ver este tour." },
    ],
    demoLabel: { icon: "mdi-arrow-up-bold", text: "Tu barra de control" },
  },
  {
    id: "search",
    target: '[data-tour="search"]',
    icon: "mdi-magnify",
    title: "1. Buscar producto",
    description:
      "Escribí nombre, SKU o código del producto. También podés tocar el icono del scanner para usar la cámara.",
    simulation: SimSearchHit,
    tips: [
      { icon: "mdi-barcode-scan", text: "Si hay un único match, el producto entra solo al carrito." },
      { icon: "mdi-cellphone-screenshot", text: "El scanner del bottom-nav también funciona acá." },
    ],
    demoLabel: { icon: "mdi-cursor-default-click-outline", text: "Tocá para buscar" },
  },
  {
    id: "catalog",
    target: '[data-tour="catalog"]',
    icon: "mdi-view-grid-outline",
    title: "2. Tocar producto del catálogo",
    description:
      "Toda la pantalla está dedicada al catálogo. Tocá una tarjeta y el producto se suma al carrito al instante.",
    tips: [
      { icon: "mdi-package-variant-closed", text: "Solo ves productos de la sucursal activa." },
      { icon: "mdi-tag-outline", text: "Los productos en promo muestran el precio rebajado." },
    ],
    demoLabel: { icon: "mdi-gesture-tap", text: "Tocá una tarjeta" },
  },
  {
    id: "caja",
    target: '[data-tour="caja"]',
    icon: "mdi-cash-register",
    title: "3. Estado de caja",
    description:
      "Esta pastilla muestra si la caja está abierta. Tocala para abrir/cerrar caja, ver el cajero y arqueo.",
    tips: [
      { icon: "mdi-lock-open-variant-outline", text: "Verde = caja abierta, lista para cobrar." },
      { icon: "mdi-lock", text: "Rojo = cerrada. Tocá para abrirla con saldo inicial." },
    ],
    demoLabel: { icon: "mdi-cursor-default-click-outline", text: "Tocá para gestionar caja" },
  },
  {
    id: "cart",
    target: '[data-tour="cart"]',
    icon: "mdi-cart-outline",
    title: "4. Carrito flotante",
    description:
      "Cuando agregues productos aparece acá abajo un botón flotante con el total. Tocalo y se abre el carrito completo desde abajo.",
    simulation: SimCartLine,
    tips: [
      { icon: "mdi-cart-arrow-up", text: "El FAB muestra cantidad de items y total acumulado." },
      { icon: "mdi-pencil-outline", text: "Dentro podés editar cantidades y precios." },
    ],
    demoLabel: { icon: "mdi-arrow-down-bold", text: "Tu carrito flota acá abajo" },
  },
  {
    id: "checkout",
    target: '[data-tour="cart"]',
    icon: "mdi-cash-multiple",
    title: "5. Cobrar venta",
    description:
      "Abrí el carrito desde el botón flotante y abajo encontrás un botón gigante \"COBRAR\". Tocalo para abrir el flujo de pago: efectivo, tarjeta, QR, transferencia o combinado.",
    simulation: SimCheckout,
    tips: [
      { icon: "mdi-cash", text: "Pago en efectivo con cálculo de vuelto." },
      { icon: "mdi-credit-card-multiple-outline", text: "Pago combinado: mezclá medios de pago." },
      { icon: "mdi-printer-outline", text: "Imprime ticket o factura al confirmar." },
    ],
    demoLabel: { icon: "mdi-cart-check", text: "Abrí el carrito y tocá COBRAR" },
  },
];

const steps = computed(() => mobile.value ? stepsMobile : stepsDesktop);

const currentStep = computed(() => steps.value[stepIndex.value]);
const hasTarget = computed(() => !!currentStep.value?.target && targetRect.value);

// ── Spotlight ─────────────────────────────────────────────────────────
const overlayClipStyle = computed(() => {
  if (!hasTarget.value) return { clipPath: "none" };
  const r = targetRect.value;
  const pad = 8;
  const left = Math.max(0, r.left - pad);
  const top = Math.max(0, r.top - pad);
  const right = r.left + r.width + pad;
  const bottom = r.top + r.height + pad;
  return {
    clipPath: `polygon(
      0 0, 0 100%, ${left}px 100%, ${left}px ${top}px,
      ${right}px ${top}px, ${right}px ${bottom}px,
      ${left}px ${bottom}px, ${left}px 100%, 100% 100%, 100% 0
    )`,
  };
});

const ringStyle = computed(() => {
  if (!hasTarget.value) return { display: "none" };
  const r = targetRect.value;
  const pad = 6;
  return {
    left:   `${r.left - pad}px`,
    top:    `${r.top - pad}px`,
    width:  `${r.width + pad * 2}px`,
    height: `${r.height + pad * 2}px`,
  };
});

const demoLabelStyle = computed(() => {
  if (!hasTarget.value) return { display: "none" };
  const r = targetRect.value;
  // Por defecto va arriba del target; si no entra, lo ponemos abajo
  const labelTop = r.top - 38;
  if (labelTop < 12) {
    return { left: `${r.left + r.width / 2}px`, top: `${r.top + r.height + 10}px` };
  }
  return { left: `${r.left + r.width / 2}px`, top: `${labelTop}px` };
});

// ── Posicionamiento del tooltip ───────────────────────────────────────
const tooltipStyle = ref({ left: "50%", top: "50%" });

function placeTooltip() {
  const r = targetRect.value;
  const tip = tooltipRef.value;
  if (!tip) return;

  const W = window.innerWidth;
  const H = window.innerHeight;
  const tw = tip.offsetWidth || 400;
  const th = tip.offsetHeight || 320;
  const margin = 16;

  if (!r) {
    placement.value = "center";
    tooltipStyle.value = { left: `${(W - tw) / 2}px`, top: `${(H - th) / 2}px` };
    return;
  }

  const spaceTop    = r.top - margin;
  const spaceBottom = H - (r.top + r.height) - margin;
  const spaceRight  = W - (r.left + r.width) - margin;
  const spaceLeft   = r.left - margin;

  let pl, x, y;
  if (spaceBottom >= th)        { pl = "bottom"; x = r.left + r.width / 2 - tw / 2; y = r.top + r.height + margin; }
  else if (spaceTop >= th)      { pl = "top";    x = r.left + r.width / 2 - tw / 2; y = r.top - th - margin; }
  else if (spaceRight >= tw)    { pl = "right";  x = r.left + r.width + margin;     y = r.top + r.height / 2 - th / 2; }
  else if (spaceLeft >= tw)     { pl = "left";   x = r.left - tw - margin;          y = r.top + r.height / 2 - th / 2; }
  else                          { pl = "center"; x = (W - tw) / 2;                  y = (H - th) / 2; }

  x = Math.max(margin, Math.min(x, W - tw - margin));
  y = Math.max(margin, Math.min(y, H - th - margin));

  placement.value = pl;
  tooltipStyle.value = { left: `${x}px`, top: `${y}px` };
}

async function refreshTarget() {
  await nextTick();
  const sel = currentStep.value?.target;
  if (!sel) {
    targetRect.value = null;
    await nextTick();
    placeTooltip();
    return;
  }
  const el = document.querySelector(sel);
  if (!el) {
    targetRect.value = null;
    await nextTick();
    placeTooltip();
    return;
  }
  el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
  await new Promise(r => setTimeout(r, 250));
  const rect = el.getBoundingClientRect();
  targetRect.value = {
    top: rect.top, left: rect.left, width: rect.width, height: rect.height,
  };
  await nextTick();
  placeTooltip();
}

// ── Transiciones de modo ──────────────────────────────────────────────
watch(open, (v) => {
  if (v) {
    mode.value = "welcome";
    stepIndex.value = 0;
  }
});
watch(mode, (m) => {
  if (m === "tour") refreshTarget();
});
watch(stepIndex, () => { if (mode.value === "tour") refreshTarget(); });

const onResize = () => { if (mode.value === "tour") refreshTarget(); };
if (typeof window !== "undefined") {
  window.addEventListener("resize", onResize);
  window.addEventListener("scroll", onResize, true);
}
onBeforeUnmount(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("resize", onResize);
    window.removeEventListener("scroll", onResize, true);
  }
});

// ── Acciones ──────────────────────────────────────────────────────────
function startTour()    { mode.value = "tour"; stepIndex.value = 0; }
function goTo(i)        { stepIndex.value = i; }
function next()         { if (stepIndex.value < steps.value.length - 1) stepIndex.value++; }
function prev()         { if (stepIndex.value > 0) stepIndex.value--; }
function goCompleted()  { mode.value = "completed"; }
function finish() {
  try { localStorage.setItem("pos.wizard.seen", "1"); } catch {}
  emit("update:modelValue", false);
}
</script>

<style scoped>
/* ───────── overlay full-screen ───────── */
.posw {
  position: fixed;
  inset: 0;
  z-index: 3000;
  pointer-events: none;
}
.posw__scrim {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.62);
  backdrop-filter: blur(2px);
  pointer-events: auto;
}
.posw__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.62);
  backdrop-filter: blur(1px);
  pointer-events: auto;
  transition: clip-path 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ───────── WELCOME ───────── */
.posw__welcome {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 460px;
  max-width: calc(100vw - 32px);
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  border-radius: 20px;
  padding: 22px 24px 20px;
  text-align: center;
  pointer-events: auto;
  box-shadow:
    0 24px 80px rgba(0, 0, 0, 0.5),
    0 4px 12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}
.posw__welcome-glow {
  position: absolute;
  top: -120px;
  left: 50%;
  transform: translateX(-50%);
  width: 260px;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(20, 136, 209, 0.22), transparent 70%);
  pointer-events: none;
  z-index: 0;
}
.posw__welcome > * { position: relative; z-index: 1; }

.posw__welcome-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #1488d1 0%, #0e6ba8 100%);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  box-shadow: 0 8px 22px rgba(20, 136, 209, 0.4);
}
.posw__welcome-icon :deep(.v-icon) { font-size: 28px !important; }

.posw__welcome-eyebrow {
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  color: #1488d1;
  margin-bottom: 4px;
}
.posw__welcome-title {
  font-size: 21px;
  font-weight: 500;
  letter-spacing: -0.3px;
  line-height: 1.2;
  margin: 0 0 8px;
}
.posw__welcome-text {
  font-size: 13px;
  line-height: 1.5;
  color: rgba(var(--v-theme-on-surface), 0.72);
  margin: 0 auto 16px;
  max-width: 400px;
}
.posw__welcome-features {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 18px;
  flex-wrap: wrap;
}
.posw__feat {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(20, 136, 209, 0.08);
  flex: 1 1 0;
  min-width: 120px;
  text-align: left;
}
.v-theme--adminDark .posw__feat,
.v-theme--shopDark .posw__feat,
.v-theme--dark .posw__feat {
  background: rgba(20, 136, 209, 0.12);
}
.posw__feat-icon {
  color: #1488d1;
  flex-shrink: 0;
}
.posw__feat-text {
  font-size: 11px;
  line-height: 1.3;
  color: rgba(var(--v-theme-on-surface), 0.85);
}
.posw__feat-text b { color: rgb(var(--v-theme-on-surface)); }

.posw__welcome-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
}
.posw__welcome-cta {
  min-width: 200px;
}
.posw__skip-tiny {
  background: transparent;
  border: none;
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.42);
  text-decoration: underline;
  cursor: pointer;
  padding: 6px;
  margin-top: 8px;
}
.posw__skip-tiny:hover { color: rgba(var(--v-theme-on-surface), 0.7); }

/* ───────── RING + DEMO LABEL ───────── */
.posw__ring {
  position: absolute;
  border: 2px solid #1488d1;
  border-radius: 14px;
  box-shadow:
    0 0 0 4px rgba(20, 136, 209, 0.25),
    0 0 32px 4px rgba(20, 136, 209, 0.45);
  pointer-events: none;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  animation: posw-ring-pulse 2s ease-in-out infinite;
}
@keyframes posw-ring-pulse {
  0%, 100% { box-shadow: 0 0 0 4px rgba(20, 136, 209, 0.25), 0 0 32px 4px rgba(20, 136, 209, 0.45); }
  50%      { box-shadow: 0 0 0 8px rgba(20, 136, 209, 0.18), 0 0 48px 8px rgba(20, 136, 209, 0.55); }
}

.posw__demo-label {
  position: absolute;
  transform: translateX(-50%);
  background: #1488d1;
  color: #fff;
  font-size: 11.5px;
  font-weight: 500;
  letter-spacing: 0.01em;
  padding: 5px 12px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  box-shadow: 0 6px 18px rgba(20, 136, 209, 0.5);
  pointer-events: none;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  animation: posw-bounce 1.6s ease-in-out infinite;
}
@keyframes posw-bounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50%      { transform: translateX(-50%) translateY(-3px); }
}

/* ───────── tooltip ───────── */
.posw__tooltip {
  position: absolute;
  width: 400px;
  max-width: calc(100vw - 32px);
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  border-radius: 14px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.45),
    0 4px 12px rgba(0, 0, 0, 0.20);
  pointer-events: auto;
  overflow: hidden;
  transition: left 0.35s cubic-bezier(0.4, 0, 0.2, 1),
              top  0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.v-theme--adminDark .posw__tooltip,
.v-theme--shopDark .posw__tooltip,
.v-theme--dark .posw__tooltip {
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.posw__head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 14px 10px;
}
.posw__head-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(20, 136, 209, 0.14);
  color: #1488d1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.v-theme--adminDark .posw__head-icon,
.v-theme--shopDark .posw__head-icon,
.v-theme--dark .posw__head-icon { background: rgba(20, 136, 209, 0.22); }

.posw__head-text { flex: 1 1 auto; min-width: 0; }
.posw__eyebrow {
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #1488d1;
  margin-bottom: 1px;
}
.posw__title {
  font-size: 15.5px;
  font-weight: 500;
  letter-spacing: -0.2px;
  line-height: 1.2;
}
.posw__close {
  background: transparent;
  border: none;
  color: rgba(var(--v-theme-on-surface), 0.55);
  cursor: pointer;
  width: 30px; height: 30px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.posw__close:hover { background: rgba(var(--v-theme-on-surface), 0.08); color: rgb(var(--v-theme-on-surface)); }

.posw__body { padding: 4px 16px 12px; }
.posw__desc {
  font-size: 13px;
  line-height: 1.5;
  color: rgba(var(--v-theme-on-surface), 0.78);
  margin: 0 0 10px;
}

/* simulación inline */
.posw__sim {
  border-radius: 10px;
  border: 1px dashed rgba(20, 136, 209, 0.35);
  background: rgba(20, 136, 209, 0.05);
  margin: 6px 0 10px;
  overflow: hidden;
}
.v-theme--adminDark .posw__sim,
.v-theme--shopDark .posw__sim,
.v-theme--dark .posw__sim {
  background: rgba(20, 136, 209, 0.08);
}
.posw__sim-head {
  display: flex;
  align-items: center;
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #1488d1;
  padding: 6px 10px 4px;
}
.posw__sim-body { padding: 4px 10px 10px; }

.posw__tips {
  list-style: none; padding: 0; margin: 0;
  display: flex; flex-direction: column; gap: 6px;
}
.posw__tip {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 9px;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  font-size: 12.5px;
  line-height: 1.35;
  color: rgba(var(--v-theme-on-surface), 0.85);
}
.v-theme--adminDark .posw__tip,
.v-theme--shopDark .posw__tip,
.v-theme--dark .posw__tip { background: rgba(255, 255, 255, 0.04); }
.posw__tip-icon { color: #1488d1; flex-shrink: 0; }
.posw__tip-text { flex: 1 1 auto; min-width: 0; }
.posw__tip-chip { flex-shrink: 0; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }

.posw__foot {
  display: flex; align-items: center; justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}
.posw__dots { display: inline-flex; gap: 5px; }
.posw__dot {
  width: 7px; height: 7px;
  padding: 0; border: none; border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.18);
  cursor: pointer;
  transition: background 0.15s, width 0.15s;
}
.posw__dot.is-done   { background: rgba(20, 136, 209, 0.55); }
.posw__dot.is-active { width: 18px; background: #1488d1; }
.posw__actions { display: inline-flex; align-items: center; gap: 4px; }

/* ───────── COMPLETED ───────── */
.posw__done {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 480px;
  max-width: calc(100vw - 32px);
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  border-radius: 22px;
  padding: 36px 32px 28px;
  text-align: center;
  pointer-events: auto;
  box-shadow:
    0 24px 80px rgba(0, 0, 0, 0.5),
    0 4px 12px rgba(0, 0, 0, 0.25);
}
.posw__done-check {
  width: 80px; height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  box-shadow: 0 12px 32px rgba(16, 185, 129, 0.45);
  animation: posw-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes posw-pop {
  0%   { transform: scale(0); }
  100% { transform: scale(1); }
}
.posw__done-eyebrow {
  font-size: 11.5px;
  font-weight: 500;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  color: #10b981;
  margin-bottom: 6px;
}
.posw__done-title {
  font-size: 24px;
  font-weight: 500;
  letter-spacing: -0.4px;
  margin: 0 0 10px;
}
.posw__done-text {
  font-size: 13.5px;
  line-height: 1.55;
  color: rgba(var(--v-theme-on-surface), 0.72);
  margin: 0 auto 22px;
  max-width: 380px;
}
.posw__done-summary {
  text-align: left;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 22px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.v-theme--adminDark .posw__done-summary,
.v-theme--shopDark .posw__done-summary,
.v-theme--dark .posw__done-summary { background: rgba(255, 255, 255, 0.04); }
.posw__done-row {
  display: flex; align-items: center;
  font-size: 12.5px;
  color: rgba(var(--v-theme-on-surface), 0.85);
}
.posw__done-row-icon { color: #1488d1; margin-right: 6px; }

.posw__done-actions {
  display: flex; justify-content: center;
}

/* ───────── simulaciones internas ───────── */
:deep(.sim-row) {
  display: flex; align-items: center; gap: 10px;
  background: rgb(var(--v-theme-surface));
  border-radius: 8px;
  padding: 8px;
}
:deep(.sim-thumb) {
  width: 36px; height: 36px;
  border-radius: 8px;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; letter-spacing: 0.05em;
  color: #fff;
  flex-shrink: 0;
}
:deep(.sim-thumb--blue) { background: linear-gradient(135deg, #1488d1, #0e6ba8); }
:deep(.sim-info) { flex: 1 1 auto; min-width: 0; }
:deep(.sim-title) { font-size: 12.5px; font-weight: 500; line-height: 1.2; }
:deep(.sim-meta)  { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.55); margin-top: 1px; }
:deep(.sim-price) { font-size: 13px; font-weight: 500; color: #1488d1; }

:deep(.sim-cart) {
  background: rgb(var(--v-theme-surface));
  border-radius: 8px;
  padding: 8px;
}
:deep(.sim-cart-row) {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 10px;
  align-items: center;
  font-size: 12.5px;
  padding: 4px 2px;
}
:deep(.sim-cart-name) { font-weight: 500; }
:deep(.sim-cart-qty)  { color: rgba(var(--v-theme-on-surface), 0.55); }
:deep(.sim-cart-sub)  { font-weight: 500; color: #1488d1; }
:deep(.sim-cart-total) {
  display: flex; justify-content: space-between;
  margin-top: 6px; padding-top: 6px;
  border-top: 1px dashed rgba(var(--v-theme-on-surface), 0.15);
  font-size: 13px;
}
:deep(.sim-cart-total b) { color: #10b981; font-weight: 600; }

:deep(.sim-pay) {
  background: rgb(var(--v-theme-surface));
  border-radius: 8px;
  padding: 8px;
}
:deep(.sim-pay-row) {
  display: flex; align-items: center; gap: 8px;
  font-size: 12.5px;
  padding: 5px 2px;
}
:deep(.sim-pay-row b) { margin-left: auto; }
:deep(.sim-pay-row--ok) { color: #10b981; }

/* ───────── transiciones ───────── */
.posw-fade-enter-active, .posw-fade-leave-active { transition: opacity 0.22s ease; }
.posw-fade-enter-from, .posw-fade-leave-to { opacity: 0; }

@media (max-width: 720px) {
  .posw__welcome,
  .posw__done { padding: 28px 22px 22px; }
  .posw__welcome-features { flex-direction: column; }
  .posw__tooltip { width: calc(100vw - 24px); }
}
</style>
