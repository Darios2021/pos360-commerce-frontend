<!-- src/modules/admin/pages/EmailPromoBlocksView.vue -->
<!--
  Catálogo de bloques promocionales del CRM email.

  FLUJO SIMPLIFICADO:
   1. Click "Agregar productos" → buscador de productos del catálogo.
   2. Tildás los que querés destacar y "Agregar al catálogo".
   3. El sistema crea un bloque por producto, con imagen + nombre + precio
      tomados automáticamente del catálogo.
   4. Cada bloque permite editar SOLO overrides opcionales (badge, cuotas,
      texto del botón). Para cambiar imagen/precio se edita el producto.
-->
<template>
  <v-container class="mx-auto" style="max-width: 1300px">
    <v-card rounded="xl" elevation="3" class="pa-4">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap ga-2">
        <div>
          <div class="text-h6 font-weight-bold">CRM · Promociones de productos</div>
          <div class="text-caption text-medium-emphasis">
            Elegí productos del catálogo y se arman las piezas automáticamente. Imagen, nombre y precio
            se sincronizan en tiempo real con tu inventario.
          </div>
        </div>

        <div class="d-flex ga-2">
          <v-btn variant="tonal" prepend-icon="mdi-refresh" @click="load" :loading="loading">
            Recargar
          </v-btn>
          <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="openPicker">
            Agregar productos
          </v-btn>
        </div>
      </v-card-title>

      <v-divider class="my-3" />

      <!-- ════════ Barra de envío múltiple ════════ -->
      <div v-if="selectedPromoIds.length" class="promos-bulk">
        <div class="promos-bulk__left">
          <v-icon size="18" color="primary">mdi-checkbox-multiple-marked</v-icon>
          <span><b>{{ selectedPromoIds.length }}</b> promo(s) elegida(s) para enviar juntas</span>
          <button class="promos-bulk__clear" type="button" @click="selectedPromoIds = []">Limpiar</button>
        </div>
        <div class="promos-bulk__right">
          <v-btn color="primary" variant="flat" size="small" rounded="lg"
                 prepend-icon="mdi-send" @click="openSendDialogForSelected">
            Enviar las {{ selectedPromoIds.length }} promos
          </v-btn>
        </div>
      </div>

      <!-- Hint inicial -->
      <div v-else-if="blocks.length" class="promos-tip">
        <v-icon size="14" color="primary">mdi-lightbulb-on-outline</v-icon>
        <span>
          Hacé click en <b>"Enviar"</b> dentro de cualquier promo para mandarla por email o WhatsApp.
          O tildá varias para enviarlas juntas en un mismo mensaje.
        </span>
      </div>

      <v-alert v-if="error" type="error" variant="tonal" class="mb-3 mt-3">{{ error }}</v-alert>

      <!-- Empty state -->
      <div v-if="!loading && !blocks.length" class="text-center py-10">
        <v-icon size="64" color="medium-emphasis">mdi-tag-multiple-outline</v-icon>
        <div class="text-h6 font-weight-bold mt-3">Sin promociones cargadas</div>
        <div class="text-body-2 text-medium-emphasis mt-1">
          Elegí productos de tu catálogo y armamos las piezas automáticamente.
        </div>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" class="mt-4" @click="openPicker">
          Elegir productos
        </v-btn>
      </div>

      <!-- Grid de cards -->
      <v-row v-else dense>
        <v-col v-for="b in blocks" :key="b.id" cols="12" sm="6" md="4" lg="3">
          <div class="promo-card"
               :class="{
                 'promo-card--inactive': !b.active,
                 'promo-card--selected': selectedPromoIds.includes(b.id),
               }"
               @click="b.active ? togglePromoSelection(b.id) : null">
            <!-- Checkbox de selección -->
            <div v-if="b.active" class="promo-card__select" @click.stop>
              <v-checkbox
                :model-value="selectedPromoIds.includes(b.id)"
                hide-details density="compact" color="primary"
                @update:model-value="togglePromoSelection(b.id)"
              />
            </div>

            <div class="promo-card__media">
              <span v-if="b.badge_text" class="promo-card__badge"
                    :style="{ background: b.badge_color || '#e53935' }">
                {{ formatBadge(b.badge_text) }}
              </span>
              <img v-if="b.image_url" :src="b.image_url" :alt="b.title" />
              <div v-else class="promo-card__no-img">
                <v-icon size="40">mdi-image-off-outline</v-icon>
              </div>
              <span v-if="!b.active" class="promo-card__inactive-badge">Inactivo</span>
            </div>

            <div class="promo-card__body">
              <div class="promo-card__title">{{ b.title || "(sin título)" }}</div>
              <div v-if="b.subtitle" class="promo-card__subtitle">{{ b.subtitle }}</div>

              <!-- Precios — siempre mostramos algo, aunque sea placeholder -->
              <div class="promo-card__price-row">
                <span v-if="b.price_original" class="promo-card__price-old">{{ b.price_original }}</span>
                <span v-if="b.price_final" class="promo-card__price-new">{{ b.price_final }}</span>
                <span v-else class="promo-card__price-missing">
                  <v-icon size="11">mdi-alert-circle-outline</v-icon>
                  Sin precio en el producto
                </span>
              </div>

              <div v-if="b.installments_text" class="promo-card__installments">
                <v-icon size="11" class="me-1">mdi-credit-card-outline</v-icon>
                {{ formatInstallments(b.installments_text) }}
              </div>

              <div class="promo-card__cta-line">
                <a v-if="b.product_url" :href="b.product_url" target="_blank" rel="noopener" class="promo-card__cta-link" @click.stop>
                  <v-icon size="14">mdi-open-in-new</v-icon>
                  Ver en el shop
                </a>
              </div>

              <div class="promo-card__meta">
                <span class="promo-card__name">
                  <v-icon size="11" class="me-1">mdi-package-variant-closed</v-icon>
                  Producto #{{ b.product_id || "—" }}
                </span>
                <span class="promo-card__pos">#{{ b.position || 0 }}</span>
              </div>

              <div class="promo-card__actions" @click.stop>
                <v-btn v-if="b.active" size="small" variant="flat" color="primary"
                       prepend-icon="mdi-send" class="promo-card__send-btn"
                       @click="openSendDialogForOne(b)">
                  Enviar
                </v-btn>
                <v-btn size="x-small" variant="text" icon="mdi-tune-variant" @click="openEdit(b)"
                       title="Personalizar" />
                <v-btn size="x-small" variant="text"
                       :icon="b.active ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                       @click="toggleActive(b)" :title="b.active ? 'Pausar' : 'Activar'" />
                <v-btn size="x-small" variant="text" color="error" icon="mdi-delete-outline"
                       @click="confirmDelete(b)" title="Eliminar" />
              </div>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-card>

    <!-- ════════════════ PICKER DE PRODUCTOS ════════════════ -->
    <v-dialog v-model="pickerOpen" max-width="900" scrollable>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center ga-3">
          <v-icon color="primary">mdi-package-variant-closed</v-icon>
          <div class="flex-grow-1">
            <div class="text-h6 font-weight-bold">Elegir productos del catálogo</div>
            <div class="text-caption text-medium-emphasis">
              Tildá los productos que querés destacar en tus emails. Se arma una pieza por cada uno.
            </div>
          </div>
          <v-btn icon="mdi-close" variant="text" @click="pickerOpen = false" />
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-4">
          <div class="d-flex ga-2 align-center mb-3">
            <v-text-field
              v-model="pickerSearch" label="Buscar producto (nombre, SKU, marca)"
              variant="outlined" density="compact" hide-details
              prepend-inner-icon="mdi-magnify"
              @update:model-value="onPickerSearch"
            />
            <v-btn variant="tonal" :loading="pickerLoading" prepend-icon="mdi-refresh"
                   @click="loadPickerProducts">
              Buscar
            </v-btn>
          </div>

          <div v-if="pickerLoading" class="d-flex justify-center py-6">
            <v-progress-circular indeterminate size="32" color="primary" />
          </div>

          <div v-else-if="!pickerProducts.length" class="text-center py-6 text-medium-emphasis">
            No se encontraron productos.
          </div>

          <div v-else class="picker-list">
            <label
              v-for="p in pickerProducts" :key="p.id"
              class="picker-row" :class="{ 'picker-row--selected': selectedProductIds.includes(p.id) }"
            >
              <input
                type="checkbox" class="picker-row__chk"
                :value="p.id" v-model="selectedProductIds"
              />
              <v-avatar size="48" rounded="lg" color="grey-lighten-3" class="picker-row__img">
                <v-img v-if="firstImageOf(p)" :src="firstImageOf(p)" cover />
                <v-icon v-else>mdi-image-outline</v-icon>
              </v-avatar>
              <div class="picker-row__info">
                <div class="picker-row__name">{{ p.name }}</div>
                <div class="picker-row__meta">
                  <span v-if="p.sku" class="picker-row__sku">SKU {{ p.sku }}</span>
                  <span v-if="p.brand" class="picker-row__brand">· {{ p.brand }}</span>
                </div>
              </div>
              <div class="picker-row__prices">
                <span v-if="hasOldPrice(p)" class="picker-row__price-old">{{ fmtPrice(p.price_list) }}</span>
                <span class="picker-row__price">{{ fmtPrice(p.price) || "—" }}</span>
              </div>
            </label>
          </div>

          <!-- Paginación simple -->
          <div v-if="pickerHasMore" class="d-flex justify-center mt-3">
            <v-btn variant="tonal" size="small" :loading="pickerLoading" @click="loadMorePicker">
              Cargar más
            </v-btn>
          </div>
        </v-card-text>

        <v-divider />

        <!-- Defaults compartidos para los bloques recién creados -->
        <v-card-text v-if="selectedProductIds.length" class="pa-4 pt-0">
          <div class="text-caption font-weight-bold text-medium-emphasis mb-2"
               style="letter-spacing: 0.06em; text-transform: uppercase;">
            Aplicar a los {{ selectedProductIds.length }} productos elegidos (opcional)
          </div>
          <v-row dense>
            <v-col cols="12" sm="4">
              <v-text-field v-model="bulkForm.badge_text" label="Badge"
                            placeholder="-30% / HOT SALE / NUEVO"
                            variant="outlined" density="compact" hide-details />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field v-model="bulkForm.installments_text" label="Cuotas"
                            placeholder="12 cuotas sin interés"
                            variant="outlined" density="compact" hide-details />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field v-model="bulkForm.cta_label" label="Texto del botón"
                            placeholder="Comprar ahora"
                            variant="outlined" density="compact" hide-details />
            </v-col>
          </v-row>
          <div class="text-caption text-medium-emphasis mt-2">
            Si dejás los campos vacíos: el badge se calcula automáticamente del descuento del producto
            (si tiene precio_lista &gt; precio), y el botón usa "Comprar ahora".
          </div>
        </v-card-text>

        <v-card-actions class="pa-3">
          <v-btn variant="text" :disabled="creating" @click="pickerOpen = false">Cancelar</v-btn>
          <v-spacer />
          <span v-if="selectedProductIds.length" class="text-caption text-medium-emphasis me-3">
            {{ selectedProductIds.length }} seleccionado{{ selectedProductIds.length !== 1 ? "s" : "" }}
          </span>
          <v-btn color="primary" variant="flat" prepend-icon="mdi-plus"
                 :disabled="!selectedProductIds.length" :loading="creating"
                 @click="createFromSelected">
            Agregar al catálogo
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ════════════════ EDITOR (overrides + flags) ════════════════ -->
    <v-dialog v-model="editorOpen" max-width="780" scrollable>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center ga-3">
          <v-icon color="primary">mdi-tune-variant</v-icon>
          <div class="flex-grow-1">
            <div class="text-h6 font-weight-bold">Personalizar pieza</div>
            <div class="text-caption text-medium-emphasis">
              Imagen, nombre y precio se toman del producto. Acá podés ajustar el badge, las cuotas y el botón.
            </div>
          </div>
          <v-btn icon="mdi-close" variant="text" @click="editorOpen = false" />
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-4" v-if="editing">
          <!-- Preview compacta -->
          <div class="edit-preview">
            <div class="edit-preview__media">
              <span v-if="editForm.badge_text" class="edit-preview__badge"
                    :style="{ background: editForm.badge_color || '#e53935' }">
                {{ editForm.badge_text }}
              </span>
              <img v-if="editing.image_url" :src="editing.image_url" />
              <div v-else class="edit-preview__no-img"><v-icon>mdi-image-off-outline</v-icon></div>
            </div>
            <div class="edit-preview__info">
              <div class="edit-preview__title">{{ editing.title }}</div>
              <div v-if="editing.subtitle" class="edit-preview__sub">{{ editing.subtitle }}</div>
              <div class="edit-preview__prices">
                <span v-if="editing.price_original" class="edit-preview__price-old">{{ editing.price_original }}</span>
                <span v-if="editing.price_final" class="edit-preview__price-new">{{ editing.price_final }}</span>
              </div>
              <div v-if="editForm.installments_text" class="edit-preview__cuotas">{{ editForm.installments_text }}</div>
              <button class="edit-preview__cta" :style="{ background: editForm.cta_color || '#02498b' }">
                {{ editForm.cta_label || "Comprar ahora" }}
              </button>
            </div>
          </div>

          <v-divider class="my-4" />

          <div class="text-caption font-weight-bold text-medium-emphasis mb-2"
               style="letter-spacing: 0.06em; text-transform: uppercase;">
            Opciones de la pieza
          </div>

          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field v-model="editForm.badge_text" label="Badge (esquina sup-izq)"
                            placeholder="-30% / HOT SALE / NUEVO"
                            variant="outlined" density="compact" hide-details />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="editForm.badge_color" label="Color del badge"
                            placeholder="#e53935"
                            variant="outlined" density="compact" hide-details />
            </v-col>
            <v-col cols="12">
              <v-text-field v-model="editForm.installments_text" label="Cuotas (texto libre)"
                            placeholder="12 cuotas sin interés de $ 83.250"
                            variant="outlined" density="compact" hide-details />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="editForm.cta_label" label="Texto del botón"
                            placeholder="Comprar ahora"
                            variant="outlined" density="compact" hide-details />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="editForm.cta_color" label="Color del botón"
                            placeholder="#02498b"
                            variant="outlined" density="compact" hide-details />
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <div class="text-caption font-weight-bold text-medium-emphasis mb-2"
               style="letter-spacing: 0.06em; text-transform: uppercase;">
            Override avanzado (opcional)
          </div>
          <div class="text-caption text-medium-emphasis mb-2">
            Sólo si necesitás que el email muestre algo distinto al producto. Se sincroniza con el catálogo
            automáticamente si los dejás vacíos.
          </div>

          <v-row dense>
            <v-col cols="12">
              <v-text-field v-model="editForm.override_title" label="Título alternativo"
                            :placeholder="editing.title"
                            variant="outlined" density="compact" hide-details />
            </v-col>
            <v-col cols="12">
              <v-text-field v-model="editForm.override_subtitle" label="Subtítulo alternativo"
                            variant="outlined" density="compact" hide-details />
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field v-model.number="editForm.position" label="Posición (orden)" type="number"
                            variant="outlined" density="compact" hide-details />
            </v-col>
            <v-col cols="12" sm="6" class="d-flex align-center">
              <v-switch v-model="editForm.active" color="success" hide-details density="compact"
                        :label="editForm.active ? 'Activo' : 'Pausado'" />
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider />
        <v-card-actions class="pa-3">
          <v-btn variant="text" :disabled="saving" @click="editorOpen = false">Cancelar</v-btn>
          <v-spacer />
          <v-btn color="primary" variant="flat" prepend-icon="mdi-content-save"
                 :loading="saving" @click="saveEdits">
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog "Enviar promociones" — se abre desde cada card o desde el bulk -->
    <PromoSendDialog
      :open="sendDialog.open"
      :promo-blocks="sendDialog.promos"
      @close="sendDialog.open = false"
      @sent="onSent"
    />

    <v-snackbar v-model="snack.show" :timeout="3000">{{ snack.text }}</v-snackbar>
  </v-container>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from "vue";
import http from "@/app/api/http";
import {
  listPromoBlocks,
  createPromoBlocksFromProducts,
  updatePromoBlock,
  deletePromoBlock,
} from "@/modules/admin/services/emailPromoBlocks.api";
import PromoSendDialog from "@/modules/admin/components/PromoSendDialog.vue";

// Selección para envío múltiple ("agrupar varias promos en un mismo mensaje")
const selectedPromoIds = ref([]);
const MAX_PROMOS_PER_EMAIL = 4;

// Dialog de envío
const sendDialog = reactive({ open: false, promos: [] });

function openSendDialogForOne(block) {
  sendDialog.promos = [block];
  sendDialog.open = true;
}

function openSendDialogForSelected() {
  const promos = blocks.value.filter((b) => selectedPromoIds.value.includes(b.id));
  if (!promos.length) return;
  sendDialog.promos = promos;
  sendDialog.open = true;
}

function onSent({ summary }) {
  const totalOk = (summary?.email_ok || 0) + (summary?.wa_ok || 0);
  snack.value = {
    show: true,
    text: `Envío completado · ${totalOk} mensaje(s) entregado(s)`,
  };
  // Cerramos el dialog tras 1.5s para que el usuario vea el resultado.
  setTimeout(() => { sendDialog.open = false; }, 1800);
}

function togglePromoSelection(id) {
  const i = selectedPromoIds.value.indexOf(id);
  if (i >= 0) {
    selectedPromoIds.value.splice(i, 1);
  } else {
    if (selectedPromoIds.value.length >= MAX_PROMOS_PER_EMAIL) {
      snack.value = {
        show: true,
        text: `Máximo ${MAX_PROMOS_PER_EMAIL} promos por email para no saturar al lector.`,
      };
      return;
    }
    selectedPromoIds.value.push(id);
  }
}

// Helpers de formato — el badge a veces viene "30" y queremos mostrar "-30%"
// si es solo un número, respetando textos custom como "HOT SALE".
function formatBadge(text) {
  const s = String(text || "").trim();
  if (!s) return "";
  // Si es solo un número (con o sin signo) lo convertimos en "-N% OFF"
  if (/^-?\d+$/.test(s)) {
    const n = Math.abs(parseInt(s, 10));
    return `-${n}%`;
  }
  return s;
}

// Las cuotas a veces vienen "12" y queremos mostrar "12 cuotas"
function formatInstallments(text) {
  const s = String(text || "").trim();
  if (!s) return "";
  if (/^\d+$/.test(s)) {
    return `${s} cuotas`;
  }
  return s;
}

const loading = ref(false);
const error = ref("");
const blocks = ref([]);
const snack = ref({ show: false, text: "" });

// ─── PICKER STATE ───
const pickerOpen = ref(false);
const pickerLoading = ref(false);
const pickerSearch = ref("");
const pickerProducts = ref([]);
const pickerPage = ref(1);
const pickerHasMore = ref(false);
const selectedProductIds = ref([]);
const creating = ref(false);
const bulkForm = reactive({
  badge_text: "",
  installments_text: "",
  cta_label: "",
});

// ─── EDITOR STATE ───
const editorOpen = ref(false);
const editing = ref(null);
const editForm = reactive(emptyEditForm());
const saving = ref(false);

function emptyEditForm() {
  return {
    badge_text: "",
    badge_color: "#e53935",
    installments_text: "",
    cta_label: "",
    cta_color: "",
    override_title: "",
    override_subtitle: "",
    position: 0,
    active: true,
  };
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    blocks.value = await listPromoBlocks({ activeOnly: false });
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudieron cargar los bloques.";
  } finally {
    loading.value = false;
  }
}

// ─── Picker ───
function openPicker() {
  pickerOpen.value = true;
  pickerSearch.value = "";
  pickerProducts.value = [];
  selectedProductIds.value = [];
  bulkForm.badge_text = "";
  bulkForm.installments_text = "";
  bulkForm.cta_label = "";
  pickerPage.value = 1;
  loadPickerProducts();
}

let _searchTimer = null;
function onPickerSearch() {
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(() => {
    pickerPage.value = 1;
    loadPickerProducts();
  }, 300);
}

async function loadPickerProducts(append = false) {
  pickerLoading.value = true;
  try {
    const r = await http.get("/products", {
      params: {
        q: pickerSearch.value || undefined,
        page: pickerPage.value,
        limit: 20,
        is_active: 1,
      },
    });
    const newRows = r.data?.data || [];
    pickerProducts.value = append ? [...pickerProducts.value, ...newRows] : newRows;
    pickerHasMore.value = newRows.length === 20;
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "Error al cargar productos.";
  } finally {
    pickerLoading.value = false;
  }
}

async function loadMorePicker() {
  pickerPage.value++;
  await loadPickerProducts(true);
}

function firstImageOf(p) {
  // Aceptar varios shapes posibles devueltos por /products
  if (p.image_url) return p.image_url;
  if (p.cover_url) return p.cover_url;
  if (Array.isArray(p.images) && p.images.length) return p.images[0].url || p.images[0].image_url;
  return "";
}

function fmtPrice(n) {
  const num = Number(n);
  if (!Number.isFinite(num) || num <= 0) return "";
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency", currency: "ARS", maximumFractionDigits: 0,
    }).format(num);
  } catch {
    return `$ ${num.toLocaleString("es-AR")}`;
  }
}

function hasOldPrice(p) {
  const list = Number(p.price_list) || 0;
  const final = Number(p.price) || 0;
  return list > 0 && final > 0 && list > final;
}

async function createFromSelected() {
  creating.value = true;
  error.value = "";
  try {
    const payload = {
      product_ids: selectedProductIds.value,
      badge_text: bulkForm.badge_text || undefined,
      installments_text: bulkForm.installments_text || undefined,
      cta_label: bulkForm.cta_label || undefined,
    };
    const res = await createPromoBlocksFromProducts(payload);
    pickerOpen.value = false;
    snack.value = {
      show: true,
      text: `${res?.summary?.created || 0} pieza(s) creada(s)` +
            (res?.summary?.reused ? `, ${res.summary.reused} ya existía(n)` : ""),
    };
    await load();
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudieron crear las piezas.";
  } finally {
    creating.value = false;
  }
}

// ─── Editor ───
function openEdit(b) {
  editing.value = b;
  Object.assign(editForm, emptyEditForm(), {
    badge_text: b.badge_text || "",
    badge_color: b.badge_color || "#e53935",
    installments_text: b.installments_text || "",
    cta_label: b.cta_label || "",
    cta_color: b.cta_color || "",
    override_title: b.override_title || "",
    override_subtitle: b.override_subtitle || "",
    position: b.position ?? 0,
    active: b.active !== false,
  });
  editorOpen.value = true;
}

async function saveEdits() {
  if (!editing.value) return;
  saving.value = true;
  error.value = "";
  try {
    const updated = await updatePromoBlock(editing.value.id, { ...editForm });
    const i = blocks.value.findIndex((x) => x.id === editing.value.id);
    if (i >= 0 && updated) blocks.value[i] = updated;
    editorOpen.value = false;
    snack.value = { show: true, text: "Guardado" };
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo guardar.";
  } finally {
    saving.value = false;
  }
}

async function toggleActive(b) {
  try {
    const updated = await updatePromoBlock(b.id, { active: !b.active });
    const i = blocks.value.findIndex((x) => x.id === b.id);
    if (i >= 0 && updated) blocks.value[i] = updated;
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "Error al cambiar estado.";
  }
}

async function confirmDelete(b) {
  if (!window.confirm(`¿Eliminar la pieza "${b.title || b.name}"?`)) return;
  try {
    await deletePromoBlock(b.id);
    blocks.value = blocks.value.filter((x) => x.id !== b.id);
    snack.value = { show: true, text: "Pieza eliminada" };
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo eliminar.";
  }
}

onMounted(load);
</script>

<style scoped>
/* ═══════════════ Barra "Ir a clientes con estas promos" ═══════════════ */
.promos-bulk {
  display: flex; align-items: center; justify-content: space-between;
  gap: 14px; flex-wrap: wrap;
  padding: 12px 16px;
  border-radius: 14px;
  background: rgba(var(--v-theme-primary), 0.10);
  border: 1.5px solid rgba(var(--v-theme-primary), 0.4);
  margin-bottom: 14px;
}
.promos-bulk__left {
  display: flex; align-items: center; gap: 12px;
  font-size: 13.5px; font-weight: 400;
}
.promos-bulk__clear {
  background: transparent; border: none; cursor: pointer;
  font-size: 11px; font-weight: 400;
  color: rgb(var(--v-theme-primary));
  padding: 4px 9px; border-radius: 6px;
  text-transform: uppercase; letter-spacing: 0.06em;
}
.promos-bulk__clear:hover { background: rgba(var(--v-theme-primary), 0.12); }
.promos-tip {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 0.05);
  border: 1px dashed rgba(var(--v-theme-primary), 0.3);
  margin-bottom: 14px;
  font-size: 12.5px;
  color: rgba(var(--v-theme-on-surface), 0.85);
}

/* ═══════════════ Cards del listado ═══════════════ */
.promo-card {
  position: relative;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 14px;
  overflow: hidden;
  transition: transform 0.12s, box-shadow 0.12s, border-color 0.12s;
  height: 100%;
  display: flex;
  flex-direction: column;
  cursor: pointer;
}
.promo-card:hover { transform: translateY(-2px); box-shadow: 0 6px 22px rgba(0,0,0,.08); }
.promo-card--inactive { opacity: 0.55; cursor: default; }
.promo-card--selected {
  border-color: rgba(var(--v-theme-primary), 0.6);
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.18);
}
.promo-card__select {
  position: absolute;
  top: 6px; right: 6px;
  z-index: 3;
  background: rgba(var(--v-theme-surface), 0.92);
  border-radius: 6px;
}

.promo-card__media {
  position: relative;
  aspect-ratio: 1;
  background: rgba(var(--v-theme-on-surface), 0.04);
  display: grid; place-items: center;
  overflow: hidden;
}
.promo-card__media img { width:100%; height:100%; object-fit:cover; display:block; }
.promo-card__no-img { color: rgba(var(--v-theme-on-surface), 0.3); }

.promo-card__badge {
  position: absolute; top:10px; left:10px;
  background: #e53935; color: #fff;
  font-size: 11px; font-weight: 500; letter-spacing: 0.5px;
  padding: 5px 10px; border-radius: 6px; z-index: 2;
}
.promo-card__inactive-badge {
  position: absolute; bottom:10px; right:10px;
  background: rgba(0,0,0,0.65); color:#fff;
  font-size: 10.5px; font-weight: 500; letter-spacing: 0.5px;
  padding: 4px 8px; border-radius: 6px;
}

.promo-card__body { padding: 12px 14px 14px; display:flex; flex-direction:column; gap:4px; flex-grow:1; }
.promo-card__title {
  font-size: 13.5px; font-weight: 400; line-height: 1.3;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden; min-height: 35px;
}
.promo-card__subtitle { font-size: 11.5px; opacity:.7; line-height:1.4; }
.promo-card__price-row { margin-top:6px; display:flex; align-items:baseline; gap:6px; flex-wrap:wrap; }
.promo-card__price-old { font-size: 11px; text-decoration: line-through; opacity: .55; }
.promo-card__price-new { font-size: 16px; font-weight: 500; letter-spacing: -0.3px; }
.promo-card__price-missing {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 400;
  color: rgb(var(--v-theme-warning));
  font-style: italic;
}
.promo-card__installments {
  display: inline-flex; align-items: center;
  font-size: 11.5px; color: rgb(var(--v-theme-success));
  font-weight: 400;
}
.promo-card__cta-line { margin-top: 4px; }
.promo-card__cta-link {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11.5px; font-weight: 400;
  color: rgb(var(--v-theme-primary)); text-decoration: none;
}
.promo-card__cta-link:hover { text-decoration: underline; }
.promo-card__meta {
  display:flex; justify-content:space-between;
  font-size: 10px; letter-spacing: 0.04em; text-transform: uppercase;
  opacity: .55; margin-top: 8px; font-weight: 400;
}
.promo-card__actions {
  display: flex; gap: 4px;
  margin-top: 10px;
  align-items: center;
}
.promo-card__send-btn {
  flex-grow: 1;
  font-weight: 500 !important;
  letter-spacing: 0.04em;
}

/* ═══════════════ Picker ═══════════════ */
.picker-list {
  display: flex; flex-direction: column; gap: 4px;
  max-height: 50vh; overflow-y: auto;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 10px;
  padding: 4px;
}
.picker-row {
  display: flex; align-items: center; gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.1s;
  user-select: none;
}
.picker-row:hover { background: rgba(var(--v-theme-on-surface), 0.04); }
.picker-row--selected {
  background: rgba(var(--v-theme-primary), 0.08);
  border: 1px solid rgba(var(--v-theme-primary), 0.3);
}
.picker-row__chk { transform: scale(1.15); cursor: pointer; }
.picker-row__img { flex-shrink: 0; }
.picker-row__info { flex-grow: 1; min-width: 0; }
.picker-row__name { font-size: 13.5px; font-weight: 400; line-height: 1.3; }
.picker-row__meta { font-size: 11px; opacity: .65; margin-top: 2px; }
.picker-row__sku { font-family: monospace; }
.picker-row__brand { font-weight: 400; }
.picker-row__prices { text-align: right; flex-shrink: 0; }
.picker-row__price-old {
  display: block; font-size: 10.5px; text-decoration: line-through; opacity: .5;
}
.picker-row__price { font-size: 14px; font-weight: 500; letter-spacing: -0.3px; }

/* ═══════════════ Editor preview ═══════════════ */
.edit-preview {
  display: flex; gap: 16px; align-items: flex-start;
  background: #fafbfc; border: 1px solid #e5e7eb; border-radius: 12px;
  padding: 16px; max-width: 560px; margin: 0 auto;
}
.edit-preview__media {
  position: relative; flex-shrink: 0;
  width: 130px; height: 130px;
  background: #f5f7fb; border-radius: 8px;
  display: grid; place-items: center; overflow: hidden;
}
.edit-preview__media img { width:100%; height:100%; object-fit:cover; }
.edit-preview__no-img { color: #9ca3af; }
.edit-preview__badge {
  position: absolute; top: 8px; left: 8px;
  background: #e53935; color: #fff;
  font-size: 10.5px; font-weight: 500; letter-spacing: 0.5px;
  padding: 4px 8px; border-radius: 5px;
}
.edit-preview__info { flex-grow: 1; min-width: 0; }
.edit-preview__title { font-size: 14.5px; font-weight: 500; color: #111827; line-height: 1.3; }
.edit-preview__sub { font-size: 12.5px; color: #6b7280; margin-top: 2px; }
.edit-preview__prices { margin-top: 8px; display: flex; align-items: baseline; gap: 8px; }
.edit-preview__price-old { color: #9ca3af; text-decoration: line-through; font-size: 12px; }
.edit-preview__price-new { color: #1f2937; font-size: 18px; font-weight: 500; letter-spacing: -0.3px; }
.edit-preview__cuotas { color: #02498b; font-size: 12px; font-weight: 400; margin-top: 2px; }
.edit-preview__cta {
  margin-top: 12px;
  background: #02498b; color: #fff; border: 0;
  font-size: 12px; font-weight: 500; letter-spacing: 0.3px;
  padding: 9px 16px; border-radius: 7px; cursor: default;
}
</style>
