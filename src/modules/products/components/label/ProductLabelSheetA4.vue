<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/products/components/label/ProductLabelSheetA4.vue -->
<template>
  <!-- ✅ IMPORTANTE: este root se imprime tal cual -->
  <div class="sheet-root">
    <!-- Render de N páginas A4 -->
    <div v-for="(page, pIndex) in pages" :key="pIndex" class="page">
      <div
        class="grid"
        :style="gridStyle"
      >
        <!-- celdas -->
        <div
          v-for="cellIndex in capacity"
          :key="cellIndex"
          class="cell no-break"
        >
          <div v-if="hasLabel(pIndex, cellIndex - 1)" class="label-wrap">
            <component :is="labelComp" :product="product" :qrValue="qrValue" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import ProductLabel58 from "./ProductLabel58.vue";
import ProductLabel100 from "./ProductLabel100.vue";

const props = defineProps({
  product: { type: Object, required: true },
  qrValue: { type: String, required: true },

  // "100" => 100x60; "58" => 58x40
  size: { type: String, default: "100" },

  // cantidad de etiquetas a imprimir
  copies: { type: Number, default: 8 },
});

// ✅ Layouts A4 profesionales (mm)
const layout = computed(() => {
  if (props.size === "58") {
    // 58x40 => 3x6 = 18 por hoja
    return {
      pageW: 210,
      pageH: 297,
      cols: 3,
      rows: 6,
      cellW: 58,
      cellH: 40,
      gapX: 4,
      gapY: 4,
    };
  }

  // 100x60 => 2x4 = 8 por hoja
  return {
    pageW: 210,
    pageH: 297,
    cols: 2,
    rows: 4,
    cellW: 100,
    cellH: 60,
    gapX: 5,
    gapY: 5,
  };
});

const capacity = computed(() => layout.value.cols * layout.value.rows);

const pagesCount = computed(() => {
  const n = Math.max(1, Math.ceil(Math.max(1, props.copies) / capacity.value));
  return n;
});

const pages = computed(() => Array.from({ length: pagesCount.value }, (_, i) => i));

const labelComp = computed(() => (props.size === "58" ? ProductLabel58 : ProductLabel100));

function hasLabel(pageIndex, indexInPage) {
  const globalIndex = pageIndex * capacity.value + indexInPage;
  return globalIndex < Math.max(1, props.copies);
}

// ✅ Margenes automáticos centrando la grilla en A4
const gridStyle = computed(() => {
  const L = layout.value;

  const gridW = L.cols * L.cellW + (L.cols - 1) * L.gapX;
  const gridH = L.rows * L.cellH + (L.rows - 1) * L.gapY;

  const marginLeft = (L.pageW - gridW) / 2;
  const marginTop = (L.pageH - gridH) / 2;

  return {
    width: `${L.pageW}mm`,
    height: `${L.pageH}mm`,
    paddingLeft: `${marginLeft}mm`,
    paddingTop: `${marginTop}mm`,
    gridTemplateColumns: `repeat(${L.cols}, ${L.cellW}mm)`,
    gridTemplateRows: `repeat(${L.rows}, ${L.cellH}mm)`,
    columnGap: `${L.gapX}mm`,
    rowGap: `${L.gapY}mm`,
  };
});
</script>

<style scoped>
/* root: puede contener múltiples páginas */
.sheet-root { width: 210mm; }

/* cada page A4 */
.page {
  width: 210mm;
  height: 297mm;
  background: #fff;
}

/* grilla centrada */
.grid {
  display: grid;
  align-content: start;
  justify-content: start;
}

/* celda exacta */
.cell {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}

/* adentro, el label ya trae width/height en mm */
.label-wrap {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}

/* 🔥 Para pantalla: preview cómodo (NO afecta impresión porque se imprime con printPageElement) */
@media screen {
  .page { border: 1px solid rgba(0,0,0,.08); border-radius: 12px; margin-bottom: 12px; overflow: hidden; }
}
</style>