<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/pos/components/PosPickBranchDialog.vue -->

<template>
  <v-dialog v-model="openLocal" max-width="640">
    <v-card class="rounded-xl">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="text-subtitle-1 font-weight-bold">¿De qué sucursal sale?</div>
        <v-btn icon variant="text" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <div class="text-caption text-medium-emphasis mb-4">
          Este producto tiene stock en más de una sucursal. Elegí desde cuál se descuenta.
        </div>

        <v-select
          v-model="picked"
          :items="items"
          item-title="title"
          item-value="value"
          label="Sucursal"
          variant="outlined"
          density="comfortable"
        />

        <div v-if="touched && !picked" class="text-caption text-error mt-2">
          Seleccioná una sucursal para continuar.
        </div>
      </v-card-text>

      <v-card-actions class="px-6 pb-5">
        <v-spacer />
        <v-btn variant="tonal" @click="close">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" @click="confirm">Confirmar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  open: { type: Boolean, default: false },
  branches: { type: Array, default: () => [] }, // [{id,name,qty?}, ...]
});

const emit = defineEmits(["update:open", "confirm"]);

const openLocal = computed({
  get: () => !!props.open,
  set: (v) => emit("update:open", !!v),
});

const picked = ref(null);
const touched = ref(false);

const items = computed(() => {
  const arr = Array.isArray(props.branches) ? props.branches : [];
  return arr.map((b) => {
    const id = Number(b?.id || 0) || null;
    const name = String(b?.name || "").trim() || (id ? `Sucursal #${id}` : "Sucursal");
    const qty = Number(b?.qty || 0) || 0;
    return {
      title: qty > 0 ? `${name} (stk ${qty})` : name,
      value: id,
    };
  });
});

function close() {
  emit("update:open", false);
}

function confirm() {
  touched.value = true;
  const bid = Number(picked.value || 0) || null;
  if (!bid) return;
  emit("confirm", { branch_id: bid });
  emit("update:open", false);
}

watch(
  () => props.open,
  (v) => {
    if (v) {
      picked.value = null;
      touched.value = false;
    }
  }
);
</script>