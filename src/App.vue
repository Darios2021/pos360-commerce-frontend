<!-- src/App.vue -->
<template>
  <component :is="layoutComponent">
    <router-view />
  </component>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

import AppShell from "./app/layouts/AppShell.vue";
import AuthLayout from "./app/layouts/AuthLayout.vue";

const route = useRoute();

const layoutComponent = computed(() => {
  return route.meta?.layout === "auth" ? AuthLayout : AppShell;
});
</script>
