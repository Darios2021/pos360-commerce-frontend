<!--
  Venta en curso (teléfono, maqueta pantalla 5). Reemplaza la hoja del carrito
  de PosMobileLayout. Ítems con stepper −/+ (en 1 el − quita), cliente y
  precio, y un pie con el total y Cobrar. El carrito vive en pos.store.
-->
<template>
  <MovilVista titulo="Venta en curso" :volver="{ name: 'pos' }">
    <template #barra>
      <button v-if="items.length" type="button" class="mv-ib" aria-label="Vaciar" @click="vaciar">
        <v-icon size="24">mdi-close</v-icon>
      </button>
    </template>

    <div class="m-pz">
      <div v-if="!items.length" class="m-it"><span class="tx"><b>Sin artículos</b></span></div>
      <div v-for="it in items" :key="it.id" class="m-it vc-it">
        <span class="m-foto">
          <img v-if="it.image" :src="it.image" alt="" loading="lazy" />
          <v-icon v-else size="24">mdi-package-variant-closed</v-icon>
        </span>
        <span class="tx">
          <b>{{ it.name }}</b>
          <small class="num">{{ pesos(it.price) }}</small>
          <span class="m-stp vc-stp">
            <button type="button" :aria-label="Number(it.qty) === 1 ? 'Quitar' : 'Menos'" @click="posStore.decreaseQty(it.id)">
              <v-icon size="20">{{ Number(it.qty) === 1 ? "mdi-close" : "mdi-minus" }}</v-icon>
            </button>
            <span class="num">{{ cantidadTxt(it.qty) }}</span>
            <button type="button" aria-label="Más" @click="sumar(it)">
              <v-icon size="20">mdi-plus</v-icon>
            </button>
          </span>
        </span>
        <span class="der"><b class="num">{{ pesos(it.subtotal) }}</b></span>
      </div>
    </div>

    <div class="m-pz">
      <div class="m-pz-b m-pz-b--top">
        <dl class="m-dl">
          <dt>Cliente</dt><dd>{{ posStore.clienteVenta?.display_name || "Consumidor final" }}</dd>
          <dt>Precio</dt><dd>{{ posStore.precioMayoristaAplicado?.() ? "Revendedor" : "Lista" }}</dd>
        </dl>
      </div>
    </div>

    <template #pie>
      <div class="res"><span>{{ cantidadRotulo }}</span><b class="num">{{ pesos(total) }}</b></div>
      <router-link v-if="!isCajaOpen" :to="{ name: 'cajaAbrir' }" class="m-btn">Abrir caja</router-link>
      <button v-else type="button" class="m-btn" :disabled="!items.length" @click="openCheckoutSafe">Cobrar</button>
    </template>
  </MovilVista>
  <MovilAviso alto="140px" />
</template>

<script setup>
import { computed, watch } from "vue";
import MovilVista from "@/app/components/movil/MovilVista.vue";
import MovilAviso from "@/app/components/movil/MovilAviso.vue";
import { usePosSalesFlow } from "../../containers/usePosSalesFlow";
import { pesos } from "../../utils/cobroReglas";

const { posStore, cartItems, cartCount, isCajaOpen, openCheckoutSafe, toast } = usePosSalesFlow();

const items = computed(() => cartItems.value || []);
const total = computed(() => items.value.reduce((a, it) => a + Number(it.subtotal || 0), 0));
const cantidadRotulo = computed(() => (cartCount.value === 1 ? "1 artículo" : `${cantidadTxt(cartCount.value)} artículos`));

function cantidadTxt(n) {
  const v = Number(n || 0);
  return Number.isInteger(v) ? String(v) : v.toLocaleString("es-AR", { maximumFractionDigits: 3 });
}
function sumar(it) {
  posStore.increaseQty(it.id);
}
function vaciar() {
  posStore.clearCart();
}

// Avisos del store (stock insuficiente) en el aviso breve, sin emojis.
watch(
  () => posStore.toast?.show && posStore.toast?.text,
  (t) => {
    if (!t) return;
    toast(String(t).replace(/^[^\p{L}\p{N}$]+/u, "").trim());
    posStore.toast.show = false;
  }
);
</script>

<style scoped>
.vc-it { align-items: flex-start; }
.vc-stp { margin-top: 8px; width: max-content; }
</style>
