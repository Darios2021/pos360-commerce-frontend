<template>
  <div class="ck-screen" ref="rootRef">
    <div class="ck-screen__head">
      <div class="ck-screen__title">Cliente</div>
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
              ref="nameFieldRef"
              :model-value="customerName"
              placeholder="Nombre o razón social"
              autofocus
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

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref } from "vue";

const props = defineProps({
  state: { type: Object, required: true },
  customerNameRef: { type: Object, default: null },
  customerName: { type: String, default: "" },
  customerDoc: { type: String, default: "" },
  customerPhone: { type: String, default: "" },
});

const rootRef = ref(null);
const nameFieldRef = ref(null);

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
    // Foco al input de nombre (crítico para facturar)
    const candidate = nameFieldRef.value || props.customerNameRef?.value;
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
  gap: 10px;
  padding: 10px 12px;
  background: transparent;
  min-width: 0;
}

.ck-screen__head {
  display: grid;
  gap: 2px;
}

.ck-screen__title {
  font-size: 1rem;
  font-weight: 900;
  line-height: 1.1;
  color: rgb(var(--v-theme-on-surface));
}

.ck-screen__subtitle {
  font-size: 0.76rem;
  font-weight: 700;
  line-height: 1.1;
  color: rgba(var(--v-theme-on-surface), 0.55);
}

.ck-screen__body {
  min-height: 0;
}

.ck-form-shell {
  display: grid;
  gap: 8px;
  min-height: 0;
  align-content: start;
}

.ck-top-strip {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ck-top-chip {
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.68rem;
  font-weight: 800;
  line-height: 1;
  border: 1px solid transparent;
}

.ck-top-chip--required {
  color: rgb(var(--v-theme-error));
  background: rgba(var(--v-theme-error), 0.08);
  border-color: rgba(var(--v-theme-error), 0.16);
}

.ck-top-chip--optional {
  color: rgba(var(--v-theme-on-surface), 0.6);
  background: rgba(var(--v-theme-on-surface), 0.05);
  border-color: rgba(var(--v-theme-on-surface), 0.1);
}

.ck-form {
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  background: rgba(var(--v-theme-surface), 0.6);
}

.ck-form__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
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
  font-size: 0.74rem;
  font-weight: 800;
  color: rgba(var(--v-theme-on-surface), 0.7);
  letter-spacing: 0.01em;
  line-height: 1.05;
}

.ck-required-chip,
.ck-optional-chip {
  min-height: 20px;
  padding: 0 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  font-size: 0.62rem;
  font-weight: 900;
  white-space: nowrap;
  line-height: 1;
}

.ck-required-chip {
  color: rgb(var(--v-theme-error));
  background: rgba(var(--v-theme-error), 0.08);
}

.ck-optional-chip {
  color: rgba(var(--v-theme-on-surface), 0.5);
  background: rgba(var(--v-theme-on-surface), 0.06);
}

.ck-field {
  width: 100%;
}

.ck-field :deep(.v-field) {
  border-radius: 10px;
}

.ck-field :deep(.v-field__input) {
  min-height: 40px;
  padding-top: 0;
  padding-bottom: 0;
  font-weight: 600;
  font-size: 0.88rem;
}

@media (max-width: 760px) {
  .ck-screen {
    padding: 8px;
    gap: 8px;
  }

  .ck-form {
    padding: 10px;
    gap: 8px;
  }

  .ck-form__grid {
    grid-template-columns: 1fr;
  }
}
</style>