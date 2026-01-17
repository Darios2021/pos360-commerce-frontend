<!-- src/modules/products/components/panels/ProductImagesPanel.vue -->
<template>
  <div class="d-flex flex-column ga-3">
    <div class="d-flex align-center justify-space-between flex-wrap ga-2">
      <div>
        <div class="text-subtitle-1 font-weight-bold">Imágenes</div>
        <div class="text-caption text-medium-emphasis">
          <template v-if="resolvedId && !defer">
            Subí imágenes al producto existente.
          </template>
          <template v-else>
            Elegí imágenes ahora y quedan en cola. Se subirán al tocar <b>CREAR</b> en el Resumen.
          </template>
        </div>
      </div>

      <div class="d-flex ga-2">
        <v-btn
          variant="tonal"
          size="small"
          @click="refresh"
          :disabled="busy || !resolvedId"
          title="Refrescar (solo si el producto ya existe)"
        >
          <v-icon start size="18">mdi-refresh</v-icon>
          Refrescar
        </v-btn>

        <v-btn
          color="primary"
          size="small"
          @click="pickFiles"
          :loading="busy"
          :disabled="busy"
          title="Elegir imágenes"
        >
          <v-icon start size="18">mdi-upload</v-icon>
          {{ resolvedId && !defer ? "Subir" : "Elegir" }}
        </v-btn>
      </div>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      multiple
      class="d-none"
      @change="onFilesSelected"
    />

    <v-alert v-if="error" type="error" variant="tonal" density="compact">
      {{ error }}
    </v-alert>

    <!-- ✅ MODO COLA (si NO hay id o si defer=true) -->
    <template v-if="isQueueMode">
      <v-alert type="info" variant="tonal" density="comfortable" class="rounded-lg">
        Tenés <b>{{ queuedCount }}</b> imagen(es) en cola. Se subirán al tocar <b>CREAR</b>.
      </v-alert>

      <div v-if="!queuedCount" class="text-caption text-medium-emphasis">
        Sin imágenes en cola.
      </div>

      <div class="img-grid" v-else>
        <v-card
          v-for="q in queued"
          :key="q.key"
          class="img-card"
          rounded="lg"
          variant="tonal"
        >
          <div class="img-wrap">
            <img :src="q.url" class="img" alt="queued" />
          </div>

          <div class="d-flex align-center justify-space-between px-2 py-2">
            <div class="text-caption text-medium-emphasis text-truncate">
              {{ q.name }}
            </div>

            <v-btn
              size="x-small"
              variant="tonal"
              color="error"
              @click="removeQueuedByKey(q.key)"
              :disabled="busy"
              title="Quitar"
            >
              <v-icon size="16">mdi-close</v-icon>
            </v-btn>
          </div>
        </v-card>
      </div>
    </template>

    <!-- ✅ MODO REAL (con productId y defer=false) -->
    <template v-else>
      <div v-if="!images.length" class="text-caption text-medium-emphasis">
        Sin imágenes.
      </div>

      <div class="img-grid">
        <v-card
          v-for="img in images"
          :key="img.id || img.url"
          class="img-card"
          rounded="lg"
          variant="tonal"
        >
          <div class="img-wrap">
            <img :src="img.url" class="img" alt="product" />
          </div>

          <div class="d-flex align-center justify-space-between px-2 py-2">
            <div class="text-caption text-medium-emphasis text-truncate">
              {{ img.is_primary ? "Principal" : " " }}
            </div>

            <div class="d-flex ga-1">
              <v-btn
                size="x-small"
                variant="tonal"
                @click="setPrimary(img)"
                :disabled="busy || img.is_primary"
                title="Marcar como principal"
              >
                <v-icon size="16">mdi-star</v-icon>
              </v-btn>

              <v-btn
                size="x-small"
                variant="tonal"
                color="error"
                @click="removeImage(img)"
                :disabled="busy"
                title="Eliminar"
              >
                <v-icon size="16">mdi-delete</v-icon>
              </v-btn>
            </div>
          </div>
        </v-card>
      </div>
    </template>

    <v-snackbar v-model="snack.open" :timeout="2500" location="bottom right">
      {{ snack.text }}
      <template #actions>
        <v-btn variant="text" @click="snack.open=false">OK</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import http from "../../../../app/api/http";

/**
 * API esperado:
 * - GET    /products/:id/images
 * - POST   /products/:id/images (multipart)
 * - PATCH  /products/:id/images/:imageId/primary
 * - DELETE /products/:id/images/:imageId
 */
const API = {
  list: (id) => `/products/${id}/images`,
  upload: (id) => `/products/${id}/images`,
  setPrimary: (id, imageId) => `/products/${id}/images/${imageId}/primary`,
  remove: (id, imageId) => `/products/${id}/images/${imageId}`,
};

const emit = defineEmits(["update:modelValue", "changed"]);

const props = defineProps({
  productId: { type: [Number, String], default: null },

  // ✅ v-model (cola): File[]
  modelValue: { type: Array, default: () => [] },

  // ✅ si true: siempre cola (aunque exista productId)
  defer: { type: Boolean, default: false },
});

const fileInput = ref(null);
const busy = ref(false);
const error = ref("");
const images = ref([]);
const snack = ref({ open: false, text: "" });

function toast(t) {
  snack.value = { open: true, text: String(t || "") };
}

const resolvedId = computed(() => {
  const id = Number(props.productId || 0);
  return id > 0 ? id : 0;
});

const isQueueMode = computed(() => {
  // cola si no hay id o si defer=true
  return !resolvedId.value || !!props.defer;
});

function safeFiles(arr) {
  return (Array.isArray(arr) ? arr : []).filter((f) => f instanceof File);
}

function fileKey(f) {
  return `${f.name}__${f.size}__${f.lastModified}`;
}

function setQueue(nextFiles) {
  const clean = safeFiles(nextFiles);
  emit("update:modelValue", clean);
  emit("changed", clean);
}

function addToQueue(newFiles) {
  const prev = safeFiles(props.modelValue);
  const add = safeFiles(newFiles);

  const map = new Map();
  for (const f of prev) map.set(fileKey(f), f);
  for (const f of add) map.set(fileKey(f), f);

  setQueue(Array.from(map.values()));
}

function removeQueuedByKey(key) {
  const prev = safeFiles(props.modelValue);
  const next = prev.filter((f) => fileKey(f) !== key);
  setQueue(next);
}

/* ===== previews (ObjectURL) ===== */
const objectUrls = new Map(); // key -> url

const queued = computed(() => {
  const arr = safeFiles(props.modelValue);
  return arr.map((f) => {
    const k = fileKey(f);
    let url = objectUrls.get(k);
    if (!url) {
      url = URL.createObjectURL(f);
      objectUrls.set(k, url);
    }
    return { key: k, file: f, url, name: f.name };
  });
});

const queuedCount = computed(() => queued.value.length);

function cleanupObjectUrls(keepKeys = new Set()) {
  for (const [k, url] of objectUrls.entries()) {
    if (!keepKeys.has(k)) {
      try { URL.revokeObjectURL(url); } catch {}
      objectUrls.delete(k);
    }
  }
}

watch(
  () => queued.value.map((q) => q.key),
  (keys) => cleanupObjectUrls(new Set(keys)),
  { immediate: true }
);

onBeforeUnmount(() => cleanupObjectUrls(new Set()));

/* ===== actions ===== */
function pickFiles() {
  error.value = "";
  fileInput.value?.click?.();
}

function normalizeImages(list) {
  const arr = Array.isArray(list) ? list : [];
  return arr
    .map((x) => {
      if (!x) return null;
      const id = x.id ?? x.image_id ?? null;
      const url = String(x.url ?? x.image_url ?? x.path ?? "").trim();
      const is_primary = !!(x.is_primary ?? x.primary ?? false);
      if (!url) return null;
      return { id, url, is_primary };
    })
    .filter(Boolean);
}

async function refresh() {
  error.value = "";
  const id = resolvedId.value;
  if (!id) return;

  busy.value = true;
  try {
    const { data } = await http.get(API.list(id));
    images.value = normalizeImages(data?.items ?? data?.images ?? data ?? []);
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudieron cargar imágenes";
  } finally {
    busy.value = false;
  }
}

async function onFilesSelected(ev) {
  const files = Array.from(ev?.target?.files || []);
  ev.target.value = "";
  if (!files.length) return;

  error.value = "";

  // ✅ cola (create wizard)
  if (isQueueMode.value) {
    addToQueue(files);
    toast(`🧾 ${files.length} imagen(es) en cola`);
    return;
  }

  // ✅ upload inmediato (edit)
  busy.value = true;
  try {
    const id = resolvedId.value;
    const fd = new FormData();
    for (const f of files) fd.append("files", f);

    await http.post(API.upload(id), fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    toast("✅ Imágenes subidas");
    await refresh();
  } catch (e) {
    const msg =
      e?.response?.data?.message ||
      e?.response?.data?.error ||
      e?.message ||
      "Error al subir imágenes";

    error.value = "Error al subir imágenes.\n" + msg;
  } finally {
    busy.value = false;
  }
}

async function setPrimary(img) {
  error.value = "";
  busy.value = true;
  try {
    const id = resolvedId.value;
    const imageId = img?.id;
    if (!imageId) throw new Error("La imagen no tiene id (backend debe devolverlo)");
    await http.patch(API.setPrimary(id, imageId));
    toast("⭐ Imagen principal actualizada");
    await refresh();
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo marcar como principal";
  } finally {
    busy.value = false;
  }
}

async function removeImage(img) {
  error.value = "";
  busy.value = true;
  try {
    const id = resolvedId.value;
    const imageId = img?.id;
    if (!imageId) throw new Error("La imagen no tiene id (backend debe devolverlo)");
    await http.delete(API.remove(id, imageId));
    toast("🗑️ Imagen eliminada");
    await refresh();
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo eliminar la imagen";
  } finally {
    busy.value = false;
  }
}

watch(
  () => props.productId,
  (v) => {
    if (Number(v || 0) > 0 && !props.defer) refresh();
  },
  { immediate: true }
);

onMounted(() => {
  if (resolvedId.value && !props.defer) refresh();
});
</script>

<style scoped>
.img-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
@media (max-width: 1100px) {
  .img-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 760px) {
  .img-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.img-card {
  overflow: hidden;
}
.img-wrap {
  width: 100%;
  aspect-ratio: 4 / 3;
  background: rgba(255, 255, 255, 0.04);
  display: grid;
  place-items: center;
}
.img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
