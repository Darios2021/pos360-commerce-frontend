<template>
  <v-card rounded="xl">
    <v-card-title class="tf-title">
      <v-icon class="mr-2">mdi-truck-plus-outline</v-icon>
      Nueva derivación
    </v-card-title>
    <v-divider />

    <v-card-text class="tf-body">
      <!-- Sucursal destino -->
      <div class="tf-field">
        <label class="tf-label">Sucursal destino *</label>
        <v-select
          v-model="form.to_branch_id"
          :items="branches"
          item-title="name"
          item-value="id"
          placeholder="Seleccionar sucursal..."
          variant="outlined"
          density="compact"
          rounded="lg"
          hide-details
        />
      </div>

      <!-- Nota -->
      <div class="tf-field">
        <label class="tf-label">Nota / Referencia</label>
        <v-textarea
          v-model="form.note"
          placeholder="Referencia interna, número de orden, etc."
          variant="outlined"
          density="compact"
          rounded="lg"
          rows="2"
          hide-details
        />
      </div>

      <!-- Buscador de productos -->
      <div class="tf-field">
        <label class="tf-label">Agregar productos</label>
        <div class="tf-search-row">
          <v-text-field
            v-model="searchQ"
            placeholder="Nombre, SKU o escanear código de barras..."
            variant="outlined"
            density="compact"
            rounded="lg"
            hide-details
            :prepend-inner-icon="searching ? undefined : 'mdi-barcode-scan'"
            :loading="searching"
            clearable
            @input="onSearch"
            @click:clear="searchResults = []"
            autofocus
          />
        </div>
        <!-- Resultados búsqueda -->
        <div v-if="searchResults.length" class="tf-search-results">
          <div
            v-for="p in searchResults" :key="p.id"
            class="tf-search-item"
            @click="addProduct(p)"
          >
            <v-avatar size="36" rounded="md" class="mr-2 flex-shrink-0">
              <v-img v-if="p.images?.[0]?.url" :src="p.images[0].url" cover />
              <v-icon v-else size="18" color="secondary">mdi-package-variant</v-icon>
            </v-avatar>
            <div class="tf-search-item__info">
              <span class="tf-search-item__name">{{ p.name }}</span>
              <span class="tf-search-item__sku">
                {{ [p.sku, p.barcode].filter(Boolean).join(" · ") }}
              </span>
            </div>
            <div class="tf-search-item__stock ml-2 flex-shrink-0">
              <v-icon size="11">mdi-package-variant</v-icon>
              <span :class="p.stock_qty > 0 ? 'tf-stock--ok' : 'tf-stock--zero'">
                {{ p.stock_qty ?? 0 }} en stock
              </span>
            </div>
            <v-icon size="18" color="primary" class="ml-2 flex-shrink-0">mdi-plus-circle-outline</v-icon>
          </div>
        </div>
        <div v-else-if="searchQ && !searching" class="tf-no-results">
          Sin resultados para "{{ searchQ }}"
        </div>
      </div>

      <!-- Items seleccionados -->
      <div v-if="form.items.length" class="tf-items">
        <label class="tf-label">Productos a derivar ({{ form.items.length }})</label>
        <div class="tf-item" v-for="(item, idx) in form.items" :key="item.product_id"
             :class="{ 'tf-item--over': item.qty_sent > item.stock_qty }">
          <div class="tf-item__info">
            <span class="tf-item__name">{{ item.name }}</span>
            <span class="tf-item__sku">{{ item.sku }}</span>
            <span class="tf-item__stock">
              <v-icon size="11">mdi-package-variant</v-icon>
              Disponible: {{ item.stock_qty ?? "?" }}
              <span v-if="item.qty_sent > item.stock_qty" class="tf-item__over-warn">
                — excede stock
              </span>
            </span>
          </div>
          <div class="tf-item__qty">
            <v-btn icon size="x-small" variant="text" @click="changeQty(idx, -1)"><v-icon>mdi-minus</v-icon></v-btn>
            <input
              type="number"
              class="tf-qty-input"
              :class="{ 'tf-qty-input--over': item.qty_sent > item.stock_qty }"
              v-model.number="item.qty_sent"
              min="1"
              :max="item.stock_qty || 9999"
              @change="item.qty_sent = Math.max(1, item.qty_sent)"
            />
            <v-btn icon size="x-small" variant="text" @click="changeQty(idx, 1)"><v-icon>mdi-plus</v-icon></v-btn>
          </div>
          <v-btn icon size="x-small" variant="text" color="error" @click="removeItem(idx)">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </div>

      <v-alert v-if="error" type="error" variant="tonal" rounded="lg" density="compact" class="mt-3">{{ error }}</v-alert>
    </v-card-text>

    <v-divider />
    <v-card-actions class="tf-actions">
      <v-btn variant="text" @click="$emit('close')">Cancelar</v-btn>
      <v-spacer />
      <v-btn
        color="primary" variant="flat" rounded="lg"
        :loading="saving"
        :disabled="!form.to_branch_id || !form.items.length"
        @click="save"
      >
        Crear borrador
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { createTransfer, listBranchesApi, searchProducts } from "../service/stockTransfer.api";

const props = defineProps({
  currentWarehouseId: { type: Number, default: null },
  currentBranchId:    { type: Number, default: null },
});
const emit = defineEmits(["created", "close"]);

const branches      = ref([]);
const searchQ       = ref("");
const searchResults = ref([]);
const searching     = ref(false);
const saving        = ref(false);
const error         = ref("");
let   searchTimer   = null;

const form = ref({ to_branch_id: null, note: "", items: [] });

onMounted(async () => {
  const { data } = await listBranchesApi();
  // Excluir la sucursal actual (no enviarse a sí mismo)
  branches.value = (data.branches || data.data || []).filter(
    (b) => b.id !== props.currentBranchId
  );
});

// Buscar productos con debounce (150ms — más ágil para código de barras)
function onSearch() {
  clearTimeout(searchTimer);
  const q = searchQ.value.trim();
  if (!q) { searchResults.value = []; searching.value = false; return; }
  searching.value = true;
  searchTimer = setTimeout(async () => {
    try {
      const { data } = await searchProducts({ search: q, limit: 12, branchId: props.currentBranchId });
      const existing = new Set(form.value.items.map((i) => i.product_id));
      const results = (data.products || data.data || []).filter((p) => !existing.has(p.id));
      searchResults.value = results;
      // Si hay exactamente 1 resultado por código de barras → agregar automáticamente
      if (results.length === 1) {
        const p = results[0];
        const barcode = String(p.barcode || p.code || "").trim();
        if (barcode && barcode === q.trim()) {
          addProduct(p);
          return;
        }
      }
    } catch {
      searchResults.value = [];
    } finally {
      searching.value = false;
    }
  }, 150);
}

function addProduct(p) {
  const stockQty = parseFloat(p.stock_qty ?? 0) || 0;
  form.value.items.push({
    product_id: p.id,
    name:       p.name,
    sku:        p.sku || p.barcode || "",
    qty_sent:   Math.min(1, stockQty) || 1, // no superar el stock disponible
    stock_qty:  stockQty,
    isNew:      false, // se determinará en recepción
  });
  searchQ.value = "";
  searchResults.value = [];
}

function removeItem(idx) { form.value.items.splice(idx, 1); }
function changeQty(idx, delta) {
  const item = form.value.items[idx];
  const newQty = Math.max(1, (item.qty_sent || 1) + delta);
  // Advertir si supera el stock, pero no bloquear (el backend valida al despachar)
  item.qty_sent = newQty;
}

async function save() {
  error.value = "";
  saving.value = true;
  try {
    const payload = {
      to_branch_id: form.value.to_branch_id,
      note:         form.value.note || null,
      items:        form.value.items.map((i) => ({ product_id: i.product_id, qty_sent: i.qty_sent })),
    };
    await createTransfer(payload);
    emit("created");
  } catch (e) {
    error.value = e?.response?.data?.message || "Error al crear la derivación";
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.tf-title { font-size: 15px; font-weight: 700; padding: 16px 20px; display: flex; align-items: center; }
.tf-body  { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.tf-label { display: block; font-size: 12px; font-weight: 600;
            color: rgba(var(--v-theme-on-surface),.6); margin-bottom: 6px; }
.tf-field { display: flex; flex-direction: column; }

.tf-search-row { margin-bottom: 6px; }
.tf-search-results {
  border: 1px solid rgba(var(--v-theme-on-surface),.1); border-radius: 10px; overflow: hidden;
}
.tf-search-item {
  display: flex; align-items: center; padding: 8px 12px; cursor: pointer;
  transition: background .12s;
}
.tf-search-item:hover { background: rgba(var(--v-theme-primary),.06); }
.tf-search-item + .tf-search-item { border-top: 1px solid rgba(var(--v-theme-on-surface),.06); }
.tf-search-item__info { flex: 1; display: flex; flex-direction: column; }
.tf-search-item__name { font-size: 13px; font-weight: 500; }
.tf-search-item__sku  { font-size: 11px; color: rgba(var(--v-theme-on-surface),.45); }
.tf-no-results { font-size: 12px; color: rgba(var(--v-theme-on-surface),.4);
  padding: 10px 12px; text-align: center; }
.tf-search-item__stock { font-size: 10px; display: flex; align-items: center; gap: 2px;
  white-space: nowrap; }
.tf-stock--ok   { color: #2e7d32; font-weight: 600; }
.tf-stock--zero { color: #c62828; font-weight: 600; }
.tf-qty-input--over { border-color: #e65100 !important; color: #e65100; }

.tf-items { display: flex; flex-direction: column; gap: 6px; }
.tf-item {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px;
  border: 1px solid rgba(var(--v-theme-on-surface),.08); border-radius: 10px;
  background: rgba(var(--v-theme-surface-variant),.4);
}
.tf-item__info  { flex: 1; display: flex; flex-direction: column; }
.tf-item__name  { font-size: 13px; font-weight: 500; }
.tf-item__sku   { font-size: 11px; color: rgba(var(--v-theme-on-surface),.45); }
.tf-item__new   { font-size: 10px; color: rgb(var(--v-theme-primary)); font-weight: 600; margin-top: 2px; }
.tf-item__stock { font-size: 10px; color: rgba(var(--v-theme-on-surface),.45); margin-top: 2px;
  display: flex; align-items: center; gap: 3px; }
.tf-item__over-warn { color: #e65100; font-weight: 600; }
.tf-item--over  { border-color: rgba(230,81,0,.4) !important; }
.tf-item__qty   { display: flex; align-items: center; gap: 4px; }
.tf-qty-input {
  width: 44px; text-align: center; font-size: 13px; font-weight: 600;
  border: 1px solid rgba(var(--v-theme-on-surface),.2); border-radius: 6px; padding: 2px 4px;
  background: transparent; color: inherit;
}
.tf-actions { padding: 12px 16px; }
</style>
