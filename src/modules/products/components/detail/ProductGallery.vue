<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/products/components/detail/ProductGallery.vue -->
<template>
  <v-card rounded="xl" elevation="1" class="pa-3">
    <div class="pg-title">Fotos</div>

    <v-alert v-if="!items.length" type="info" variant="tonal" density="comfortable">
      Sin imágenes.
    </v-alert>

    <div v-else class="pg-grid">
      <v-img
        v-for="(img, i) in items"
        :key="i"
        :src="img"
        cover
        class="pg-img"
        height="140"
      />
    </div>
  </v-card>
</template>

<script setup>
import { computed } from "vue";
const props = defineProps({ product: { type: Object, required: true } });

const items = computed(() => {
  const p = props.product || {};
  // soporta distintos formatos
  const arr =
    p.images ||
    p.image_urls ||
    p.media?.images ||
    p.gallery ||
    [];
  return Array.isArray(arr) ? arr.filter(Boolean) : [];
});
</script>

<style scoped>
.pg-title{ font-weight: 500; margin-bottom:10px; }
.pg-grid{ display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap:10px; }
.pg-img{ border-radius: 14px; border:1px solid rgba(0,0,0,.06); overflow:hidden; background:#f3f3f3; }
@media (max-width: 1200px){ .pg-grid{ grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 900px){ .pg-grid{ grid-template-columns: repeat(2, 1fr); } }
</style>