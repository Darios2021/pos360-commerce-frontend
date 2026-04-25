<!--
  AppBackButton — Botón "Volver" estándar del sistema.

  ═══════════════════════════════════════════════════════════════════════════
  ESTÁNDAR DE NAVEGACIÓN HACIA ATRÁS (regla del sistema)
  ═══════════════════════════════════════════════════════════════════════════

  CUÁNDO USAR:
  - Detail views (ej. DER-2026-000014, Caja #55, Producto #123).
  - Form views (alta/edición inline sin ser dialog).
  - Sub-views profundas (hijos de settings, etc.).

  CUÁNDO NO USAR:
  - Páginas "root" de sección accesibles desde el sidebar
    (Dashboard, Usuarios, Productos, Cajas, POS, etc.).
    Esas se navegan por el menú lateral, NO necesitan back.
  - Dialogs / modals. Ellos tienen su propio botón cerrar (X).

  UBICACIÓN:
  - Siempre en la primera fila visible de la página, alineado a la izquierda.
  - Separado del resto del contenido con margin-bottom medio.

  COMPORTAMIENTO:
  - Si se pasa `to`: navega a esa ruta named.
  - Si no: router.back() cuando hay historia; sino navega al `fallback`.
  - El texto por default es "Volver" o "Volver a {label}".

  ESTILO (NO MODIFICAR — es el estándar):
  - variant="tonal", rounded="lg", size="small".
  - prepend-icon="mdi-arrow-left".
  - Hover conservador (no llama la atención contra el CTA principal).

  ═══════════════════════════════════════════════════════════════════════════
  USO TÍPICO
  ═══════════════════════════════════════════════════════════════════════════

  <AppBackButton />                                    // "Volver" (router.back)
  <AppBackButton label="Productos" />                  // "Volver a Productos"
  <AppBackButton :to="{ name: 'products' }" label="Productos" />
  <AppBackButton fallback="/app/products" />           // si no hay historia
-->
<template>
  <v-btn
    variant="tonal"
    size="small"
    rounded="lg"
    prepend-icon="mdi-arrow-left"
    class="app-back"
    :disabled="disabled"
    @click="handleClick"
  >
    {{ computedText }}
  </v-btn>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";

const props = defineProps({
  /** Texto descriptivo. Genera "Volver a {label}" si se especifica. */
  label: { type: String, default: "" },
  /** Ruta destino (string path o objeto `{ name, params }`). Si se pasa, navega ahí. */
  to: { type: [String, Object], default: null },
  /** Ruta fallback si no hay historia y no hay `to`. */
  fallback: { type: [String, Object], default: null },
  /** Si está en true emite evento `back` en lugar de navegar (uso en vistas embebidas). */
  emitOnly: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(["back"]);
const router = useRouter();

const computedText = computed(() => {
  if (!props.label) return "Volver";
  return `Volver a ${props.label}`;
});

function handleClick() {
  if (props.emitOnly) {
    emit("back");
    return;
  }

  if (props.to) {
    router.push(props.to);
    return;
  }

  // ¿Hay historia real para ir atrás?
  const hasHistory =
    typeof window !== "undefined" && window.history && window.history.length > 1;

  if (hasHistory) {
    router.back();
    return;
  }

  if (props.fallback) {
    router.push(props.fallback);
    return;
  }

  // Último recurso: raíz del app.
  router.push("/app");
}
</script>

<style scoped>
.app-back {
  font-weight: 600 !important;
  letter-spacing: 0 !important;
  text-transform: none !important;
}
</style>
