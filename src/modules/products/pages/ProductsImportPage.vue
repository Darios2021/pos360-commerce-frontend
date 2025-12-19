<!-- src/modules/products/pages/ProductsImportPage.vue -->
<template>
  <div class="page">
    <div class="topbar">
      <div>
        <div class="text-h5 font-weight-bold">Importar productos (CSV)</div>
        <div class="text-caption text-medium-emphasis">
          Subí un CSV, revisá el preview y ejecutá la importación. Rubro/Subrubro se crean en <b>categories</b>.
        </div>
      </div>

      <div class="actions">
        <v-btn variant="tonal" prepend-icon="mdi-download" @click="downloadTemplate">
          Descargar plantilla
        </v-btn>

        <v-btn color="primary" variant="flat" prepend-icon="mdi-arrow-left" @click="goBack">
          Volver a productos
        </v-btn>
      </div>
    </div>

    <v-card rounded="xl" class="pa-4">
      <v-row dense class="align-center">
        <v-col cols="12" md="6">
          <v-file-input
            v-model="file"
            label="Seleccionar CSV"
            accept=".csv,text/csv"
            prepend-inner-icon="mdi-paperclip"
            show-size
            :disabled="busy"
            @update:modelValue="onFile"
          />
        </v-col>

        <v-col cols="12" md="2">
          <v-select
            v-model="separator"
            :items="sepItems"
            label="Separador"
            :disabled="busy"
          />
        </v-col>

        <v-col cols="12" md="2">
          <v-text-field
            v-model.number="concurrency"
            type="number"
            label="Concurrencia"
            hint="Más alto = más rápido (cuidado rate limits)"
            persistent-hint
            :min="1"
            :max="10"
            :disabled="busy"
          />
        </v-col>

        <v-col cols="12" md="2" class="d-flex justify-end ga-2">
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-eye-outline"
            :disabled="!rows.length || busy"
            @click="openPreview"
          >
            Ver preview ({{ rows.length }})
          </v-btn>

          <v-btn
            color="green"
            variant="flat"
            prepend-icon="mdi-cloud-upload-outline"
            :disabled="!validRows.length || busy"
            @click="runImport"
          >
            Importar
          </v-btn>
        </v-col>
      </v-row>

      <v-divider class="my-4" />

      <v-row dense>
        <v-col cols="12" md="4">
          <v-card variant="tonal" rounded="xl" class="pa-4">
            <div class="text-caption text-medium-emphasis">Estado</div>
            <div class="text-h6 font-weight-bold">{{ statusLabel }}</div>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card variant="tonal" rounded="xl" class="pa-4">
            <div class="text-caption text-medium-emphasis">Filas válidas</div>
            <div class="text-h6 font-weight-bold">{{ validRows.length }} / {{ rows.length }}</div>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card variant="tonal" rounded="xl" class="pa-4">
            <div class="text-caption text-medium-emphasis">Errores (validación)</div>
            <div class="text-h6 font-weight-bold">{{ errors.length }}</div>
          </v-card>
        </v-col>
      </v-row>

      <v-alert v-if="lastError" type="error" variant="tonal" class="mt-4">
        {{ lastError }}
      </v-alert>

      <v-alert v-if="doneMsg" type="success" variant="tonal" class="mt-4">
        {{ doneMsg }}
      </v-alert>
    </v-card>

    <!-- PREVIEW DIALOG -->
    <v-dialog v-model="previewOpen" max-width="1100" scrollable>
      <v-card rounded="xl">
        <v-card-title class="d-flex justify-space-between align-center">
          <div class="font-weight-bold">Preview (primeras 50 filas)</div>
          <v-btn icon="mdi-close" variant="text" @click="previewOpen=false" />
        </v-card-title>

        <v-divider />

        <v-card-text>
          <v-alert v-if="errors.length" type="warning" variant="tonal" class="mb-4">
            Hay {{ errors.length }} filas con error. Podés exportarlas abajo.
          </v-alert>

          <v-data-table
            :headers="previewHeaders"
            :items="previewItems"
            density="comfortable"
            hover
          />

          <div class="d-flex justify-end ga-2 mt-4">
            <v-btn variant="tonal" prepend-icon="mdi-download" :disabled="!errors.length" @click="downloadErrors">
              Descargar errores (CSV)
            </v-btn>
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions class="justify-end pa-4">
          <v-btn variant="text" @click="previewOpen=false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import http from "../../../app/api/http";
import { mapCsvRowToProductPayload } from "../utils/csvProductMapper";

const router = useRouter();

const file = ref(null);
const separator = ref(",");
const sepItems = [",", ";", "\t"];
const concurrency = ref(3);

const rows = ref([]);       // raw parsed rows (objects)
const errors = ref([]);     // { rowIndex, message, raw }
const validRows = ref([]);  // { rowIndex, payload }

const busy = ref(false);
const previewOpen = ref(false);
const lastError = ref("");
const doneMsg = ref("");

const statusLabel = computed(() => {
  if (busy.value) return "Procesando…";
  if (!file.value) return "Esperando archivo";
  if (rows.value.length && !errors.value.length) return "Archivo listo";
  if (rows.value.length && errors.value.length) return "Archivo con errores";
  return "Listo";
});

const previewHeaders = [
  { title: "#", key: "n", width: 60 },
  { title: "Código", key: "code", width: 120 },
  { title: "SKU", key: "sku", width: 120 },
  { title: "Nombre", key: "name", width: 340 },
  { title: "Descripción", key: "description", width: 420 },
  { title: "Rubro", key: "rubro", width: 180 },
  { title: "Subrubro", key: "subrubro", width: 180 },
  { title: "Marca", key: "brand", width: 160 },
  { title: "Lista", key: "price_list", width: 120 },
];

const previewItems = computed(() => {
  const first = validRows.value.slice(0, 50);
  return first.map((x, i) => ({
    n: x.rowIndex,
    code: x.payload.code,
    sku: x.payload.sku,
    name: x.payload.name,
    description: x.payload.description,
    rubro: x.payload.__rubroTxt || "",
    subrubro: x.payload.__subrubroTxt || "",
    brand: x.payload.brand || "",
    price_list: x.payload.price_list,
  }));
});

function goBack() {
  router.push({ name: "products" });
}

function downloadTemplate() {
  const content = [
    "Codigo,Descripcion,Rubro,Subrubro,Marca,PrecioCompra,PrecioVenta",
    "252453,AURICULAR TWS ANC XAEA BT5.49,AURICULARES BT,AURICULARES M. LIBRES,XAEA,12725,38400",
  ].join("\n");

  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "products_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * CSV parser simple (soporta comillas y separador configurable)
 */
function parseCsv(text, sep = ",") {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(Boolean);
  if (!lines.length) return { headers: [], data: [] };

  const headers = splitCsvLine(lines[0], sep).map((h) => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i], sep);
    if (!cols.length) continue;

    const obj = {};
    for (let c = 0; c < headers.length; c++) {
      obj[headers[c]] = cols[c] ?? "";
    }
    data.push(obj);
  }

  return { headers, data };
}

function splitCsvLine(line, sep) {
  const out = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      // doble comilla escapada ""
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && ch === sep) {
      out.push(cur);
      cur = "";
      continue;
    }

    cur += ch;
  }
  out.push(cur);
  return out.map((x) => String(x ?? "").trim());
}

async function onFile(f) {
  lastError.value = "";
  doneMsg.value = "";
  rows.value = [];
  errors.value = [];
  validRows.value = [];

  if (!f) return;

  busy.value = true;
  try {
    const text = await f.text();
    const parsed = parseCsv(text, separator.value);

    rows.value = parsed.data;

    // validar + mapear
    const v = [];
    const e = [];

    for (let i = 0; i < rows.value.length; i++) {
      const rowIndex = i + 2; // +2 porque header es línea 1
      try {
        const payload = mapCsvRowToProductPayload(rows.value[i]);
        v.push({ rowIndex, payload });
      } catch (err) {
        e.push({ rowIndex, message: err?.message || String(err), raw: rows.value[i] });
      }
    }

    validRows.value = v;
    errors.value = e;
  } catch (err) {
    lastError.value = err?.message || String(err);
  } finally {
    busy.value = false;
  }
}

function openPreview() {
  previewOpen.value = true;
}

function downloadErrors() {
  const headers = ["rowIndex", "message"];
  const lines = [headers.join(",")];

  for (const e of errors.value) {
    const row = [
      e.rowIndex,
      `"${String(e.message).replace(/"/g, '""')}"`,
    ];
    lines.push(row.join(","));
  }

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "import_errors.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Crea (si no existe) rubro (parent) y subrubro (child) en categories,
 * y devuelve el ID del subrubro (category_id del producto).
 */
async function resolveCategoryId(rubroTxt, subrubroTxt) {
  // si no vienen textos, no tocamos category_id
  const rubro = (rubroTxt || "").trim();
  const sub = (subrubroTxt || "").trim();
  if (!rubro || !sub) return null;

  // 1) Traer todas las categorías (cached simple)
  const { data } = await http.get("/categories");
  const items = data?.items || [];

  const findByName = (name) => items.find((x) => String(x.name).trim().toLowerCase() === name.trim().toLowerCase());

  // 2) Rubro (parent)
  let rubroItem = findByName(rubro);
  if (!rubroItem) {
    const created = await http.post("/categories", { name: rubro, parent_id: null, is_active: 1 });
    rubroItem = created?.data?.item;
    items.push(rubroItem);
  }

  // 3) Subrubro (child) -> OJO: tu DB tiene UNIQUE(name) global.
  // Para evitar choque entre rubros distintos, si ya existe con otro parent, le prefijamos rubro.
  let subItem = findByName(sub);

  if (subItem && subItem.parent_id !== rubroItem.id) {
    // workaround por UNIQUE(name) global:
    const safe = `${rubro} - ${sub}`;
    subItem = findByName(safe);
    if (!subItem) {
      const created = await http.post("/categories", { name: safe, parent_id: rubroItem.id, is_active: 1 });
      subItem = created?.data?.item;
      items.push(subItem);
    }
  }

  if (!subItem) {
    const created = await http.post("/categories", { name: sub, parent_id: rubroItem.id, is_active: 1 });
    subItem = created?.data?.item;
    items.push(subItem);
  }

  return subItem?.id ?? null;
}

async function runImport() {
  lastError.value = "";
  doneMsg.value = "";
  busy.value = true;

  const ok = [];
  const fail = [];

  try {
    // Concurrency pool
    const queue = [...validRows.value];

    const workers = Array.from({ length: Math.max(1, Math.min(10, Number(concurrency.value) || 3)) }).map(
      async () => {
        while (queue.length) {
          const job = queue.shift();
          if (!job) break;

          const { rowIndex } = job;
          const payload = { ...job.payload };

          try {
            // ✅ resolve category_id (subrubro)
            const catId = await resolveCategoryId(payload.__rubroTxt, payload.__subrubroTxt);
            payload.category_id = catId;

            // limpiar extras internos
            delete payload.__rubroTxt;
            delete payload.__subrubroTxt;

            await http.post("/products", payload);
            ok.push(rowIndex);
          } catch (err) {
            const msg =
              err?.response?.data?.message ||
              err?.response?.data?.code ||
              err?.friendlyMessage ||
              err?.message ||
              "Error importando";
            fail.push({ rowIndex, message: msg });
          }
        }
      }
    );

    await Promise.all(workers);

    doneMsg.value = `Import finalizado. OK: ${ok.length} · Errores: ${fail.length}`;

    if (fail.length) {
      // sumo a errores para exportar
      errors.value = fail.map((x) => ({ rowIndex: x.rowIndex, message: x.message, raw: {} }));
    }
  } catch (err) {
    lastError.value = err?.message || String(err);
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.page {
  padding-bottom: 80px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
</style>
