<template>
  <v-dialog v-model="internalOpen" max-width="1100">
    <v-card rounded="xl" class="overflow-hidden">
      <v-card-title class="d-flex align-center justify-space-between pa-4">
        <div>
          <div class="text-h6 font-weight-bold">Detalle de producto</div>
          <div class="text-caption text-medium-emphasis">Información técnica y galería</div>
        </div>
        <v-btn icon="mdi-close" variant="text" @click="internalOpen = false" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-6">
        <v-row v-if="product">
          <v-col cols="12" md="5">
            <v-card variant="tonal" rounded="xl" class="pa-4" min-height="350">
              <div class="font-weight-bold mb-4">Imágenes</div>
              
              <v-carousel
                v-if="product.images && product.images.length > 0"
                height="300"
                hide-delimiter-background
                show-arrows="hover"
                rounded="xl"
                color="primary"
              >
                <v-carousel-item
                  v-for="(img, i) in product.images"
                  :key="i"
                  :src="img.url"
                  cover
                >
                  <template v-slot:placeholder>
                    <div class="d-flex align-center justify-center fill-height bg-grey-lighten-4">
                      <v-progress-circular indeterminate color="primary" />
                    </div>
                  </template>
                </v-carousel-item>
              </v-carousel>

              <div v-else class="d-flex flex-column align-center justify-center fill-height py-10 border-dashed rounded-xl">
                <v-icon size="64" color="medium-emphasis">mdi-image-off-outline</v-icon>
                <div class="text-caption text-medium-emphasis mt-2">Sin imágenes disponibles</div>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" md="7">
            <div class="d-flex align-center justify-space-between mb-4">
              <h2 class="text-h5 font-weight-bold">{{ product.name }}</h2>
              <v-chip :color="product.is_active ? 'success' : 'error'" size="small">
                {{ product.is_active ? 'Activo' : 'Inactivo' }}
              </v-chip>
            </div>

            <v-row dense class="mb-4">
              <v-col cols="6"><div class="text-caption">SKU</div><div class="font-weight-bold">{{ product.sku || '—' }}</div></v-col>
              <v-col cols="6"><div class="text-caption">Marca</div><div class="font-weight-bold">{{ product.brand || '—' }}</div></v-col>
            </v-row>

            <v-divider class="mb-4" />

            <v-row dense>
              <v-col cols="4"><div class="text-caption">Precio Lista</div><div class="text-h6 font-weight-bold">{{ money(product.price_list) }}</div></v-col>
              <v-col cols="4"><div class="text-caption">Descuento</div><div class="text-h6 font-weight-bold text-primary">{{ money(product.price_discount) }}</div></v-col>
              <v-col cols="4"><div class="text-caption">Costo</div><div class="text-h6">{{ money(product.cost) }}</div></v-col>
            </v-row>

            <div class="mt-6">
              <div class="text-caption mb-1">Descripción</div>
              <p class="text-body-2">{{ product.description || 'Sin descripción' }}</p>
            </div>
          </v-col>
        </v-row>
        
        <div v-else class="d-flex justify-center align-center pa-10">
          <v-progress-circular indeterminate color="primary" size="64" />
        </div>
      </v-card-text>

      <v-card-actions class="pa-4 bg-grey-lighten-4">
        <v-spacer />
        <v-btn variant="text" @click="internalOpen = false">Cerrar</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-pencil" @click="$emit('edit', { id: productId })">
          Editar Producto
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, watch } from 'vue';
import { useProductsStore } from '../../../app/store/products.store';

const props = defineProps({
  open: Boolean,
  productId: [Number, String]
});

const emit = defineEmits(['update:open', 'edit']);
const productsStore = useProductsStore();

// Esta variable vincula la prop 'open' con el v-model del diálogo
const internalOpen = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v)
});

const product = computed(() => productsStore.current);

const money = (v) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v || 0);

watch(() => props.open, (isOpen) => {
  if (isOpen && props.productId) {
    productsStore.fetchOne(props.productId, { force: true });
  }
});
</script>