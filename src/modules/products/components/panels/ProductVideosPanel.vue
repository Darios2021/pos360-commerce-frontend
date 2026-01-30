<!-- src/modules/products/components/panels/ProductVideosPanel.vue -->
<!-- ✅ COPY-PASTE FINAL COMPLETO
     - Admin panel videos por producto
     - Lista / agrega YouTube / sube video / elimina
     - ✅ FIX: endpoints con fallback:
         1) /api/v1/products/:id/videos (público)
         2) si 404 => /api/v1/admin/products/:id/videos (admin)
     - NO usa v-model para evitar watchers circulares
-->

<template>
  <div class="pv-wrap">
    <v-card rounded="xl" variant="tonal" class="pv-card">
      <div class="d-flex align-center justify-space-between flex-wrap ga-2">
        <div>
          <div class="text-subtitle-1 font-weight-bold">Videos</div>
          <div class="text-caption text-medium-emphasis">
            Cargá un video para que se vea en la tienda (YouTube o archivo).
          </div>
        </div>

        <v-btn
          size="small"
          variant="tonal"
          prepend-icon="mdi-refresh"
          :loading="loading"
          :disabled="disabled || !productId"
          @click="reload"
        >
          Recargar
        </v-btn>
      </div>

      <v-divider class="my-3" />

      <v-alert v-if="!productId" type="info" variant="tonal" density="comfortable">
        Guardá/creá el producto primero para poder cargar videos.
      </v-alert>

      <v-alert v-else-if="error" type="error" variant="tonal" density="comfortable" class="mb-3">
        {{ error }}
      </v-alert>

      <!-- Actions -->
      <div v-if="productId" class="pv-grid">
        <!-- YouTube -->
        <v-card rounded="xl" variant="outlined" class="pv-box">
          <div class="d-flex align-center ga-2 mb-2">
            <v-icon>mdi-youtube</v-icon>
            <div class="font-weight-bold">YouTube</div>
          </div>

          <v-text-field
            v-model="yt.url"
            label="Link (watch / shorts / youtu.be)"
            placeholder="https://www.youtube.com/watch?v=..."
            variant="outlined"
            density="comfortable"
            hide-details
            :disabled="disabled || busy"
          />

          <v-text-field
            v-model="yt.title"
            class="mt-2"
            label="Título (opcional)"
            variant="outlined"
            density="comfortable"
            hide-details
            :disabled="disabled || busy"
          />

          <div class="d-flex justify-end mt-3">
            <v-btn
              color="primary"
              variant="flat"
              prepend-icon="mdi-plus"
              :loading="busy && busyKind === 'youtube'"
              :disabled="disabled || busy || !yt.url.trim()"
              @click="addYoutube"
            >
              Agregar
            </v-btn>
          </div>
        </v-card>

        <!-- Upload -->
        <v-card rounded="xl" variant="outlined" class="pv-box">
          <div class="d-flex align-center ga-2 mb-2">
            <v-icon>mdi-video</v-icon>
            <div class="font-weight-bold">Subir archivo</div>
          </div>

          <v-file-input
            v-model="up.file"
            label="Video (mp4 / webm / mov)"
            variant="outlined"
            density="comfortable"
            prepend-icon="mdi-paperclip"
            accept="video/*"
            :disabled="disabled || busy"
            show-size
          />

          <v-text-field
            v-model="up.title"
            class="mt-2"
            label="Título (opcional)"
            variant="outlined"
            density="comfortable"
            hide-details
            :disabled="disabled || busy"
          />

          <div class="d-flex justify-end mt-3">
            <v-btn
              color="primary"
              variant="flat"
              prepend-icon="mdi-cloud-upload"
              :loading="busy && busyKind === 'upload'"
              :disabled="disabled || busy || !up.file"
              @click="uploadFile"
            >
              Subir
            </v-btn>
          </div>

          <div class="text-caption text-medium-emphasis mt-2">
            Recomendado: MP4. Límite backend: 80MB (según controller).
          </div>
        </v-card>
      </div>

      <!-- List -->
      <div v-if="productId" class="mt-4">
        <div class="d-flex align-center justify-space-between">
          <div class="text-subtitle-2 font-weight-bold">Cargados</div>
          <v-chip size="small" variant="tonal">{{ videos.length }} video(s)</v-chip>
        </div>

        <div v-if="!videos.length" class="text-caption text-medium-emphasis mt-2">
          Aún no hay videos.
        </div>

        <div v-else class="pv-list mt-3">
          <v-card
            v-for="v in videos"
            :key="v.id"
            rounded="xl"
            variant="outlined"
            class="pv-item"
          >
            <div class="d-flex align-center justify-space-between ga-2">
              <div class="minw-0">
                <div class="font-weight-black text-truncate">
                  {{ v.title || (v.provider === 'youtube' ? 'YouTube' : 'Video') }}
                </div>
                <div class="text-caption text-medium-emphasis text-truncate">
                  {{ v.provider === 'youtube' ? v.url : (v.url || v.storage_key || '—') }}
                </div>
              </div>

              <div class="d-flex ga-2">
                <v-btn
                  v-if="v.provider === 'youtube' && v.url"
                  icon
                  variant="tonal"
                  :href="v.url"
                  target="_blank"
                  title="Abrir"
                >
                  <v-icon>mdi-open-in-new</v-icon>
                </v-btn>

                <v-btn
                  icon
                  color="error"
                  variant="tonal"
                  :loading="busy && busyKind === ('del:' + v.id)"
                  :disabled="disabled || busy"
                  @click="removeVideo(v.id)"
                  title="Eliminar"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </div>
            </div>
          </v-card>
        </div>
      </div>
    </v-card>

    <v-snackbar v-model="snack.open" :timeout="2400" location="bottom right">
      {{ snack.text }}
      <template #actions>
        <v-btn variant="text" @click="snack.open=false">OK</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>






<script setup>
import { computed, onMounted, ref, watch } from "vue";
import http from "../../../../app/api/http";

/* =========================
   PROPS
========================= */
const props = defineProps({
  productId: { type: [Number, String], default: null },
  disabled: { type: Boolean, default: false },
});

/* =========================
   STATE
========================= */
const pid = computed(() => {
  const n = Number(props.productId);
  return Number.isFinite(n) && n > 0 ? n : 0;
});

const loading = ref(false);
const busy = ref(false);
const busyKind = ref("");
const error = ref(null);

const videos = ref([]);

const yt = ref({ url: "", title: "" });
const up = ref({ file: null, title: "" });

const snack = ref({ open: false, text: "" });
function toast(t) {
  snack.value = { open: true, text: String(t || "") };
}

/* =========================
   ENDPOINT BASES
========================= */
function basePublic() {
  // axios ya tiene baseURL = /api/v1
  return `/products/${pid.value}/videos`;
}
function baseAdmin() {
  return `/admin/products/${pid.value}/videos`;
}

/* =========================
   FALLBACK HELPERS
========================= */
function is404(e) {
  return Number(e?.response?.status) === 404;
}

async function getWithFallback(path) {
  try {
    return await http.get(path);
  } catch (e) {
    if (is404(e)) return await http.get(path.replace("/products/", "/admin/products/"));
    throw e;
  }
}

async function postWithFallback(path, body, config) {
  try {
    return await http.post(path, body, config);
  } catch (e) {
    if (is404(e)) return await http.post(path.replace("/products/", "/admin/products/"), body, config);
    throw e;
  }
}

async function deleteWithFallback(path) {
  try {
    return await http.delete(path);
  } catch (e) {
    if (is404(e)) return await http.delete(path.replace("/products/", "/admin/products/"));
    throw e;
  }
}

/* =========================
   API ACTIONS
========================= */
async function reload() {
  if (!pid.value) return;

  loading.value = true;
  error.value = null;
  try {
    const { data } = await getWithFallback(basePublic());
    videos.value = Array.isArray(data?.data) ? data.data : [];
  } catch (e) {
    error.value =
      e?.response?.data?.message ||
      e?.message ||
      "No se pudo cargar la lista de videos";
  } finally {
    loading.value = false;
  }
}

async function addYoutube() {
  if (!pid.value) return;

  const url = String(yt.value.url || "").trim();
  const title = String(yt.value.title || "").trim();
  if (!url) return;

  busy.value = true;
  busyKind.value = "youtube";
  error.value = null;

  try {
    const { data } = await postWithFallback(`${basePublic()}/youtube`, {
      url,
      title: title || null,
    });

    if (!data?.ok) throw new Error(data?.message || "No se pudo agregar");

    yt.value = { url: "", title: "" };
    toast("✅ YouTube agregado");
    await reload();
  } catch (e) {
    error.value =
      e?.response?.data?.message ||
      e?.message ||
      "No se pudo agregar YouTube";
  } finally {
    busy.value = false;
    busyKind.value = "";
  }
}

async function uploadFile() {
  if (!pid.value) return;
  if (!up.value.file) return;

  const f = up.value.file;
  const title = String(up.value.title || "").trim();

  const form = new FormData();
  form.append("file", f);
  if (title) form.append("title", title);

  busy.value = true;
  busyKind.value = "upload";
  error.value = null;

  try {
    const { data } = await postWithFallback(`${basePublic()}/upload`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (!data?.ok) throw new Error(data?.message || "No se pudo subir");

    up.value = { file: null, title: "" };
    toast("✅ Video subido");
    await reload();
  } catch (e) {
    error.value =
      e?.response?.data?.message ||
      e?.message ||
      "No se pudo subir el video";
  } finally {
    busy.value = false;
    busyKind.value = "";
  }
}

async function removeVideo(videoId) {
  if (!pid.value) return;

  const id = Number(videoId);
  if (!Number.isFinite(id) || id <= 0) return;

  busy.value = true;
  busyKind.value = "del:" + id;
  error.value = null;

  try {
    const { data } = await deleteWithFallback(`${basePublic()}/${id}`);
    if (!data?.ok) throw new Error(data?.message || "No se pudo eliminar");

    toast("✅ Video eliminado");
    await reload();
  } catch (e) {
    error.value =
      e?.response?.data?.message ||
      e?.message ||
      "No se pudo eliminar el video";
  } finally {
    busy.value = false;
    busyKind.value = "";
  }
}

/* =========================
   LIFECYCLE
========================= */
watch(
  () => pid.value,
  (v) => {
    videos.value = [];
    error.value = null;
    if (v) reload();
  },
  { immediate: true }
);

onMounted(() => {
  if (pid.value) reload();
});
</script>





<style scoped>
.pv-card {
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.pv-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
@media (max-width: 900px) {
  .pv-grid {
    grid-template-columns: 1fr;
  }
}
.pv-box {
  padding: 12px;
}
.pv-list {
  display: grid;
  gap: 10px;
}
.pv-item {
  padding: 12px;
}
.minw-0 {
  min-width: 0;
}
</style>
