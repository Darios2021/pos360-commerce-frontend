<!-- src/modules/import/pages/ImportProductsPage.vue -->
<template>
  <div class="page">
    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
      <div>
        <div class="text-h5 font-weight-bold">Importar productos</div>
        <div class="text-caption text-medium-emphasis">
          Subí un CSV y el backend lo importa por <b>SKU</b> (actualiza si existe, crea si no).
        </div>
      </div>

      <div class="d-flex ga-2">
        <v-btn variant="tonal" prepend-icon="mdi-file-download-outline" @click="downloadTemplate">
          Plantilla CSV
        </v-btn>
      </div>
    </div>

    <v-alert type="info" variant="tonal" class="mb-4">
      Field esperado: <b>file</b> en multipart. Endpoint: <b>/import/products</b>.
      <div class="text-caption mt-1">
        Consejo: exportá desde Excel como CSV UTF-8. Si viene ANSI, igual lo tolera (backend hace fallback).
      </div>
    </v-alert>

    <v-card rounded="xl" class="pa-4">
      <v-row dense>
        <v-col cols="12" md="8">
          <v-file-input
            v-model="file"
            accept=".csv,text/csv"
            label="Seleccionar CSV"
            prepend-inner-icon="mdi-file-delimited-outline"
            :show-size="true"
            :disabled="loading"
            @update:modelValue="onFileSelected"
          />
        </v-col>

        <v-col cols="12" md="4" class="d-flex align-end ga-2">
          <v-btn
            color="primary"
            prepend-icon="mdi-upload-outline"
            :disabled="!file || loading"
            :loading="loading"
            @click="doImport"
            block
          >
            Importar
          </v-btn>
        </v-col>
      </v-row>

      <v-divider class="my-4" />

      <!-- Preview -->
      <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-2">
        <div class="font-weight-bold">Previsualización</div>
        <div class="text-caption text-medium-emphasis" v-if="preview.rows.length">
          Mostrando {{ preview.rows.length }} de {{ preview.totalRows }} filas (solo preview)
        </div>
      </div>

      <v-alert v-if="preview.error" type="warning" variant="tonal" class="mb-3">
        {{ preview.error }}
      </v-alert>

      <div v-if="preview.rows.length" class="table-wrap">
        <v-data-table
          :headers="preview.headers"
          :items="preview.rows"
          density="compact"
          hover
          class="preview-table"
          :items-per-page="20"
        />
      </div>

      <div v-else class="text-caption text-medium-emphasis">
        Seleccioná un CSV para ver el preview.
      </div>
    </v-card>

    <!-- Result -->
    <v-card v-if="result" rounded="xl" class="pa-4 mt-4">
      <div class="d-flex align-center justify-space-between flex-wrap ga-2">
        <div class="font-weight-bold">Resultado de importación</div>

        <div class="d-flex ga-2" v-if="result?.errors?.length">
          <v-btn
            variant="tonal"
            color="error"
            prepend-icon="mdi-file-download-outline"
            @click="downloadErrorsCsv"
          >
            Descargar errores (CSV)
          </v-btn>
        </div>
      </div>

      <v-row dense class="mt-2">
        <v-col cols="12" sm="6" md="3">
          <v-card variant="tonal" rounded="xl" class="pa-3">
            <div class="text-caption text-medium-emphasis">Total filas</div>
            <div class="text-h6 font-weight-bold">{{ result.total ?? "—" }}</div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card variant="tonal" rounded="xl" class="pa-3">
            <div class="text-caption text-medium-emphasis">Creados</div>
            <div class="text-h6 font-weight-bold">{{ result.created ?? 0 }}</div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card variant="tonal" rounded="xl" class="pa-3">
            <div class="text-caption text-medium-emphasis">Actualizados</div>
            <div class="text-h6 font-weight-bold">{{ result.updated ?? 0 }}</div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card variant="tonal" rounded="xl" class="pa-3">
            <div class="text-caption text-medium-emphasis">Errores</div>
            <div class="text-h6 font-weight-bold">{{ result.errorsCount ?? 0 }}</div>
          </v-card>
        </v-col>
      </v-row>

      <v-divider class="my-4" />

      <v-alert v-if="(result.errorsCount ?? 0) === 0" type="success" variant="tonal">
        Importación OK. Sin errores.
      </v-alert>

      <div v-else>
        <v-alert type="warning" variant="tonal" class="mb-3">
          Hay errores. Te muestro los primeros (el backend devuelve máx 50).
        </v-alert>

        <v-data-table
          :headers="errorHeaders"
          :items="result.errors || []"
          density="compact"
          hover
          :items-per-page="10"
        />
      </div>
    </v-card>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { ImportService } from "../../../app/services/import.service";

const file = ref(null);
const loading = ref(false);
const result = ref(null);

const preview = ref({
  headers: [],
  rows: [],
  totalRows: 0,
  error: "",
});

const errorHeaders = computed(() => [
  { title: "Fila", key: "row", sortable: false, width: 80 },
  { title: "SKU", key: "sku", sortable: false, width: 180 },
  { title: "Error", key: "error", sortable: false },
]);

function onFileSelected(f) {
  result.value = null;
  buildPreview(f);
}

function buildPreview(f) {
  preview.value = { headers: [], rows: [], totalRows: 0, error: "" };
  if (!f) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const text = String(reader.result || "");
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
      if (lines.length < 2) {
        preview.value.error = "El CSV no tiene filas suficientes.";
        return;
      }

      // parse simple para preview (no perfecto, pero suficiente)
      const header = splitCsvLine(lines[0]).map((h) => h.trim());
      const rows = [];

      const max = Math.min(lines.length - 1, 20);
      for (let i = 1; i <= max; i++) {
        const parts = splitCsvLine(lines[i]);
        const obj = {};
        header.forEach((h, idx) => {
          obj[h] = (parts[idx] ?? "").trim();
        });
        rows.push(obj);
      }

      preview.value.headers = header.slice(0, 14).map((h) => ({ title: h, key: h, sortable: false }));
      // mostramos solo primeras columnas (evita ancho infinito)
      preview.value.rows = rows.map((r) => pickKeys(r, header.slice(0, 14)));
      preview.value.totalRows = lines.length - 1;
    } catch (e) {
      preview.value.error = e?.message || String(e);
    }
  };
  reader.readAsText(f);
}

// split CSV con comillas (simple)
function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"' && line[i + 1] === '"') {
      cur += '"';
      i++;
      continue;
    }
    if (ch === '"') {
      inQ = !inQ;
      continue;
    }
    if (ch === "," && !inQ) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

function pickKeys(obj, keys) {
  const o = {};
  keys.forEach((k) => (o[k] = obj[k] ?? ""));
  return o;
}

async function doImport() {
  if (!file.value) return;
  loading.value = true;
  result.value = null;

  try {
    const resp = await ImportService.importProductsCsv(file.value);
    if (!resp?.ok) throw new Error(resp?.message || "Error importando");
    result.value = resp;
  } catch (e) {
    result.value = {
      ok: false,
      created: 0,
      updated: 0,
      total: 0,
      errorsCount: 1,
      errors: [{ row: "-", sku: "-", error: e?.friendlyMessage || e?.message || String(e) }],
    };
  } finally {
    loading.value = false;
  }
}

function downloadTemplate() {
  const headers = [
    "sku",
    "name",
    "description",
    "rubro",
    "sub_rubro",
    "brand",
    "model",
    "code",
    "barcode",
    "warranty_months",
    "is_new",
    "is_promo",
    "track_stock",
    "is_active",
    "cost",
    "price",
    "price_list",
    "price_discount",
    "price_reseller",
    "tax_rate",
  ];

  const example = [
    "TEST-001",
    "Producto de ejemplo",
    "Descripción real del producto",
    "Redes & CCTV",
    "Cámaras",
    "GENERICA",
    "MODEL-X",
    "COD-01",
    "7790000000000",
    "12",
    "1",
    "0",
    "1",
    "1",
    "100",
    "0",
    "12000",
    "11000",
    "10000",
    "21",
  ];

  const csv = `${headers.join(",")}\n${example.map(escapeCsv).join(",")}\n`;

  downloadText("products_template.csv", csv, "text/csv");
}

function escapeCsv(v) {
  const s = String(v ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadText(filename, text, mime) {
  const blob = new Blob([text], { type: mime || "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadErrorsCsv() {
  const errs = result.value?.errors || [];
  const headers = ["row", "sku", "error"];
  const lines = [headers.join(",")];

  for (const e of errs) {
    lines.push([e.row, e.sku, e.error].map(escapeCsv).join(","));
  }

  downloadText("import_errors.csv", lines.join("\n") + "\n", "text/csv");
}
</script>

<style scoped>
.page {
  padding-bottom: 80px;
}

.table-wrap {
  overflow-x: auto;
}

.preview-table {
  min-width: 900px;
}
</style>
