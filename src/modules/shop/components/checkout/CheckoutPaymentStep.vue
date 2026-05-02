<!-- src/modules/shop/components/checkout/CheckoutPaymentStep.vue -->
<!-- ✅ COPY-PASTE FINAL COMPLETO
     - ✅ Minimal: card = titulo + chip (sin descripción adentro)
     - ✅ Panel de detalle aparece JUSTO debajo del método seleccionado
     - ✅ Elimina "Acordar pago con el vendedor"
     - ✅ DB-first: method_code => mercadopago | transfer | cash | credit_sjt
-->

<template>
  <div class="ml-step">
    <div class="ml-step-head">
      <div class="ml-kicker">Paso 2 de 3</div>
      <div class="ml-step-title">¿Cómo querés pagar?</div>
      <div class="ml-step-sub">Elegí el método y completá los datos si corresponde.</div>
    </div>

    <div class="ml-pay-grid">
      <template v-for="m in methods" :key="m.code">
        <!-- Card -->
        <button
          class="ml-pay-card"
          type="button"
          :class="{
            'is-active': local.method_code === m.code,
            'is-disabled': m.code === 'mercadopago' && !mpEnabled,
            'ml-pay-card--mp': m.code === 'mercadopago',
          }"
          :disabled="m.code === 'mercadopago' && !mpEnabled"
          @click="setPay(m.code)"
        >
          <div class="ml-pay-left">
            <div class="ml-pay-ico" :class="m.icoClass">
              <v-icon size="20">{{ m.icon }}</v-icon>
            </div>

            <div class="ml-pay-txt">
              <div class="ml-pay-title">
                {{ m.title }}
                <span v-if="m.chip" class="ml-chip" :class="m.chipClass">{{ m.chip }}</span>
              </div>

              <div v-if="m.subtitle" class="ml-pay-subtitle">{{ m.subtitle }}</div>

              <!-- Logos de marcas aceptadas (sólo MP) -->
              <div v-if="m.code === 'mercadopago' && mpEnabled" class="ml-pay-brands">
                <span class="ml-brand-pill ml-brand-visa">VISA</span>
                <span class="ml-brand-pill ml-brand-mc">MC</span>
                <span class="ml-brand-pill ml-brand-amex">AMEX</span>
                <span class="ml-brand-pill ml-brand-naranja">NX</span>
                <span class="ml-brand-pill ml-brand-cabal">CB</span>
                <span class="ml-brand-more">+ otras</span>
              </div>

              <div v-if="m.code === 'mercadopago' && !mpEnabled" class="ml-pay-warn">
                No disponible: falta configuración en el servidor.
              </div>
            </div>
          </div>

          <!-- Radio circle (no chevron) — se siente como "elegir", no "navegar" -->
          <div class="ml-pay-radio" :class="{ 'is-on': local.method_code === m.code }">
            <v-icon v-if="local.method_code === m.code" size="14">mdi-check</v-icon>
          </div>
        </button>
      </template>
    </div>

    <div class="ml-actions">
      <v-btn
        variant="tonal"
        color="primary"
        class="ml-cta ml-cta--back"
        @click="$emit('prev')"
      >
        <v-icon start>mdi-arrow-left</v-icon>
        Volver a entrega
      </v-btn>

      <v-btn
        color="primary"
        variant="flat"
        class="ml-cta"
        :disabled="!canContinue"
        @click="$emit('next')"
      >
        Continuar
        <v-icon end>mdi-arrow-right</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, watch } from "vue";

const props = defineProps({
  modelValue: {
    // ✅ DB-first: { method_code, reference }
    type: Object,
    default: () => ({ method_code: "mercadopago", reference: "" }),
  },
  mpEnabled: { type: Boolean, default: false },
  transfer: { type: Object, default: () => ({ alias: "", cbu: "", holder: "" }) },
});

const emit = defineEmits(["update:modelValue", "prev", "next"]);

function toStr(v) {
  return String(v ?? "").trim();
}

function normalizeCode(v) {
  const s = toStr(v).toLowerCase();

  // compat viejo (por si algo todavía manda method)
  if (s === "mercado_pago" || s === "mercadopago") return "mercadopago";
  if (s === "transfer") return "transfer";
  if (s === "cash") return "cash";
  if (s === "credit_sjt") return "credit_sjt";
  return "";
}

const local = reactive({
  method_code: normalizeCode(props.modelValue?.method_code) || "mercadopago",
  reference: toStr(props.modelValue?.reference),
});

// si MP está off y estaba seleccionado, caemos a transfer
watch(
  () => props.mpEnabled,
  (on) => {
    if (!on && local.method_code === "mercadopago") local.method_code = "transfer";
  },
  { immediate: true }
);

watch(
  () => props.modelValue,
  (v) => {
    if (!v) return;
    const nextCode = normalizeCode(v.method_code) || local.method_code;
    local.method_code = nextCode;
    local.reference = toStr(v.reference);
  },
  { deep: true }
);

watch(
  () => ({ method_code: local.method_code, reference: local.reference }),
  (v) => emit("update:modelValue", v),
  { deep: true }
);

const methods = computed(() => [
  {
    code: "mercadopago",
    title: "Mercado Pago",
    subtitle: "Tarjeta, débito, dinero en cuenta o QR",
    chip: "Recomendado",
    chipClass: "ml-chip-green",
    icon: "mdi-credit-card-outline",
    icoClass: "mp",
  },
  {
    code: "transfer",
    title: "Transferencia bancaria",
    subtitle: "Desde tu home banking, te damos alias y CBU",
    chip: null,
    chipClass: "",
    icon: "mdi-bank-outline",
    icoClass: "bank",
  },
  {
    code: "cash",
    title: "Efectivo",
    subtitle: "Pagás al retirar o cuando recibas el pedido",
    chip: null,
    chipClass: "",
    icon: "mdi-cash-multiple",
    icoClass: "cash",
  },
  {
    code: "credit_sjt",
    title: "Crédito San Juan Tecnología",
    subtitle: "Trámite presencial en sucursal",
    chip: "En tienda",
    chipClass: "ml-chip-amber",
    icon: "mdi-file-document-outline",
    icoClass: "credit",
  },
]);

function setPay(code) {
  if (code === "mercadopago" && !props.mpEnabled) return;
  local.method_code = code;

  // limpieza suave
  if (code !== "transfer") local.reference = "";
}

const canContinue = computed(() => {
  if (!local.method_code) return false;
  if (local.method_code === "mercadopago" && !props.mpEnabled) return false;
  return true;
});
</script>

<style scoped>
/* =========================
   INTER + base
========================= */
.ml-step,
.ml-step :deep(*) {
  font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
.ml-step {
  width: 100%;
  max-width: none;
  font-feature-settings: "cv02", "cv03", "cv04", "cv11";
  letter-spacing: 0.005em;
}

.ml-step-head {
  margin-bottom: 18px;
}
.ml-kicker {
  font-size: 11px;
  font-weight: 460;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(17, 24, 39, 0.5);
  margin-bottom: 6px;
}
.ml-step-title {
  font-weight: 540;
  font-size: 22px;
  line-height: 1.18;
  letter-spacing: -0.01em;
  color: rgba(17, 24, 39, 0.92);
}
.ml-step-sub {
  color: rgba(17, 24, 39, 0.6);
  font-size: 13.5px;
  font-weight: 400;
  margin-top: 4px;
}

/* =========================
   Cards de método
========================= */
.ml-pay-grid {
  display: grid;
  gap: 10px;
  width: 100%;
}

.ml-pay-card {
  width: 100%;
  border: 1.5px solid rgba(17, 24, 39, 0.10);
  background: #fff;
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease, background 0.18s ease;
}
.ml-pay-card:hover {
  border-color: rgba(21, 101, 192, 0.32);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
}
.ml-pay-card.is-active {
  border-color: rgb(var(--v-theme-primary));
  background: linear-gradient(180deg, rgba(21, 101, 192, 0.04) 0%, rgba(21, 101, 192, 0.08) 100%);
  box-shadow: 0 0 0 3px rgba(21, 101, 192, 0.12);
}
.ml-pay-card.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* MP destacada con halo verde sutil cuando NO está activa, para
   sugerir "recomendado" sin gritar */
.ml-pay-card--mp:not(.is-active):not(.is-disabled) {
  border-color: rgba(0, 153, 102, 0.25);
  box-shadow: 0 0 0 2px rgba(0, 153, 102, 0.06);
}

.ml-pay-left {
  display: flex;
  gap: 12px;
  min-width: 0;
  align-items: flex-start;
  flex: 1 1 auto;
}

.ml-pay-ico {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  margin-top: 1px;
}
.ml-pay-ico.mp { background: rgba(21, 101, 192, 0.12); color: rgb(var(--v-theme-primary)); }
.ml-pay-ico.bank { background: rgba(17, 24, 39, 0.07); color: rgba(17, 24, 39, 0.7); }
.ml-pay-ico.cash { background: rgba(0, 153, 102, 0.12); color: #009966; }
.ml-pay-ico.credit { background: rgba(245, 158, 11, 0.14); color: #b45309; }

.ml-pay-txt {
  min-width: 0;
  flex: 1 1 auto;
}
.ml-pay-title {
  font-weight: 540;
  font-size: 14.5px;
  color: rgba(17, 24, 39, 0.94);
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  letter-spacing: -0.005em;
  line-height: 1.2;
}
.ml-pay-subtitle {
  font-size: 12.5px;
  color: rgba(17, 24, 39, 0.58);
  font-weight: 400;
  line-height: 1.35;
  margin-top: 3px;
}

/* Brand pills (Visa, MC, etc.) debajo del título de MP */
.ml-pay-brands {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
  margin-top: 8px;
}
.ml-brand-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 18px;
  padding: 0 5px;
  border-radius: 4px;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
.ml-brand-visa { background: #1A1F71; }
.ml-brand-mc { background: #EB001B; }
.ml-brand-amex { background: #006FCF; }
.ml-brand-naranja { background: #FF6600; }
.ml-brand-cabal { background: #ED1C24; }
.ml-brand-more {
  font-size: 10.5px;
  color: rgba(17, 24, 39, 0.55);
  font-weight: 460;
  margin-left: 2px;
}

.ml-pay-warn {
  margin-top: 4px;
  font-size: 12px;
  color: #b45309;
  font-weight: 400;
}

/* Radio circle a la derecha — reemplaza el chevron, comunica "selección" */
.ml-pay-radio {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1.5px solid rgba(17, 24, 39, 0.20);
  background: #fff;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  color: #fff;
  transition: background 0.18s ease, border-color 0.18s ease;
}
.ml-pay-radio.is-on {
  background: rgb(var(--v-theme-primary));
  border-color: rgb(var(--v-theme-primary));
}

.ml-chip {
  font-size: 10px;
  font-weight: 540;
  padding: 3px 8px;
  border-radius: 999px;
  line-height: 1.2;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.ml-chip-blue { background: rgba(21, 101, 192, 0.12); color: rgb(var(--v-theme-primary)); }
.ml-chip-green { background: rgba(0, 153, 102, 0.14); color: #009966; }
.ml-chip-gray { background: rgba(17, 24, 39, 0.07); color: rgba(17, 24, 39, 0.7); }
.ml-chip-amber { background: rgba(245, 158, 11, 0.14); color: #b45309; }

.ml-actions {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}
/* Ambos botones (volver / continuar) comparten forma y tamaño.
   El primario es flat (azul lleno blanco) y el secundario es tonal
   (fondo azul tenue + texto/icono primary). */
/* Patrón sober compartido con CheckoutStepper / ProductPurchasePanel */
.ml-cta {
  border-radius: 6px;
  text-transform: none;
  font-weight: 500;
  letter-spacing: 0.005em;
  padding: 0 22px !important;
  min-width: 170px;
  min-height: 44px;
  height: 44px !important;
  font-size: 14px !important;
  box-shadow: none !important;
}
.ml-cta :deep(.v-btn__overlay) { opacity: 0; }
.ml-cta:not(.ml-cta--back):hover :deep(.v-btn__overlay) {
  opacity: 0.08;
  background: #000;
}

.ml-cta--back {
  font-weight: 460;
  background: rgba(21, 101, 192, 0.08) !important;
}
.ml-cta--back :deep(.v-btn__content),
.ml-cta--back :deep(.v-icon) {
  color: rgb(var(--v-theme-primary)) !important;
}
.ml-cta--back:hover {
  background: rgba(21, 101, 192, 0.14) !important;
}

@media (max-width: 600px) {
  .ml-actions { flex-direction: column-reverse; align-items: stretch; }
  .ml-cta { width: 100%; min-width: 0; }
  .ml-step-title { font-size: 19px; }
  .ml-pay-card { padding: 12px 14px; }
  .ml-pay-ico { width: 36px; height: 36px; }
  .ml-pay-brands { gap: 4px; }
  .ml-brand-pill { min-width: 28px; height: 16px; font-size: 9px; }
}
</style>
