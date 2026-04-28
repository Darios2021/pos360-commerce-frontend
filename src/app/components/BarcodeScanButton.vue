<!--
  BarcodeScanButton — Botón compacto para escanear código de barras.

  Solo se renderiza en mobile (donde tiene sentido aprovechar la cámara
  del teléfono). En desktop queda oculto. Útil para integrarlo en
  formularios de carga rápida (productos, derivaciones, inventario, etc.)
  donde el usuario quiere ahorrarse tipear el código.

  Uso:
    <BarcodeScanButton
      mode="emit-code"
      label="Escanear código"
      title="Lector"
      @scanned="onCode"
    />

    <BarcodeScanButton
      mode="emit-product"
      @product="onProduct"
    />

  Props:
    - mode: "emit-code" | "emit-product" (default "emit-code")
    - label: texto del botón (default "Escanear")
    - icon: icono inicial (default "mdi-barcode-scan")
    - block: si toma el ancho completo (default false)
    - color: color del botón (default "primary")
    - variant: variante del v-btn (default "tonal")
    - desktopHidden: oculta en >sm (default true)

  Eventos:
    - @scanned (code: string)
    - @product (productOrNull) — solo en mode="emit-product"
-->
<template>
  <template v-if="visible">
    <v-btn
      :color="color"
      :variant="variant"
      :block="block"
      :size="size"
      rounded="lg"
      :prepend-icon="icon"
      @click="open = true"
    >
      {{ label }}
    </v-btn>

    <BarcodeScannerDialog
      v-model="open"
      :mode="mode"
      :title="title"
      :continuous="continuous"
      @scanned="onScanned"
      @product="onProduct"
    />
  </template>
</template>

<script setup>
import { computed, ref } from "vue";
import { useDisplay } from "vuetify";
import BarcodeScannerDialog from "./BarcodeScannerDialog.vue";

const props = defineProps({
  mode:          { type: String,  default: "emit-code" },
  label:         { type: String,  default: "Escanear" },
  title:         { type: String,  default: "Lector de código" },
  icon:          { type: String,  default: "mdi-barcode-scan" },
  block:         { type: Boolean, default: false },
  color:         { type: String,  default: "primary" },
  variant:       { type: String,  default: "tonal" },
  size:          { type: String,  default: "default" },
  /** Si true, el botón solo se muestra en mobile. */
  desktopHidden: { type: Boolean, default: true },
  /** Si true, el dialog NO se cierra al detectar (modo armar paquete). */
  continuous:    { type: Boolean, default: false },
});

const emit = defineEmits(["scanned", "product"]);

const { mobile } = useDisplay();
const open = ref(false);

const visible = computed(() => {
  if (!props.desktopHidden) return true;
  return mobile.value;
});

function onScanned(code) {
  emit("scanned", code);
}
function onProduct(p) {
  emit("product", p);
}
</script>
