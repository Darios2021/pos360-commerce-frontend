<!--
  MovilVista: marco de las vistas completas del teléfono (rediseño aprobado).
  Banda azul de 56 px con flecha de volver (o cerrar) y el título, cuerpo con
  scroll sobre el canvas y un pie fijo opcional con el único botón de acción.
  Estas rutas llevan meta.movilCompleta: AppShell oculta su barra superior y
  la barra inferior mientras están abiertas.
-->
<template>
  <div class="mv m-vista">
    <header class="mv-tb" :class="{ 'mv-tb--atras': !!volver || cerrar || manual }">
      <button
        v-if="volver || cerrar || manual"
        type="button"
        class="mv-ib"
        :aria-label="cerrar ? 'Cerrar' : 'Volver'"
        @click="irAtras"
      >
        <v-icon size="24">{{ cerrar ? "mdi-close" : "mdi-chevron-left" }}</v-icon>
      </button>
      <h2 class="mv-tit">{{ titulo }}</h2>
      <slot name="barra" />
    </header>
    <slot name="arriba" />
    <div ref="cuerpo" class="m-cu" :class="cuerpoClase">
      <slot />
    </div>
    <footer v-if="$slots.pie" class="m-pie">
      <slot name="pie" />
    </footer>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const props = defineProps({
  titulo: { type: String, required: true },
  // Ruta de respaldo si no hay historial (entrada directa por URL).
  volver: { type: [Object, String], default: null },
  // Cruz en lugar de flecha (Venta registrada).
  cerrar: { type: Boolean, default: false },
  cuerpoClase: { type: [String, Object, Array], default: "" },
  // La vista maneja la flecha (pasos internos): sólo se emite "volver".
  manual: { type: Boolean, default: false },
});
const emit = defineEmits(["volver"]);
const router = useRouter();
const cuerpo = ref(null);

function irAtras() {
  emit("volver");
  if (props.manual) return;
  if (props.cerrar && props.volver) {
    router.replace(props.volver);
    return;
  }
  if (window.history.state?.back) router.back();
  else if (props.volver) router.replace(props.volver);
}

defineExpose({ cuerpo });
</script>

<style>
/* Fija al viewport: el alto no depende del contenido ni de 100dvh (que en
   algunos navegadores incluye la barra de direcciones y empuja el pie). */
.mv {
  position: fixed;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
.mv-tb {
  height: 56px;
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 8px 0 16px;
  padding-top: env(safe-area-inset-top, 0px);
  box-sizing: content-box;
  background: var(--m-banda);
  color: var(--m-banda-ink);
}
.mv-tb--atras { padding-left: 4px; }
.mv-tit {
  font-size: 19px;
  font-weight: 700;
  flex: 1;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.01em;
}
</style>
