<!--
  Inicio: en el teléfono el Inicio del cargador (maqueta diseno-cargador);
  en escritorio el tablero de siempre (DashboardHome), sin cambios.
-->
<template>
  <InicioCargador v-if="mobile" />
  <DashboardHome v-else />
</template>

<script setup>
import { defineAsyncComponent } from "vue";
import { useDisplay } from "vuetify";

const DashboardHome = defineAsyncComponent(() => import("@/modules/dashboard/pages/DashboardHome.vue"));
const InicioCargador = defineAsyncComponent(() => import("../components/InicioCargador.vue"));
const { mobile } = useDisplay();
</script>
