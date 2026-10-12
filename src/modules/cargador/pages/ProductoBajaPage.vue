<!-- Dar de baja un producto: vista completa con un botón rojo (nada sensible en ventanas). -->
<template>
  <MovilVista titulo="Dar de baja" :volver="{ name: 'productEdit', params: { id: route.params.id } }">
    <div v-if="p" class="m-pz">
      <div class="m-pz-b m-pz-b--top">
        <div style="font-size: 19px; font-weight: 800">{{ p.name }}</div>
        <div class="m-sub num">{{ [p.barcode || p.sku, p.category?.name].filter(Boolean).join(" · ") }}</div>
        <dl class="m-dl" style="margin-top: 12px">
          <dt>Stock total</dt><dd class="num">{{ u(p.stock_total ?? p.stock_qty ?? 0) }}</dd>
        </dl>
      </div>
    </div>
    <div v-if="error" class="m-error">{{ error }}</div>
    <template #pie>
      <button type="button" class="m-btn rojo" :disabled="!p || enviando" @click="dar">Dar de baja el producto</button>
    </template>
  </MovilVista>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import MovilVista from "@/app/components/movil/MovilVista.vue";
import { useProductsStore } from "@/app/store/products.store";
import { u } from "../lib/formato";
import { avisar } from "../lib/aviso";

const route = useRoute();
const router = useRouter();
const products = useProductsStore();
const p = ref(null);
const error = ref("");
const enviando = ref(false);

async function dar() {
  enviando.value = true;
  error.value = "";
  try {
    const r = await products.remove(route.params.id);
    if (r !== true) { error.value = r?.message || "No se pudo dar de baja"; return; }
    avisar("Producto dado de baja");
    router.replace({ name: "products" });
  } finally {
    enviando.value = false;
  }
}

onMounted(async () => { p.value = await products.fetchOne(route.params.id, { force: true }); });
</script>
