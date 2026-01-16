<!-- src/modules/products/components/panels/ProductImagesPanel.vue -->
<template>
  <div>
    <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-3">
      <div>
        <div class="text-subtitle-1 font-weight-bold">Imágenes</div>
        <div class="text-caption text-medium-emphasis">
          Subí imágenes en cualquier momento. Si el producto aún no existe, se crea automáticamente.
        </div>
      </div>

      <div class="d-flex ga-2 align-center">
        <v-btn variant="tonal" @click="reload" :disabled="busy || !productIdResolved">
          <v-icon start>mdi-refresh</v-icon>
          Refrescar
        </v-btn>

        <v-btn color="primary" variant="flat" @click="pick" :loading="busy" :disabled="busy">
          <v-icon start>mdi-upload</v-icon>
          Subir
        </v-btn>
      </div>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" density="comfortable" class="mb-3">
      {{ error }}
    </v-alert>

    <input
      ref="fileInput"
      type="file"
      multiple
      accept="image/*"
      style="display:none"
      @change="onFiles"
    />

    <div v-if="!productIdResolved" class="text-caption text-medium-emphasis">
      * Para subir imágenes, primero se debe crear el producto (ID).
    </div>

    <v-skeleton-loader v-if="busy && !images.length" type="image, image, image" />

    <v-row v-if="images.length" dense>
      <v-col v-for="img in images" :key="img.id || img.url" cols="12" sm="6" md="4" lg="3">
        <v-card rounded="lg" class="overflow-hidden">
          <v-img :src="img.url" height="160" cover />
          <v-card-actions class="d-flex justify-end">
            <v-btn
              icon
              variant="text"
              color="red"
              @click="removeImg(img)"
              :disabled="busy"
              :title="'Eliminar'"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <div v-else class="text-caption text-medium-emphasis">
      No hay imágenes aún.
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useProductsStore } from "../../../../app/store/products.store";

const props = defineProps({
  productId: { type: [Number, String, null], default: null },
  ensureId: { type: Function, default: null }, // async () => productId
});

const products = useProductsStore();

const busy = ref(false);
const error = ref(null);
const images = ref([]);

const fileInput = ref(null);

const productIdResolved = computed(() => Number(props.productId || 0) > 0);

watch(
  () => props.productId,
  async (v) => {
    const pid = Number(v || 0);
    if (pid > 0) {
      await reload();
    } else {
      images.value = [];
    }
  },
  { immediate: true }
);

function pick() {
  error.value = null;
  fileInput.value?.click?.();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * ✅ asegura productId (y evita el bug: subir antes de crear)
 */
async function ensureProductIdOrThrow() {
  const pid = Number(props.productId || 0);
  if (pid > 0) return pid;

  if (typeof props.ensureId !== "function") {
    throw new Error("No hay ensureId() para crear el producto antes de subir imágenes.");
  }

  const createdId = Number(await props.ensureId());
  if (!createdId) throw new Error("No se pudo obtener ID de producto.");
  return createdId;
}

/**
 * ✅ upload con retry: cubre el caso de commit/replicación/latencia
 * - 3 intentos: 0ms, 250ms, 650ms
 */
async function uploadWithRetry(pid, files) {
  let lastErr = null;
  const delays = [0, 250, 650];

  for (let i = 0; i < delays.length; i++) {
    if (delays[i]) await sleep(delays[i]);
    try {
      const res = await products.uploadImages(pid, files);
      if (res) return res;
      lastErr = new Error(products.error || "UPLOAD_FAILED");
    } catch (e) {
      lastErr = e;
    }
  }

  throw lastErr || new Error("UPLOAD_FAILED");
}

async function onFiles(e) {
  const list = Array.from(e?.target?.files || []);
  e.target.value = "";

  if (!list.length) return;

  busy.value = true;
  error.value = null;
  products.error = null;

  try {
    const pid = await ensureProductIdOrThrow();

    // ✅ subir (con retry)
    await uploadWithRetry(pid, list);

    // ✅ refrescar
    await reload(pid);
  } catch (err) {
    error.value = err?.message || products.error || "No se pudo subir la imagen";
  } finally {
    busy.value = false;
  }
}

async function reload(forcedId = null) {
  const pid = Number(forcedId || props.productId || 0);
  if (!pid) return;

  busy.value = true;
  error.value = null;
  products.error = null;

  try {
    const list = await products.fetchImages(pid);
    images.value = Array.isArray(list) ? list : [];
  } catch (e) {
    error.value = products.error || e?.message || "No se pudieron cargar imágenes";
  } finally {
    busy.value = false;
  }
}

async function removeImg(img) {
  const pid = Number(props.productId || 0);
  const iid = Number(img?.id || 0);
  if (!pid || !iid) return;

  busy.value = true;
  error.value = null;
  products.error = null;

  try {
    const ok = await products.removeImage(pid, iid);
    if (!ok) throw new Error(products.error || "No se pudo eliminar");
    images.value = (images.value || []).filter((x) => Number(x?.id || 0) !== iid);
  } catch (e) {
    error.value = products.error || e?.message || "No se pudo eliminar";
  } finally {
    busy.value = false;
  }
}
</script>
