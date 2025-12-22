<!-- src/modules/products/components/ProductImagesPanel.vue -->
<template>
  <div class="pi-root">
    <div class="pi-head">
      <div class="pi-title">
        <div class="text-subtitle-1 font-weight-bold">Imágenes</div>
        <div class="text-caption text-medium-emphasis">
          Máximo {{ max }} · listo para MinIO
        </div>
      </div>

      <div class="pi-actions">
        <v-btn
          v-if="isAdmin"
          variant="tonal"
          color="red"
          prepend-icon="mdi-delete-outline"
          :disabled="!images.length || loading"
          @click="$emit('removeAll')"
        >
          Limpiar
        </v-btn>

        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-cloud-upload-outline"
          :disabled="!selectedFiles.length || loading"
          :loading="loading"
          @click="upload"
        >
          Subir seleccionadas
        </v-btn>
      </div>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-3">
      {{ error }}
    </v-alert>

    <!-- EXISTING IMAGES -->
    <v-card rounded="xl" variant="flat" class="pi-card">
      <div class="pi-card-head">
        <div class="pi-card-label">
          <v-icon size="18">mdi-image-multiple-outline</v-icon>
          <span>Existentes</span>
        </div>
        <div class="text-caption text-medium-emphasis">{{ images.length }} cargadas</div>
      </div>

      <v-divider class="my-3" />

      <v-alert v-if="!images.length" type="info" variant="tonal">
        Aún no hay imágenes para este producto.
      </v-alert>

      <div v-else class="pi-grid">
        <div v-for="img in images" :key="img.id" class="pi-tile">
          <div class="pi-thumb">
            <img :src="img.url" :alt="`img-${img.id}`" />
            <div class="pi-overlay">
              <v-chip size="x-small" variant="tonal">ID {{ img.id }}</v-chip>

              <v-btn
                v-if="isAdmin"
                icon="mdi-delete-outline"
                size="small"
                color="red"
                variant="flat"
                class="pi-del"
                @click="$emit('removeOne', img)"
              />
            </div>
          </div>
        </div>
      </div>
    </v-card>

    <!-- UPLOAD -->
    <v-card rounded="xl" variant="flat" class="pi-card mt-4">
      <div class="pi-card-head">
        <div class="pi-card-label">
          <v-icon size="18">mdi-upload</v-icon>
          <span>Subir nuevas</span>
        </div>
        <div class="text-caption text-medium-emphasis">
          Seleccioná hasta {{ remaining }} más
        </div>
      </div>

      <v-divider class="my-3" />

      <div class="pi-upload">
        <v-file-input
          v-model="selectedFiles"
          :disabled="loading || remaining <= 0"
          :multiple="true"
          :counter="true"
          accept="image/*"
          variant="outlined"
          density="comfortable"
          prepend-icon="mdi-image-plus"
          label="Seleccionar imágenes"
          class="pi-file"
          @update:modelValue="onFiles"
        />

        <div v-if="previews.length" class="pi-previews">
          <div v-for="p in previews" :key="p.key" class="pi-preview-tile">
            <div class="pi-preview-thumb">
              <img :src="p.url" :alt="p.name" />
              <v-btn
                icon="mdi-close"
                size="x-small"
                variant="flat"
                class="pi-preview-remove"
                @click="removePreview(p.key)"
              />
            </div>
            <div class="pi-preview-meta">
              <div class="pi-preview-name" :title="p.name">{{ p.name }}</div>
              <div class="text-caption text-medium-emphasis">{{ prettySize(p.size) }}</div>
            </div>
          </div>
        </div>

        <div class="text-caption text-medium-emphasis mt-2">
          Al subir: guardamos URLs en <b>product_images</b>. (No hace falta apretar “Guardar” del producto.)
        </div>
      </div>
    </v-card>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useAuthStore } from "../../../app/store/auth.store";

const props = defineProps({
  images: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null },
  max: { type: Number, default: 3 },
});

const emit = defineEmits(["upload", "removeOne", "removeAll"]);

const auth = useAuthStore();

const isAdmin = computed(() => (auth.roles || []).includes("admin"));

const selectedFiles = ref([]);
const previews = ref([]);

const remaining = computed(() => Math.max(0, props.max - (props.images?.length || 0)));

watch(
  () => remaining.value,
  (r) => {
    // si quedaste sin cupo, limpiamos selección
    if (r <= 0) clearSelection();
  }
);

function clearSelection() {
  // revoke previews
  for (const p of previews.value) {
    try { URL.revokeObjectURL(p.url); } catch {}
  }
  previews.value = [];
  selectedFiles.value = [];
}

function onFiles(files) {
  // limpiar previews anteriores
  for (const p of previews.value) {
    try { URL.revokeObjectURL(p.url); } catch {}
  }
  previews.value = [];

  const list = Array.isArray(files) ? files : [];
  const limited = list.slice(0, remaining.value);

  selectedFiles.value = limited;

  previews.value = limited.map((f, idx) => ({
    key: `${f.name}-${f.size}-${idx}-${Date.now()}`,
    name: f.name,
    size: f.size,
    url: URL.createObjectURL(f),
  }));
}

function removePreview(key) {
  const idx = previews.value.findIndex((x) => x.key === key);
  if (idx >= 0) {
    try { URL.revokeObjectURL(previews.value[idx].url); } catch {}
    previews.value.splice(idx, 1);
    // también sacamos el file correspondiente por índice
    selectedFiles.value.splice(idx, 1);
  }
}

function prettySize(bytes) {
  const b = Number(bytes || 0);
  if (!b) return "0 B";
  const kb = b / 1024;
  const mb = kb / 1024;
  if (mb >= 1) return `${mb.toFixed(2)} MB`;
  if (kb >= 1) return `${kb.toFixed(0)} KB`;
  return `${b} B`;
}

async function upload() {
  if (!selectedFiles.value.length) return;
  emit("upload", selectedFiles.value);
}

onBeforeUnmount(() => {
  for (const p of previews.value) {
    try { URL.revokeObjectURL(p.url); } catch {}
  }
});
</script>

<style scoped>
.pi-root {
  display: grid;
  gap: 14px;
}

.pi-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.pi-title {
  display: grid;
  gap: 2px;
}

.pi-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.pi-card {
  border: 1px solid rgba(0,0,0,.06);
  box-shadow: 0 10px 24px rgba(0,0,0,.05);
  padding: 14px;
}

.pi-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.pi-card-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
}

.pi-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 1000px) {
  .pi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 600px) {
  .pi-grid { grid-template-columns: 1fr; }
}

.pi-tile {
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(0,0,0,.06);
  background: rgba(0,0,0,.02);
}

.pi-thumb {
  position: relative;
  height: 190px;
}

.pi-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transform: scale(1);
  transition: transform 180ms ease;
}

.pi-thumb:hover img {
  transform: scale(1.03);
}

.pi-overlay {
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.pi-del {
  box-shadow: 0 10px 24px rgba(0,0,0,.18);
}

.pi-upload {
  display: grid;
  gap: 12px;
}

.pi-file :deep(.v-field) {
  border-radius: 14px;
}

.pi-previews {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 900px) {
  .pi-previews { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 600px) {
  .pi-previews { grid-template-columns: 1fr; }
}

.pi-preview-tile {
  border-radius: 14px;
  border: 1px solid rgba(0,0,0,.06);
  overflow: hidden;
  background: #fff;
  box-shadow: 0 10px 24px rgba(0,0,0,.05);
}

.pi-preview-thumb {
  position: relative;
  height: 160px;
  background: rgba(0,0,0,.02);
}

.pi-preview-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.pi-preview-remove {
  position: absolute;
  top: 8px;
  right: 8px;
  min-width: 0;
  box-shadow: 0 10px 24px rgba(0,0,0,.16);
}

.pi-preview-meta {
  padding: 10px 12px;
  display: grid;
  gap: 2px;
}

.pi-preview-name {
  font-weight: 800;
  font-size: 12px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
