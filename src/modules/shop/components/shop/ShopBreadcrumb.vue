<!-- ✅ COPY-PASTE FINAL -->
<!-- src/modules/shop/components/ShopBreadcrumb.vue -->
<template>
  <div class="bc">
    <v-breadcrumbs :items="items" class="pa-0">
      <template #divider>
        <span class="bc-sep">›</span>
      </template>
    </v-breadcrumbs>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  product: { type: Object, default: null },
});

function pickName(v) {
  const s = String(v ?? "").trim();
  return s || "";
}

const items = computed(() => {
  const p = props.product || {};

  const cat =
    pickName(p?.category_name) ||
    pickName(p?.Category?.name) ||
    pickName(p?.category?.name);

  const sub =
    pickName(p?.subcategory_name) ||
    pickName(p?.Subcategory?.name) ||
    pickName(p?.subcategory?.name);

  const out = [{ title: "Inicio", to: "/shop" }];

  // Nota: por ahora lo mando a /shop para no depender de rutas específicas
  if (cat) out.push({ title: cat, to: "/shop" });
  if (sub) out.push({ title: sub, to: "/shop" });

  return out;
});
</script>

<style scoped>
.bc :deep(.v-breadcrumbs) {
  font-size: 13px;
}
.bc-sep {
  margin: 0 6px;
  opacity: 0.6;
}
</style>
