<template>
  <v-dialog v-model="open" :fullscreen="isMobile || forceFullscreen" :max-width="forceFullscreen ? '100%' : maxWidth">
    <v-card rounded="xl" class="mm-viewer-card">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="minw-0">
          <div class="text-h6 text-truncate">Vista de imagen</div>
          <div class="text-caption text-medium-emphasis text-truncate">{{ img?.filename || "—" }}</div>
        </div>

        <div class="d-flex align-center ga-1">
          <v-btn
            v-if="tab === 'editor'"
            size="small"
            variant="tonal"
            prepend-icon="mdi-fullscreen"
            @click="forceFullscreen = !forceFullscreen"
          >
            {{ forceFullscreen ? "Salir" : "Pantalla completa" }}
          </v-btn>

          <v-btn icon variant="text" @click="open = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </v-card-title>

      <v-divider />

      <v-card-text class="mm-viewer-body" :class="{ 'mm-full-body': forceFullscreen }">
        <v-tabs v-model="tab" density="comfortable" class="mb-3">
          <v-tab value="info" prepend-icon="mdi-information-outline">Info</v-tab>
          <v-tab value="editor" prepend-icon="mdi-crop">Editor</v-tab>
        </v-tabs>

        <v-window v-model="tab">
          <v-window-item value="info">
            <div class="mm-viewer-preview">
              <img :src="img?.url" class="mm-viewer-img" :alt="img?.filename" />
            </div>

            <div class="d-flex flex-wrap ga-2 mt-3">
              <v-btn variant="tonal" prepend-icon="mdi-content-copy" @click="$emit('copy', img)">
                Copiar URL
              </v-btn>
              <v-btn variant="tonal" prepend-icon="mdi-open-in-new" :href="img?.url" target="_blank" rel="noreferrer">
                Abrir
              </v-btn>
            </div>
          </v-window-item>

          <v-window-item value="editor">
            <ImageCropperEditor
              v-if="img?.url && img?.filename"
              :src="img.url"
              :filename="img.filename"
              @overwrite="$emit('overwrite', $event)"
            />
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-divider />

      <v-card-actions class="justify-end">
        <v-btn variant="tonal" @click="open = false">Cerrar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import ImageCropperEditor from "@/modules/admin/components/media/ImageCropperEditor.vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  img: { type: Object, default: null },
  isMobile: { type: Boolean, default: false },
});

defineEmits(["update:modelValue", "copy", "overwrite"]);

const open = computed({
  get: () => props.modelValue,
  set: (v) => (forceFullscreen.value = false) || emitUpdate(v),
});

const emitUpdate = (v) => {
  // workaround para no romper el computed setter
  // (emitUpdate se define abajo con defineEmits)
};

const _emit = defineEmits(["update:modelValue", "copy", "overwrite"]);
function emitUpdate(v) {
  _emit("update:modelValue", v);
}

const tab = ref("info");
const forceFullscreen = ref(false);

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      tab.value = "info";
      forceFullscreen.value = false;
    }
  }
);

watch(tab, (t) => {
  if (t !== "editor") forceFullscreen.value = false;
});

const maxWidth = computed(() => (props.isMobile ? "100%" : 1100));
</script>

<style scoped>
.mm-viewer-card {
  overflow: hidden;
}
.mm-viewer-body {
  padding-top: 14px;
}
.mm-full-body {
  height: calc(100vh - 170px);
  overflow: auto;
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
</style>
