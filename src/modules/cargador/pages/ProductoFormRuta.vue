<!--
  Nuevo / Editar producto: en el teléfono la vista única del cargador
  (ProductoFormMovil, maqueta diseno-cargador); en escritorio el formulario de
  siempre (ProductFormPage), sin cambios. Se elige acá para que el formulario
  de escritorio no se monte (ni cargue) en el teléfono.
-->
<template>
  <ProductoFormMovil v-if="mobile" :key="'m' + clave" />
  <ProductFormPage v-else :key="'e' + clave" />
</template>

<script setup>
import { computed, defineAsyncComponent } from "vue";
import { useRoute } from "vue-router";
import { useDisplay } from "vuetify";

const ProductFormPage = defineAsyncComponent(() => import("@/modules/products/pages/ProductFormPage.vue"));
const ProductoFormMovil = defineAsyncComponent(() => import("./ProductoFormMovil.vue"));

const { mobile } = useDisplay();
const route = useRoute();
const clave = computed(() => String(route.params.id || "nuevo"));
</script>
