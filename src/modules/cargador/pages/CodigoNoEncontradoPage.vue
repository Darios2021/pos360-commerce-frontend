<!-- Código no encontrado (maqueta). El dueño crea el producto con el código cargado. -->
<template>
  <MovilVista titulo="Código no encontrado" :volver="{ name: 'home' }">
    <div class="m-pz">
      <div class="m-pz-b">
        <div class="m-codigo-grande num">{{ codigo }}</div>
        <div class="m-barras" aria-hidden="true"></div>
        <div class="m-centro" style="margin-top: 12px"><span class="m-est gr">Sin producto con este código</span></div>
      </div>
    </div>
    <template v-if="esAdmin">
      <router-link :to="{ name: 'productNew', query: { codigo } }" replace class="m-btn">Crear producto</router-link>
      <div class="m-centro"><router-link :to="{ name: 'lector' }" replace class="m-lnk">Escanear otro</router-link></div>
    </template>
    <router-link v-else :to="{ name: 'lector' }" replace class="m-btn">Escanear otro</router-link>
  </MovilVista>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import MovilVista from "@/app/components/movil/MovilVista.vue";
import { useAuthStore } from "@/app/store/auth.store";

const route = useRoute();
const auth = useAuthStore();
const codigo = computed(() => String(route.params.codigo || ""));
const esAdmin = computed(() => auth.isAdmin === true);
</script>
