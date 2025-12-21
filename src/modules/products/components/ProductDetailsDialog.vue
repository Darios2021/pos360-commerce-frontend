<template>
  <v-dialog v-model="openModel" max-width="1100">
    <v-card rounded="xl" class="overflow-hidden">
      <v-card-title class="d-flex align-center justify-space-between">
        <div>
          <div class="text-h6 font-weight-bold">Detalle de producto</div>
          <div class="text-caption text-medium-emphasis">Vista rápida (galería + ficha técnica)</div>
        </div>
        <v-btn icon="mdi-close" variant="text" @click="openModel = false" />
      </v-card-title>

      <v-divider />

      <v-card-text>
        <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
          {{ error }}
        </v-alert>

        <v-row dense>
          <!-- Galería -->
          <v-col cols="12" md="5">
            <v-card variant="tonal" rounded="xl" class="pa-4">
              <div class="font-weight-bold mb-2">Imágenes</div>

              <div class="text-caption text-medium-emphasis mb-3">
                Todavía no hay imágenes (cuando esté MinIO, acá van las URLs).
              </div>

              <div class="d-flex align-center justify-center gallery-placeholder">
                <v-icon size="72" icon="mdi-image-off-outline" />
              </div>
            </v-card>
          </v-col>

          <!-- Ficha -->
          <v-col cols="12" md="7">
            <v-card variant="tonal" rounded="xl" class="pa-4">
              <div class="d-flex align-center justify-space-between mb-3">
                <div class="font-weight-bold">{{ product?.name || "—" }}</div>

                <v-btn
                  color="primary"
                  variant="flat"
                  prepend-icon="mdi-pencil-outline"
                  :disabled="!product?.id"
                  @click="emitEdit"
                >
                  Editar
                </v-btn>
              </div>

              <div class="text-caption text-medium-emphasis mb-3">
                SKU: <b>{{ product?.sku || "—" }}</b>
                &nbsp;&nbsp; Código: <b>{{ product?.code || "—" }}</b>
              </div>

              <div class="d-flex flex-wrap ga-2 mb-4">
                <v-chip size="small" variant="tonal">{{ rubroLabel }}</v-chip>
                <v-chip size="small" variant="tonal">{{ subrubroLabel }}</v-chip>
                <v-chip size="small" variant="tonal">{{ product?.is_new ? "Nuevo" : "Existente" }}</v-chip>
                <v-chip size="small" variant="tonal">{{ product?.is_promo ? "Promo" : "No promo" }}</v-chip>
                <v-chip size="small" variant="tonal" :color="product?.is_active ? 'primary' : 'red'">
                  {{ product?.is_active ? "Activo" : "Inactivo" }}
                </v-chip>
              </div>

              <v-divider class="mb-4" />

              <v-row dense class="mb-2">
                <v-col cols="12" sm="6">
                  <div class="text-caption text-medium-emphasis">Marca</div>
                  <div class="font-weight-bold">{{ product?.brand || "—" }}</div>
                </v-col>

                <v-col cols="12" sm="6">
                  <div class="text-caption text-medium-emphasis">Modelo</div>
                  <div class="font-weight-bold">{{ product?.model || "—" }}</div>
                </v-col>
              </v-row>

              <v-row dense class="mb-2">
                <v-col cols="12" sm="6">
                  <div class="text-caption text-medium-emphasis">Garantía</div>
                  <div class="font-weight-bold">{{ toInt(product?.warranty_months) }} meses</div>
                </v-col>

                <v-col cols="12" sm="6">
                  <div class="text-caption text-medium-emphasis">IVA</div>
                  <div class="font-weight-bold">{{ pct(product?.tax_rate) }}</div>
                </v-col>
              </v-row>

              <v-divider class="my-4" />

              <v-row dense>
                <v-col cols="12" sm="4">
                  <div class="text-caption text-medium-emphasis">Lista</div>
                  <div class="text-h6 font-weight-bold">{{ money(product?.price_list) }}</div>
                </v-col>

                <v-col cols="12" sm="4">
                  <div class="text-caption text-medium-emphasis">Descuento</div>
                  <div class="text-h6 font-weight-bold">{{ money(product?.price_discount) }}</div>
                </v-col>

                <v-col cols="12" sm="4">
                  <div class="text-caption text-medium-emphasis">Revendedor</div>
                  <div class="text-h6 font-weight-bold">{{ money(product?.price_reseller) }}</div>
                </v-col>
              </v-row>

              <v-divider class="my-4" />

              <div class="text-caption text-medium-emphasis">Descripción</div>
              <div class="font-weight-medium">{{ product?.description || "—" }}</div>

              <v-progress-linear
                v-if="loading"
                indeterminate
                class="mt-4"
              />
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider />

      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="openModel = false">Cerrar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useProductsStore } from "../../../app/store/products.store";

const props = defineProps({
  open: { type: Boolean, default: false },
  productId: { type: [Number, String], default: null },
});

const emit = defineEmits(["update:open", "edit"]);

const products = useProductsStore();

const loading = ref(false);
const error = ref("");

const openModel = computed({
  get: () => props.open,
  set: (v) => emit("update:open", v),
});

const product = computed(() => {
  const id = Number(props.productId);
  if (!id) return null;
  // asumimos que fetchOne guarda el producto en el store y también lo devuelve.
  // Si tu store tiene un "byId" úsalo acá. Sino, buscamos en items + selected/current.
  const fromSelected = products.current || products.selected || null;
  if (fromSelected?.id === id) return fromSelected;

  const fromList = (products.items || []).find((x) => Number(x.id) === id);
  return fromList || fromSelected;
});

const rubroLabel = computed(() => {
  const name = product.value?.category?.parent?.name;
  return name ? clean(name) : "Sin rubro";
});

const subrubroLabel = computed(() => {
  const name = product.value?.category?.name;
  return name ? clean(name) : "Sin subrubro";
});

function clean(v) {
  return String(v ?? "").split(">").pop().replace(/\s+/g, " ").trim();
}

function toNum(v, d = 0) {
  if (v === null || v === undefined || v === "") return d;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : d;
}

function toInt(v, d = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
}

function money(v) {
  const n = toNum(v, 0);
  try {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);
  } catch {
    return `$ ${n.toFixed(2)}`;
  }
}

function pct(v) {
  const n = toNum(v, 0);
  return `${n.toFixed(2)}%`;
}

async function fetchIfNeeded() {
  error.value = "";
  const id = Number(props.productId);
  if (!openModel.value || !id) return;

  loading.value = true;
  try {
    await products.fetchOne(id, { force: true });
  } catch (e) {
    error.value = e?.friendlyMessage || e?.message || String(e);
  } finally {
    loading.value = false;
  }
}

function emitEdit() {
  const id = Number(props.productId);
  if (!id) return;
  emit("edit", { id });
}

watch(() => props.open, fetchIfNeeded);
watch(() => props.productId, fetchIfNeeded);
</script>

<style scoped>
.gallery-placeholder {
  min-height: 260px;
  border-radius: 16px;
}
</style>
