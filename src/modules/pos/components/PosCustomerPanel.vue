<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/pos/components/PosCustomerPanel.vue -->
<template>
  <v-card class="pos-surface pc" rounded="xl">
    <div class="pc-head">
      <div class="pc-left">
        <v-icon size="18" class="pc-ico">mdi-account</v-icon>

        <div class="pc-title-wrap">
          <div class="pc-title">Datos del cliente</div>
        </div>

        <v-chip size="x-small" label variant="tonal" class="pc-chip">
          {{ hasData ? "cargado" : "opcional" }}
        </v-chip>
      </div>

      <!-- ✅ desktop: texto / mobile: icon only -->
      <v-btn
        class="pc-clear text-medium-emphasis"
        :size="isXs ? 'small' : 'small'"
        :variant="isXs ? 'text' : 'text'"
        :disabled="disabled || !hasData"
        @click="$emit('clear')"
        title="Limpiar datos"
      >
        <v-icon :start="!isXs" size="18">mdi-eraser</v-icon>
        <span v-if="!isXs">Limpiar</span>
      </v-btn>
    </div>

    <v-divider />

    <div class="pc-body">
      <div class="pc-inner">
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
  </v-card>
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

/* ✅ responsive sin Vuetify useDisplay (simple & robust) */
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
  return vw.value <= 420 ? "compact" : "comfortable";
});
</script>

<style scoped>
/* ✅ clave: no recortar outlines */
.pc {
  overflow: visible !important;
}
.pc :deep(.v-card) {
  overflow: visible !important;
}

/* ✅ HEADER responsive (no se rompe) */
.pc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  padding: 10px 12px;

  background: linear-gradient(
    180deg,
    color-mix(in srgb, rgb(var(--v-theme-surface)) 92%, rgb(var(--v-theme-primary)) 8%),
    rgb(var(--v-theme-surface))
  );
}

:global(.v-theme--dark) .pc-head {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, rgb(var(--v-theme-surface)) 92%, rgb(var(--v-theme-primary)) 10%),
    rgb(var(--v-theme-surface))
  );
}

/* left pack */
.pc-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0; /* ✅ permite ellipsis */
  flex: 1 1 auto;
}

.pc-ico {
  flex: 0 0 auto;
  opacity: 0.9;
}

.pc-title-wrap {
  min-width: 0;
  flex: 1 1 auto;
}

.pc-title {
  font-weight: 950;
  letter-spacing: 0.2px;
  line-height: 1.05;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* chip nunca se achica raro */
.pc-chip {
  flex: 0 0 auto;
  max-width: 120px;
  border: 1px solid color-mix(in srgb, rgb(var(--v-theme-on-surface)) 18%, transparent);
}

/* botón a la derecha */
.pc-clear {
  flex: 0 0 auto;
  font-weight: 900;
  letter-spacing: 0.2px;
  white-space: nowrap;
}

/* ✅ en pantallas muy chicas: permitir wrap del header sin romper */
@media (max-width: 380px) {
  .pc-head {
    flex-wrap: wrap;
    row-gap: 8px;
  }
  .pc-clear {
    margin-left: auto;
  }
  .pc-chip {
    max-width: 96px;
  }
}

/* body + inner padding real */
.pc-body {
  padding: 10px 10px 8px;
  overflow: visible;
}
.pc-inner {
  padding: 2px;
  overflow: visible;
}

/* grid */
.pc-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.pc-span-2 {
  grid-column: 1 / -1;
}

.pc-field :deep(.v-field) {
  border-radius: 12px !important;
}
.pc-field :deep(.v-field__outline) {
  opacity: 1 !important;
}
.pc-field :deep(.v-field__prepend-inner) {
  padding-inline-end: 8px;
}
.pc-field :deep(.v-field__prepend-inner .v-icon) {
  opacity: 0.9;
}

/* mobile 1 col */
@media (max-width: 420px) {
  .pc-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .pc-span-2 {
    grid-column: auto;
  }
}

.pc-foot {
  padding-top: 8px;
}
</style>