<!-- src/modules/products/components/ProductDetailsDialog.vue -->
<template>
  <v-dialog v-model="openLocal" max-width="980">
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center justify-space-between">
        <div>
          <div class="text-h6 font-weight-bold">Detalle producto</div>
          <div class="text-caption text-medium-emphasis">ID #{{ productId }}</div>
        </div>

        <div class="d-flex align-center ga-2">
          <v-btn v-if="isAdmin" color="red" variant="tonal" prepend-icon="mdi-delete-outline" @click="deleteOpen = true">
            Eliminar
          </v-btn>
          <v-btn icon="mdi-close" variant="text" @click="close" />
        </div>
      </v-card-title>

      <v-divider />

      <v-card-text>
        <v-alert v-if="products.error" type="error" variant="tonal" class="mb-3">
          {{ products.error }}
        </v-alert>

        <v-skeleton-loader v-if="loading" type="article" />

        <template v-else>
          <div class="d-flex align-center justify-space-between mb-3">
            <div>
              <div class="text-h6 font-weight-bold">{{ item?.name || "—" }}</div>
              <div class="text-caption text-medium-emphasis">
                SKU: {{ item?.sku || "—" }} · Código: {{ item?.code || "—" }}
              </div>
            </div>

            <v-btn color="primary" variant="flat" prepend-icon="mdi-pencil-outline" @click="emit('edit', { id: item.id })">
              Editar
            </v-btn>
          </div>

          <v-row dense>
            <v-col cols="12" md="6">
              <v-card rounded="xl" variant="tonal" class="pa-4">
                <div class="font-weight-bold mb-2">Datos</div>

                <div class="text-body-2"><b>Rubro:</b> {{ item?.category?.parent?.name || "—" }}</div>
                <div class="text-body-2"><b>Subrubro:</b> {{ item?.category?.name || "—" }}</div>
                <div class="text-body-2"><b>Marca:</b> {{ item?.brand || "—" }}</div>
                <div class="text-body-2"><b>Modelo:</b> {{ item?.model || "—" }}</div>
                <div class="text-body-2"><b>Activo:</b> {{ item?.is_active ? "Sí" : "No" }}</div>

                <div class="text-body-2 mt-2"><b>Lista:</b> {{ money(item?.price_list) }}</div>
                <div class="text-body-2"><b>Dto:</b> {{ money(item?.price_discount) }}</div>
                <div class="text-body-2"><b>Rev:</b> {{ money(item?.price_reseller) }}</div>
              </v-card>
            </v-col>

            <v-col cols="12" md="6">
              <v-card rounded="xl" variant="tonal" class="pa-4">
                <div class="d-flex align-center justify-space-between mb-2">
                  <div class="font-weight-bold">Imágenes</div>
                  <div class="text-caption text-medium-emphasis">product_images</div>
                </div>

                <v-row dense v-if="images.length">
                  <v-col v-for="img in images" :key="img.id" cols="12" sm="6">
                    <v-card rounded="lg" class="overflow-hidden">
                      <v-img :src="img.url" height="160" cover />
                      <v-divider />
                      <v-card-actions class="justify-space-between">
                        <div class="text-caption text-medium-emphasis">ID {{ img.id }}</div>
                        <v-btn
                          v-if="isAdmin"
                          icon="mdi-delete-outline"
                          variant="text"
                          color="red"
                          @click="askRemoveImage(img)"
                        />
                      </v-card-actions>
                    </v-card>
                  </v-col>
                </v-row>

                <v-alert v-else type="info" variant="tonal">
                  Sin imágenes cargadas.
                </v-alert>
              </v-card>
            </v-col>
          </v-row>
        </template>
      </v-card-text>
    </v-card>

    <!-- confirm delete producto -->
    <v-dialog v-model="deleteOpen" max-width="520">
      <v-card rounded="xl">
        <v-card-title class="font-weight-bold">Eliminar producto</v-card-title>
        <v-card-text>
          ¿Eliminar <b>{{ item?.name }}</b> (ID #{{ item?.id }})?
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="tonal" @click="deleteOpen = false">Cancelar</v-btn>
          <v-btn color="red" variant="flat" @click="doDeleteProduct" :loading="products.loading">
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- confirm delete imagen -->
    <v-dialog v-model="deleteImgOpen" max-width="520">
      <v-card rounded="xl">
        <v-card-title class="font-weight-bold">Eliminar imagen</v-card-title>
        <v-card-text>
          ¿Eliminar imagen ID <b>#{{ deleteImg?.id }}</b>?
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="tonal" @click="deleteImgOpen = false">Cancelar</v-btn>
          <v-btn color="red" variant="flat" @click="doDeleteImage" :loading="products.loading">
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useProductsStore } from "../../../app/store/products.store";
import { useAuthStore } from "../../../app/store/auth.store";

const props = defineProps({
  open: { type: Boolean, default: false },
  productId: { type: [Number, String], default: null },
});

const emit = defineEmits(["update:open", "edit", "deleted"]);

const products = useProductsStore();
const auth = useAuthStore();

const openLocal = ref(false);
const loading = ref(false);

const item = ref(null);
const images = ref([]);

const isAdmin = computed(() => (auth.roles || []).includes("admin"));

const deleteOpen = ref(false);

const deleteImgOpen = ref(false);
const deleteImg = ref(null);

watch(
  () => props.open,
  async (v) => {
    openLocal.value = v;
    if (v) await load();
  },
  { immediate: true }
);

watch(openLocal, (v) => emit("update:open", v));

async function load() {
  const id = Number(props.productId);
  if (!id) return;

  loading.value = true;
  try {
    const p = await products.fetchOne(id, { force: true });
    item.value = p || null;
    images.value = await products.fetchImages(id);
  } finally {
    loading.value = false;
  }
}

function close() {
  openLocal.value = false;
}

function toNum(v, d = 0) {
  if (v === null || v === undefined || v === "") return d;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : d;
}

function money(n) {
  try {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(toNum(n, 0));
  } catch {
    return `$ ${toNum(n, 0).toFixed(2)}`;
  }
}

function askRemoveImage(img) {
  deleteImg.value = img;
  deleteImgOpen.value = true;
}

async function doDeleteImage() {
  const pid = Number(props.productId);
  if (!pid || !deleteImg.value?.id) return;

  const ok = await products.removeImage(pid, deleteImg.value.id);
  if (ok) {
    images.value = images.value.filter((x) => x.id !== deleteImg.value.id);
    deleteImgOpen.value = false;
    deleteImg.value = null;
  }
}

async function doDeleteProduct() {
  const pid = Number(props.productId);
  if (!pid) return;

  const ok = await products.remove(pid);
  if (ok) {
    deleteOpen.value = false;
    emit("deleted", { id: pid });
    close();
  }
}
</script>
