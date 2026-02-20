<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/products/components/detail/ProductHeader.vue -->
<template>
  <v-card rounded="xl" elevation="1" class="pa-3">
    <div class="ph">
      <div class="ph-left">
        <v-btn variant="text" class="ph-back" @click="$emit('back')">
          <v-icon start>mdi-arrow-left</v-icon>
          Volver
        </v-btn>

        <div class="ph-title">
          <div class="ph-name">{{ name }}</div>
          <div class="ph-meta">
            <span v-if="code"><b>COD:</b> {{ code }}</span>
            <span v-if="sku"><b>SKU:</b> {{ sku }}</span>
          </div>
        </div>
      </div>

      <div class="ph-right">
        <slot name="actions" />
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  product: { type: Object, required: true },
});

defineEmits(["back"]);

const name = computed(() => String(props.product?.name || props.product?.title || "Producto"));
const code = computed(() => String(props.product?.code || props.product?.internal_code || props.product?.barcode || ""));
const sku = computed(() => String(props.product?.sku || props.product?.product_code || props.product?.id || ""));
</script>

<style scoped>
.ph{ display:flex; align-items:flex-start; justify-content:space-between; gap:14px; }
.ph-left{ display:flex; align-items:flex-start; gap:10px; min-width:0; }
.ph-title{ min-width:0; }
.ph-name{ font-weight:900; font-size:18px; line-height:1.1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:62vw; }
.ph-meta{ margin-top:6px; display:flex; gap:12px; flex-wrap:wrap; font-size:12px; opacity:.8; }
.ph-right{ display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
</style>