<template>
  <v-container fluid class="py-6">
    <v-card class="mx-auto" max-width="1300" rounded="xl" elevation="2">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap ga-3">
        <div class="d-flex flex-column">
          <div class="text-h6 font-weight-bold">Stock</div>
          <div class="text-caption text-medium-emphasis">
            Por sucursal → depósito → movimientos.
          </div>
        </div>

        <div class="d-flex ga-2 align-center flex-wrap">
          <v-select
            v-model="filters.branch_id"
            :items="branchOptions"
            item-title="label"
            item-value="id"
            label="Sucursal"
            variant="outlined"
            density="compact"
            hide-details
            style="min-width: 320px"
            :loading="wh.loading"
            @update:model-value="onBranchChange"
          />

          <v-select
            v-model="filters.warehouse_id"
            :items="warehouseOptionsFiltered"
            item-title="label"
            item-value="id"
            label="Depósito"
            variant="outlined"
            density="compact"
            hide-details
            style="min-width: 360px"
            :loading="wh.loading"
            :disabled="!filters.branch_id"
            @update:model-value="onWarehouseChange"
          />

          <v-text-field
            v-model="filters.q"
            density="compact"
            variant="outlined"
            prepend-inner-icon="mdi-magnify"
            label="Buscar producto"
            hide-details
            style="min-width: 280px"
            :disabled="!filters.warehouse_id"
            @keyup.enter="refresh"
          />

          <v-btn color="primary" prepend-icon="mdi-refresh" @click="refresh" :disabled="!filters.warehouse_id">
            Actualizar
          </v-btn>

          <v-btn color="primary" variant="flat" prepend-icon="mdi-swap-vertical" :disabled="!filters.warehouse_id" @click="openMovement">
            Movimiento
          </v-btn>
        </div>
      </v-card-title>

      <v-divider />

      <v-card-text class="pt-4">
        <v-alert v-if="stock.error" type="error" variant="tonal" class="mb-4">
          {{ stock.error }}
        </v-alert>

        <v-data-table
          :headers="stockHeaders"
          :items="stock.items"
          :loading="stock.loadingStock"
          class="rounded-xl"
          items-per-page="25"
        >
          <template #item.product="{ item }">
            <div class="d-flex flex-column">
              <div class="font-weight-medium">{{ item?.product?.name || "—" }}</div>
              <div class="text-caption text-medium-emphasis">
                SKU: {{ item?.product?.sku || "—" }} · Barcode: {{ item?.product?.barcode || "—" }}
              </div>
            </div>
          </template>

          <template #item.qty="{ item }">
            <span class="font-weight-bold">{{ Number(item?.qty ?? 0) }}</span>
          </template>

          <template #no-data>
            <div class="py-8 text-medium-emphasis">
              {{ filters.warehouse_id ? "No hay stock para mostrar." : "Seleccioná sucursal y depósito." }}
            </div>
          </template>
        </v-data-table>

        <v-divider class="my-6" />

        <div class="d-flex align-center justify-space-between mb-2">
          <div class="text-subtitle-1 font-weight-bold">Movimientos</div>
          <v-btn variant="text" prepend-icon="mdi-refresh" :disabled="!filters.warehouse_id" :loading="stock.loadingMovements" @click="refreshMovements">
            Actualizar
          </v-btn>
        </div>

        <v-data-table
          :headers="moveHeaders"
          :items="stock.movements"
          :loading="stock.loadingMovements"
          class="rounded-xl"
          items-per-page="10"
        >
          <template #item.type="{ item }">
            <v-chip size="small" variant="tonal">{{ item.type }}</v-chip>
          </template>

          <template #item.items="{ item }">
            <span class="text-body-2">{{ (item.items || []).length }} ítems</span>
          </template>

          <template #no-data>
            <div class="py-6 text-medium-emphasis">
              {{ filters.warehouse_id ? "Sin movimientos todavía." : "Seleccioná depósito." }}
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Movimiento -->
    <v-dialog v-model="mv.open" max-width="920">
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="text-h6 font-weight-bold">Nuevo movimiento</div>
          <v-btn icon="mdi-close" variant="text" @click="mv.open = false" />
        </v-card-title>

        <v-divider />

        <v-card-text class="pt-4">
          <v-alert v-if="mv.error" type="error" variant="tonal" class="mb-4">
            {{ mv.error }}
          </v-alert>

          <v-row dense>
            <v-col cols="12" md="4">
              <v-select
                v-model="mv.type"
                :items="movementTypes"
                item-title="label"
                item-value="value"
                label="Tipo"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="4" v-if="mv.type !== 'transfer'">
              <v-text-field v-model.number="mv.warehouse_id" type="number" label="warehouse_id" variant="outlined" readonly />
            </v-col>

            <v-col cols="12" md="4" v-if="mv.type === 'transfer'">
              <v-select
                v-model="mv.from_warehouse_id"
                :items="warehouseOptionsAll"
                item-title="label"
                item-value="id"
                label="Desde depósito"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12" md="4" v-if="mv.type === 'transfer'">
              <v-select
                v-model="mv.to_warehouse_id"
                :items="warehouseOptionsAll"
                item-title="label"
                item-value="id"
                label="Hacia depósito"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12">
              <v-textarea v-model="mv.note" label="Nota" variant="outlined" rows="2" auto-grow />
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <div class="d-flex align-center justify-space-between mb-2">
            <div class="text-subtitle-1 font-weight-bold">Items</div>
            <v-btn variant="text" prepend-icon="mdi-plus" @click="addItem">Agregar item</v-btn>
          </div>

          <v-row dense v-for="(it, idx) in mv.items" :key="idx" class="mb-2">
            <v-col cols="12" md="6">
              <v-text-field v-model.number="it.product_id" type="number" label="product_id" variant="outlined" />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field v-model.number="it.qty" type="number" label="Cantidad" variant="outlined" />
            </v-col>
            <v-col cols="12" md="2" class="d-flex align-center justify-end">
              <v-btn icon="mdi-delete" variant="text" color="error" @click="removeItem(idx)" />
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4 d-flex justify-end ga-2">
          <v-btn variant="text" @click="mv.open = false" :disabled="saving">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" @click="submitMovement" :loading="saving">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useWarehousesStore } from "../../../app/store/warehouses.store";
import { useStockStore } from "../../../app/store/stock.store";
import { useRoute } from "vue-router";

const route = useRoute();
const wh = useWarehousesStore();
const stock = useStockStore();

const filters = reactive({
  branch_id: null,
  warehouse_id: null,
  q: "",
});

const stockHeaders = [
  { title: "Producto", key: "product", minWidth: 380 },
  { title: "Marca", key: "product.brand", width: 160 },
  { title: "Modelo", key: "product.model", width: 160 },
  { title: "Cantidad", key: "qty", width: 120, align: "end" },
];

const moveHeaders = [
  { title: "ID", key: "id", width: 80 },
  { title: "Tipo", key: "type", width: 140 },
  { title: "warehouse_id", key: "warehouse_id", width: 140 },
  { title: "from", key: "from_warehouse_id", width: 120 },
  { title: "to", key: "to_warehouse_id", width: 120 },
  { title: "Items", key: "items", width: 120 },
  { title: "Nota", key: "note" },
];

const branchOptions = computed(() => {
  return wh.branches.map((b) => ({ id: b.id, label: `${b.code} — ${b.name}` }));
});

const warehouseOptionsAll = computed(() => {
  return (wh.items || []).map((w) => {
    const b = w.branch?.name ? ` · ${w.branch.name}` : "";
    return { id: w.id, label: `${w.code} — ${w.name}${b}` };
  });
});

const warehouseOptionsFiltered = computed(() => {
  return (wh.items || [])
    .filter((w) => w.branch?.id === filters.branch_id)
    .map((w) => ({ id: w.id, label: `${w.code} — ${w.name}` }));
});

async function onBranchChange() {
  filters.warehouse_id = null;
  stock.items = [];
  stock.movements = [];
}

async function onWarehouseChange() {
  await refresh();
}

async function refresh() {
  if (!filters.warehouse_id) return;
  await stock.fetchStock({ warehouse_id: filters.warehouse_id, q: filters.q });
  await stock.fetchMovements({ warehouse_id: filters.warehouse_id });
}

async function refreshMovements() {
  if (!filters.warehouse_id) return;
  await stock.fetchMovements({ warehouse_id: filters.warehouse_id });
}

// Movement dialog
const saving = ref(false);

const movementTypes = [
  { label: "Entrada", value: "in" },
  { label: "Salida", value: "out" },
  { label: "Ajuste", value: "adjustment" },
  { label: "Transferencia", value: "transfer" },
];

const mv = reactive({
  open: false,
  type: "in",
  warehouse_id: null,
  from_warehouse_id: null,
  to_warehouse_id: null,
  note: "",
  items: [],
  error: null,
});

function addItem() {
  mv.items.push({ product_id: null, qty: 1 });
}
function removeItem(i) {
  mv.items.splice(i, 1);
}

function openMovement() {
  mv.error = null;
  mv.open = true;
  mv.type = "in";
  mv.note = "";
  mv.items = [{ product_id: null, qty: 1 }];
  mv.warehouse_id = filters.warehouse_id;
  mv.from_warehouse_id = filters.warehouse_id;
  mv.to_warehouse_id = null;
}

async function submitMovement() {
  mv.error = null;

  // validaciones mínimas
  if (!mv.items?.length) return (mv.error = "Agregá al menos 1 item");
  for (const it of mv.items) {
    if (!it.product_id) return (mv.error = "product_id requerido en items");
    if (!it.qty || Number(it.qty) <= 0) return (mv.error = "qty debe ser > 0");
  }

  const payload =
    mv.type === "transfer"
      ? {
          type: "transfer",
          from_warehouse_id: mv.from_warehouse_id,
          to_warehouse_id: mv.to_warehouse_id,
          note: mv.note || null,
          items: mv.items.map((i) => ({ product_id: Number(i.product_id), qty: Number(i.qty) })),
        }
      : {
          type: mv.type,
          warehouse_id: mv.warehouse_id,
          note: mv.note || null,
          items: mv.items.map((i) => ({ product_id: Number(i.product_id), qty: Number(i.qty) })),
        };

  saving.value = true;
  const created = await stock.createMovement(payload);
  saving.value = false;

  if (!created) {
    mv.error = stock.error || "No se pudo crear el movimiento";
    return;
  }

  mv.open = false;
}

onMounted(async () => {
  await wh.fetch();

  // prefill q desde query (?q=SKU) si viene de Products
  if (route.query?.q) filters.q = String(route.query.q);

  // auto seleccionar sucursal+depósito si hay 1
  if (wh.items.length === 1) {
    const w = wh.items[0];
    filters.branch_id = w.branch?.id || null;
    filters.warehouse_id = w.id;
    await refresh();
    return;
  }

  // si hay múltiples, auto elegir primera sucursal
  if (!filters.branch_id && branchOptions.value.length) {
    filters.branch_id = branchOptions.value[0].id;
  }
});
</script>
