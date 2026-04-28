<template>
  <!-- ════════════════════════════════════════════════════════════════
       MOBILE: layout dedicado, app-like.
       Eje del flow: armar el paquete escaneando o buscando.
       Todo lo demás (destino, nota) son chips compactos.
  ════════════════════════════════════════════════════════════════ -->
  <v-card v-if="isMobile" rounded="0" class="tfm" flat>
    <!-- Header sticky -->
    <header class="tfm-head">
      <button class="tfm-head__close" @click="$emit('close')" aria-label="Cerrar">
        <v-icon size="22">mdi-close</v-icon>
      </button>
      <div class="tfm-head__title">Nueva derivación</div>
      <div class="tfm-head__count" v-if="form.items.length">
        {{ form.items.length }}
      </div>
      <span v-else class="tfm-head__count-spacer" />
    </header>

    <!-- Chips de configuración: destino + nota (clicables para editar) -->
    <div class="tfm-setup">
      <button
        class="tfm-chip tfm-chip--destino"
        :class="{ 'is-empty': !form.to_branch_id }"
        @click="openDestinoSheet"
      >
        <v-icon size="16">mdi-store-marker-outline</v-icon>
        <span class="tfm-chip__label">Destino</span>
        <span class="tfm-chip__value">
          {{ destinoLabel || 'Elegir sucursal' }}
        </span>
        <v-icon size="14" class="tfm-chip__chev">mdi-chevron-down</v-icon>
      </button>
      <button
        class="tfm-chip tfm-chip--nota"
        :class="{ 'is-empty': !form.note }"
        @click="openNotaSheet"
      >
        <v-icon size="16">mdi-text</v-icon>
        <span class="tfm-chip__label">Nota</span>
        <span class="tfm-chip__value">
          {{ form.note || 'Sin nota' }}
        </span>
      </button>
    </div>

    <!-- Cuerpo principal: paquete (foco) -->
    <div class="tfm-body">
      <!-- Empty hero: invitación clara -->
      <div v-if="!form.items.length" class="tfm-hero">
        <button class="tfm-hero__scan" @click="scanDialogOpen = true">
          <v-icon size="42">mdi-barcode-scan</v-icon>
        </button>
        <div class="tfm-hero__title">Empezá a escanear</div>
        <div class="tfm-hero__sub">
          Apuntá la cámara al código y los productos se suman al paquete.
        </div>
        <button class="tfm-hero__alt" @click="searchSheetOpen = true">
          <v-icon size="14">mdi-magnify</v-icon>
          O buscalo manualmente
        </button>
      </div>

      <!-- Lista de items del paquete -->
      <div v-else class="tfm-list">
        <div
          v-for="(item, idx) in form.items"
          :key="`${item.product_id}-${idx}`"
          class="tfm-item"
        >
          <div class="tfm-item__main">
            <div class="tfm-item__name">{{ item.name }}</div>
            <div class="tfm-item__meta">
              <span v-if="item.sku">{{ item.sku }}</span>
              <span v-if="item.stock_qty != null" class="tfm-item__stock">
                Disp. {{ item.stock_qty }}
              </span>
              <span v-if="item.qty_sent > item.stock_qty" class="tfm-item__over">
                <v-icon size="11">mdi-alert</v-icon> excede
              </span>
            </div>
          </div>
          <div class="tfm-item__qty">
            <button
              class="tfm-qty-btn"
              :disabled="item.qty_sent <= 1"
              @click="changeQty(idx, -1)"
              aria-label="Restar"
            >
              <v-icon size="16">mdi-minus</v-icon>
            </button>
            <input
              type="number"
              class="tfm-qty-input"
              :class="{ 'is-over': item.qty_sent > item.stock_qty }"
              v-model.number="item.qty_sent"
              min="1"
              @change="item.qty_sent = Math.max(1, Number(item.qty_sent) || 1)"
            />
            <button
              class="tfm-qty-btn"
              @click="changeQty(idx, 1)"
              aria-label="Sumar"
            >
              <v-icon size="16">mdi-plus</v-icon>
            </button>
          </div>
          <button
            class="tfm-item__del"
            @click="removeItem(idx)"
            aria-label="Quitar"
          >
            <v-icon size="18">mdi-close</v-icon>
          </button>
        </div>
      </div>
    </div>

    <!-- FAB: agregar más productos cuando ya hay items -->
    <button
      v-if="form.items.length"
      class="tfm-fab"
      @click="scanDialogOpen = true"
      aria-label="Escanear más"
    >
      <v-icon size="22">mdi-barcode-scan</v-icon>
      <span>Escanear más</span>
    </button>

    <!-- Footer con CTA primario grande -->
    <footer class="tfm-foot">
      <div v-if="error" class="tfm-foot__error">
        <v-icon size="14">mdi-alert-circle</v-icon> {{ error }}
      </div>
      <button
        class="tfm-foot__cta"
        :class="{ 'is-disabled': !canSave }"
        :disabled="!canSave || saving"
        @click="save"
      >
        <v-progress-circular v-if="saving" size="18" width="2" indeterminate color="white" />
        <template v-else>
          <v-icon size="18">mdi-check-bold</v-icon>
          <span>{{ canSave ? 'Crear borrador' : ctaHint }}</span>
        </template>
      </button>
    </footer>

    <!-- Bottom sheets para editar destino y nota -->
    <v-bottom-sheet v-model="destinoSheetOpen" :scrim="true" inset>
      <div class="tfm-sheet">
        <div class="tfm-sheet__handle" />
        <div class="tfm-sheet__title">Sucursal destino</div>
        <div class="tfm-sheet__body">
          <button
            v-for="b in branches"
            :key="b.id"
            class="tfm-branch"
            :class="{ 'is-selected': form.to_branch_id === b.id }"
            @click="form.to_branch_id = b.id; destinoSheetOpen = false"
          >
            <v-icon size="18">mdi-store-outline</v-icon>
            <span>{{ b.name }}</span>
            <v-icon
              v-if="form.to_branch_id === b.id"
              size="20"
              color="primary"
              class="ml-auto"
            >mdi-check-circle</v-icon>
          </button>
        </div>
      </div>
    </v-bottom-sheet>

    <v-bottom-sheet v-model="notaSheetOpen" :scrim="true" inset>
      <div class="tfm-sheet">
        <div class="tfm-sheet__handle" />
        <div class="tfm-sheet__title">Nota / Referencia</div>
        <div class="tfm-sheet__body">
          <v-text-field
            v-model="form.note"
            placeholder="Nº de orden, observación..."
            variant="outlined"
            autofocus
            hide-details
            @keyup.enter="notaSheetOpen = false"
          />
          <v-btn block color="primary" rounded="lg" class="mt-3" @click="notaSheetOpen = false">
            Guardar
          </v-btn>
        </div>
      </div>
    </v-bottom-sheet>

    <!-- Bottom sheet para búsqueda manual -->
    <v-bottom-sheet v-model="searchSheetOpen" :scrim="true" inset>
      <div class="tfm-sheet tfm-sheet--search">
        <div class="tfm-sheet__handle" />
        <div class="tfm-sheet__title">Buscar producto</div>
        <div class="tfm-sheet__body">
          <v-text-field
            v-model="searchQ"
            placeholder="Nombre, SKU o código…"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            autofocus
            prepend-inner-icon="mdi-magnify"
            :loading="searching"
            @input="onSearch"
            @click:clear="clearSearch"
          />
          <div class="tfm-sresults">
            <div v-if="!searchQ" class="tfm-sresults__hint">
              Escribí para buscar productos del catálogo.
            </div>
            <div v-else-if="searching" class="tfm-sresults__hint">
              Buscando…
            </div>
            <div v-else-if="!searchResults.length" class="tfm-sresults__hint">
              Sin resultados para "{{ searchQ }}".
            </div>
            <button
              v-for="p in searchResults"
              :key="p.id"
              class="tfm-sresult"
              @click="addProduct(p); searchSheetOpen = false"
            >
              <div class="tfm-sresult__media">
                <img v-if="getProductImage(p)" :src="getProductImage(p)" />
                <v-icon v-else size="22">mdi-package-variant-closed</v-icon>
              </div>
              <div class="tfm-sresult__info">
                <div class="tfm-sresult__name">{{ p.name }}</div>
                <div class="tfm-sresult__meta">
                  <span v-if="p.sku">{{ p.sku }}</span>
                  <span class="tfm-sresult__stock">Stock: {{ p.stock_qty ?? 0 }}</span>
                </div>
              </div>
              <v-icon size="20" color="primary">mdi-plus-circle</v-icon>
            </button>
          </div>
        </div>
      </div>
    </v-bottom-sheet>

    <!-- Scanner (compartido) -->
    <BarcodeScannerDialog
      v-model="scanDialogOpen"
      mode="emit-product"
      continuous
      title="Armar paquete"
      @product="onScanProductForTransfer"
      @scanned="onScanCodeForTransfer"
    />
  </v-card>

  <!-- ════════════════════════════════════════════════════════════════
       DESKTOP: layout original (sin cambios).
  ════════════════════════════════════════════════════════════════ -->
  <v-card v-else rounded="xl" class="tf">
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
        <!-- Header del catálogo (oculto en mobile para liberar espacio) -->
        <div class="tf-catalog__head">
          <div class="tf-catalog__title">
            <v-icon size="16" color="primary">mdi-package-variant</v-icon>
            <span>Catálogo</span>
            <v-chip v-if="searchResults.length" size="x-small" variant="tonal">
              {{ searchResults.length }} resultado{{ searchResults.length === 1 ? '' : 's' }}
            </v-chip>
          </div>
          <!-- Crear producto: solo en desktop. En mobile se accede via la nav. -->
          <v-btn
            class="tf-create-product"
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

        <!-- Search manual + botón scanner inline (mobile) -->
        <div class="tf-search">
          <v-text-field
            v-model="searchQ"
            :placeholder="searchQ ? '' : 'Buscar por nombre, SKU o código…'"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            rounded="lg"
            :prepend-inner-icon="searching ? undefined : 'mdi-magnify'"
            :loading="searching"
            autofocus
            @input="onSearch"
            @click:clear="clearSearch"
          />
          <button
            v-if="isMobile"
            type="button"
            class="tf-search__scan-btn"
            title="Escanear código de barras"
            aria-label="Escanear"
            @click="scanDialogOpen = true"
          >
            <v-icon size="20">mdi-barcode-scan</v-icon>
          </button>
        </div>
        <BarcodeScannerDialog
          v-model="scanDialogOpen"
          mode="emit-product"
          continuous
          title="Armar paquete"
          @product="onScanProductForTransfer"
          @scanned="onScanCodeForTransfer"
        />

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
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useDisplay } from "vuetify";
import { createTransfer, listBranchesApi, searchProducts } from "../service/stockTransfer.api";
import ProductFormDialog from "@/modules/products/components/ProductFormDialog.vue";
import BarcodeScannerDialog from "@/app/components/BarcodeScannerDialog.vue";

const { mobile: isMobile } = useDisplay();
const scanDialogOpen   = ref(false);
const destinoSheetOpen = ref(false);
const notaSheetOpen    = ref(false);
const searchSheetOpen  = ref(false);

function openDestinoSheet() { destinoSheetOpen.value = true; }
function openNotaSheet()    { notaSheetOpen.value = true; }

// Permite abrir el scanner externamente (ej: desde el FAB del bottom-nav
// cuando el usuario eligió "Armar derivación").
function openScannerExternal() { scanDialogOpen.value = true; }

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
  if (typeof window !== "undefined") {
    window.addEventListener("transfer-form:open-scanner", openScannerExternal);
  }
});
onBeforeUnmount(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("transfer-form:open-scanner", openScannerExternal);
  }
});

const totalUnits = computed(() =>
  form.value.items.reduce((acc, it) => acc + Math.max(1, Number(it.qty_sent) || 0), 0)
);

const hasOverStock = computed(() =>
  form.value.items.some((it) => Number(it.qty_sent) > Number(it.stock_qty))
);

const canSave = computed(() => !!form.value.to_branch_id && form.value.items.length > 0 && !saving.value);

/* ── Helpers para el layout mobile ────────────────────────── */
const destinoLabel = computed(() => {
  if (!form.value.to_branch_id) return "";
  const b = branches.value.find(x => x.id === form.value.to_branch_id);
  return b?.name || "";
});
const ctaHint = computed(() => {
  if (!form.value.to_branch_id) return "Elegí destino";
  if (!form.value.items.length) return "Agregá productos";
  return "Crear borrador";
});

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

/* ── Escaneo cámara (mobile) ──────────────────────────────────────
   Si el código mapea a un producto existente, lo agrega al paquete.
   Si no se encontró, deja el código pegado en el buscador para que
   el usuario decida (crear nuevo, etc.). */
function onScanProductForTransfer(product) {
  if (!product) return;
  // Evitar duplicados: si ya está en el paquete, sumá 1 en vez de duplicar
  const exists = form.value.items.find(it => it.product_id === product.id);
  if (exists) {
    exists.qty_sent = (Number(exists.qty_sent) || 0) + 1;
    searchQ.value = "";
    searchResults.value = [];
    return;
  }
  addProduct(product);
}
function onScanCodeForTransfer(code) {
  // Si no encontró producto, deja el código en el buscador para que
  // el usuario vea el flujo de "crear producto nuevo"
  if (!code) return;
  searchQ.value = String(code);
  onSearch?.();
}

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
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tf-muted);
}
.tf-head__title {
  margin: 1px 0 0;
  font-size: 18px;
  font-weight: 500;
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
  font-weight: 500;
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
  font-weight: 500;
  letter-spacing: 0.01em;
}
.tf-search {
  display: flex;
  gap: 8px;
  align-items: stretch;
  padding: 0 16px 12px;
  flex-shrink: 0;
}
.tf-search :deep(.v-field) { border-radius: 10px; }
.tf-search :deep(.v-text-field) { flex: 1 1 auto; min-width: 0; }

/* Botón scanner inline al lado del input (mobile). Compacto y sutil. */
.tf-search__scan-btn {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #1488d1 0%, #0e6ba8 100%);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(20, 136, 209, 0.30);
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.15s, box-shadow 0.15s;
}
.tf-search__scan-btn:active {
  transform: scale(0.92);
  box-shadow: 0 2px 6px rgba(20, 136, 209, 0.30);
}

/* ─────────────────────────────────────────────────────────
   MOBILE: rediseño app-like.
   - El foco es el PAQUETE (lo que estás armando).
   - El catálogo no ocupa espacio cuando no hay búsqueda activa.
   - Cuando se busca, los resultados aparecen como dropdown ABSOLUTO
     debajo del search (no roba espacio al paquete).
   - Footer fijo abajo con CTA primario destacado.
───────────────────────────────────────────────────────── */
@media (max-width: 600px) {
  /* Header compacto: solo título grande */
  .tf-head { padding: 12px 12px 10px; }
  .tf-head__eyebrow { display: none; }
  .tf-head__title { font-size: 17px; }
  .tf-head__icon { width: 36px; height: 36px; border-radius: 10px; }

  /* Setup row: solo destino y nota, compactos */
  .tf-setup { padding: 8px 12px 10px; gap: 8px; }
  .tf-label { font-size: 11px; }

  /* Header del catálogo: no aporta en mobile */
  .tf-catalog__head { display: none; }
  .tf-create-product { display: none !important; }

  /* El catálogo se vuelve un container relativo para anclar el dropdown */
  .tf-catalog {
    position: relative;
    flex: 0 0 auto !important;     /* no expande verticalmente */
    border: none !important;
    background: transparent !important;
  }
  .tf-search { padding: 6px 12px 4px; }

  /* El body del catálogo (resultados / empty) se convierte en DROPDOWN
     absoluto: sólo aparece cuando hay búsqueda activa. Si está vacío
     (sin q), no se muestra y el paquete ocupa todo el espacio disponible. */
  .tf-catalog__body {
    position: absolute;
    left: 12px;
    right: 12px;
    top: 100%;
    z-index: 5;
    max-height: 320px;
    overflow-y: auto;
    background: rgb(var(--v-theme-surface));
    border: 1px solid rgba(var(--v-theme-on-surface), 0.10);
    border-radius: 14px;
    box-shadow: 0 14px 32px rgba(0, 0, 0, 0.20);
    padding: 6px !important;
  }
  /* Si no hay query, no hay resultados que mostrar → ocultamos el dropdown
     entero (incluido el empty state grande "Buscá un producto..."). */
  .tf-catalog__body:has(.tf-empty:first-child:nth-last-child(1)):not(:has(.tf-grid)) {
    display: none;
  }
  /* Fallback para browsers sin :has(): ocultamos directamente el empty
     "sin búsqueda". El empty "sin resultados" sí queremos verlo. */
  .tf-empty:first-child {
    /* "Buscá un producto..." aparece sólo cuando NO hay query.
       Lo ocultamos en mobile y dejamos que el paquete sea el foco. */
    display: none;
  }

  /* Grid mobile: 1 columna apilada (más legible al tapear) */
  .tf-grid {
    grid-template-columns: 1fr !important;
    gap: 6px !important;
  }
  .tf-card {
    flex-direction: row !important;
    align-items: center;
    padding: 6px !important;
    gap: 10px;
  }
  .tf-card__media {
    width: 56px !important;
    height: 56px !important;
    flex-shrink: 0;
  }
  .tf-card__info { flex: 1 1 auto; min-width: 0; }
  .tf-card__add { padding: 8px !important; }

  /* PAQUETE: ahora es el foco principal de la pantalla */
  .tf-package {
    flex: 1 1 auto !important;
    min-height: 240px;
    border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  }

  /* Empty del paquete: invitación clara y simple, no decorativa */
  .tf-package__empty {
    padding: 22px 16px !important;
  }
  .tf-package__empty-box {
    width: 52px !important;
    height: 52px !important;
    margin-bottom: 10px !important;
  }
  .tf-package__empty-title {
    font-size: 14px !important;
    font-weight: 500;
  }
  .tf-package__empty-sub {
    font-size: 12px !important;
    line-height: 1.45;
  }

  /* Body 2-col → 1-col stack en mobile */
  .tf-body {
    grid-template-columns: 1fr !important;
    gap: 0 !important;
  }

  /* Footer compacto: CTA primario más prominente */
  .tf-footer {
    padding: 10px 12px calc(10px + env(safe-area-inset-bottom, 0px)) !important;
    flex-direction: column;
    align-items: stretch !important;
    gap: 8px !important;
    background: rgb(var(--v-theme-surface));
    border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  }
  .tf-footer__check { justify-content: center; font-size: 11.5px; }
  .tf-footer__actions { justify-content: space-between; gap: 8px; }
  .tf-footer__actions :deep(.v-btn) { flex: 1; min-height: 42px; }
}
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
  font-weight: 400;
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
  font-weight: 500;
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
  font-weight: 400;
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
  font-weight: 500;
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
  font-weight: 500;
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
  font-weight: 500;
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
  font-weight: 400;
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
  font-weight: 400;
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
  font-weight: 500;
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
  font-weight: 400;
}
.tf-summary__val {
  font-weight: 500;
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
  font-weight: 400;
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
  font-weight: 400;
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

/* ════════════════════════════════════════════════════════════
   LAYOUT MOBILE DEDICADO (.tfm)
   App-like: header sticky, chips de configuración, hero CTA
   con scanner, lista de items, FAB, footer con CTA primario.
════════════════════════════════════════════════════════════ */
.tfm {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  background: rgb(var(--v-theme-background));
  overflow: hidden;
}

/* ─── Header ─────────────────────── */
.tfm-head {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: 40px 1fr 40px;
  align-items: center;
  padding: calc(8px + env(safe-area-inset-top, 0px)) 8px 8px;
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  position: sticky;
  top: 0;
  z-index: 5;
}
.tfm-head__close {
  width: 40px; height: 40px;
  border-radius: 12px;
  border: none;
  background: transparent;
  color: rgb(var(--v-theme-on-surface));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.tfm-head__close:active { background: rgba(var(--v-theme-on-surface), 0.06); }
.tfm-head__title {
  font-size: 16px;
  font-weight: 500;
  letter-spacing: -0.1px;
  text-align: center;
}
.tfm-head__count {
  width: 36px; height: 28px;
  margin: 0 auto;
  border-radius: 14px;
  background: #1488d1;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.tfm-head__count-spacer { width: 40px; }

/* ─── Setup chips (destino + nota) ─────────── */
.tfm-setup {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 12px 6px;
  flex-shrink: 0;
}
.tfm-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 11px 14px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.10);
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  cursor: pointer;
  text-align: left;
  -webkit-tap-highlight-color: transparent;
  transition: border-color 0.15s, background 0.15s;
}
.tfm-chip:active {
  background: rgba(var(--v-theme-on-surface), 0.04);
}
.tfm-chip.is-empty {
  border-color: rgba(20, 136, 209, 0.30);
  border-style: dashed;
}
.tfm-chip.is-empty .tfm-chip__value {
  color: rgba(var(--v-theme-on-surface), 0.50);
  font-style: italic;
}
.tfm-chip > .v-icon:first-child {
  color: #1488d1;
  flex-shrink: 0;
}
.tfm-chip__label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.55);
  flex-shrink: 0;
}
.tfm-chip__value {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 13.5px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tfm-chip__chev {
  flex-shrink: 0;
  opacity: 0.4;
}

/* ─── Body (paquete) ─────────────────────── */
.tfm-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 6px 12px 100px; /* deja espacio para el FAB y footer */
}

/* Empty hero */
.tfm-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 36px 16px;
  text-align: center;
  min-height: 320px;
}
.tfm-hero__scan {
  width: 96px;
  height: 96px;
  border-radius: 24px;
  border: none;
  background: linear-gradient(135deg, #1488d1 0%, #0e6ba8 100%);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow:
    0 16px 40px rgba(20, 136, 209, 0.45),
    0 4px 12px rgba(0, 0, 0, 0.18);
  margin-bottom: 18px;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
}
.tfm-hero__scan::before {
  content: "";
  position: absolute;
  inset: -8px;
  border-radius: 28px;
  background: rgba(20, 136, 209, 0.22);
  opacity: 0;
  z-index: -1;
  animation: tfm-pulse 2.4s ease-in-out infinite;
}
@keyframes tfm-pulse {
  0%, 100% { transform: scale(1); opacity: 0; }
  50% { transform: scale(1.18); opacity: 0.55; }
}
.tfm-hero__scan:active { transform: scale(0.94); }
.tfm-hero__title {
  font-size: 18px;
  font-weight: 500;
  letter-spacing: -0.2px;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 6px;
}
.tfm-hero__sub {
  font-size: 13px;
  line-height: 1.45;
  color: rgba(var(--v-theme-on-surface), 0.6);
  max-width: 280px;
  margin-bottom: 18px;
}
.tfm-hero__alt {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: none;
  background: transparent;
  color: #1488d1;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 999px;
  -webkit-tap-highlight-color: transparent;
}
.tfm-hero__alt:active { background: rgba(20, 136, 209, 0.10); }

/* Lista de items */
.tfm-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.tfm-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}
.tfm-item__main { flex: 1 1 auto; min-width: 0; }
.tfm-item__name {
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1.2;
  color: rgb(var(--v-theme-on-surface));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tfm-item__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.55);
}
.tfm-item__stock { color: rgba(var(--v-theme-on-surface), 0.45); }
.tfm-item__over {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: #f59e0b;
  font-weight: 500;
}

.tfm-item__qty {
  display: inline-flex;
  align-items: center;
  gap: 0;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 999px;
  padding: 2px;
  flex-shrink: 0;
}
.tfm-qty-btn {
  width: 28px; height: 28px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: rgb(var(--v-theme-on-surface));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s;
}
.tfm-qty-btn:active { background: rgba(20, 136, 209, 0.18); }
.tfm-qty-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.tfm-qty-input {
  width: 36px;
  text-align: center;
  background: transparent;
  border: none;
  outline: none;
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: rgb(var(--v-theme-on-surface));
}
.tfm-qty-input.is-over { color: #f59e0b; }

.tfm-item__del {
  width: 30px; height: 30px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.45);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  flex-shrink: 0;
}
.tfm-item__del:active {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}

/* FAB para escanear más */
.tfm-fab {
  position: fixed;
  right: 16px;
  bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #1488d1 0%, #0e6ba8 100%);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  box-shadow:
    0 12px 30px rgba(20, 136, 209, 0.45),
    0 4px 10px rgba(0, 0, 0, 0.18);
  -webkit-tap-highlight-color: transparent;
  z-index: 6;
}
.tfm-fab:active { transform: scale(0.96); }

/* Footer con CTA grande */
.tfm-foot {
  flex: 0 0 auto;
  padding: 10px 12px calc(10px + env(safe-area-inset-bottom, 0px));
  background: rgb(var(--v-theme-surface));
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}
.tfm-foot__error {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  margin-bottom: 8px;
  font-size: 12px;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.10);
  border-radius: 8px;
}
.tfm-foot__cta {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #1488d1 0%, #0e6ba8 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.01em;
  cursor: pointer;
  box-shadow: 0 8px 22px rgba(20, 136, 209, 0.32);
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
}
.tfm-foot__cta:active { transform: scale(0.99); }
.tfm-foot__cta.is-disabled,
.tfm-foot__cta:disabled {
  background: rgba(var(--v-theme-on-surface), 0.10);
  color: rgba(var(--v-theme-on-surface), 0.45);
  box-shadow: none;
  cursor: not-allowed;
}

/* ─── Bottom sheets ─────────────────── */
.tfm-sheet {
  background: rgb(var(--v-theme-surface));
  border-radius: 20px 20px 0 0;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.tfm-sheet__handle {
  width: 44px;
  height: 4px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.18);
  margin: 10px auto 4px;
  flex-shrink: 0;
}
.tfm-sheet__title {
  padding: 8px 16px 12px;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: -0.1px;
  color: rgb(var(--v-theme-on-surface));
  flex-shrink: 0;
}
.tfm-sheet__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 0 14px 16px;
}

/* Lista de sucursales */
.tfm-branch {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  cursor: pointer;
  text-align: left;
  font-size: 14px;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 8px;
  -webkit-tap-highlight-color: transparent;
}
.tfm-branch:active { background: rgba(20, 136, 209, 0.06); }
.tfm-branch.is-selected {
  border-color: #1488d1;
  background: rgba(20, 136, 209, 0.06);
}

/* Resultados de búsqueda en sheet */
.tfm-sresults {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 14px;
}
.tfm-sresults__hint {
  text-align: center;
  padding: 22px 12px;
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.55);
}
.tfm-sresult {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: none;
  cursor: pointer;
  text-align: left;
  -webkit-tap-highlight-color: transparent;
}
.tfm-sresult:active { background: rgba(20, 136, 209, 0.10); }
.tfm-sresult__media {
  width: 44px; height: 44px;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  color: rgba(var(--v-theme-on-surface), 0.5);
}
.tfm-sresult__media img { width: 100%; height: 100%; object-fit: cover; }
.tfm-sresult__info { flex: 1 1 auto; min-width: 0; }
.tfm-sresult__name {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: rgb(var(--v-theme-on-surface));
}
.tfm-sresult__meta {
  display: flex;
  gap: 8px;
  margin-top: 2px;
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.55);
}
.tfm-sresult__stock { color: rgba(var(--v-theme-on-surface), 0.45); }

/* Ajustes en dark mode */
.v-theme--adminDark .tfm-chip,
.v-theme--shopDark .tfm-chip,
.v-theme--dark .tfm-chip {
  border-color: rgba(255, 255, 255, 0.08);
}
.v-theme--adminDark .tfm-item,
.v-theme--shopDark .tfm-item,
.v-theme--dark .tfm-item {
  border-color: rgba(255, 255, 255, 0.06);
}
</style>
