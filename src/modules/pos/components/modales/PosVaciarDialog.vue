<!-- src/modules/pos/components/modales/PosVaciarDialog.vue -->
<!-- F8 Vaciar carrito: pregunta y vacía con Enter; Esc deja todo como está. -->
<template>
  <PosModal
    :model-value="modelValue"
    titulo="Vaciar carrito"
    tecla="F8"
    icono="mdi-backspace-outline"
    :ancho="560"
    accion="Vaciar"
    accion-icono="mdi-delete-outline"
    tono="rojo"
    @update:model-value="emit('update:modelValue', $event)"
    @accion="vaciar"
  >
    <div class="pv">
      <span class="pv-ic"><v-icon size="40">mdi-cart-remove</v-icon></span>
      <span class="pv-tit">¿Vaciar el carrito?</span>
      <span class="pv-sub num">{{ items.length }} {{ items.length === 1 ? "producto" : "productos" }} · {{ unidades }} {{ unidades === 1 ? "unidad" : "unidades" }} · {{ pesos(total) }}</span>
    </div>
    <template #pie>
      <button type="button" class="pm-esc" @click="emit('update:modelValue', false)">No<span class="tk">Esc</span></button>
    </template>
  </PosModal>
</template>

<script setup>
import { computed } from "vue";
import PosModal from "./PosModal.vue";
import { useTeclasModal } from "../../composables/useTeclasModal";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  posStore: { type: Object, required: true },
});
const emit = defineEmits(["update:modelValue", "vaciado"]);

const abierto = computed(() => props.modelValue);
const items = computed(() => props.posStore?.cart || []);
const total = computed(() => items.value.reduce((a, it) => a + Number(it.subtotal || 0), 0));
const unidades = computed(() => items.value.reduce((a, it) => a + Number(it.qty || 0), 0));
const pesos = (n) => `$ ${Math.round(Number(n || 0)).toLocaleString("es-AR")}`;

function vaciar() {
  props.posStore.clearCart();
  emit("vaciado");
  emit("update:modelValue", false);
}

useTeclasModal(abierto, (e) => {
  if (e.key === "Enter") { vaciar(); return true; }
  return false;
});
</script>

<style>
.pv { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 28px 28px 22px; text-align: center; }
.pv-ic { width: 72px; height: 72px; border-radius: 9999px; background: #fdeceb; display: flex; align-items: center; justify-content: center; }
.pv-ic .v-icon { color: #c2413a; }
.pv-tit { font-size: 24px; font-weight: 900; }
.pv-sub { font-size: 16px; font-weight: 600; color: #5a6678; }
</style>
