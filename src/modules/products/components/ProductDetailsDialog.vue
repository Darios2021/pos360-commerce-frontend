<!-- src/modules/products/components/ProductDetailsDialog.vue -->
<template>
  <v-dialog v-model="openLocal" max-width="980">
    <v-card rounded="xl" class="pd-root">
      <!-- HEADER -->
      <div class="pd-header">
        <div class="pd-title">
          <div class="text-h6 font-weight-bold">Detalle producto</div>
          <div class="text-caption text-medium-emphasis">ID #{{ productId }}</div>
        </div>

        <div class="pd-actions">
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-pencil-outline"
            @click="onEdit"
            :disabled="!item?.id"
          >
            Editar
          </v-btn>

          <v-btn
            v-if="isAdmin"
            color="red"
            variant="tonal"
            prepend-icon="mdi-delete-outline"
            @click="deleteOpen = true"
            :disabled="!item?.id"
          >
            Eliminar
          </v-btn>

          <v-btn icon="mdi-close" variant="text" @click="close" />
        </div>
      </div>

      <v-divider />

      <v-card-text class="pd-body">
        <v-alert v-if="products.error" type="error" variant="tonal" class="mb-3">
          {{ products.error }}
        </v-alert>

        <v-skeleton-loader v-if="loading" type="article" />

        <template v-else>
          <!-- TOP SUMMARY -->
          <div class="pd-summary">
            <div>
              <div class="text-h5 font-weight-bold">{{ item?.name || "—" }}</div>
              <div class="text-caption text-medium-emphasis">
                SKU: {{ item?.sku || "—" }} · Código: {{ item?.code || "—" }}
              </div>
            </div>

            <div class="d-flex ga-2 align-center flex-wrap justify-end">
              <v-chip size="small" variant="tonal" :color="item?.is_active ? 'primary' : 'red'">
                {{ item?.is_active ? "Activo" : "Inactivo" }}
              </v-chip>
              <v-chip size="small" variant="tonal">
                {{ item?.is_new ? "Nuevo" : "Existente" }}
              </v-chip>
              <v-chip size="small" variant="tonal">
                Promo: {{ item?.is_promo ? "Sí" : "No" }}
              </v-chip>
            </div>
          </div>

          <v-row dense>
            <!-- LEFT: DATA -->
            <v-col cols="12" md="5">
              <v-card rounded="xl" variant="flat" class="pd-card">
                <div class="pd-card-title">
                  <v-icon size="18">mdi-text-box-outline</v-icon>
                  <span>Datos</span>
                </div>

                <div class="pd-kv">
                  <div class="pd-kv-row">
                    <div class="pd-k">Rubro</div>
                    <div class="pd-v">{{ rubro || "—" }}</div>
                  </div>
                  <div class="pd-kv-row">
                    <div class="pd-k">Subrubro</div>
                    <div class="pd-v">{{ subrubro || "—" }}</div>
                  </div>
                  <div class="pd-kv-row">
                    <div class="pd-k">Marca</div>
                    <div class="pd-v">{{ item?.brand || "—" }}</div>
                  </div>
                  <div class="pd-kv-row">
                    <div class="pd-k">Modelo</div>
                    <div class="pd-v">{{ item?.model || "—" }}</div>
                  </div>
                </div>

                <v-divider class="my-3" />

                <div class="pd-card-title">
                  <v-icon size="18">mdi-cash</v-icon>
                  <span>Precios</span>
                </div>

                <div class="pd-prices">
                  <div class="pd-price">
                    <div class="pd-price-k">Lista</div>
                    <div class="pd-price-v">{{ money(item?.price_list) }}</div>
                  </div>
                  <div class="pd-price">
                    <div class="pd-price-k">Dto.</div>
                    <div class="pd-price-v">{{ money(item?.price_discount) }}</div>
                  </div>
                  <div class="pd-price">
                    <div class="pd-price-k">Rev.</div>
                    <div class="pd-price-v">{{ money(item?.price_reseller) }}</div>
                  </div>
                </div>

                <div v-if="item?.description" class="mt-3">
                  <div class="text-caption text-medium-emphasis mb-1">Descripción</div>
                  <div class="text-body-2 pd-desc">{{ item.description }}</div>
                </div>
              </v-card>
            </v-col>

            <!-- RIGHT: IMAGES -->
            <v-col cols="12" md="7">
              <v-card rounded="xl" variant="flat" class="pd-card">
                <div class="d-flex align-center justify-space-between">
                  <div class="pd-card-title mb-0">
                    <v-icon size="18">mdi-image-multiple-outline</v-icon>
                    <span>Imágenes</span>
                  </div>
                  <div class="text-caption text-medium-emphasis">product_images · {{ images.length }}</div>
                </div>

                <v-divider class="my-3" />

                <v-alert v-if="!images.length" type="info" variant="tonal">
                  Sin imágenes cargadas.
                </v-alert>

                <div v-else class="pd-img-grid">
                  <div v-for="img in images" :key="img.id" class="pd-img-tile">
                    <div class="pd-img-wrap">
                      <img :src="img.url" :alt="`img-${img.id}`" class="pd-img" />
                      <div class="pd-img-overlay">
                        <v-chip size="x-small" variant="tonal">ID {{ img.id }}</v-chip>

                        <v-btn
                          v-if="isAdmin"
                          icon="mdi-delete-outline"
                          size="small"
                          variant="flat"
                          color="red"
                          class="pd-img-del"
                          @click="askRemoveImage(img)"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div class="text-caption text-medium-emphasis mt-3">
                  * Para agregar/reemplazar imágenes, entrá a <b>Editar</b>.
                </div>
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
          <div class="text-caption text-medium-emphasis mt-2">No se puede deshacer.</div>
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

const rubro = computed(() => item.value?.category?.parent?.name || null);
const subrubro = computed(() => item.value?.category?.name || null);

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

function onEdit() {
  if (!item.value?.id) return;
  emit("edit", { id: item.value.id });
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

<style scoped>
.pd-root {
  overflow: hidden;
}

.pd-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px;
}

.pd-title {
  display: grid;
  gap: 2px;
}

.pd-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pd-body {
  padding: 18px 20px 22px;
}

.pd-summary {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.pd-card {
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.05);
  padding: 16px;
}

.pd-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  margin-bottom: 10px;
}

.pd-kv {
  display: grid;
  gap: 8px;
}

.pd-kv-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.pd-k {
  font-size: 12px;
  opacity: 0.7;
}

.pd-v {
  font-size: 14px;
  font-weight: 600;
  text-align: right;
}

.pd-prices {
  display: grid;
  gap: 10px;
}

.pd-price {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.pd-price-k {
  font-size: 12px;
  opacity: 0.7;
}

.pd-price-v {
  font-size: 15px;
  font-weight: 800;
}

.pd-desc {
  white-space: pre-wrap;
}

.pd-img-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 700px) {
  .pd-img-grid {
    grid-template-columns: 1fr;
  }
}

.pd-img-tile {
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.06);
}

.pd-img-wrap {
  position: relative;
  width: 100%;
  height: 210px;
  background: rgba(0, 0, 0, 0.03);
}

.pd-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transform: scale(1);
  transition: transform 180ms ease;
}

.pd-img-wrap:hover .pd-img {
  transform: scale(1.03);
}

.pd-img-overlay {
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.pd-img-del {
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
}
</style>
