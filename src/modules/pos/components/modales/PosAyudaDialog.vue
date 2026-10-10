<!-- src/modules/pos/components/modales/PosAyudaDialog.vue -->
<!-- F1 Teclas del POS: las mismas de la barra y en el mismo orden (de más a
     menos usada), más las que valen en todas las ventanas. -->
<template>
  <PosModal
    :model-value="modelValue"
    titulo="Teclas del POS"
    tecla="F1"
    icono="mdi-keyboard-outline"
    :ancho="1000"
    accion="Entendido"
    @update:model-value="emit('update:modelValue', $event)"
    @accion="emit('update:modelValue', false)"
  >
    <div class="pa">
      <div class="pa-grilla">
        <div v-for="s in POS_SHORTCUTS" :key="s.key" class="pa-tecla" :class="{ 'is-clave': s.clave }">
          <span class="tk pa-tk">{{ s.key }}</span>
          <span class="pa-txt"><b>{{ s.label }}</b><small>{{ s.description }}</small></span>
        </div>
      </div>
      <span class="pm-lab">En todas las ventanas</span>
      <div class="pa-gen">
        <span><span class="tk">Enter</span>confirma</span>
        <span><span class="tk">Esc</span>cierra</span>
        <span><span class="tk">↑</span><span class="tk">↓</span>recorre</span>
        <span><span class="tk">+</span><span class="tk">−</span>cantidad</span>
      </div>
    </div>
  </PosModal>
</template>

<script setup>
import { computed } from "vue";
import PosModal from "./PosModal.vue";
import { POS_SHORTCUTS } from "../../config/posShortcuts.config";
import { useTeclasModal } from "../../composables/useTeclasModal";

const props = defineProps({ modelValue: { type: Boolean, default: false } });
const emit = defineEmits(["update:modelValue"]);
const abierto = computed(() => props.modelValue);
useTeclasModal(abierto, (e) => {
  if (e.key === "Enter") { emit("update:modelValue", false); return true; }
  return false;
});
</script>

<style>
.pa { display: flex; flex-direction: column; gap: 16px; padding: 20px 22px; }
.pa-grilla { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.pa-tecla { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 12px; border: 1px solid #d3dde7; }
.pa-tecla.is-clave { background: #eef7fd; border-color: #8cc0e3; }
.pa-tk { min-width: 44px !important; height: 32px !important; font-size: 15px !important; }
.pa-txt { display: flex; flex-direction: column; min-width: 0; }
.pa-txt b { font-size: 16px; font-weight: 800; }
.pa-txt small { font-size: 12px; color: #5a6678; }
.pa-gen { display: flex; gap: 22px; flex-wrap: wrap; }
.pa-gen > span { display: inline-flex; align-items: center; gap: 6px; font-size: 15px; font-weight: 700; }
</style>
