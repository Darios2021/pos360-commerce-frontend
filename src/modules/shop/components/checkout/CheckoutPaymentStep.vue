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

    <!-- Trust banner — comunica seguridad ANTES de elegir método -->
    <div class="ml-trust-banner">
      <div class="ml-trust-ico">
        <v-icon size="16">mdi-shield-check-outline</v-icon>
      </div>
      <div class="ml-trust-text">
        <span class="ml-trust-strong">Pago 100% seguro</span>
        <span class="ml-trust-sep">·</span>
        Tus datos están protegidos. Nunca vemos los datos de tu tarjeta.
      </div>
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

        <!-- Panel contextual JUSTO debajo -->
        <v-expand-transition>
          <div v-if="local.method_code === m.code" class="ml-pay-panel">
            <!-- MERCADO PAGO -->
            <template v-if="m.code === 'mercadopago'">
              <div class="ml-panel-rows">
                <div class="ml-panel-row">
                  <v-icon size="15" color="primary">mdi-credit-card-outline</v-icon>
                  <span>Pagás con tarjeta de crédito, débito, dinero en cuenta o QR.</span>
                </div>
                <div class="ml-panel-row">
                  <v-icon size="15" color="primary">mdi-arrow-right-bold-circle-outline</v-icon>
                  <span>Al confirmar te redirigimos al sitio seguro de Mercado Pago.</span>
                </div>
                <div class="ml-panel-row">
                  <v-icon size="15" color="success">mdi-cash-multiple</v-icon>
                  <span>Hasta 12 cuotas según tu tarjeta y promociones disponibles.</span>
                </div>
              </div>
            </template>

            <!-- TRANSFER -->
            <template v-else-if="m.code === 'transfer'">
              <div class="ml-panel-rows">
                <div class="ml-panel-row">
                  <v-icon size="15" color="primary">mdi-bank-transfer</v-icon>
                  <span>Te mostramos los datos para que transfieras desde tu home banking.</span>
                </div>
              </div>

              <div class="ml-panel-grid">
                <div class="ml-kv">
                  <div class="k">Alias</div>
                  <div class="v">{{ transfer.alias || "—" }}</div>
                </div>
                <div class="ml-kv">
                  <div class="k">CBU</div>
                  <div class="v">{{ transfer.cbu || "—" }}</div>
                </div>
                <div class="ml-kv">
                  <div class="k">Titular</div>
                  <div class="v">{{ transfer.holder || "—" }}</div>
                </div>
              </div>

              <v-text-field
                v-model="local.reference"
                label="N° de referencia / comprobante (opcional)"
                variant="outlined"
                density="comfortable"
                class="mt-3"
                hide-details="auto"
              />
            </template>

            <!-- CASH -->
            <template v-else-if="m.code === 'cash'">
              <div class="ml-panel-rows">
                <div class="ml-panel-row">
                  <v-icon size="15" color="primary">mdi-cash</v-icon>
                  <span>Confirmás el pedido y pagás en efectivo al retirar o recibir.</span>
                </div>
                <div class="ml-panel-row">
                  <v-icon size="15" color="success">mdi-clock-outline</v-icon>
                  <span>Te avisamos cuando esté listo para retirar.</span>
                </div>
              </div>
            </template>

            <!-- CREDIT -->
            <template v-else-if="m.code === 'credit_sjt'">
              <div class="ml-panel-rows">
                <div class="ml-panel-row">
                  <v-icon size="15" color="warning">mdi-store-outline</v-icon>
                  <span>Reservás online y completás el trámite de crédito en la sucursal.</span>
                </div>
                <div class="ml-panel-row">
                  <v-icon size="15" color="primary">mdi-account-check-outline</v-icon>
                  <span>Necesitás presentar DNI y comprobante de ingresos en sucursal.</span>
                </div>
              </div>
            </template>
          </div>
        </v-expand-transition>
      </template>
    </div>

    <!-- Footer de seguridad — refuerza confianza al final -->
    <div class="ml-secure-footer">
      <v-icon size="13">mdi-lock-outline</v-icon>
      <span>Conexión cifrada (SSL). Tus datos viajan seguros.</span>
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
   Trust banner — refuerza seguridad arriba de los métodos
========================= */
.ml-trust-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: linear-gradient(180deg, rgba(0, 153, 102, 0.06) 0%, rgba(0, 153, 102, 0.10) 100%);
  border: 1px solid rgba(0, 153, 102, 0.20);
  border-radius: 12px;
  margin-bottom: 14px;
}
.ml-trust-ico {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: rgba(0, 153, 102, 0.16);
  color: #009966;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
}
.ml-trust-text {
  font-size: 12.5px;
  color: rgba(17, 24, 39, 0.7);
  font-weight: 400;
  line-height: 1.4;
}
.ml-trust-strong {
  color: #009966;
  font-weight: 540;
}
.ml-trust-sep {
  margin: 0 6px;
  color: rgba(17, 24, 39, 0.3);
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

/* =========================
   Panel de detalle del método (rows con ícono)
========================= */
.ml-pay-panel {
  border: 1px solid rgba(17, 24, 39, 0.08);
  background: linear-gradient(180deg, rgba(21, 101, 192, 0.025) 0%, rgba(21, 101, 192, 0.04) 100%);
  border-radius: 12px;
  padding: 14px 16px;
  margin-top: 4px;
}

.ml-panel-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ml-panel-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: rgba(17, 24, 39, 0.72);
  line-height: 1.4;
  font-weight: 400;
}
.ml-panel-row .v-icon {
  flex: 0 0 auto;
  margin-top: 2px;
}

/* Footer de seguridad cierra la sección */
.ml-secure-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 14px;
  font-size: 11.5px;
  color: rgba(17, 24, 39, 0.5);
  font-weight: 460;
}
.ml-secure-footer .v-icon {
  color: rgba(17, 24, 39, 0.45);
}

.ml-panel-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 12px;
}
.ml-kv {
  background: rgba(17, 24, 39, 0.03);
  border-radius: 10px;
  padding: 10px 12px;
}
.ml-kv .k {
  font-size: 10.5px;
  color: rgba(17, 24, 39, 0.55);
  font-weight: 460;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 2px;
}
.ml-kv .v {
  font-size: 13.5px;
  font-weight: 500;
  color: rgba(17, 24, 39, 0.92);
  word-break: break-word;
}

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
.ml-cta {
  border-radius: 12px;
  text-transform: none;
  font-weight: 540;
  letter-spacing: 0.005em;
  padding: 0 22px !important;
  min-width: 170px;
  height: 46px !important;
  font-size: 14px !important;
}
/* Back: fondo tonal más definido, color primary explícito en texto + icono */
.ml-cta--back :deep(.v-btn__content),
.ml-cta--back :deep(.v-icon) {
  color: rgb(var(--v-theme-primary)) !important;
}
.ml-cta--back {
  background: rgba(21, 101, 192, 0.10) !important;
}
.ml-cta--back:hover {
  background: rgba(21, 101, 192, 0.18) !important;
}

@media (max-width: 600px) {
  .ml-panel-grid { grid-template-columns: 1fr; }
  .ml-actions { flex-direction: column-reverse; align-items: stretch; }
  .ml-cta { width: 100%; min-width: 0; }
  .ml-step-title { font-size: 19px; }
  .ml-pay-card { padding: 12px 14px; }
  .ml-pay-ico { width: 36px; height: 36px; }
  .ml-trust-text { font-size: 12px; }
  .ml-pay-brands { gap: 4px; }
  .ml-brand-pill { min-width: 28px; height: 16px; font-size: 9px; }
}
</style>
