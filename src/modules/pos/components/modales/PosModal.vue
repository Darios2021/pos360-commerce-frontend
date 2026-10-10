<!-- src/modules/pos/components/modales/PosModal.vue -->
<!-- Marco común de las ventanas de la barra de teclas del POS (maqueta
     aprobada 10/10): banda azul con título y la tecla F, "Cerrar Esc" a la
     derecha, cuerpo y pie con un único botón grande que confirma con Enter. -->
<template>
  <v-dialog
    :model-value="modelValue"
    :max-width="ancho"
    scrollable
    class="pm-dialogo"
    @update:model-value="emit('update:modelValue', $event)"
    @after-enter="emit('abierto')"
  >
    <section class="pm" role="dialog" :aria-label="titulo">
      <header class="pm-cab">
        <v-icon size="26">{{ icono }}</v-icon>
        <span class="pm-cab__txt">
          <span class="pm-cab__tit">{{ titulo }}</span>
          <span v-if="sub" class="pm-cab__sub num">{{ sub }}</span>
        </span>
        <span v-if="tecla" class="tk tk--w">{{ tecla }}</span>
        <button type="button" class="pm-cerrar" @click="emit('update:modelValue', false)">
          Cerrar<span class="tk tk--w">Esc</span>
        </button>
      </header>
      <div class="pm-cuerpo"><slot /></div>
      <footer v-if="$slots.pie || accion" class="pm-pie">
        <slot name="pie" />
        <button
          v-if="accion"
          type="button"
          class="pm-btn"
          :class="`pm-btn--${tono}`"
          :disabled="accionDeshabilitada || cargando"
          @click="emit('accion')"
        >
          <v-progress-circular v-if="cargando" indeterminate size="22" width="3" />
          <v-icon v-else-if="accionIcono" size="24">{{ accionIcono }}</v-icon>
          {{ accion }}
          <span class="tk tk--w">{{ accionTecla }}</span>
        </button>
      </footer>
    </section>
  </v-dialog>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  titulo: { type: String, required: true },
  sub: { type: String, default: "" },
  tecla: { type: String, default: "" },
  icono: { type: String, default: "mdi-window-maximize" },
  ancho: { type: [Number, String], default: 900 },
  accion: { type: String, default: "" },
  accionIcono: { type: String, default: "" },
  accionTecla: { type: String, default: "Enter" },
  accionDeshabilitada: { type: Boolean, default: false },
  cargando: { type: Boolean, default: false },
  tono: { type: String, default: "azul" },
});
const emit = defineEmits(["update:modelValue", "accion", "abierto"]);
</script>

<style>
.pm-dialogo .v-overlay__scrim { background: rgb(11, 42, 69) !important; opacity: 0.58 !important; }
.pm { display: flex; flex-direction: column; max-height: calc(100vh - 48px); border-radius: 14px; overflow: hidden; background: #ffffff; color: #0f172a; font-family: Inter, sans-serif; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35); }
.pm .num { font-variant-numeric: tabular-nums; }
.pm-cab { display: flex; align-items: center; gap: 12px; padding: 14px 16px 14px 22px; background: #0f6fae; color: #ffffff; flex-shrink: 0; }
.pm-cab .v-icon { color: #ffffff; }
.pm-cab__txt { display: flex; flex-direction: column; min-width: 0; }
.pm-cab__tit { font-size: 20px; font-weight: 800; letter-spacing: -0.01em; }
.pm-cab__sub { font-size: 13px; font-weight: 600; color: rgba(255, 255, 255, 0.85); }
.pm-cerrar { margin-left: auto; display: flex; align-items: center; gap: 8px; border: 0; background: transparent; color: rgba(255, 255, 255, 0.92); font: 700 14px Inter, sans-serif; cursor: pointer; padding: 6px 8px; border-radius: 8px; }
.pm-cerrar:hover { background: rgba(255, 255, 255, 0.14); }
.pm-cuerpo { flex: 1; min-height: 0; overflow-y: auto; }
.pm-pie { display: flex; align-items: center; gap: 16px; padding: 16px 22px; border-top: 1px solid #e3eaf1; background: #f8fbfd; flex-shrink: 0; }
.pm-btn { height: 60px; display: flex; align-items: center; justify-content: center; gap: 12px; padding: 0 26px; margin-left: auto; min-width: 280px; border: 0; border-radius: 12px; color: #ffffff; font: 800 18px Inter, sans-serif; cursor: pointer; transition: filter 120ms ease, transform 120ms ease; }
.pm-btn .v-icon { color: #ffffff; }
.pm-btn:hover:not(:disabled) { filter: brightness(1.08); }
.pm-btn:active:not(:disabled) { transform: scale(0.98); }
.pm-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.pm-btn--azul { background: #0f6fae; box-shadow: 0 6px 16px rgba(15, 111, 174, 0.28); }
.pm-btn--rojo { background: #c2413a; box-shadow: 0 6px 16px rgba(194, 65, 58, 0.28); }
.pm-btn--verde { background: #2e9e7b; box-shadow: 0 6px 16px rgba(46, 158, 123, 0.3); }

/* La tecla dibujada */
.tk { display: inline-flex; align-items: center; justify-content: center; min-width: 28px; height: 26px; padding: 0 7px; box-sizing: border-box; border-radius: 6px; border: 1px solid rgba(100, 116, 139, 0.6); background: linear-gradient(#f8fafc, #cbd5e1); box-shadow: 0 2px 0 rgba(15, 23, 42, 0.45); color: #1e293b; font: 900 13px ui-monospace, Menlo, Consolas, monospace; flex-shrink: 0; }
.tk--w { background: rgba(255, 255, 255, 0.18); border-color: rgba(255, 255, 255, 0.55); box-shadow: 0 2px 0 rgba(0, 0, 0, 0.25); color: #ffffff; }

/* Piezas que repiten las ventanas */
.pm-lab { font-size: 12px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: #5a6678; }
.pm-in { height: 64px; display: flex; align-items: center; gap: 10px; padding: 0 16px; border-radius: 12px; border: 2px solid #0f6fae; box-shadow: 0 0 0 4px rgba(15, 111, 174, 0.14); background: #ffffff; box-sizing: border-box; }
.pm-in input { flex: 1; min-width: 0; height: 100%; border: 0; outline: 0; background: transparent; font: 700 20px Inter, sans-serif; color: #0f172a; }
.pm-in--monto input { font-size: 34px; font-weight: 900; font-variant-numeric: tabular-nums; }
.pm-in .v-icon { color: #0f6fae; }
.pm-op { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; padding: 14px; border-radius: 12px; border: 1px solid #d3dde7; background: #ffffff; box-sizing: border-box; text-align: left; font-family: Inter, sans-serif; color: #0f172a; cursor: pointer; transition: background-color 120ms ease, box-shadow 120ms ease, border-color 120ms ease; }
.pm-op:hover { background: #cfe5f5; border-color: #3f8fc6; }
.pm-op.is-on { border: 2px solid #0f6fae; background: #eef7fd; box-shadow: 0 0 0 4px rgba(15, 111, 174, 0.12); }
.pm-fila { display: flex; align-items: center; gap: 14px; padding: 10px 14px; border-radius: 12px; border: 2px solid transparent; cursor: pointer; transition: background-color 120ms ease; }
.pm-fila:hover { background: #f3f8fc; }
.pm-fila.is-on { background: #eef7fd; border-color: #0f6fae; }
.pm-foto { width: 56px; height: 56px; flex-shrink: 0; border-radius: 10px; border: 1px solid #e3eaf1; background: #ffffff; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.pm-foto img { width: 100%; height: 100%; object-fit: contain; }
.pm-foto .v-icon { color: #b7c4d3; }
.pm-c1 { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pm-vacio { padding: 36px 16px; text-align: center; font-size: 15px; font-weight: 600; color: #5a6678; }
.pm-stock { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: #5a6678; }
.pm-stock i { width: 8px; height: 8px; border-radius: 9999px; background: #c3c9d6; }
.pm-stock.ok { color: #1f7a5f; }
.pm-stock.ok i { background: #2e9e7b; }
.pm-stock.poco i { background: #8cc0e3; }
.pm-cant { display: flex; align-items: center; gap: 6px; }
.pm-cant button { width: 36px; height: 36px; border-radius: 10px; border: 1px solid #c9d5e1; background: #ffffff; font: 900 20px Inter, sans-serif; color: #0f172a; cursor: pointer; }
.pm-cant button:hover { background: #cfe5f5; border-color: #3f8fc6; }
.pm-cant span { min-width: 40px; text-align: center; font-size: 20px; font-weight: 900; }
.pm-aside { width: 330px; flex-shrink: 0; border-left: 1px solid #e3eaf1; background: #f8fbfd; display: flex; flex-direction: column; }
.pm-dl { display: grid; grid-template-columns: 1fr auto; gap: 10px 16px; margin: 0; padding: 14px 16px; font-size: 15px; }
.pm-dl dt { color: #5a6678; font-weight: 600; }
.pm-dl dd { margin: 0; font-weight: 800; text-align: right; }
.pm-esc { display: flex; align-items: center; gap: 8px; border: 0; background: transparent; font: 700 15px Inter, sans-serif; color: #5a6678; cursor: pointer; }
</style>
