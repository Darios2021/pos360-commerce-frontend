<!-- src/modules/products/components/panels/ProductVideosPanel.vue -->
<!-- ✅ COPY-PASTE FINAL COMPLETO
     - EDIT mode: lista videos desde ADMIN (con token)
       GET /api/v1/admin/products/:id/videos
     - Delete:    DELETE /api/v1/admin/products/:id/videos/:videoId
     - Muestra también colas locales (youtubeQueue / filesQueue)
-->

<template>
  <v-card class="pv-card" rounded="xl" variant="tonal">
    <div class="pv-head d-flex align-center justify-space-between flex-wrap ga-2">
      <div class="d-flex align-center ga-2">
        <v-icon size="20">mdi-play-circle</v-icon>
        <div class="font-weight-bold">Videos</div>
      </div>

      <div class="d-flex align-center ga-2">
        <v-chip v-if="loading" size="small" variant="tonal">Cargando…</v-chip>
        <v-btn size="small" variant="text" @click="reload" :disabled="loading || !pid">
          <v-icon start size="18">mdi-refresh</v-icon>
          Recargar
        </v-btn>
      </div>
    </div>

    <div class="text-caption text-medium-emphasis mt-1">
      En edición, se listan desde el servidor. Las colas se suben al tocar <b>GUARDAR</b>.
    </div>

    <v-divider class="my-3" />

    <!-- ✅ Estado / errores -->
    <v-alert v-if="error" type="error" variant="tonal" density="comfortable" class="mb-3">
      {{ error }}
    </v-alert>

    <!-- ✅ Server list -->
    <div class="pv-section">
      <div class="pv-subtitle">En el producto</div>

      <div v-if="!pid" class="text-caption text-medium-emphasis">
        Guardá el producto para ver sus videos.
      </div>

      <div v-else-if="!loading && !serverVideos.length" class="text-caption text-medium-emphasis">
        Todavía no hay videos asociados.
      </div>

      <div v-else class="pv-grid">
        <div v-for="v in serverVideos" :key="v.id" class="pv-item">
          <div class="pv-thumb">
            <img v-if="thumbOf(v)" :src="thumbOf(v)" alt="" />
            <div v-else class="pv-thumb-fallback">
              <v-icon>mdi-video</v-icon>
            </div>
          </div>

          <div class="pv-meta minw-0">
            <div class="pv-title text-truncate">
              {{ v.title || labelOf(v) }}
            </div>
            <div class="pv-sub text-truncate">
              {{ v.url || (v.storage_key ? `Archivo: ${v.storage_key}` : "—") }}
            </div>
          </div>

          <div class="pv-actions">
            <v-btn
              v-if="v.url"
              icon
              size="small"
              variant="text"
              :href="v.url"
              target="_blank"
              title="Abrir"
            >
              <v-icon>mdi-open-in-new</v-icon>
            </v-btn>

            <v-btn
              icon
              size="small"
              variant="text"
              color="error"
              :disabled="loading"
              @click="removeVideo(v)"
              title="Eliminar"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </div>
        </div>
      </div>
    </div>

    <v-divider class="my-4" />

    <!-- ✅ Queue preview -->
    <div class="pv-section">
      <div class="pv-subtitle">En cola</div>

      <div class="pv-queue text-caption">
        <div>URLs YouTube: <b>{{ youtubeQueueSafe.length }}</b></div>
        <div>Archivos: <b>{{ filesQueueSafe.length }}</b></div>
      </div>

      <div v-if="youtubeQueueSafe.length" class="pv-queue-list mt-2">
        <div v-for="(q, idx) in youtubeQueueSafe" :key="q.key || q.url || idx" class="pv-queue-item">
          <div class="minw-0">
            <div class="pv-queue-title text-truncate">
              <v-icon size="16" class="mr-1">mdi-youtube</v-icon>
              {{ q.title || "YouTube" }}
            </div>
            <div class="pv-queue-sub text-truncate">{{ q.url }}</div>
          </div>

          <v-btn
            size="small"
            variant="text"
            icon
            @click="removeYoutubeAt(idx)"
            :disabled="loading"
            title="Quitar de cola"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </div>

      <div v-if="filesQueueSafe.length" class="mt-3 text-caption text-medium-emphasis">
        Archivos en cola:
        <div class="mt-1 pv-files">
          <div v-for="(f, i) in filesQueueSafe" :key="f?.name + i" class="pv-file">
            <v-icon size="16">mdi-file-video</v-icon>
            <span class="text-truncate">{{ f?.name || "video" }}</span>
          </div>
        </div>

        <v-btn
          size="small"
          variant="text"
          class="mt-2"
          @click="clearFiles"
          :disabled="loading"
        >
          Quitar archivos
        </v-btn>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import http from "../../../../app/api/http";

const props = defineProps({
  productId: { type: [Number, String], default: null },
  mode: { type: String, default: "edit" }, // edit
  youtubeQueue: { type: Array, default: () => [] },
  filesQueue: { type: Array, default: () => [] },
});

const emit = defineEmits([
  "changed",
  "update:youtubeQueue",
  "update:filesQueue",
]);

function toInt(v, d = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
}

const pid = computed(() => toInt(props.productId, 0));

const loading = ref(false);
const error = ref("");
const serverVideos = ref([]);

const youtubeQueueSafe = computed(() => (Array.isArray(props.youtubeQueue) ? props.youtubeQueue.filter(Boolean) : []));
const filesQueueSafe = computed(() => (Array.isArray(props.filesQueue) ? props.filesQueue.filter(Boolean) : []));

function labelOf(v) {
  const p = String(v?.provider || "").toLowerCase();
  if (p.includes("youtube")) return "YouTube";
  if (p.includes("file") || v?.storage_key) return "Archivo";
  return "Video";
}

function extractYoutubeId(url) {
  const u = String(url || "").trim();
  if (!u) return "";
  // watch?v=ID
  const m1 = u.match(/[?&]v=([^&#]+)/i);
  if (m1?.[1]) return m1[1];
  // youtu.be/ID
  const m2 = u.match(/youtu\.be\/([^?&#/]+)/i);
  if (m2?.[1]) return m2[1];
  // shorts/ID
  const m3 = u.match(/shorts\/([^?&#/]+)/i);
  if (m3?.[1]) return m3[1];
  // embed/ID
  const m4 = u.match(/embed\/([^?&#/]+)/i);
  if (m4?.[1]) return m4[1];
  return "";
}

function thumbOf(v) {
  const url = v?.url;
  const id = extractYoutubeId(url);
  if (!id) return "";
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

async function reload() {
  error.value = "";
  serverVideos.value = [];

  if (!pid.value) return;

  loading.value = true;
  try {
    // ✅ FIX CLAVE: ADMIN endpoint (con token via http.js)
    const r = await http.get(`/admin/products/${pid.value}/videos`);
    const arr = r?.data?.data;
    serverVideos.value = Array.isArray(arr) ? arr : [];
  } catch (e) {
    error.value = e?.friendlyMessage || e?.message || "No se pudo cargar videos";
  } finally {
    loading.value = false;
  }
}

async function removeVideo(v) {
  const vid = toInt(v?.id, 0);
  if (!pid.value || !vid) return;

  loading.value = true;
  error.value = "";
  try {
    // ✅ DELETE ADMIN
    await http.delete(`/admin/products/${pid.value}/videos/${vid}`);
    await reload();
    emit("changed");
  } catch (e) {
    error.value = e?.friendlyMessage || e?.message || "No se pudo eliminar";
  } finally {
    loading.value = false;
  }
}

function removeYoutubeAt(idx) {
  const a = [...youtubeQueueSafe.value];
  a.splice(idx, 1);
  emit("update:youtubeQueue", a);
  emit("changed");
}

function clearFiles() {
  emit("update:filesQueue", []);
  emit("changed");
}

watch(
  () => pid.value,
  () => {
    if (props.mode === "edit") reload();
  },
  { immediate: true }
);
</script>

<style scoped>
.pv-card {
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.pv-head {
  font-weight: 900;
}
.pv-section {
  display: grid;
  gap: 10px;
}
.pv-subtitle {
  font-size: 13px;
  font-weight: 900;
  opacity: 0.9;
}

.pv-grid {
  display: grid;
  gap: 10px;
}
.pv-item {
  display: grid;
  grid-template-columns: 74px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
}

.pv-thumb {
  width: 74px;
  height: 42px;
  border-radius: 10px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.06);
  display: grid;
  place-items: center;
}
.pv-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.pv-thumb-fallback {
  opacity: 0.8;
}

.pv-meta .pv-title {
  font-weight: 900;
  font-size: 13px;
}
.pv-meta .pv-sub {
  font-size: 12px;
  opacity: 0.75;
}
.pv-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pv-queue {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  opacity: 0.85;
}

.pv-queue-list {
  display: grid;
  gap: 8px;
}
.pv-queue-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
}
.pv-queue-title {
  font-weight: 900;
  font-size: 12px;
}
.pv-queue-sub {
  font-size: 12px;
  opacity: 0.8;
}

.pv-files {
  display: grid;
  gap: 6px;
}
.pv-file {
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0.9;
}
.minw-0 {
  min-width: 0;
}
</style>
