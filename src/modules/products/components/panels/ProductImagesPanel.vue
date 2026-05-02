<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/products/components/panels/ProductImagesPanel.vue -->
<template>
  <div class="pi-root d-flex flex-column ga-3">

    <!-- Action bar -->
    <div class="d-flex align-center justify-space-between flex-wrap ga-2">
      <div>
        <div class="text-subtitle-1 font-weight-bold">Imágenes</div>
        <div class="text-caption text-medium-emphasis">
          <template v-if="resolvedId && !defer">
            Subí imágenes al producto existente.
          </template>
          <template v-else>
            En cola: se suben al crear.
          </template>
        </div>
      </div>

      <div class="d-flex ga-2 flex-wrap">
        <v-btn
          variant="tonal"
          size="small"
          @click="refresh"
          :disabled="busy || !resolvedId"
          title="Refrescar"
        >
          <v-icon size="18">mdi-refresh</v-icon>
        </v-btn>

        <v-btn
          color="teal-darken-1"
          variant="tonal"
          size="small"
          @click="openCamera"
          :disabled="busy"
          title="Usar cámara del dispositivo"
        >
          <v-icon start size="18">mdi-camera</v-icon>
          Cámara
        </v-btn>

        <v-btn
          color="primary"
          variant="flat"
          size="small"
          @click="pickFiles"
          :loading="busy"
          :disabled="busy"
          title="Elegir archivos"
        >
          <v-icon start size="18">mdi-image-plus</v-icon>
          {{ resolvedId && !defer ? "Subir" : "Elegir" }}
        </v-btn>
      </div>
    </div>

    <!-- Hidden inputs -->
    <input ref="fileInput" type="file" accept="image/*" multiple class="d-none" @change="onFilesSelected" />
    <input ref="cameraInput" type="file" accept="image/*" capture="environment" class="d-none" @change="onFilesSelected" />

    <!-- Drop zone (shown when no images) -->
    <div
      v-if="isQueueMode && !queuedCount"
      class="pi-dropzone"
      :class="{ over: isDragOver }"
      @dragover.prevent="isDragOver = true"
      @dragleave="isDragOver = false"
      @drop.prevent="onDrop"
      @click="pickFiles"
    >
      <v-icon size="40" :color="isDragOver ? 'primary' : undefined" class="pi-dropzone-icon">mdi-cloud-upload-outline</v-icon>
      <div class="pi-dropzone-text">Arrastrá imágenes o tocá aquí</div>
      <div class="pi-dropzone-hint">JPG · PNG · WEBP</div>
      <v-btn color="teal-darken-1" variant="tonal" size="small" class="mt-3" @click.stop="openCamera">
        <v-icon start size="16">mdi-camera</v-icon>
        Tomar con cámara
      </v-btn>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" density="compact">
      {{ error }}
    </v-alert>

    <!-- ✅ MODO COLA -->
    <template v-if="isQueueMode">
      <v-alert v-if="queuedCount" type="info" variant="tonal" density="compact" class="rounded-lg">
        <b>{{ queuedCount }}</b> imagen(es) en cola · se subirán al crear
      </v-alert>

      <div
        v-if="queuedCount"
        class="pi-grid"
        @dragover.prevent="isDragOver = true"
        @dragleave="isDragOver = false"
        @drop.prevent="onDrop"
      >
        <v-card
          v-for="q in queued"
          :key="q.key"
          class="pi-card"
          rounded="lg"
          variant="tonal"
        >
          <div class="pi-wrap">
            <img :src="q.url" class="pi-img" alt="queued" />
          </div>

          <div class="d-flex align-center justify-space-between px-2 py-2">
            <div class="text-caption text-medium-emphasis text-truncate">
              {{ q.name }}
            </div>

            <div class="d-flex ga-1">
              <v-btn
                size="x-small"
                variant="tonal"
                @click="openCropperForQueued(q)"
                :disabled="busy"
                title="Recortar"
              >
                <v-icon size="16">mdi-crop</v-icon>
              </v-btn>

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
          </div>
        </v-card>
      </div>
    </template>

    <!-- ✅ MODO REAL -->
    <template v-else>
      <div v-if="!images.length" class="text-caption text-medium-emphasis">
        Sin imágenes.
      </div>

      <div class="pi-grid">
        <v-card
          v-for="img in images"
          :key="img.id || img.url"
          class="pi-card"
          rounded="lg"
          variant="tonal"
        >
          <div class="pi-wrap">
            <img :src="img.url" class="pi-img" alt="product" />
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
                color="primary"
                @click="openCropperForRemote(img)"
                :disabled="busy"
                title="Recortar"
              >
                <v-icon size="16">mdi-crop</v-icon>
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

    <!-- ✅ Editor de recorte -->
    <ImageCropperDialog
      v-model="cropper.open"
      :src="cropper.src"
      :filename="cropper.filename"
      default-ratio="1"
      @applied="onCropApplied"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import http from "../../../../app/api/http";
import ImageCropperDialog from "../dialogs/ImageCropperDialog.vue";

const API = {
  list: (id) => `/products/${id}/images`,
  upload: (id) => `/products/${id}/images`,
  setPrimary: (id, imageId) => `/products/${id}/images/${imageId}/primary`,
  remove: (id, imageId) => `/products/${id}/images/${imageId}`,
};

const emit = defineEmits(["update:modelValue", "changed"]);

const props = defineProps({
  productId: { type: [Number, String], default: null },
  modelValue: { type: Array, default: () => [] }, // File[]
  defer: { type: Boolean, default: false },
});

const fileInput = ref(null);
const cameraInput = ref(null);
const busy = ref(false);
const error = ref("");
const images = ref([]);
const snack = ref({ open: false, text: "" });
const isDragOver = ref(false);

function toast(t) {
  snack.value = { open: true, text: String(t || "") };
}

const resolvedId = computed(() => {
  const id = Number(props.productId || 0);
  return id > 0 ? id : 0;
});

const isQueueMode = computed(() => {
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

/* previews */
const objectUrls = new Map();

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

/* actions */
function pickFiles() {
  error.value = "";
  fileInput.value?.click?.();
}

function openCamera() {
  error.value = "";
  cameraInput.value?.click?.();
}

function onDrop(e) {
  isDragOver.value = false;
  const files = Array.from(e.dataTransfer?.files || []).filter((f) => f.type.startsWith("image/"));
  if (!files.length) return;
  if (isQueueMode.value) {
    addToQueue(files);
    toast(`🧾 ${files.length} imagen(es) en cola`);
  } else {
    onFilesSelected({ target: { files, value: "" } });
  }
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

  if (isQueueMode.value) {
    addToQueue(files);
    toast(`🧾 ${files.length} imagen(es) en cola`);
    return;
  }

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

/* =========================
   ✅ CROPPER
========================= */
const cropper = ref({
  open: false,
  src: "",
  filename: "",
  // contexto: una y solo una de estas dos está seteada
  queueKey: "",      // si recortamos un File en cola
  remoteImg: null,   // si recortamos una imagen ya subida
});

function openCropperForQueued(q) {
  if (!q?.file || !q?.url) return;
  cropper.value = {
    open: true,
    src: q.url, // object URL del File en cola
    filename: q.name || "imagen",
    queueKey: q.key,
    remoteImg: null,
  };
}

function openCropperForRemote(img) {
  if (!img?.url) return;
  // ✅ cache-buster para evitar tainted canvas con caches viejos
  const sep = img.url.includes("?") ? "&" : "?";
  const src = `${img.url}${sep}_cb=${Date.now()}`;
  cropper.value = {
    open: true,
    src,
    filename: `producto-${img.id || "img"}`,
    queueKey: "",
    remoteImg: img,
  };
}

async function onCropApplied(payload) {
  const file = payload?.file;
  if (!(file instanceof File)) return;

  // ── Modo cola: reemplazo el File en la queue
  if (cropper.value.queueKey) {
    const key = cropper.value.queueKey;
    const prev = safeFiles(props.modelValue);
    const next = prev.map((f) => (fileKey(f) === key ? file : f));
    setQueue(next);
    toast("✂️ Imagen recortada (en cola)");
    return;
  }

  // ── Modo real: subo nueva + borro original + refresh
  const original = cropper.value.remoteImg;
  if (!original) return;

  const id = resolvedId.value;
  if (!id) {
    error.value = "Producto sin id, no puedo guardar el recorte";
    return;
  }

  busy.value = true;
  error.value = "";
  try {
    const fd = new FormData();
    fd.append("files", file);
    await http.post(API.upload(id), fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (original.id) {
      try {
        await http.delete(API.remove(id, original.id));
      } catch (e) {
        // Si falla el delete, igual avisamos del éxito del upload
        // pero dejamos un mensaje suave por consola.
        console.warn("[ProductImages] no se pudo eliminar la original:", e);
      }
    }

    toast("✂️ Imagen recortada y guardada");
    await refresh();
  } catch (e) {
    error.value =
      e?.response?.data?.message ||
      e?.response?.data?.error ||
      e?.message ||
      "No se pudo guardar el recorte";
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
.pi-root {
  min-width: 0;
}

.pi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
@media (max-width: 1100px) {
  .pi-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 760px) {
  .pi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.pi-card {
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.pi-wrap {
  width: 100%;
  aspect-ratio: 4 / 3;
  background: rgba(0, 0, 0, 0.03);
  display: grid;
  place-items: center;
}

.pi-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* ── Drop zone ── */
.pi-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 32px 20px;
  border: 2px dashed rgba(var(--v-border-color), calc(var(--v-border-opacity) * 2));
  border-radius: 14px;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
  text-align: center;
  background: rgba(var(--v-theme-surface-variant), 0.3);
}
.pi-dropzone:hover {
  background: rgba(var(--v-theme-primary), 0.06);
  border-color: rgb(var(--v-theme-primary));
}
.pi-dropzone.over {
  background: rgba(var(--v-theme-primary), 0.12);
  border-color: rgb(var(--v-theme-primary));
}
.pi-dropzone-icon { opacity: 0.5; }
.pi-dropzone-text { font-size: 14px; font-weight: 400; opacity: 0.8; }
.pi-dropzone-hint { font-size: 12px; opacity: 0.45; }
</style>