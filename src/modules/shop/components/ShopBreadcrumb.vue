<!-- ✅ COPY-PASTE FINAL -->
<!-- src/modules/shop/components/ShopBreadcrumb.vue -->
<template>
  <nav class="bc" aria-label="Breadcrumb">
    <div class="bc-row">
      <!-- Inicio → SHOP -->
      <RouterLink class="bc-link" to="/shop">Inicio</RouterLink>

      <span class="bc-sep">›</span>

      <!-- Categoría -->
      <RouterLink
        v-if="catLabel"
        class="bc-link"
        :to="catTo"
      >
        {{ catLabel }}
      </RouterLink>

      <template v-if="subLabel">
        <span class="bc-sep">›</span>
        <span class="bc-current">{{ subLabel }}</span>
      </template>
    </div>
  </nav>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  product: { type: Object, default: null },
});

function txt(v) {
  const s = String(v ?? "").trim();
  return s || "";
}

const categoryId = computed(() =>
  props.product?.category_id ||
  props.product?.Category?.id ||
  null
);

const subcategoryId = computed(() =>
  props.product?.subcategory_id ||
  props.product?.Subcategory?.id ||
  null
);

const catLabel = computed(() =>
  txt(props.product?.Category?.name || props.product?.category_name)
);

const subLabel = computed(() =>
  txt(props.product?.Subcategory?.name || props.product?.subcategory_name)
);

const catTo = computed(() =>
  categoryId.value ? `/shop/c/${categoryId.value}` : "/shop"
);
</script>

<style scoped>
.bc {
  width: 100%;
  margin: 6px 0 10px;
}

.bc-row {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.bc-row::-webkit-scrollbar {
  height: 4px;
}

.bc-link {
  font-size: 13px;
  font-weight: 600;
  color: rgba(0,0,0,.8);
  text-decoration: none;
}
.bc-link:hover {
  text-decoration: underline;
}

.bc-sep {
  color: rgba(0,0,0,.35);
}

.bc-current {
  font-size: 13px;
  font-weight: 700;
  color: rgba(0,0,0,.55);
}

@media (min-width: 981px) {
  .bc-row {
    overflow-x: hidden;
  }
}
</style>
