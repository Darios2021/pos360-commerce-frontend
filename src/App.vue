<!-- src/App.vue -->
<template>
  <component :is="layout">
    <router-view />
  </component>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

import AppShell from "./app/layouts/AppShell.vue";
import AuthLayout from "./app/layouts/AuthLayout.vue";

const route = useRoute();

// Si estás en /auth/* => AuthLayout, si no => AppShell
const layout = computed(() => {
  return route.path.startsWith("/auth") ? AuthLayout : AppShell;
});
</script>
