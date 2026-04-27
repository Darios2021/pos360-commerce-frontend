<template>
  <v-card rounded="xl" class="tf">
    <!-- ── HEADER ───────────────────────────────────────── -->
    <header class="tf-head">
      <div class="tf-head__left">
        <div class="tf-head__icon">
          <v-icon size="22" color="white">mdi-truck-fast-outline</v-icon>
        </div>
        <div class="tf-head__titles">
          <p class="tf-head__eyebrow">Stock · Derivaciones</p>
          <h2 class="tf-head__title">Armar nueva derivación</h2>
        </div>
      </div>
      <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('close')" />
    </header>

    <!-- ── SETUP ROW (destino + nota) ───────────────────── -->
    <section class="tf-setup">
      <div class="tf-setup__field tf-setup__field--main">
        <label class="tf-label">
          <v-icon size="13">mdi-store-marker-outline</v-icon>
          Sucursal destino
          <span class="tf-required">*</span>
        </label>
        <v-select
          v-model="form.to_branch_id"
          :items="branches"
          item-title="name"
          item-value="id"
          placeholder="Seleccionar sucursal..."
          variant="outlined"
          density="compact"
          hide-details
          rounded="lg"
        />
      </div>
      <div class="tf-setup__field">
        <label class="tf-label">
          <v-icon size="13">mdi-text</v-icon>
          Nota / Referencia
        </label>
        <v-text-field
          v-model="form.note"
          placeholder="Nº de orden, observación..."
          variant="outlined"
          density="compact"
          hide-details
          rounded="lg"
        />
      </div>
    </section>

    <!-- ── BODY 2-COL ───────────────────────────────────── -->
    <div class="tf-body">

      <!-- ── CATÁLOGO ───────────────────────────────────── -->
      <section class="tf-catalog">
        <div class="tf-catalog__head">
          <div class="tf-catalog__title">
            <v-icon size="16" color="primary">mdi-package-variant</v-icon>
            <span>Catálogo</span>
            <v-chip v-if="searchResults.length" size="x-small" variant="tonal">
              {{ searchResults.length }} resultado{{ searchResults.length === 1 ? '' : 's' }}
            </v-chip>
          </div>
          <v-btn
            variant="tonal"
            size="x-small"
            rounded="lg"
            prepend-icon="mdi-plus"
            color="primary"
            @click="openCreateProduct"
          >
            Crear producto
          </v-btn>
        </div>

        <!-- Search -->
        <div class="tf-search">
          <v-text-field
            v-model="searchQ"
            :placeholder="searchQ ? '' : 'Buscar por nombre, SKU o escanear código…'"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            rounded="lg"
            :prepend-inner-icon="searching ? undefined : 'mdi-barcode-scan'"
            :loading="searching"
            autofocus
            @input="onSearch"
            @click:clear="clearSearch"
          />
        </div>

        <!-- Resultados -->
        <div class="tf-catalog__body">
          <!-- Empty (sin búsqueda) -->
          <div v-if="!searchQ && !searchResults.length" class="tf-empty">
            <v-icon size="48" color="medium-emphasis">mdi-magnify-scan</v-icon>
            <div class="tf-empty__title">Buscá un producto para empezar</div>
            <div class="tf-empty__sub">
              Por nombre, SKU o escaneando un código de barras
            </div>
          </div>

          <!-- Empty (sin resultados) -->
          <div v-else-if="searchQ && !searching && !searchResults.length" class="tf-empty">
            <v-icon size="48" color="medium-emphasis">mdi-package-variant-closed-remove</v-icon>
            <div class="tf-empty__title">Sin resultados para "{{ searchQ }}"</div>
            <div class="tf-empty__sub">Verificá el nombre o creá el producto si no existe.</div>
            <v-btn
              variant="tonal"
              color="primary"
              size="small"
              rounded="lg"
              prepend-icon="mdi-plus"
              class="mt-2"
              @click="openCreateProduct"
            >
              Crear producto nuevo
            </v-btn>
          </div>

          <!-- Grid de cards -->
          <div v-else class="tf-grid">
            <button
              v-for="p in searchResults"
              :key="p.id"
              type="button"
              class="tf-card"
              :class="{ 'tf-card--zero': (p.stock_qty ?? 0) <= 0 }"
              @click="addProduct(p)"
            >
              <div class="tf-card__media">
                <img v-if="getProductImage(p)" :src="getProductImage(p)" :alt="p.name" />
                <div v-else class="tf-card__noimg">
                  <v-icon size="34">mdi-package-variant-closed</v-icon>
                </div>
                <span
                  class="tf-card__stock"
                  :class="stockLevelClass(p.stock_qty)"
                  :title="`Stock disponible: ${p.stock_qty ?? 0}`"
                >
                  <v-icon size="11">mdi-package-variant-closed</v-icon>
                  {{ p.stock_qty ?? 0 }}
                </span>
              </div>
              <div class="tf-card__info">
                <div class="tf-card__name" :title="p.name">{{ p.name }}</div>
                <div v-if="p.sku || p.barcode" class="tf-card__sku">
                  {{ [p.sku, p.barcode].filter(Boolean).join(" · ") }}
                </div>
              </div>
              <div class="tf-card__add">
                <v-icon size="16">mdi-plus-circle</v-icon>
                <span>Agregar</span>
              </div>
            </button>
          </div>
        </div>
      </section>

      <!-- ── PAQUETE ────────────────────────────────────── -->
      <section class="tf-package" :class="{ 'tf-package--filled': form.items.length }">
        <div class="tf-package__head">
          <div class="tf-package__title">
            <v-icon size="18" :color="form.items.length ? 'primary' : undefined">
              {{ form.items.length ? 'mdi-package-variant-closed-check' : 'mdi-package-variant' }}
            </v-icon>
            <span>Paquete</span>
            <v-chip
              v-if="form.items.length"
              size="x-small"
              :color="hasOverStock ? 'warning' : 'primary'"
              variant="flat"
            >
              {{ form.items.length }} ítem{{ form.items.length === 1 ? '' : 's' }}
            </v-chip>
          </div>
          <v-btn
            v-if="form.items.length"
            variant="text"
            size="x-small"
            rounded="lg"
            color="error"
            @click="clearPackage"
          >
            <v-icon start size="13">mdi-trash-can-outline</v-icon>
            Vaciar
          </v-btn>
        </div>

        <div class="tf-package__body">
          <!-- Empty -->
          <div v-if="!form.items.length" class="tf-package__empty">
            <div class="tf-package__empty-box">
              <v-icon size="44" color="medium-emphasis">mdi-package-variant</v-icon>
            </div>
            <div class="tf-package__empty-title">Paquete vacío</div>
            <div class="tf-package__empty-sub">
              Buscá productos en el catálogo y tocá <b>Agregar</b> para armar la derivación.
            </div>
          </div>

          <!-- Items -->
          <div v-else class="tf-package__list">
            <div
              v-for="(item, idx) in form.items"
              :key="item.product_id"
              class="tf-line"
              :class="{ 'tf-line--over': item.qty_sent > item.stock_qty }"
            >
              <div class="tf-line__main">
                <div class="tf-line__name" :title="item.name">{{ item.name }}</div>
                <div class="tf-line__meta">
                  <span v-if="item.sku" class="tf-line__sku">{{ item.sku }}</span>
                  <span class="tf-line__stock">
                    <v-icon size="10">mdi-package-variant</v-icon>
                    Disp. {{ item.stock_qty ?? '?' }}
                  </span>
                  <span v-if="item.qty_sent > item.stock_qty" class="tf-line__over-warn">
                    <v-icon size="10">mdi-alert</v-icon>
                    excede
                  </span>
                </div>
              </div>

              <div class="tf-line__qty">
                <v-btn
                  icon
                  size="x-small"
                  variant="tonal"
                  rounded="md"
                  :disabled="item.qty_sent <= 1"
                  @click="changeQty(idx, -1)"
                >
                  <v-icon size="14">mdi-minus</v-icon>
                </v-btn>
                <input
                  type="number"
                  class="tf-qty-input"
                  :class="{ 'tf-qty-input--over': item.qty_sent > item.stock_qty }"
                  v-model.number="item.qty_sent"
                  min="1"
                  :max="item.stock_qty || 9999"
                  @change="item.qty_sent = Math.max(1, Number(item.qty_sent) || 1)"
                />
                <v-btn
                  icon
                  size="x-small"
                  variant="tonal"
                  rounded="md"
                  @click="changeQty(idx, 1)"
                >
                  <v-icon size="14">mdi-plus</v-icon>
                </v-btn>
              </div>

              <v-btn
                icon
                size="x-small"
                variant="text"
                color="error"
                @click="removeItem(idx)"
              >
                <v-icon size="16">mdi-close</v-icon>
              </v-btn>
            </div>
          </div>
        </div>

        <!-- Resumen -->
        <div v-if="form.items.length" class="tf-package__summary">
          <div class="tf-summary__row">
            <span class="tf-summary__lbl">Productos</span>
            <span class="tf-summary__val">{{ form.items.length }}</span>
          </div>
          <div class="tf-summary__row">
            <span class="tf-summary__lbl">Unidades totales</span>
            <span class="tf-summary__val">{{ totalUnits }}</span>
          </div>
          <div v-if="hasOverStock" class="tf-summary__warn">
            <v-icon size="13" color="warning">mdi-alert-circle</v-icon>
            <span>Algunos ítems exceden el stock disponible. Se validará al despachar.</span>
          </div>
        </div>
      </section>
    </div>

    <!-- ── ERROR ────────────────────────────────────────── -->
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      density="compact"
      rounded="lg"
      class="tf-error"
    >
      {{ error }}
    </v-alert>

    <!-- ── FOOTER ───────────────────────────────────────── -->
    <footer class="tf-footer">
      <div class="tf-footer__check">
        <v-icon
          size="14"
          :color="canSave ? 'success' : 'medium-emphasis'"
        >
          {{ canSave ? 'mdi-check-circle' : 'mdi-checkbox-blank-circle-outline' }}
        </v-icon>
        <span v-if="!form.to_branch_id">Elegí la sucursal destino</span>
        <span v-else-if="!form.items.length">Agregá al menos un producto</span>
        <span v-else>Listo para crear el borrador</span>
      </div>

      <div class="tf-footer__actions">
        <v-btn variant="text" size="small" rounded="lg" @click="$emit('close')">
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          size="small"
          rounded="lg"
          prepend-icon="mdi-content-save-outline"
          :loading="saving"
          :disabled="!canSave"
          @click="save"
        >
          Crear borrador
        </v-btn>
      </div>
    </footer>

    <!-- ── MODAL: crear producto ───────────────────────── -->
    <ProductFormDialog
      v-model:open="productDlgOpen"
      mode="create"
      :item="null"
      @saved="onProductCreated"
    />
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { createTransfer, listBranchesApi, searchProducts } from "../service/stockTransfer.api";
import ProductFormDialog from "@/modules/products/components/ProductFormDialog.vue";

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
const productDlgOpen = ref(false);
let   searchTimer   = null;

const form = ref({ to_branch_id: null, note: "", items: [] });

onMounted(async () => {
  const { data } = await listBranchesApi();
  branches.value = (data.branches || data.data || []).filter(
    (b) => b.id !== props.currentBranchId
  );
});

const totalUnits = computed(() =>
  form.value.items.reduce((acc, it) => acc + Math.max(1, Number(it.qty_sent) || 0), 0)
);

const hasOverStock = computed(() =>
  form.value.items.some((it) => Number(it.qty_sent) > Number(it.stock_qty))
);

const canSave = computed(() => !!form.value.to_branch_id && form.value.items.length > 0 && !saving.value);

function getProductImage(p) {
  const imgs = p?.images;
  if (Array.isArray(imgs) && imgs.length) {
    const first = imgs[0];
    return typeof first === "string" ? first : first?.url || first?.thumbnail || null;
  }
  return p?.thumbnail || p?.image_url || p?.image || null;
}

function stockLevelClass(qty) {
  const n = Number(qty || 0);
  if (n <= 0) return "level-out";
  if (n < 5) return "level-low";
  if (n <= 10) return "level-mid";
  return "level-high";
}

function clearSearch() {
  searchQ.value = "";
  searchResults.value = [];
}

function onSearch() {
  clearTimeout(searchTimer);
  const q = searchQ.value?.trim?.() || "";
  if (!q) { searchResults.value = []; searching.value = false; return; }
  searching.value = true;
  searchTimer = setTimeout(async () => {
    try {
      const { data } = await searchProducts({ search: q, limit: 18, branchId: props.currentBranchId });
      const existing = new Set(form.value.items.map((i) => i.product_id));
      const results = (data.products || data.data || []).filter((p) => !existing.has(p.id));
      searchResults.value = results;
      // Auto-add si vino exacto el barcode
      if (results.length === 1) {
        const p = results[0];
        const barcode = String(p.barcode || p.code || "").trim();
        if (barcode && barcode === q.trim()) {
          addProduct(p);
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
    qty_sent:   stockQty > 0 ? 1 : 1,
    stock_qty:  stockQty,
    isNew:      false,
  });
  // Limpiar búsqueda y dejar foco para seguir escaneando
  searchQ.value = "";
  searchResults.value = [];
}

function removeItem(idx) { form.value.items.splice(idx, 1); }

function changeQty(idx, delta) {
  const item = form.value.items[idx];
  const newQty = Math.max(1, (Number(item.qty_sent) || 1) + delta);
  item.qty_sent = newQty;
}

function clearPackage() {
  if (!form.value.items.length) return;
  if (window.confirm("¿Vaciar todos los productos del paquete?")) {
    form.value.items = [];
  }
}

function openCreateProduct() {
  productDlgOpen.value = true;
}

async function onProductCreated(payload) {
  productDlgOpen.value = false;
  // Si el dialog devuelve el producto creado, lo agregamos directo al paquete
  const created = payload?.product || payload?.data || payload;
  if (created && created.id) {
    form.value.items.push({
      product_id: created.id,
      name:       created.name,
      sku:        created.sku || created.barcode || "",
      qty_sent:   1,
      stock_qty:  Number(created.stock_qty || 0),
      isNew:      true,
    });
  } else if (searchQ.value) {
    // Fallback: re-buscar lo último escrito por si vuelve sólo evento
    onSearch();
  }
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
.tf {
  --tf-radius: 14px;
  --tf-radius-sm: 10px;
  --tf-card-bg: rgb(var(--v-theme-surface));
  --tf-card-border: rgba(var(--v-border-color), var(--v-border-opacity));
  --tf-muted: rgba(var(--v-theme-on-surface), 0.55);
  --tf-strong: rgba(var(--v-theme-on-surface), 0.9);

  display: flex;
  flex-direction: column;
  max-height: 92vh;
  overflow: hidden;
}

/* HEADER */
.tf-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px 14px;
  border-bottom: 1px solid var(--tf-card-border);
}
.tf-head__left { display: flex; align-items: center; gap: 12px; min-width: 0; }
.tf-head__icon {
  width: 40px; height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)), rgba(var(--v-theme-primary), 0.7));
  display: grid; place-items: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.25);
}
.tf-head__titles { display: flex; flex-direction: column; min-width: 0; }
.tf-head__eyebrow {
  margin: 0;
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tf-muted);
}
.tf-head__title {
  margin: 1px 0 0;
  font-size: 18px;
  font-weight: 900;
  line-height: 1.15;
  letter-spacing: -0.01em;
}

/* SETUP */
.tf-setup {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 12px;
  padding: 14px 20px;
  background: rgba(var(--v-theme-on-surface), 0.02);
  border-bottom: 1px solid var(--tf-card-border);
}
.tf-setup__field { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.tf-label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--tf-muted);
}
.tf-required { color: rgb(var(--v-theme-error)); margin-left: 2px; }

/* BODY */
.tf-body {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 0;
  flex: 1;
  min-height: 0;
}

/* CATÁLOGO */
.tf-catalog {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-right: 1px solid var(--tf-card-border);
}
.tf-catalog__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 8px;
  flex-shrink: 0;
}
.tf-catalog__title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.01em;
}
.tf-search {
  padding: 0 16px 12px;
  flex-shrink: 0;
}
.tf-search :deep(.v-field) { border-radius: 10px; }
.tf-catalog__body {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 16px;
  min-height: 0;
}

.tf-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 20px;
  gap: 6px;
  min-height: 220px;
}
.tf-empty__title {
  font-size: 14px;
  font-weight: 700;
  margin-top: 4px;
}
.tf-empty__sub {
  font-size: 12px;
  color: var(--tf-muted);
}

/* GRID DE CARDS */
.tf-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
}
.tf-card {
  position: relative;
  display: flex;
  flex-direction: column;
  text-align: left;
  border-radius: var(--tf-radius-sm);
  background: var(--tf-card-bg);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  cursor: pointer;
  overflow: hidden;
  padding: 0;
  transition: border-color 0.14s, box-shadow 0.14s, transform 0.14s;
  min-width: 0;
}
.tf-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.5);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}
.tf-card:hover .tf-card__add {
  background: rgba(var(--v-theme-primary), 0.16);
  color: rgb(var(--v-theme-primary));
}
.tf-card--zero { opacity: 0.65; }

.tf-card__media {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  overflow: hidden;
}
.tf-card__media img {
  position: absolute;
  inset: 0;
  width: 100%; height: 100%;
  object-fit: cover;
}
.tf-card__noimg {
  position: absolute;
  inset: 0;
  display: grid; place-items: center;
  color: rgba(var(--v-theme-on-surface), 0.3);
}
.tf-card__stock {
  position: absolute;
  top: 6px; left: 6px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 7px;
  border-radius: 7px;
  color: #fff;
  font-size: 10.5px;
  font-weight: 800;
  line-height: 1;
  font-feature-settings: "tnum";
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.22);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  z-index: 2;
}
.tf-card__stock.level-high { background: rgb(var(--v-theme-success)); }
.tf-card__stock.level-mid  { background: rgb(var(--v-theme-warning)); }
.tf-card__stock.level-low,
.tf-card__stock.level-out  { background: rgb(var(--v-theme-error)); }

.tf-card__info {
  padding: 8px 10px 6px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-height: 56px;
}
.tf-card__name {
  font-size: 12px;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.005em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}
.tf-card__sku {
  font-size: 10.5px;
  color: rgba(var(--v-theme-on-surface), 0.55);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tf-card__add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 10px;
  margin: 0 8px 8px;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  color: rgba(var(--v-theme-on-surface), 0.65);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  transition: background 0.14s, color 0.14s;
}

/* PAQUETE */
.tf-package {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: rgba(var(--v-theme-on-surface), 0.015);
}
.tf-package--filled { background: rgba(var(--v-theme-primary), 0.04); }
.tf-package__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--tf-card-border);
  flex-shrink: 0;
}
.tf-package__title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.01em;
}
.tf-package__body {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.tf-package__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 20px;
  gap: 6px;
  height: 100%;
  min-height: 220px;
}
.tf-package__empty-box {
  width: 76px; height: 76px;
  border-radius: 16px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 2px dashed rgba(var(--v-theme-on-surface), 0.14);
  display: grid; place-items: center;
  margin-bottom: 6px;
}
.tf-package__empty-title {
  font-size: 14px;
  font-weight: 800;
}
.tf-package__empty-sub {
  font-size: 12px;
  color: var(--tf-muted);
  max-width: 220px;
  line-height: 1.4;
}

.tf-package__list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
}
.tf-line {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  transition: border-color 0.14s, background 0.14s;
}
.tf-line:hover { border-color: rgba(var(--v-theme-primary), 0.3); }
.tf-line--over {
  border-color: rgba(var(--v-theme-warning), 0.5);
  background: rgba(var(--v-theme-warning), 0.06);
}
.tf-line__main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.tf-line__name {
  font-size: 12.5px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tf-line__meta {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  color: var(--tf-muted);
}
.tf-line__sku {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  padding: 1px 5px;
  border-radius: 4px;
  background: rgba(var(--v-theme-on-surface), 0.06);
}
.tf-line__stock { display: inline-flex; align-items: center; gap: 3px; }
.tf-line__over-warn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: rgb(var(--v-theme-warning));
  font-weight: 700;
}
.tf-line__qty {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.tf-qty-input {
  width: 44px;
  height: 26px;
  text-align: center;
  font-size: 12.5px;
  font-weight: 800;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.16);
  border-radius: 6px;
  background: transparent;
  color: inherit;
  outline: none;
  font-feature-settings: "tnum";
  -moz-appearance: textfield;
}
.tf-qty-input::-webkit-outer-spin-button,
.tf-qty-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.tf-qty-input:focus { border-color: rgb(var(--v-theme-primary)); }
.tf-qty-input--over {
  border-color: rgb(var(--v-theme-warning)) !important;
  color: rgb(var(--v-theme-warning));
}

/* SUMMARY */
.tf-package__summary {
  padding: 10px 14px;
  border-top: 1px solid var(--tf-card-border);
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: rgb(var(--v-theme-surface));
  flex-shrink: 0;
}
.tf-summary__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12.5px;
}
.tf-summary__lbl {
  color: var(--tf-muted);
  font-weight: 600;
}
.tf-summary__val {
  font-weight: 900;
  font-size: 14px;
  font-feature-settings: "tnum";
}
.tf-summary__warn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 4px;
  padding: 6px 8px;
  border-radius: 8px;
  background: rgba(var(--v-theme-warning), 0.1);
  color: rgb(var(--v-theme-warning));
  font-size: 11px;
  font-weight: 700;
}

/* ERROR */
.tf-error {
  margin: 10px 16px 0 !important;
}

/* FOOTER */
.tf-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 18px;
  border-top: 1px solid var(--tf-card-border);
  background: rgba(var(--v-theme-on-surface), 0.02);
  flex-shrink: 0;
}
.tf-footer__check {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--tf-muted);
}
.tf-footer__actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* RESPONSIVE */
@media (max-width: 960px) {
  .tf { max-height: 100vh; }
  .tf-setup {
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 12px 14px;
  }
  .tf-body {
    grid-template-columns: 1fr;
  }
  .tf-catalog {
    border-right: none;
    border-bottom: 1px solid var(--tf-card-border);
    max-height: 60vh;
  }
  .tf-grid {
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 8px;
  }
  .tf-head { padding: 14px 16px 12px; }
  .tf-head__title { font-size: 16px; }
  .tf-package__body { max-height: 40vh; }
}

@media (max-width: 480px) {
  .tf-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .tf-card__name { font-size: 11.5px; }
  .tf-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  .tf-footer__actions { justify-content: flex-end; }
}
</style>
