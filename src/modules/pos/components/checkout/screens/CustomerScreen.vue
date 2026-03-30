<template>
  <div class="ck-screen">
    <div class="ck-screen__head">
      <div class="ck-screen__title">Cliente</div>
      <div class="ck-screen__subtitle">
        {{ isFacturaMode ? "Completá los datos" : "Cliente opcional" }}
      </div>
    </div>

    <div class="ck-screen__body">
      <div class="ck-form-shell">
        <div class="ck-top-strip">
          <div
            class="ck-top-chip"
            :class="isFacturaMode ? 'ck-top-chip--required' : 'ck-top-chip--optional'"
          >
            <v-icon size="14">
              {{ isFacturaMode ? "mdi-receipt-text-check-outline" : "mdi-account-outline" }}
            </v-icon>
            <span>
              {{ isFacturaMode ? "Obligatorio para facturar" : "Podés seguir sin cliente" }}
            </span>
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
              placeholder="Nombre o razón social"
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
                placeholder="Documento"
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
                placeholder="Teléfono"
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
              <v-icon size="14">mdi-keyboard-return</v-icon>
              <span>Enter seguir</span>
            </div>

            <div class="ck-help-pill">
              <v-icon size="14">mdi-backspace-outline</v-icon>
              <span>Borrar volver</span>
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

const cleanName = computed(() => String(props.customerName || "").trim());
const cleanDoc = computed(() => String(props.customerDoc || "").trim());

const nameError = computed(() => isFacturaMode.value && !cleanName.value);
const docError = computed(() => isFacturaMode.value && !cleanDoc.value);

const nameErrorMsg = computed(() => "Ingresá nombre o razón social.");
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
  gap: 6px;
  padding: 6px 8px;
  border-radius: 20px;
  background: transparent;
  min-width: 0;
}

.ck-screen__head {
  display: grid;
  gap: 1px;
  padding-inline: 2px;
}

.ck-screen__title {
  font-size: 0.95rem;
  font-weight: 950;
  line-height: 1.02;
  letter-spacing: -0.02em;
  color: #f4f7fb;
}

.ck-screen__subtitle {
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1.05;
  color: rgba(255, 255, 255, 0.62);
}

.ck-screen__body {
  min-height: 0;
}

.ck-form-shell {
  display: grid;
  gap: 6px;
  min-height: 0;
  align-content: start;
}

.ck-top-strip {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ck-top-chip {
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  font-weight: 900;
  line-height: 1;
  border: 1px solid transparent;
}

.ck-top-chip--required {
  color: #fb7185;
  background: rgba(251, 113, 133, 0.1);
  border-color: rgba(251, 113, 133, 0.16);
}

.ck-top-chip--optional {
  color: rgba(255, 255, 255, 0.78);
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.08);
}

.ck-form {
  display: grid;
  gap: 8px;
  padding: 10px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.02) 0%,
      rgba(255, 255, 255, 0.01) 100%
    ),
    rgba(10, 20, 44, 0.74);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    0 6px 16px rgba(0, 0, 0, 0.14);
}

.ck-form__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.ck-field-wrap {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.ck-field-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  flex-wrap: wrap;
}

.ck-field-label {
  font-size: 0.76rem;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.72);
  letter-spacing: 0.01em;
  line-height: 1.05;
}

.ck-required-chip,
.ck-optional-chip {
  min-height: 22px;
  padding: 0 9px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  font-size: 0.66rem;
  font-weight: 900;
  white-space: nowrap;
  line-height: 1;
}

.ck-required-chip {
  color: #fb7185;
  background: rgba(251, 113, 133, 0.1);
}

.ck-optional-chip {
  color: rgba(255, 255, 255, 0.72);
  background: rgba(255, 255, 255, 0.05);
}

.ck-field {
  width: 100%;
}

.ck-field :deep(.v-field) {
  border-radius: 14px;
  background: rgba(10, 20, 44, 0.58);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.ck-field :deep(.v-field__input) {
  min-height: 42px;
  padding-top: 0;
  padding-bottom: 0;
  color: #f4f7fb;
  font-weight: 700;
  font-size: 0.9rem;
}

.ck-help-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding-top: 0;
}

.ck-help-pill {
  min-height: 26px;
  padding: 0 9px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.76);
  font-size: 0.68rem;
  font-weight: 800;
  line-height: 1;
}

@media (max-width: 760px) {
  .ck-screen {
    padding: 6px 6px 0;
    gap: 6px;
  }

  .ck-form {
    padding: 8px;
    gap: 8px;
  }

  .ck-form__grid {
    grid-template-columns: 1fr;
  }
}
</style>