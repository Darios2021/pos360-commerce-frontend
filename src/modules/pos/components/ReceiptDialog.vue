<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/pos/components/ReceiptDialog.vue -->
<template>
  <v-dialog
    v-model="localOpen"
    max-width="520"
    scrollable
    @click:outside="close"
    @keydown.esc="close"
  >
    <v-card class="rounded-xl">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="text-subtitle-1 font-weight-black">Comprobante</div>
        <v-btn icon variant="text" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text style="max-height: 70vh">
        <div v-if="!sale" class="text-medium-emphasis">Sin venta seleccionada</div>

        <div v-else>
          <!-- 🔽 tu contenido real del ticket acá -->
          <div class="text-caption text-medium-emphasis">Venta #{{ sale.id }}</div>
          <!-- ... -->
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="justify-end">
        <v-btn variant="tonal" @click="close">
          <v-icon start>mdi-close</v-icon>
          Cerrar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  open: { type: Boolean, default: false },
  sale: { type: Object, default: null },
});

const emit = defineEmits(["update:open"]);

const localOpen = ref(!!props.open);

/**
 * ✅ Importante:
 * - SI sincronizamos props -> local, PERO
 * - NUNCA emitimos update:open desde este watch (eso genera loop)
 */
watch(
  () => props.open,
  (v) => {
    localOpen.value = !!v;
  }
);

/**
 * ✅ Este watch solo emite cuando el usuario cierra/abre el diálogo (v-model)
 * y además evita emitir si no cambió realmente el estado del parent.
 */
watch(localOpen, (v) => {
  const nv = !!v;
  if (nv === !!props.open) return;
  emit("update:open", nv);
});

function close() {
  localOpen.value = false;
}
</script>