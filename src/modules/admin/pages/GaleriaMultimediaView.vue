<!-- src/modules/admin/pages/GaleriaMultimediaView.vue -->
<!-- ✅ COPY-PASTE FINAL COMPLETO (thumb WEBP + copy WEBP + delete PACKAGE + overwrite por key/url/stem) -->

<template>
  <v-container fluid class="mm-root pa-4">
    <!-- HEADER -->
    <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-4">
      <div>
        <div class="text-h5 font-weight-bold">Galería multimedia</div>
        <div class="text-caption text-medium-emphasis">
          Admin · Imágenes del storage · Filtrado por producto/categoría/subcategoría.
        </div>
      </div>

      <div class="d-flex flex-wrap ga-2 align-center">
        <v-text-field
          v-model="q"
          label="Buscar (filename / producto / categoría / subcategoría)"
          variant="outlined"
          density="comfortable"
          clearable
          class="mm-search"
          prepend-inner-icon="mdi-magnify"
        />

        <v-btn variant="tonal" prepend-icon="mdi-refresh" :loading="loading" @click="reload(true)">
          Recargar
        </v-btn>

        <input ref="fileInput" type="file" accept="image/*" class="d-none" @change="onPickFile" />

        <v-btn color="primary" prepend-icon="mdi-upload" :loading="uploading" @click="pickFile">
          Subir imagen
        </v-btn>
      </div>
    </div>

    <!-- FILTER BAR -->
    <v-card variant="tonal" rounded="xl" class="mm-filtercard mb-3">
      <v-card-text class="mm-filtergrid">
        <div class="d-flex flex-wrap ga-2 align-center">
          <v-chip-group v-model="used" mandatory>
            <v-chip value="all" size="small" variant="tonal">Todas</v-chip>
            <v-chip value="used" size="small" variant="tonal" color="green">Usadas</v-chip>
            <v-chip value="free" size="small" variant="tonal">No usadas</v-chip>
          </v-chip-group>

          <v-checkbox v-model="compact" density="compact" hide-details label="Compacto" />
        </div>

        <v-text-field v-model="product_id" label="Product ID" variant="outlined" density="comfortable" type="number" clearable />
        <v-text-field v-model="category_id" label="Category ID" variant="outlined" density="comfortable" type="number" clearable />
        <v-text-field v-model="subcategory_id" label="Subcategory ID" variant="outlined" density="comfortable" type="number" clearable />

        <div class="d-flex align-center justify-space-between mm-stats">
          <div class="text-caption text-medium-emphasis">
            Total: <b>{{ total }}</b> · Página: <b>{{ page }}</b>
          </div>

          <v-pagination
            v-model="page"
            :length="pageCount"
            density="comfortable"
            rounded="xl"
            @update:modelValue="reload(false)"
          />
        </div>
      </v-card-text>
    </v-card>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-3">
      {{ error }}
    </v-alert>

    <!-- GRID -->
    <div class="mm-grid" :class="{ 'mm-grid-compact': compact }">
      <v-card v-for="img in items" :key="img.key || img.url" class="mm-card" rounded="xl" variant="outlined">
        <button class="mm-thumb" type="button" @click="openViewer(img)" :aria-label="`Ver ${img.filename}`">
          <!-- ✅ Thumb SIEMPRE WEBP -->
          <img :src="webpUrl(img)" :alt="img.filename" loading="lazy" />
          <div class="mm-badges">
            <v-chip size="small" :color="img.is_used ? 'green' : 'grey'" variant="tonal">
              {{ img.is_used ? `Usada (${img.used_count})` : "No usada" }}
            </v-chip>
          </div>
        </button>

        <v-card-text class="mm-meta">
          <div class="mm-filename" :title="img.filename">{{ img.filename }}</div>

          <div class="text-caption text-medium-emphasis">
            {{ formatBytes(img.size) }} · {{ formatDate(img.last_modified) }}
          </div>

          <div class="mm-summary text-caption">
            <span class="text-medium-emphasis">{{ summaryLine(img) }}</span>
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions class="mm-actions">
          <v-btn size="small" variant="tonal" prepend-icon="mdi-eye" @click="openViewer(img)">Ver</v-btn>

          <!-- ✅ Copiar WEBP (lo que va a product_images.url) -->
          <v-btn size="small" variant="tonal" prepend-icon="mdi-content-copy" @click="copy(webpUrl(img))">
            Copiar URL (WEBP)
          </v-btn>

          <v-spacer />

          <v-btn
            size="small"
            color="red"
            variant="tonal"
            prepend-inner-icon="mdi-delete"
            :disabled="img.is_used"
            @click="remove(img)"
          >
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </div>

    <!-- VIEWER FULLSCREEN -->
    <v-dialog v-model="viewerOpen" fullscreen>
      <v-card class="mm-fullscreen-card">
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="minw-0">
            <div class="text-h6 text-truncate">Vista / Editor</div>
            <div class="text-caption text-medium-emphasis text-truncate">{{ viewer?.filename || "—" }}</div>
          </div>

          <div class="d-flex align-center ga-2">
            <v-chip v-if="viewer?.filename" size="small" :color="viewer?.is_used ? 'green' : 'grey'" variant="tonal">
              {{ viewer?.is_used ? `Usada (${viewer?.used_count})` : "No usada" }}
            </v-chip>

            <v-btn icon variant="text" @click="closeViewer">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
        </v-card-title>

        <v-divider />

        <v-card-text class="mm-fullscreen-body">
          <v-tabs v-model="viewerTab" density="comfortable" class="mb-3">
            <v-tab value="info" prepend-icon="mdi-information-outline">Info</v-tab>
            <v-tab value="editor" prepend-icon="mdi-crop">Editor</v-tab>
          </v-tabs>

          <v-window v-model="viewerTab" class="mm-window">
            <v-window-item value="info">
              <div class="mm-info-grid">
                <div class="mm-viewer-preview">
                  <!-- ✅ Preview grande WEBP -->
                  <img :src="viewerWebpCacheBust" class="mm-viewer-img" :alt="viewer?.filename" />
                </div>

                <div class="mm-info-side">
                  <v-list density="compact" rounded="lg" class="mm-list">
                    <v-list-item>
                      <v-list-item-title>Archivo</v-list-item-title>
                      <v-list-item-subtitle class="text-truncate">{{ viewer?.filename }}</v-list-item-subtitle>
                    </v-list-item>

                    <v-list-item>
                      <v-list-item-title>Key (storage)</v-list-item-title>
                      <v-list-item-subtitle class="text-truncate">{{ viewer?.key || "—" }}</v-list-item-subtitle>
                    </v-list-item>

                    <v-list-item>
                      <v-list-item-title>Stem (paquete)</v-list-item-title>
                      <v-list-item-subtitle class="text-truncate">{{ viewer ? stemKey(viewer) : "—" }}</v-list-item-subtitle>
                    </v-list-item>

                    <v-list-item>
                      <v-list-item-title>WEBP</v-list-item-title>
                      <v-list-item-subtitle class="text-truncate">{{ viewer ? webpUrl(viewer) : "—" }}</v-list-item-subtitle>
                    </v-list-item>

                    <v-list-item>
                      <v-list-item-title>OG (1200×630)</v-list-item-title>
                      <v-list-item-subtitle class="text-truncate">{{ viewer ? ogUrl(viewer) : "—" }}</v-list-item-subtitle>
                    </v-list-item>

                    <v-list-item>
                      <v-list-item-title>Square (1080×1080)</v-list-item-title>
                      <v-list-item-subtitle class="text-truncate">{{ viewer ? sqUrl(viewer) : "—" }}</v-list-item-subtitle>
                    </v-list-item>

                    <v-list-item>
                      <v-list-item-title>Resumen</v-list-item-title>
                      <v-list-item-subtitle class="text-truncate">{{ summaryLine(viewer) }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-list>

                  <div class="d-flex flex-wrap ga-2 mt-3">
                    <v-btn variant="tonal" prepend-icon="mdi-content-copy" @click="copy(viewer ? webpUrl(viewer) : '')">
                      Copiar WEBP
                    </v-btn>
                    <v-btn variant="tonal" prepend-icon="mdi-content-copy" @click="copy(viewer ? ogUrl(viewer) : '')">
                      Copiar OG
                    </v-btn>
                    <v-btn variant="tonal" prepend-icon="mdi-content-copy" @click="copy(viewer ? sqUrl(viewer) : '')">
                      Copiar Square
                    </v-btn>

                    <v-btn
                      variant="tonal"
                      prepend-icon="mdi-open-in-new"
                      :href="viewer ? webpUrl(viewer) : '#'"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Abrir WEBP
                    </v-btn>
                  </div>
                </div>
              </div>
            </v-window-item>

            <v-window-item value="editor">
              <ImageCropperEditor
                v-if="viewer"
                :src="viewerWebpCacheBust"
                :filename="viewer.filename"
                @overwrite="onOverwrite"
              />
            </v-window-item>
          </v-window>
        </v-card-text>

        <v-divider />

        <v-card-actions class="justify-end">
          <v-btn variant="tonal" @click="closeViewer">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { listMediaImages, uploadMediaImage, deleteMediaImage, overwriteMediaImage } from "@/app/services/media.service";
import ImageCropperEditor from "@/modules/admin/components/media/ImageCropperEditor.vue";

const loading = ref(false);
const uploading = ref(false);
const error = ref("");

const q = ref("");
const used = ref("all");

const product_id = ref("");
const category_id = ref("");
const subcategory_id = ref("");

const page = ref(1);
const limit = ref(60);
const total = ref(0);
const items = ref([]);
const compact = ref(false);

const pageCount = computed(() => Math.max(1, Math.ceil(Number(total.value || 0) / Number(limit.value || 1))));

// viewer
const viewerOpen = ref(false);
const viewerTab = ref("info");
const viewer = ref(null);
const viewerCacheBust = ref(Date.now());

// =======================
// ✅ Variants helpers (front)
// =======================
function stripQuery(u) {
  return String(u || "").split("?")[0].split("#")[0];
}
function stripExt(name) {
  return String(name || "").replace(/\.[a-z0-9]+$/i, "");
}
function baseNoSuffix(nameNoExt) {
  return String(nameNoExt || "").replace(/(_og|_sq)$/i, "");
}
function urlDir(u) {
  const s = stripQuery(u);
  const i = s.lastIndexOf("/");
  return i >= 0 ? s.slice(0, i + 1) : "";
}
function fileNameFromAny(img) {
  const k = img?.key || img?.url || "";
  const s = stripQuery(String(k));
  return s.substring(s.lastIndexOf("/") + 1) || s;
}

/**
 * Stem key: preferimos img.key (porque trae path exacto en bucket),
 * si no, derivamos del url.
 */
function stemKey(img) {
  const key = String(img?.key || "");
  if (key) {
    const dir = key.includes("/") ? key.slice(0, key.lastIndexOf("/") + 1) : "";
    const fn = key.substring(key.lastIndexOf("/") + 1) || key;
    const base = baseNoSuffix(stripExt(fn));
    return `${dir}${base}`;
  }

  const u = String(img?.url || "");
  const dir = urlDir(u);
  const fn = fileNameFromAny(img);
  const base = baseNoSuffix(stripExt(fn));
  return `${dir}${base}`; // es un "stem url", igual lo acepta el backend (resolveKeyForOverwrite)
}

function webpUrl(img) {
  const u = String(img?.url || "");
  if (!u) return "";
  const dir = urlDir(u);
  const base = baseNoSuffix(stripExt(fileNameFromAny(img)));
  return `${dir}${base}.webp`;
}
function ogUrl(img) {
  const u = String(img?.url || "");
  if (!u) return "";
  const dir = urlDir(u);
  const base = baseNoSuffix(stripExt(fileNameFromAny(img)));
  return `${dir}${base}_og.jpg`;
}
function sqUrl(img) {
  const u = String(img?.url || "");
  if (!u) return "";
  const dir = urlDir(u);
  const base = baseNoSuffix(stripExt(fileNameFromAny(img)));
  return `${dir}${base}_sq.jpg`;
}

const viewerWebpCacheBust = computed(() => {
  const u = viewer.value ? webpUrl(viewer.value) : "";
  if (!u) return "";
  const sep = u.includes("?") ? "&" : "?";
  return `${u}${sep}v=${viewerCacheBust.value}`;
});

// =======================

function openViewer(img) {
  viewer.value = img;
  viewerTab.value = "info";
  viewerCacheBust.value = Date.now();
  viewerOpen.value = true;
}

function closeViewer() {
  viewerOpen.value = false;
  viewerTab.value = "info";
  viewer.value = null;
}

async function reload(resetPage) {
  if (resetPage) page.value = 1;

  loading.value = true;
  error.value = "";
  try {
    const data = await listMediaImages({
      page: page.value,
      limit: limit.value,
      q: q.value,
      used: used.value,
      product_id: product_id.value,
      category_id: category_id.value,
      subcategory_id: subcategory_id.value,
    });

    if (!data || data.ok !== true) {
      items.value = [];
      total.value = 0;
      error.value = data?.message || "Respuesta inválida.";
      return;
    }

    items.value = data.items || [];
    total.value = data.total ?? 0;
  } catch (err) {
    error.value = err?.friendlyMessage || err?.message || "Error cargando galería";
  } finally {
    loading.value = false;
  }
}

const fileInput = ref(null);
function pickFile() {
  fileInput.value?.click();
}

async function onPickFile(e) {
  const file = e?.target?.files?.[0];
  e.target.value = "";
  if (!file) return;

  uploading.value = true;
  error.value = "";
  try {
    await uploadMediaImage(file);
    await reload(true);
  } catch (err) {
    error.value = err?.friendlyMessage || err?.message || "Error subiendo";
  } finally {
    uploading.value = false;
  }
}

async function copy(text) {
  const t = String(text || "");
  if (!t) return;
  try {
    await navigator.clipboard.writeText(t);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = t;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

async function remove(img) {
  if (img?.is_used) return;

  const ok = confirm(`Eliminar imagen (paquete webp+og+sq)?\n\n${fileNameFromAny(img)}`);
  if (!ok) return;

  try {
    // ✅ mandamos STEM (borra paquete)
    await deleteMediaImage(stemKey(img));
    await reload(false);
  } catch (err) {
    error.value = err?.friendlyMessage || err?.message || "Error eliminando";
  }
}

function summaryLine(img) {
  const s = img?.used_sample || null;
  if (!img) return "—";
  if (!img.is_used) return "—";

  const p = s?.product_name ? `#${s.product_id} ${s.product_name}` : `${img.used_count || 1} producto(s)`;
  const c = s?.category_name ? ` · ${s.category_name}` : "";
  const sc = s?.subcategory_name ? ` / ${s.subcategory_name}` : "";
  return `${p}${c}${sc}`;
}

/**
 * ✅ Overwrite: mandamos key/url/stem
 * Con el backend nuevo acepta stem también, pero preferimos key si está.
 */
async function onOverwrite({ file, filename }) {
  uploading.value = true;
  error.value = "";
  try {
    const id = viewer.value?.key || viewer.value?.url || (viewer.value ? stemKey(viewer.value) : filename);
    await overwriteMediaImage(id, file);

    await reload(false);
    viewerCacheBust.value = Date.now();

    alert("✅ Imagen reemplazada OK");
  } catch (err) {
    error.value = err?.friendlyMessage || err?.message || "Error reemplazando imagen";
  } finally {
    uploading.value = false;
  }
}

// debounce global
let t = null;
watch([q, used, product_id, category_id, subcategory_id], () => {
  if (t) clearTimeout(t);
  t = setTimeout(() => reload(true), 350);
});

onMounted(() => reload(true));

function formatBytes(n) {
  const v = Number(n || 0);
  if (!v) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(sizes.length - 1, Math.floor(Math.log(v) / Math.log(k)));
  return `${(v / Math.pow(k, i)).toFixed(i ? 1 : 0)} ${sizes[i]}`;
}

function formatDate(s) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString();
  } catch {
    return "—";
  }
}
</script>

<style scoped>
.mm-root {
  max-width: 1400px;
  margin: 0 auto;
}
.mm-search {
  min-width: 320px;
}

/* filter */
.mm-filtercard {
  overflow: hidden;
}
.mm-filtergrid {
  display: grid;
  grid-template-columns: 1.4fr 0.7fr 0.7fr 0.7fr;
  gap: 12px;
  align-items: center;
}
.mm-stats {
  grid-column: 1 / -1;
  display: flex;
  gap: 12px;
}

/* grid */
.mm-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
}
.mm-grid-compact {
  gap: 10px;
}

.mm-card {
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.mm-thumb {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: rgba(0, 0, 0, 0.06);
  border: 0;
  padding: 0;
  cursor: pointer;
}
.mm-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.mm-badges {
  position: absolute;
  left: 10px;
  top: 10px;
}

.mm-meta {
  padding: 12px;
}
.mm-filename {
  font-weight: 800;
  font-size: 0.95rem;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mm-summary {
  margin-top: 6px;
  min-height: 18px;
}

.mm-actions {
  padding: 10px;
  gap: 8px;
  flex-wrap: wrap;
}

/* fullscreen viewer */
.mm-fullscreen-card {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.mm-fullscreen-body {
  flex: 1 1 auto;
  overflow: auto;
}
.mm-window {
  height: calc(100vh - 190px);
}
.mm-info-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 14px;
}
.mm-viewer-preview {
  background: rgba(0, 0, 0, 0.04);
  border-radius: 14px;
  overflow: hidden;
}
.mm-viewer-img {
  width: 100%;
  height: auto;
  display: block;
}
.mm-info-side .mm-list {
  border: 1px solid rgba(0, 0, 0, 0.08);
}

@media (max-width: 1400px) {
  .mm-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}
@media (max-width: 1200px) {
  .mm-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .mm-filtergrid {
    grid-template-columns: 1fr 1fr;
  }
  .mm-stats {
    grid-column: 1 / -1;
  }
}
@media (max-width: 960px) {
  .mm-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .mm-info-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 600px) {
  .mm-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .mm-search {
    min-width: 220px;
    width: 100%;
  }
  .mm-filtergrid {
    grid-template-columns: 1fr;
  }
}
</style>
