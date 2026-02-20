<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/products/components/detail/ProductInfoCard.vue -->
<template>
  <v-card rounded="xl" elevation="1" class="pa-3">
    <div class="pi-title">Información</div>

    <div class="pi-grid">
      <div class="pi-item"><span class="k">Marca</span><span class="v">{{ brand }}</span></div>
      <div class="pi-item"><span class="k">Modelo</span><span class="v">{{ model }}</span></div>
      <div class="pi-item"><span class="k">Categoría</span><span class="v">{{ category }}</span></div>
      <div class="pi-item"><span class="k">Subcategoría</span><span class="v">{{ subcategory }}</span></div>
    </div>

    <div v-if="desc" class="pi-desc">
      {{ desc }}
    </div>
  </v-card>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  product: { type: Object, required: true },
});

const brand = computed(() => props.product?.brand?.name || props.product?.brand_name || "-");
const model = computed(() => props.product?.model || props.product?.model_name || "-");
const category = computed(() => props.product?.category?.name || props.product?.category_name || "-");
const subcategory = computed(() => props.product?.subcategory?.name || props.product?.subcategory_name || "-");
const desc = computed(() => String(props.product?.description || props.product?.desc || "").trim());
</script>

<style scoped>
.pi-title{ font-weight:900; margin-bottom:10px; }
.pi-grid{ display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:10px; }
.pi-item{ display:flex; flex-direction:column; gap:2px; background: rgba(0,0,0,.03); border:1px solid rgba(0,0,0,.06); border-radius:12px; padding:10px; }
.k{ font-size:12px; opacity:.7; font-weight:700; }
.v{ font-size:14px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.pi-desc{ margin-top:10px; font-size:13px; opacity:.85; }
@media (max-width: 900px){
  .pi-grid{ grid-template-columns: 1fr; }
}
</style>