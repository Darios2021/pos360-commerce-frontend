<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/products/components/detail/ProductInfoCard.vue -->
<template>
  <v-card rounded="xl" elevation="1" class="pa-3">
    <div class="pi-title">Información</div>

    <div class="pi-grid">
      <div class="pi-item">
        <span class="k">Marca</span>
        <span class="v">{{ brand }}</span>
      </div>

      <div class="pi-item">
        <span class="k">Modelo</span>
        <span class="v">{{ model }}</span>
      </div>

      <div class="pi-item">
        <span class="k">Categoría</span>
        <span class="v">{{ category }}</span>
      </div>

      <div class="pi-item">
        <span class="k">Subcategoría</span>
        <span class="v">{{ subcategory }}</span>
      </div>
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

function pickString(...values) {
  for (const v of values) {
    if (v && String(v).trim() !== "") {
      return String(v).trim();
    }
  }
  return "-";
}

const brand = computed(() =>
  pickString(
    props.product?.brand?.name,   // si viene objeto
    props.product?.brand_name,    // alias
    props.product?.brand          // 🔥 string simple (tu caso real)
  )
);

const model = computed(() =>
  pickString(
    props.product?.model,
    props.product?.model_name
  )
);

const category = computed(() =>
  pickString(
    props.product?.category?.name,
    props.product?.category_name,
    props.product?.category
  )
);

const subcategory = computed(() =>
  pickString(
    props.product?.subcategory?.name,
    props.product?.subcategory_name,
    props.product?.subcategory
  )
);

const desc = computed(() =>
  String(props.product?.description || props.product?.desc || "").trim()
);
</script>

<style scoped>
.pi-title{ font-weight: 500; margin-bottom:10px; }

.pi-grid{
  display:grid;
  grid-template-columns: repeat(2, minmax(0,1fr));
  gap:10px;
}

.pi-item{
  display:flex;
  flex-direction:column;
  gap:2px;
  background: rgba(0,0,0,.03);
  border:1px solid rgba(0,0,0,.06);
  border-radius:12px;
  padding:10px;
}

.k{
  font-size:12px;
  opacity:.7;
  font-weight: 400;
}

.v{
  font-size:14px;
  font-weight: 500;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}

.pi-desc{
  margin-top:10px;
  font-size:13px;
  opacity:.85;
}

@media (max-width: 900px){
  .pi-grid{
    grid-template-columns: 1fr;
  }
}
</style>