<template>
  <div class="pc">
    <div class="pc-head">
      <div class="pc-left">
        <v-icon size="16" class="pc-ico">mdi-account</v-icon>

        <div class="pc-title-wrap">
          <div class="pc-title">Datos del cliente</div>
        </div>

        <v-chip size="x-small" label variant="tonal" class="pc-chip">
          {{ hasData ? "cargado" : "opcional" }}
        </v-chip>
      </div>

      <v-btn
        class="pc-clear text-medium-emphasis"
        :size="isXs ? 'small' : 'small'"
        :variant="'text'"
        :disabled="disabled || !hasData"
        @click="$emit('clear')"
        title="Limpiar datos"
      >
        <v-icon :start="!isXs" size="16">mdi-eraser</v-icon>
        <span v-if="!isXs">Limpiar</span>
      </v-btn>
    </div>

    <div class="pc-divider" />

    <div class="pc-body">
      <div class="pc-grid">
        <v-text-field
          v-model="local.name"
          label="Nombre / Razón social"
          variant="outlined"
          :density="density"
          hide-details
          :disabled="disabled"
          prepend-inner-icon="mdi-account-outline"
          class="pc-field pc-span-2"
          autocomplete="off"
        />

        <v-text-field
          v-model="local.doc"
          label="DNI / CUIT"
          variant="outlined"
          :density="density"
          hide-details
          :disabled="disabled"
          prepend-inner-icon="mdi-card-account-details-outline"
          class="pc-field"
          inputmode="numeric"
          autocomplete="off"
        />

        <v-text-field
          v-model="local.phone"
          label="Teléfono"
          variant="outlined"
          :density="density"
          hide-details
          :disabled="disabled"
          prepend-inner-icon="mdi-phone-outline"
          class="pc-field"
          inputmode="tel"
          autocomplete="off"
        />

        <v-text-field
          v-model="local.email"
          label="Email"
          variant="outlined"
          :density="density"
          hide-details
          :disabled="disabled"
          prepend-inner-icon="mdi-email-outline"
          class="pc-field pc-span-2"
          inputmode="email"
          autocomplete="off"
        />

        <v-text-field
          v-model="local.address"
          label="Dirección"
          variant="outlined"
          :density="density"
          hide-details
          :disabled="disabled"
          prepend-inner-icon="mdi-map-marker-outline"
          class="pc-field pc-span-2"
          autocomplete="off"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, watch, ref, onMounted, onBeforeUnmount } from "vue";

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  disabled: { type: Boolean, default: false },
  hasData: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue", "clear"]);

function normalize(o) {
  const x = o && typeof o === "object" ? o : {};
  return {
    name: String(x.name ?? "").trim(),
    doc: String(x.doc ?? "").trim(),
    phone: String(x.phone ?? "").trim(),
    email: String(x.email ?? "").trim(),
    address: String(x.address ?? "").trim(),
  };
}

const local = reactive(normalize(props.modelValue));

watch(
  () => props.modelValue,
  (v) => {
    const n = normalize(v);
    local.name = n.name;
    local.doc = n.doc;
    local.phone = n.phone;
    local.email = n.email;
    local.address = n.address;
  },
  { deep: true }
);

watch(
  () => ({ ...local }),
  () => emit("update:modelValue", normalize(local)),
  { deep: true }
);

const vw = ref(9999);

function setVw() {
  try {
    vw.value = window.innerWidth || 9999;
  } catch {
    vw.value = 9999;
  }
}

onMounted(() => {
  setVw();
  window.addEventListener("resize", setVw, { passive: true });
});

onBeforeUnmount(() => window.removeEventListener("resize", setVw));

const isXs = computed(() => vw.value <= 380);

const density = computed(() => {
  if (vw.value <= 420) return "compact";
  if (vw.value <= 1280) return "compact";
  return "comfortable";
});
</script>

<style scoped>
.pc {
  min-width: 0;
  border-radius: 16px;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(var(--v-theme-surface), 0.99) 0%, rgba(var(--v-theme-surface), 1) 100%);
}

/* HEADER */
.pc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;

  padding: 8px 10px;
  background:
    linear-gradient(
      180deg,
      rgba(var(--v-theme-primary), 0.035) 0%,
      rgba(var(--v-theme-surface), 0.98) 100%
    );
}

.pc-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1 1 auto;
}

.pc-ico {
  flex: 0 0 auto;
  opacity: 0.88;
}

.pc-title-wrap {
  min-width: 0;
  flex: 1 1 auto;
}

.pc-title {
  font-size: 13px;
  line-height: 1.1;
  font-weight: 900;
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pc-chip {
  flex: 0 0 auto;
  max-width: 110px;
  min-height: 20px;
  border-radius: 999px !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.09);
}

.pc-clear {
  flex: 0 0 auto;
  min-width: auto !important;
  height: 28px !important;
  padding-inline: 8px !important;
  border-radius: 10px !important;
  font-size: 11px !important;
  font-weight: 800 !important;
  letter-spacing: 0.01em;
  text-transform: none !important;
  white-space: nowrap;
}

.pc-divider {
  height: 1px;
  background: rgba(var(--v-theme-on-surface), 0.08);
}

/* BODY */
.pc-body {
  padding: 8px 10px 10px;
}

.pc-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.pc-span-2 {
  grid-column: 1 / -1;
}

/* FIELDS */
.pc-field {
  min-width: 0;
}

.pc-field :deep(.v-field) {
  border-radius: 12px !important;
  background: rgba(var(--v-theme-background), 0.16);
  transition:
    box-shadow 0.16s ease,
    border-color 0.16s ease,
    background-color 0.16s ease;
}

:global(.v-theme--light) .pc-field :deep(.v-field) {
  background: rgba(var(--v-theme-background), 0.24);
}

:global(.v-theme--dark) .pc-field :deep(.v-field) {
  background: rgba(255, 255, 255, 0.015);
}

.pc-field :deep(.v-field__outline) {
  opacity: 1 !important;
}

.pc-field :deep(.v-field__prepend-inner) {
  padding-inline-end: 7px;
}

.pc-field :deep(.v-field__prepend-inner .v-icon) {
  opacity: 0.86;
  font-size: 16px;
}

.pc-field :deep(.v-label) {
  font-size: 12px;
}

.pc-field :deep(.v-field__input) {
  min-height: 34px;
  padding-top: 4px;
  padding-bottom: 4px;
  font-size: 13px;
}

.pc-field :deep(input) {
  font-size: 13px;
}

.pc-field :deep(.v-field--focused) {
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.10);
}

/* NOTEBOOK */
@media (max-width: 1366px) {
  .pc-head {
    padding: 7px 9px;
  }

  .pc-body {
    padding: 7px 9px 9px;
  }

  .pc-grid {
    gap: 7px;
  }

  .pc-title {
    font-size: 13px;
  }

  .pc-field :deep(.v-field__input) {
    min-height: 32px;
    font-size: 12px;
  }

  .pc-field :deep(input) {
    font-size: 12px;
  }

  .pc-clear {
    height: 26px !important;
    font-size: 11px !important;
    padding-inline: 7px !important;
  }
}

/* MOBILE */
@media (max-width: 420px) {
  .pc-grid {
    grid-template-columns: 1fr;
  }

  .pc-span-2 {
    grid-column: auto;
  }
}

@media (max-width: 380px) {
  .pc-head {
    flex-wrap: wrap;
    row-gap: 6px;
  }

  .pc-clear {
    margin-left: auto;
  }

  .pc-chip {
    max-width: 92px;
  }
}
</style>