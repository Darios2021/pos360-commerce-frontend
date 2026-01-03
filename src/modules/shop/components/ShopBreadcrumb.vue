<!-- src/modules/shop/components/ShopBreadcrumb.vue -->
<template>
  <div class="crumbs">
    <v-breadcrumbs :items="items" density="comfortable">
      <template #title="{ item }">
        <span class="crumb-title">{{ item.title }}</span>
      </template>
      <template #divider>
        <v-icon size="16" class="mx-1">mdi-chevron-right</v-icon>
      </template>
    </v-breadcrumbs>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  product: { type: Object, default: null },
});

const items = computed(() => {
  const p = props.product || {};
  const categoryName = p?.category_name || p?.Category?.name || p?.category?.name || "Productos";

  // Si tenés ruta real a categoría, podés cambiar href por to.
  return [
    { title: "Inicio", to: "/" },
    { title: "Shop", to: "/shop" },
    { title: categoryName, to: "/shop" }, // si tenés /shop/category/:id, ponelo acá
    { title: p?.name || "Detalle", disabled: true },
  ];
});
</script>

<style scoped>
.crumbs {
  padding: 2px 0 8px;
}
.crumb-title {
  font-size: 13px;
}
</style>
