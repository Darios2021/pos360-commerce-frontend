<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/ProductInfoTabs.vue -->
<template>
  <v-card class="ti-card" variant="flat">
    <v-card-text class="ti-pad">
      <v-tabs v-model="tab" class="ti-tabs" density="comfortable">
        <v-tab value="desc">Descripción</v-tab>
        <v-tab value="sheet">Ficha técnica</v-tab>
        <v-tab value="specs">Características</v-tab>
      </v-tabs>

      <v-divider class="my-3" />

      <v-window v-model="tab">
        <!-- DESCRIPCIÓN -->
        <v-window-item value="desc">
          <div v-if="descText" class="ti-text">{{ descText }}</div>
          <div v-else class="ti-empty">
            Este producto todavía no tiene descripción cargada.
          </div>
        </v-window-item>

        <!-- FICHA -->
        <v-window-item value="sheet">
          <div class="ti-grid">
            <div class="ti-row">
              <div class="ti-k">Marca</div>
              <div class="ti-v">{{ brandText || "—" }}</div>
            </div>
            <div class="ti-row">
              <div class="ti-k">Modelo</div>
              <div class="ti-v">{{ modelText || "—" }}</div>
            </div>
            <div class="ti-row">
              <div class="ti-k">Categoría</div>
              <div class="ti-v">{{ categoryText || "—" }}</div>
            </div>
            <div class="ti-row">
              <div class="ti-k">Subcategoría</div>
              <div class="ti-v">{{ subcategoryText || "—" }}</div>
            </div>
            <div class="ti-row">
              <div class="ti-k">Código</div>
              <div class="ti-v">{{ codeText || "—" }}</div>
            </div>
          </div>
        </v-window-item>

        <!-- CARACTERÍSTICAS -->
        <v-window-item value="specs">
          <ul v-if="specsList.length" class="ti-list">
            <li v-for="(x, i) in specsList" :key="i">{{ x }}</li>
          </ul>
          <div v-else class="ti-empty">
            No hay características cargadas.
          </div>
        </v-window-item>
      </v-window>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  product: { type: Object, default: null },
});

const tab = ref("desc");

function asText(v) {
  const s = String(v ?? "").trim();
  return s ? s : "";
}

const descText = computed(() => {
  const p = props.product || {};
  const t = asText(p.description || p.long_description || p.detail || p.details || "");
  return t.replace(/\s+/g, " ").trim();
});

const brandText = computed(() => asText(props.product?.brand || props.product?.marca));
const modelText = computed(() => asText(props.product?.model || props.product?.modelo));

const categoryText = computed(() =>
  asText(props.product?.Category?.name || props.product?.category_name)
);
const subcategoryText = computed(() =>
  asText(props.product?.Subcategory?.name || props.product?.subcategory_name)
);

const codeText = computed(() =>
  asText(props.product?.code || props.product?.sku || props.product?.barcode || "")
);

const specsList = computed(() => {
  const p = props.product || {};

  if (Array.isArray(p.specs) && p.specs.length) {
    return p.specs.map(asText).filter(Boolean);
  }
  if (Array.isArray(p.features) && p.features.length) {
    return p.features.map(asText).filter(Boolean);
  }

  // fallback: si viene como objeto
  const obj = p.attributes || p.specifications || null;
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    return Object.entries(obj)
      .map(([k, v]) => {
        const kk = asText(k);
        const vv = asText(v);
        return kk && vv ? `${kk}: ${vv}` : "";
      })
      .filter(Boolean);
  }

  return [];
});
</script>

<style scoped>
.ti-card {
  border-radius: 18px;
  background: #fff;
  border: 1px solid rgba(0,0,0,.06);
  box-shadow: 0 1px 2px rgba(0,0,0,.04);
}
.ti-pad { padding: 14px 16px; }

.ti-tabs :deep(.v-tab) {
  font-weight: 900;
  text-transform: none;
}

.ti-text {
  font-size: 13px;
  color: rgba(0,0,0,.78);
  line-height: 1.55;
  white-space: pre-line;
}

.ti-empty {
  padding: 10px 2px;
  color: rgba(0,0,0,.6);
  font-size: 13px;
}

.ti-grid {
  display: grid;
  gap: 10px;
}

.ti-row {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 12px;
  padding: 10px;
  border: 1px solid rgba(0,0,0,.08);
  border-radius: 14px;
  background: rgba(0,0,0,.01);
}

.ti-k { font-weight: 900; color: rgba(0,0,0,.78); }
.ti-v { color: rgba(0,0,0,.78); }

.ti-list {
  margin: 0;
  padding-left: 18px;
  color: rgba(0,0,0,.78);
  font-size: 13px;
}
.ti-list li { margin: 6px 0; }

@media (max-width: 700px) {
  .ti-row { grid-template-columns: 1fr; }
}
</style>
