<!--
  Inicio: siempre DashboardHome. En el teléfono, DashboardHome muestra
  InicioMovil (banda del día y actividad, uno por perfil; plan del 2026-10-31);
  en escritorio, el tablero de siempre. InicioCargador (maqueta diseno-cargador,
  con Vender) quedó afuera: en el teléfono no se vende.
-->
<template>
  <DashboardHome />
</template>

<script setup>
import { defineAsyncComponent } from "vue";

const DashboardHome = defineAsyncComponent(() => import("@/modules/dashboard/pages/DashboardHome.vue"));
</script>
