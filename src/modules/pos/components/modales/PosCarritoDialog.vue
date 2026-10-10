<!-- src/modules/pos/components/modales/PosCarritoDialog.vue -->
<!-- F6 Carrito: flechas eligen, + y − cambian la cantidad, Supr quita la
     línea, Enter (o F9) va a cobrar. -->
<template>
  <PosModal
    :model-value="modelValue"
    titulo="Carrito"
    :sub="items.length ? `${items.length} ${items.length === 1 ? 'producto' : 'productos'}` : ''"
    tecla="F6"
    icono="mdi-cart-outline"
    :ancho="900"
    accion="Cobrar"
    accion-icono="mdi-cash-register"
    :accion-deshabilitada="!items.length"
    @update:model-value="emit('update:modelValue', $event)"
    @accion="emit('cobrar')"
  >
    <div v-if="!items.length" class="pm-vacio">El carrito está vacío</div>
    <template v-else>
      <div ref="listaRef" class="pc-lista">
        <div v-for="(it, i) in items" :key="it.id" class="pm-fila" :class="{ 'is-on': i === sel }" @click="sel = i">
          <span class="pm-foto"><img v-if="foto(it)" :src="foto(it)" alt="" /><v-icon v-else size="26">mdi-image-outline</v-icon></span>
          <span class="pc-txt">
            <span class="pc-nombre pm-c1">{{ it.name }}</span>
            <span class="pc-sub num">{{ pesos(it.unit_price ?? it.price) }} c/u<template v-if="it.sku"> · {{ it.sku }}</template></span>
          </span>
          <span class="pm-cant" @click.stop>
            <button type="button" @click="menos(it)">−</button>
            <span class="num">{{ it.qty }}</span>
            <button type="button" @click="mas(it)">+</button>
          </span>
          <span class="pc-total num">{{ pesos(it.subtotal) }}</span>
          <button type="button" class="pc-quitar" title="Quitar" @click.stop="quitar(it)"><v-icon size="20">mdi-trash-can-outline</v-icon></button>
        </div>
      </div>
      <div class="pc-suma">
        <span class="num">{{ unidades }} {{ unidades === 1 ? "unidad" : "unidades" }}</span>
        <b class="num">{{ pesos(total) }}</b>
      </div>
    </template>
  </PosModal>
</template>

<script setup>
import { computed, nextTick, ref, watch } from "vue";
import PosModal from "./PosModal.vue";
import { useTeclasModal, enCampo } from "../../composables/useTeclasModal";
import { usePosImages } from "../../composables/usePosImages";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  posStore: { type: Object, required: true },
});
const emit = defineEmits(["update:modelValue", "cobrar"]);

const { productImage } = usePosImages();
const abierto = computed(() => props.modelValue);
const listaRef = ref(null);
const sel = ref(0);
const items = computed(() => props.posStore?.cart || []);
const total = computed(() => items.value.reduce((a, it) => a + Number(it.subtotal || 0), 0));
const unidades = computed(() => items.value.reduce((a, it) => a + Number(it.qty || 0), 0));

const pesos = (n) => `$ ${Math.round(Number(n || 0)).toLocaleString("es-AR")}`;
const foto = (it) => it.image || productImage({ id: it.id });

function mas(it) { props.posStore.increaseQty(it.id); }
function menos(it) { props.posStore.decreaseQty(it.id); ajustar(); }
function quitar(it) {
  props.posStore.$patch((st) => { st.cart = st.cart.filter((x) => Number(x.id) !== Number(it.id)); });
  ajustar();
}
function ajustar() { nextTick(() => { sel.value = Math.min(sel.value, Math.max(0, items.value.length - 1)); }); }
function mover(d) {
  if (!items.value.length) return;
  sel.value = (sel.value + d + items.value.length) % items.value.length;
  nextTick(() => listaRef.value?.querySelector(".pm-fila.is-on")?.scrollIntoView({ block: "nearest" }));
}

watch(abierto, (v) => { if (v) sel.value = 0; });

useTeclasModal(abierto, (e) => {
  if (enCampo(e)) return false;
  const it = items.value[sel.value];
  if (e.key === "ArrowDown") { mover(1); return true; }
  if (e.key === "ArrowUp") { mover(-1); return true; }
  if (e.key === "+" && it) { mas(it); return true; }
  if (e.key === "-" && it) { menos(it); return true; }
  if ((e.key === "Delete" || e.key === "Supr") && it) { quitar(it); return true; }
  if (e.key === "Enter" && items.value.length) { emit("cobrar"); return true; }
  return false;
});
</script>

<style>
.pc-lista { display: flex; flex-direction: column; gap: 6px; padding: 16px 22px; max-height: 52vh; overflow-y: auto; }
.pc-txt { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.pc-nombre { font-size: 16px; font-weight: 800; }
.pc-sub { font-size: 13px; color: #5a6678; }
.pc-total { min-width: 120px; text-align: right; font-size: 20px; font-weight: 900; }
.pc-quitar { width: 40px; height: 40px; border-radius: 10px; border: 1px solid transparent; background: transparent; color: #a3322c; cursor: pointer; }
.pc-quitar:hover { background: #fdeceb; border-color: #f3c4c0; }
.pc-quitar .v-icon { color: #a3322c; }
.pc-suma { margin: 0 22px 18px; padding: 16px 18px; border-radius: 12px; background: #f1f5f9; display: flex; align-items: baseline; justify-content: space-between; }
.pc-suma span { font-size: 16px; font-weight: 800; }
.pc-suma b { font-size: 34px; font-weight: 900; }
</style>
