<template>
  <v-dialog
    :model-value="open"
    max-width="420"
    @update:model-value="$emit('update:open', $event)"
  >
    <v-card class="ccd" rounded="xl">
      <PosDialogHeader
        eyebrow="Caja"
        title="Apertura de caja"
        subtitle="¿Cuánto dinero hay en caja para empezar el turno?"
        @close="$emit('update:open', false)"
      />

      <v-divider />

      <div class="ccd__body">
        <!-- Fondo inicial (único campo obligatorio) -->
        <div class="ccd__amount-section">
          <div class="ccd__amount-label">
            <v-icon size="16" class="mr-1">mdi-cash</v-icon>
            Fondo inicial de caja
          </div>
          <v-text-field
            ref="amountInputRef"
            v-model="localOpeningAmount"
            variant="outlined"
            density="comfortable"
            hide-details
            prefix="$"
            inputmode="decimal"
            placeholder="0"
            class="ccd__amount-input"
            autofocus
            @keyup.enter="submit"
          />
          <p class="ccd__amount-hint">
            Solo efectivo físico disponible para vuelto
          </p>
        </div>

        <!-- Info automática -->
        <div class="ccd__info">
          <div class="ccd__info-title">
            <v-icon size="13">mdi-information-outline</v-icon>
            Se registrarán automáticamente
          </div>
          <div class="ccd__info-chips">
            <span class="ccd-chip">
              <v-icon size="13">mdi-account-circle</v-icon>
              <span>{{ cashierName || "Usuario" }}</span>
            </span>
            <span v-if="branchLabel" class="ccd-chip">
              <v-icon size="13">mdi-store-outline</v-icon>
              <span>{{ branchLabel }}</span>
            </span>
            <span class="ccd-chip">
              <v-icon size="13">mdi-clock-outline</v-icon>
              <span>{{ currentTimeLabel }}</span>
            </span>
          </div>
        </div>

        <!-- Observación (opcional, colapsable) -->
        <div class="ccd__note">
          <button
            type="button"
            class="ccd__note-toggle"
            @click="showNote = !showNote"
            :aria-expanded="showNote ? 'true' : 'false'"
          >
            <v-icon size="14">
              {{ showNote ? "mdi-chevron-down" : "mdi-chevron-right" }}
            </v-icon>
            <span>Agregar observación (opcional)</span>
          </button>

          <v-expand-transition>
            <v-text-field
              v-if="showNote"
              v-model="localNote"
              variant="outlined"
              density="comfortable"
              hide-details
              placeholder="Ej: Cambié billetes de $10.000"
              class="mt-2"
            />
          </v-expand-transition>
        </div>
      </div>

      <v-divider />

      <div class="ccd__actions">
        <v-btn variant="text" size="small" @click="$emit('update:open', false)">
          Cancelar
        </v-btn>
        <v-btn
          variant="flat"
          color="success"
          size="small"
          prepend-icon="mdi-cash-register"
          @click="submit"
        >
          Abrir caja
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from "vue";
import PosDialogHeader from "./shared/PosDialogHeader.vue";

const props = defineProps({
  open:         { type: Boolean,          default: false },
  openingAmount:{ type: [String, Number], default: "" },
  note:         { type: String,           default: "" },
  cashierName:  { type: String,           default: "" },
  branchLabel:  { type: String,           default: "" },
});

const emit = defineEmits(["update:open", "save"]);

function normalizeAmount(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const n = Number(
    String(v ?? "")
      .replace(/\$/g, "")
      .replace(/\s+/g, "")
      .replace(/\./g, "")
      .replace(",", ".")
  );
  return Number.isFinite(n) ? n : 0;
}

const localOpeningAmount = ref("");
const localNote = ref("");
const showNote = ref(false);

// Reloj en tiempo real mientras el dialog está abierto
const now = ref(new Date());
let clockTimer = null;

const currentTimeLabel = computed(() =>
  now.value.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  })
);

function syncFromProps() {
  localOpeningAmount.value = String(props.openingAmount ?? "");
  localNote.value = props.note || "";
  showNote.value = !!(props.note && String(props.note).trim());
}

watch(
  () => props.open,
  (v) => {
    if (v) {
      syncFromProps();
      now.value = new Date();
    }
  },
  { immediate: true }
);

onMounted(() => {
  clockTimer = setInterval(() => {
    if (props.open) now.value = new Date();
  }, 30 * 1000);
});

onBeforeUnmount(() => {
  if (clockTimer) clearInterval(clockTimer);
});

function submit() {
  const openingAmount = normalizeAmount(localOpeningAmount.value);
  const noteText = String(localNote.value || "").trim();

  // Defaults fijos para mantener compatibilidad con el backend.
  // El modo de facturación se elige por venta, no por apertura de caja.
  emit("save", {
    openingAmount,
    opening_amount: openingAmount,
    opening_cash: openingAmount,
    note: noteText,
    opening_note: noteText,
    cajaType: "GENERAL",
    caja_type: "GENERAL",
    invoiceMode: "NO_FISCAL",
    invoice_mode: "NO_FISCAL",
    invoiceType: "TICKET",
    invoice_type: "TICKET",
  });
}
</script>

<style scoped>
.ccd {
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
}

.ccd__body {
  padding: 18px;
  display: grid;
  gap: 14px;
}

/* ── Fondo inicial (hero) ─────────────────────────────────────── */
.ccd__amount-section {
  display: grid;
  gap: 6px;
  padding: 14px;
  border-radius: 14px;
  background: linear-gradient(
    180deg,
    rgba(var(--v-theme-primary), 0.07) 0%,
    rgba(var(--v-theme-primary), 0.03) 100%
  );
  border: 1px solid rgba(var(--v-theme-primary), 0.18);
}

.ccd__amount-label {
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), 0.72);
  letter-spacing: 0.01em;
  text-transform: uppercase;
}

.ccd__amount-input :deep(.v-field) {
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
}

.ccd__amount-input :deep(.v-field__input) {
  font-size: 26px;
  font-weight: 500;
  letter-spacing: -0.01em;
  padding-top: 10px;
  padding-bottom: 10px;
}

.ccd__amount-input :deep(.v-field__prefix) {
  font-size: 20px;
  font-weight: 400;
  padding-top: 14px;
  opacity: 0.7;
}

.ccd__amount-hint {
  margin: 0;
  font-size: 11.5px;
  color: rgba(var(--v-theme-on-surface), 0.55);
}

/* ── Info automática ──────────────────────────────────────────── */
.ccd__info {
  display: grid;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

.ccd__info-title {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  font-weight: 400;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.58);
}

.ccd__info-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ccd-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 9px;
  border-radius: 7px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  color: rgb(var(--v-theme-on-surface));
  font-size: 12px;
  font-weight: 400;
  line-height: 1.3;
  max-width: 100%;
}

.ccd-chip :deep(.v-icon) {
  opacity: 0.7;
  flex-shrink: 0;
}

.ccd-chip span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Nota colapsable ──────────────────────────────────────────── */
.ccd__note {
  display: grid;
  gap: 4px;
}

.ccd__note-toggle {
  all: unset;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), 0.68);
  transition: background 0.14s ease, color 0.14s ease;
  width: fit-content;
}

.ccd__note-toggle:hover {
  background: rgba(var(--v-theme-on-surface), 0.06);
  color: rgb(var(--v-theme-on-surface));
}

.ccd__note-toggle:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

.ccd :deep(.v-field) {
  border-radius: 10px;
}

/* ── Actions ──────────────────────────────────────────────────── */
.ccd__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 18px 16px;
}

/* ── Dark mode ───────────────────────────────────────────────── */
:global(.v-theme--dark) .ccd__info {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.07);
}

:global(.v-theme--dark) .ccd-chip {
  background: rgba(255, 255, 255, 0.06);
}

/* ── Responsive ──────────────────────────────────────────────── */
@media (max-width: 420px) {
  .ccd__body {
    padding: 14px;
  }
  .ccd__amount-input :deep(.v-field__input) {
    font-size: 22px;
  }
}
</style>
