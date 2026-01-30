<!-- ✅ COPY-PASTE FINAL -->
<!-- src/modules/shop/components/ProductDetailsTabs.vue -->
<template>
  <v-card class="md-card" variant="flat">
    <v-card-text class="md-pad">
      <v-tabs v-model="tab" density="comfortable" class="md-tabs">
        <v-tab value="desc">Descripción</v-tab>
        <v-tab value="details">Detalles</v-tab>
      </v-tabs>

      <v-divider class="my-3" />

      <div v-if="tab === 'desc'" class="md-body">
        <div v-if="desc" class="md-text" v-html="descHtml"></div>
        <div v-else class="md-empty">Este producto no tiene descripción cargada.</div>
      </div>

      <div v-else class="md-body">
        <div class="md-grid">
          <div class="md-row">
            <div class="md-k">Marca</div>
            <div class="md-v">{{ brand || "—" }}</div>
          </div>
          <div class="md-row">
            <div class="md-k">Modelo</div>
            <div class="md-v">{{ model || "—" }}</div>
          </div>
          <div class="md-row">
            <div class="md-k">Categoría</div>
            <div class="md-v">{{ category || "—" }}</div>
          </div>
          <div class="md-row">
            <div class="md-k">Subcategoría</div>
            <div class="md-v">{{ subcategory || "—" }}</div>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  product: { type: Object, default: null },
});

const tab = ref("desc");

function txt(v) {
  const s = String(v ?? "").trim();
  return s || "";
}

const desc = computed(() => txt(props.product?.description || props.product?.long_description));
const descHtml = computed(() => {
  // simple: respeta saltos de línea sin meter dependencias
  const safe = desc.value
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");
  return safe;
});

const brand = computed(() => txt(props.product?.brand || props.product?.brand_name));
const model = computed(() => txt(props.product?.model || props.product?.model_name));

const category = computed(() =>
  txt(props.product?.Category?.name || props.product?.category_name)
);
const subcategory = computed(() =>
  txt(props.product?.Subcategory?.name || props.product?.subcategory_name)
);
</script>

<style scoped>
.md-card {
  margin-top: 14px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid rgba(0,0,0,.06);
  box-shadow: 0 1px 2px rgba(0,0,0,.04);
}
.md-pad { padding: 14px; }

.md-tabs :deep(.v-tab) {
  text-transform: none;
  font-weight: 900;
}

.md-body { padding-top: 4px; }

.md-text {
  font-size: 13px;
  line-height: 1.6;
  color: rgba(0,0,0,.78);
}

.md-empty {
  font-size: 13px;
  color: rgba(0,0,0,.6);
}

.md-grid {
  display: grid;
  gap: 10px;
}
.md-row {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 10px;
  align-items: baseline;
}
.md-k {
  font-weight: 900;
  color: rgba(0,0,0,.75);
  font-size: 13px;
}
.md-v {
  color: rgba(0,0,0,.75);
  font-size: 13px;
}

@media (max-width: 520px) {
  .md-row { grid-template-columns: 1fr; }
}
</style>
