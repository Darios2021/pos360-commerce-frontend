<!-- src/modules/products/components/ProductDetailsDialog.vue -->
<template>
  <v-dialog v-model="localOpen" max-width="1100" scrollable>
    <v-card class="pos-card">
      <v-card-title class="d-flex align-center justify-space-between py-4">
        <div class="d-flex flex-column">
          <div class="text-h6 font-weight-bold">Detalle de producto</div>
          <div class="text-caption text-medium-emphasis">Vista rápida (galería + ficha técnica)</div>
        </div>

        <div class="d-flex ga-2 align-center">
          <v-chip v-if="p.id" size="small" variant="tonal">ID #{{ p.id }}</v-chip>
          <v-btn icon="mdi-close" variant="text" @click="close" />
        </div>
      </v-card-title>

      <v-divider />

      <v-card-text class="pt-4">
        <v-alert
          v-if="errorText"
          type="error"
          variant="tonal"
          class="mb-4"
          :text="errorText"
        />

        <v-progress-linear v-if="loading" indeterminate class="mb-4" />

        <v-row dense>
          <!-- IMÁGENES -->
          <v-col cols="12" md="5">
            <v-card variant="tonal" class="pa-4" rounded="xl" style="min-height: 340px">
              <div class="font-weight-bold mb-2">Imágenes</div>

              <div v-if="images.length === 0" class="text-caption text-medium-emphasis mb-4">
                Todavía no hay imágenes (cuando esté MinIO, acá van las URLs).
              </div>

              <v-carousel
                v-if="images.length"
                height="260"
                hide-delimiters
                show-arrows="hover"
                rounded="xl"
              >
                <v-carousel-item v-for="(src, i) in images" :key="i">
                  <v-img :src="src" height="260" cover />
                </v-carousel-item>
              </v-carousel>

              <div v-else class="d-flex align-center justify-center" style="height: 260px">
                <v-icon size="72" icon="mdi-image-off-outline" class="text-medium-emphasis" />
              </div>
            </v-card>
          </v-col>

          <!-- FICHA -->
          <v-col cols="12" md="7">
            <v-card variant="tonal" class="pa-4" rounded="xl">
              <div class="d-flex align-start justify-space-between ga-3">
                <div class="flex-grow-1">
                  <div class="text-h6 font-weight-bold">{{ p.name || "—" }}</div>

                  <div class="text-caption text-medium-emphasis mt-1">
                    <span class="mr-3">SKU: <b>{{ p.sku || "—" }}</b></span>
                    <span>Código: <b>{{ p.code || "—" }}</b></span>
                  </div>
                </div>

                <v-btn
                  color="primary"
                  variant="flat"
                  prepend-icon="mdi-pencil-outline"
                  @click="emitEdit"
                  :disabled="!p.id"
                >
                  Editar
                </v-btn>
              </div>

              <div class="d-flex flex-wrap ga-2 mt-4">
                <v-chip variant="tonal">
                  {{ rubroLabel }}
                </v-chip>
                <v-chip variant="tonal">
                  {{ subrubroLabel }}
                </v-chip>

                <v-chip variant="tonal">
                  {{ p.is_new ? "Nuevo" : "Existente" }}
                </v-chip>

                <v-chip variant="tonal" :color="p.is_promo ? 'green' : 'grey'">
                  {{ p.is_promo ? "Promo" : "No promo" }}
                </v-chip>

                <v-chip variant="tonal" :color="p.is_active ? 'primary' : 'red'">
                  {{ p.is_active ? "Activo" : "Inactivo" }}
                </v-chip>
              </div>

              <v-divider class="my-4" />

              <v-row dense>
                <v-col cols="12" md="6">
                  <div class="text-caption text-medium-emphasis">Marca</div>
                  <div class="font-weight-bold">{{ p.brand || "—" }}</div>
                </v-col>

                <v-col cols="12" md="6">
                  <div class="text-caption text-medium-emphasis">Modelo</div>
                  <div class="font-weight-bold">{{ p.model || "—" }}</div>
                </v-col>

                <v-col cols="12" md="6">
                  <div class="text-caption text-medium-emphasis">Garantía</div>
                  <div class="font-weight-bold">{{ p.warranty_months }} meses</div>
                </v-col>

                <v-col cols="12" md="6">
                  <div class="text-caption text-medium-emphasis">IVA</div>
                  <div class="font-weight-bold">{{ p.tax_rate.toFixed(2) }}%</div>
                </v-col>
              </v-row>

              <v-divider class="my-4" />

              <v-row dense>
                <v-col cols="12" md="4">
                  <div class="text-caption text-medium-emphasis">Lista</div>
                  <div class="text-h6 font-weight-bold">{{ money(p.price_list) }}</div>
                </v-col>
                <v-col cols="12" md="4">
                  <div class="text-caption text-medium-emphasis">Descuento</div>
                  <div class="text-h6 font-weight-bold">{{ money(p.price_discount) }}</div>
                </v-col>
                <v-col cols="12" md="4">
                  <div class="text-caption text-medium-emphasis">Revendedor</div>
                  <div class="text-h6 font-weight-bold">{{ money(p.price_reseller) }}</div>
                </v-col>
              </v-row>

              <v-divider class="my-4" />

              <div class="text-caption text-medium-emphasis mb-1">Descripción</div>
              <div style="white-space: pre-wrap">{{ p.description || "—" }}</div>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4 d-flex justify-end">
        <v-btn variant="text" @click="close">Cerrar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, watch } from "vue";
import { useProductsStore } from "../../../app/store/products.store";

const props = defineProps({
  open: { type: Boolean, default: false },

  // podés pasar productId SIEMPRE (recomendado)
  productId: { type: [Number, String], default: null },

  // opcional: item ya cargado (igual lo normalizamos)
  item: { type: Object, default: null },
});

const emit = defineEmits(["update:open", "edit"]);

const products = useProductsStore();

const localOpen = computed({
  get: () => props.open,
  set: (v) => emit("update:open", v),
});

const loading = computed(() => !!products.loading);
const errorText = computed(() => products.error || "");

function toNum(v, d = 0) {
  if (v === null || v === undefined || v === "") return d;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : d;
}

const p = computed(() => {
  // prioridad: producto cargado por fetchOne
  const src =
    products.current ||
    props.item ||
    {};

  return {
    id: src.id ?? null,
    sku: src.sku ?? "",
    code: src.code ?? "",
    barcode: src.barcode ?? "",

    name: src.name ?? "",
    description: src.description ?? "",

    brand: src.brand ?? "",
    model: src.model ?? "",

    warranty_months: toNum(src.warranty_months, 0),
    tax_rate: toNum(src.tax_rate, 0),

    is_new: !!src.is_new,
    is_promo: !!src.is_promo,
    is_active: !!src.is_active,

    price_list: toNum(src.price_list, 0),
    price_discount: toNum(src.price_discount, 0),
    price_reseller: toNum(src.price_reseller, 0),

    // categoría: backend devuelve src.category.parent
    category: src.category || null,
    category_id: src.category_id ?? null,

    // images: si mañana implementás product_images
    images: Array.isArray(src.images) ? src.images : [],
  };
});

const rubroLabel = computed(() => {
  const cat = p.value.category;
  const rubro = cat?.parent?.name || cat?.parent_name || p.value.rubro || null;
  return rubro ? String(rubro) : "Sin rubro";
});

const subrubroLabel = computed(() => {
  const cat = p.value.category;
  const sub = cat?.name || p.value.subrubro || null;
  return sub ? String(sub) : "Sin subrubro";
});

const images = computed(() => (p.value.images || []).slice(0, 3));

function money(n) {
  try {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(toNum(n, 0));
  } catch {
    return `$ ${toNum(n, 0).toFixed(2)}`;
  }
}

function close() {
  localOpen.value = false;
}

function emitEdit() {
  if (!p.value.id) return;
  emit("edit", { id: p.value.id });
}

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return;

    // siempre traer el producto “completo” por ID
    const id = props.productId ?? props.item?.id ?? null;
    if (id) await products.fetchOne(Number(id));
  }
);
</script>

<style scoped>
.pos-card {
  overflow: hidden;
}
</style>
