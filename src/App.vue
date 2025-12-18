<template>
  <component :is="layoutComponent" />
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import AppShell from "./app/layouts/AppShell.vue";
import AuthLayout from "./app/layouts/AuthLayout.vue";

const route = useRoute();

// Ocultamos shell en login (y cualquier /auth/*)
const layoutComponent = computed(() => {
  const p = String(route.path || "");
  if (p.startsWith("/auth")) return AuthLayout;
  return AppShell;
});
</script>
