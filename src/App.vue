<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/App.vue -->
<template>
  <div :class="rootScopeClass">
    <router-view />
    <AppVersionAviso v-if="rootScopeClass === 'scope-app'" />
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import AppVersionAviso from "@/app/components/AppVersionAviso.vue";

const route = useRoute();

/**
 * ✅ AISLAMIENTO:
 * - Backoffice vive en /app
 * - Ecommerce vive en / o /shop
 */
const rootScopeClass = computed(() => {
  const p = String(route.path || "");
  if (p.startsWith("/app")) return "scope-app";
  return "scope-shop";
});
</script>

<style scoped>
.scope-app,
.scope-shop {
  min-height: 100vh;
}
</style>