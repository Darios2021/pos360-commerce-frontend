<!-- src/modules/products/components/ProductDetailsDialog.vue -->
<template>
  <v-dialog v-model="localOpen" max-width="1100" scrollable>
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center justify-space-between py-4">
        <div class="d-flex flex-column">
          <div class="text-h6 font-weight-bold">Detalle de producto</div>
          <div class="text-caption text-medium-emphasis">
            Vista rápida (galería + ficha técnica)
          </div>
        </div>

        <div class="d-flex align-center ga-2">
          <v-chip v-if="product?.id" size="small" variant="tonal">ID #{{ product.id }}</v-chip>
          <v-btn icon="mdi-close" variant="text" @click="close" />
        </div>
      </v-card-title>

      <v-divider />

      <v-card-text class="pt-4">
        <v-alert v-if="errorText" type="error" variant="tonal" class="mb-4">
          {{ errorText }}
        </v-alert>

        <v-row dense>
          <v-col cols="12" md="5">
            <v-card variant="tonal" rounded="xl" class="pa-3">
              <div class="font-weight-bold mb-2">Imágenes</div>

              <template v-if="images.length">
                <v-carousel height="260" hide-delimiter-background show-arrows="hover">
                  <v-carousel-item v-for="(src, i) in images" :key="i">
                    <v-img :src="src" height="260" cover />
                  </v-carousel-item>
                </v-carousel>
              </template>

              <template v-else>
                <div class="text-caption text-medium-emphasis">
                  Todavía no hay imágenes (cuando esté MinIO, acá van las URLs).
                </div>
                <v-sheet class="mt-3 d-flex align-center justify-center" height="220" rounded="xl">
                  <v-icon size="42">mdi-image-off-outline</v-icon>
                </v-sheet>
              </template>
            </v-card>
          </v-col>

          <v-col cols="12" md="7">
            <v-card variant="tonal" rounded="xl" class="pa-4">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="text-h6 font-weight-bold">{{ product?.name || "—" }}</div>
                  <div class="text-caption text-medium-emphasis">
                    SKU: <b>{{ product?.sku || "—" }}</b>
                    <span v-if="product?.barcode"> · Barcode: <b>{{ product.barcode }}</b></span>
                    <span v-if="product?.code"> · Código: <b>{{ product.code }}</b></span>
                  </div>
                </div>

                <div class="d-flex ga-2">
                  <v-btn
                    color="primary"
                    variant="flat"
                    prepend-icon="mdi-pencil-outline"
                    @click="$emit('edit', product)"
                    :disabled="!product?.id"
                  >
                    Editar
                  </v-btn>
                </div>
              </div>

              <v-divider class="my-3" />

              <div class="d-flex flex-wrap ga-2 mb-3">
                <v-chip variant="tonal">{{ product?.category?.name || "Sin rubro" }}</v-chip>
                <v-chip variant="tonal" v-if="product?.category?.parent">
                  {{ product.category.parent.name }}
                </v-chip>

                <v-chip :color="product?.is_new ? 'primary' : 'grey'" variant="tonal">
                  {{ product?.is_new ? "Nuevo" : "Existente" }}
                </v-chip>

                <v-chip :color="product?.is_promo ? 'green' : 'grey'" variant="tonal">
                  {{ product?.is_promo ? "En promo" : "No promo" }}
                </v-chip>

                <v-chip :color="product?.is_active ? 'primary' : 'red'" variant="tonal">
                  {{ product?.is_active ? "Activo" : "Inactivo" }}
                </v-chip>
              </div>

              <v-row dense>
                <v-col cols="12" sm="6">
                  <div class="text-caption text-medium-emphasis">Marca</div>
                  <div class="font-weight-medium">{{ product?.brand || "—" }}</div>
                </v-col>
                <v-col cols="12" sm="6">
                  <div class="text-caption text-medium-emphasis">Modelo</div>
                  <div class="font-weight-medium">{{ product?.model || "—" }}</div>
                </v-col>
                <v-col cols="12" sm="6">
                  <div class="text-caption text-medium-emphasis">Garantía</div>
                  <div class="font-weight-medium">{{ product?.warranty_months ?? 0 }} meses</div>
                </v-col>
                <v-col cols="12" sm="6">
                  <div class="text-caption text-medium-emphasis">IVA</div>
                  <div class="font-weight-medium">{{ product?.tax_rate ?? 21 }}%</div>
                </v-col>
              </v-row>

              <v-divider class="my-3" />

              <v-row dense>
                <v-col cols="12" sm="4">
                  <div class="text-caption text-medium-emphasis">Lista</div>
                  <div class="font-weight-bold">{{ money(product?.price_list) }}</div>
                </v-col>
                <v-col cols="12" sm="4">
                  <div class="text-caption text-medium-emphasis">Descuento</div>
                  <div class="font-weight-bold">{{ money(product?.price_discount) }}</div>
                </v-col>
                <v-col cols="12" sm="4">
                  <div class="text-caption text-medium-emphasis">Revendedor</div>
                  <div class="font-weight-bold">{{ money(product?.price_reseller) }}</div>
                </v-col>
              </v-row>

              <v-divider class="my-3" />

              <div class="text-caption text-medium-emphasis mb-1">Descripción</div>
              <div class="text-body-2">{{ product?.description || "—" }}</div>
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
import { computed } from "vue";

const props = defineProps({
  open: { type: Boolean, default: false },
  product: { type: Object, default: null },
  errorText: { type: String, default: "" },
});

const emit = defineEmits(["update:open", "edit"]);

const localOpen = computed({
  get: () => props.open,
  set: (v) => emit("update:open", v),
});

function close() {
  localOpen.value = false;
}

// ⚠️ por ahora no hay imágenes reales (MinIO). Si después guardás URLs en product.images:
// - soporta product.images = ["url1","url2","url3"]
const images = computed(() => {
  const arr = props.product?.images;
  return Array.isArray(arr) ? arr.slice(0, 3) : [];
});

function money(val) {
  const n = Number(val ?? 0);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}
</script>
