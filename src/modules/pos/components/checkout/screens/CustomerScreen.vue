<template>
  <div class="ck-screen">
    <div class="ck-screen__head">
      <div class="ck-screen__title">Cliente</div>
      <div class="ck-screen__subtitle">
        {{ subtitleText }}
      </div>
    </div>

    <div class="ck-screen__body">
      <div class="ck-form-shell">
        <div v-if="isFacturaMode" class="ck-alert ck-alert--required">
          <div class="ck-alert__icon">
            <v-icon size="18">mdi-receipt-text-check-outline</v-icon>
          </div>

          <div class="ck-alert__text">
            <div class="ck-alert__title">Obligatorio para factura electrónica</div>
            <div class="ck-alert__desc">
              Completá nombre o razón social y documento para emitir el comprobante fiscal.
            </div>
          </div>
        </div>

        <div v-else class="ck-alert ck-alert--optional">
          <div class="ck-alert__icon">
            <v-icon size="18">mdi-account-outline</v-icon>
          </div>

          <div class="ck-alert__text">
            <div class="ck-alert__title">Cliente opcional</div>
            <div class="ck-alert__desc">
              Podés asociar un cliente a la venta o continuar sin completar estos datos.
            </div>
          </div>
        </div>

        <div class="ck-form">
          <div class="ck-field-wrap">
            <div class="ck-field-head">
              <label class="ck-field-label">Nombre / Razón social</label>
              <span v-if="isFacturaMode" class="ck-required-chip">Obligatorio</span>
            </div>

            <v-text-field
              :ref="customerNameRef"
              :model-value="customerName"
              placeholder="Ingresar nombre o razón social"
              variant="outlined"
              density="comfortable"
              hide-details="auto"
              class="ck-field"
              :error="nameError"
              :error-messages="nameError ? nameErrorMsg : ''"
              @update:model-value="$emit('update:customer-name', $event)"
              @keyup.enter="emitNextIfValid"
            />
          </div>

          <div class="ck-form__grid">
            <div class="ck-field-wrap">
              <div class="ck-field-head">
                <label class="ck-field-label">DNI / CUIT / CUIL</label>
                <span v-if="isFacturaMode" class="ck-required-chip">Obligatorio</span>
              </div>

              <v-text-field
                :model-value="customerDoc"
                placeholder="Ingresar documento"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
                class="ck-field"
                :error="docError"
                :error-messages="docError ? docErrorMsg : ''"
                @update:model-value="$emit('update:customer-doc', $event)"
                @keyup.enter="emitNextIfValid"
              />
            </div>

            <div class="ck-field-wrap">
              <div class="ck-field-head">
                <label class="ck-field-label">Teléfono</label>
                <span class="ck-optional-chip">Opcional</span>
              </div>

              <v-text-field
                :model-value="customerPhone"
                placeholder="Ingresar teléfono"
                variant="outlined"
                density="comfortable"
                hide-details
                class="ck-field"
                @update:model-value="$emit('update:customer-phone', $event)"
                @keyup.enter="emitNextIfValid"
              />
            </div>
          </div>

          <div class="ck-help-row">
            <div class="ck-help-pill">
              <v-icon size="16">mdi-keyboard-outline</v-icon>
              <span>Enter para seguir</span>
            </div>

            <div class="ck-help-pill">
              <v-icon size="16">mdi-backspace-outline</v-icon>
              <span>Borrar para volver</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick } from "vue";

const props = defineProps({
  state: { type: Object, required: true },
  customerNameRef: { type: Object, default: null },
  customerName: { type: String, default: "" },
  customerDoc: { type: String, default: "" },
  customerPhone: { type: String, default: "" },
});

const emit = defineEmits([
  "update:customer-name",
  "update:customer-doc",
  "update:customer-phone",
  "next",
  "back",
]);

const isFacturaMode = computed(() => {
  return String(props.state?.invoiceMode || "").toUpperCase() === "FISCAL";
});

const subtitleText = computed(() => {
  return isFacturaMode.value
    ? "Datos requeridos para emitir factura electrónica"
    : "Podés asociar un cliente a la venta";
});

const cleanName = computed(() => String(props.customerName || "").trim());
const cleanDoc = computed(() => String(props.customerDoc || "").trim());

const nameError = computed(() => isFacturaMode.value && !cleanName.value);
const docError = computed(() => isFacturaMode.value && !cleanDoc.value);

const nameErrorMsg = computed(() => "Ingresá el nombre o razón social.");
const docErrorMsg = computed(() => "Ingresá DNI, CUIT o CUIL.");

function isValid() {
  if (!isFacturaMode.value) return true;
  return !!cleanName.value && !!cleanDoc.value;
}

function emitNextIfValid() {
  if (!isValid()) return true;
  emit("next");
  return true;
}

function focusCurrent() {
  nextTick(() => {
    const candidate = props.customerNameRef?.value;
    const input =
      candidate?.$el?.querySelector?.("input") ||
      candidate?.querySelector?.("input") ||
      candidate;

    input?.focus?.();
    input?.select?.();
  });
}

function handleKeyboardAction(action) {
  if (action === "enter") {
    return emitNextIfValid();
  }

  if (action === "backspace") {
    emit("back");
    return true;
  }

  return false;
}

defineExpose({
  focusCurrent,
  handleKeyboardAction,
});
</script>

<style scoped>
.ck-screen {
  min-height: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 12px;
  padding: 10px 12px 12px;
  border-radius: 20px;
  background: transparent;
}

.ck-screen__head {
  display: grid;
  gap: 4px;
  padding-inline: 2px;
}

.ck-screen__title {
  font-size: 1.18rem;
  font-weight: 950;
  line-height: 1.02;
  letter-spacing: -0.02em;
}

.ck-screen__subtitle {
  font-size: 0.86rem;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.6);
  line-height: 1.15;
}

.ck-screen__body {
  min-height: 0;
}

.ck-form-shell {
  display: grid;
  gap: 12px;
}

.ck-alert {
  min-height: 64px;
  padding: 12px 14px;
  border-radius: 18px;
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: 10px;
  align-items: start;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 4px 12px rgba(0, 0, 0, 0.03);
}

.ck-alert--required {
  background: rgba(var(--v-theme-error), 0.06);
  border-color: rgba(var(--v-theme-error), 0.18);
}

.ck-alert--optional {
  background: rgba(var(--v-theme-primary), 0.06);
  border-color: rgba(var(--v-theme-primary), 0.14);
}

.ck-alert__icon {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-surface), 0.72);
}

.ck-alert__text {
  display: grid;
  gap: 2px;
}

.ck-alert__title {
  font-size: 0.9rem;
  font-weight: 950;
  line-height: 1.1;
}

.ck-alert__desc {
  font-size: 0.8rem;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.7);
  line-height: 1.2;
}

.ck-form {
  display: grid;
  gap: 12px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background:
    linear-gradient(
      180deg,
      rgba(var(--v-theme-surface), 0.9) 0%,
      rgba(var(--v-theme-on-surface), 0.015) 100%
    );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 4px 12px rgba(0, 0, 0, 0.03);
}

.ck-form__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.ck-field-wrap {
  display: grid;
  gap: 6px;
}

.ck-field-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.ck-field-label {
  font-size: 0.82rem;
  font-weight: 900;
  color: rgba(var(--v-theme-on-surface), 0.66);
  letter-spacing: 0.01em;
}

.ck-required-chip,
.ck-optional-chip {
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  font-size: 0.72rem;
  font-weight: 900;
  white-space: nowrap;
}

.ck-required-chip {
  background: rgba(var(--v-theme-error), 0.12);
  color: rgb(var(--v-theme-error));
}

.ck-optional-chip {
  background: rgba(var(--v-theme-on-surface), 0.06);
  color: rgba(var(--v-theme-on-surface), 0.72);
}

.ck-field {
  width: 100%;
}

.ck-field :deep(.v-field) {
  border-radius: 16px;
  background: rgba(var(--v-theme-surface), 0.58);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.ck-help-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 2px;
}

.ck-help-pill {
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  color: rgba(var(--v-theme-on-surface), 0.76);
  font-size: 0.76rem;
  font-weight: 800;
}

@media (max-width: 760px) {
  .ck-screen {
    padding: 6px 0 0;
    gap: 10px;
  }

  .ck-form {
    padding: 10px;
  }

  .ck-form__grid {
    grid-template-columns: 1fr;
  }

  .ck-alert {
    grid-template-columns: 1fr;
  }

  .ck-alert__icon {
    width: 36px;
    height: 36px;
  }
}
</style>