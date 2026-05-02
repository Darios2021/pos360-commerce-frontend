<!-- src/modules/products/components/dialogs/ImageCropperDialog.vue -->
<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="980"
    persistent
    scrollable
  >
    <v-card class="icd-card" rounded="lg">
      <v-card-title class="d-flex align-center justify-space-between pa-3">
        <div class="d-flex align-center ga-2">
          <v-icon>mdi-crop</v-icon>
          <span class="text-subtitle-1 font-weight-bold">Recortar imagen</span>
        </div>
        <v-btn icon variant="text" size="small" @click="close" :disabled="busy">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-3">
        <!-- Toolbar -->
        <div class="d-flex align-center flex-wrap ga-2 mb-3">
          <v-btn-toggle
            v-model="ratioKey"
            density="comfortable"
            variant="outlined"
            divided
            mandatory
            color="primary"
          >
            <v-btn value="1" size="small" title="Cuadrada (recomendada)">
              <v-icon start size="16">mdi-square-outline</v-icon>
              1:1
            </v-btn>
            <v-btn value="4_3" size="small" title="Horizontal 4:3">
              <v-icon start size="16">mdi-rectangle-outline</v-icon>
              4:3
            </v-btn>
            <v-btn value="3_4" size="small" title="Vertical 3:4">
              <v-icon start size="16">mdi-rectangle-outline</v-icon>
              3:4
            </v-btn>
            <v-btn value="free" size="small" title="Libre">
              <v-icon start size="16">mdi-vector-square</v-icon>
              Libre
            </v-btn>
          </v-btn-toggle>

          <v-divider vertical class="mx-1" />

          <v-btn
            size="small"
            variant="tonal"
            @click="rotate(-90)"
            :disabled="!ready || busy"
            title="Rotar -90°"
          >
            <v-icon size="18">mdi-rotate-left</v-icon>
          </v-btn>
          <v-btn
            size="small"
            variant="tonal"
            @click="rotate(90)"
            :disabled="!ready || busy"
            title="Rotar +90°"
          >
            <v-icon size="18">mdi-rotate-right</v-icon>
          </v-btn>

          <v-btn
            size="small"
            variant="tonal"
            @click="flipH"
            :disabled="!ready || busy"
            title="Espejar horizontal"
          >
            <v-icon size="18">mdi-flip-horizontal</v-icon>
          </v-btn>
          <v-btn
            size="small"
            variant="tonal"
            @click="flipV"
            :disabled="!ready || busy"
            title="Espejar vertical"
          >
            <v-icon size="18">mdi-flip-vertical</v-icon>
          </v-btn>

          <v-divider vertical class="mx-1" />

          <v-btn
            size="small"
            variant="tonal"
            color="warning"
            @click="reset"
            :disabled="!ready || busy"
            title="Restablecer"
          >
            <v-icon start size="18">mdi-restore</v-icon>
            Reset
          </v-btn>
        </div>

        <!-- Canvas -->
        <div class="icd-stage">
          <div v-if="loading" class="icd-loading">
            <v-progress-circular indeterminate size="40" />
            <div class="text-caption mt-2">Cargando editor…</div>
          </div>

          <img
            v-show="ready"
            ref="imgEl"
            :src="src"
            alt="Imagen a recortar"
            class="icd-img"
            crossorigin="anonymous"
            @load="onImgLoad"
            @error="onImgError"
          />
        </div>

        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-3">
          {{ error }}
        </v-alert>

        <div class="text-caption text-medium-emphasis mt-2">
          Tip: arrastrá las esquinas para ajustar el área. Se conserva el formato original (PNG sin pérdida, JPEG calidad alta) y la resolución natural de la foto, hasta 2400px de lado.
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-3">
        <v-spacer />
        <v-btn variant="text" @click="close" :disabled="busy">
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          @click="apply"
          :loading="busy"
          :disabled="!ready"
        >
          <v-icon start size="18">mdi-check</v-icon>
          Aplicar recorte
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import "cropperjs/dist/cropper.css";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  src: { type: String, default: "" },
  /** Default ratio: "1" | "4_3" | "3_4" | "free" */
  defaultRatio: { type: String, default: "1" },
  /** Calidad JPEG (0..1). 0.95 = prácticamente indistinguible del original */
  quality: { type: Number, default: 0.95 },
  /** Tope del lado mayor del crop (px). Solo aplica si el crop excede */
  maxSide: { type: Number, default: 2400 },
  /** Nombre sugerido del archivo resultante */
  filename: { type: String, default: "" },
  /** Formato de salida forzado: "auto" | "image/jpeg" | "image/png" | "image/webp" */
  outputFormat: { type: String, default: "auto" },
});

const emit = defineEmits(["update:modelValue", "applied", "cancel"]);

const imgEl = ref(null);
const ready = ref(false);
const loading = ref(false);
const busy = ref(false);
const error = ref("");
const ratioKey = ref(props.defaultRatio || "1");

let cropper = null;
let CropperCtor = null;

const RATIO_MAP = {
  "1": 1,
  "4_3": 4 / 3,
  "3_4": 3 / 4,
  "free": NaN,
};

async function loadCropperLib() {
  if (CropperCtor) return CropperCtor;
  const mod = await import("cropperjs");
  CropperCtor = mod.default || mod;
  return CropperCtor;
}

function destroyCropper() {
  try { cropper?.destroy?.(); } catch {}
  cropper = null;
  ready.value = false;
}

async function initCropper() {
  if (!imgEl.value || !props.src) return;
  loading.value = true;
  error.value = "";
  try {
    await loadCropperLib();
    destroyCropper();

    cropper = new CropperCtor(imgEl.value, {
      aspectRatio: RATIO_MAP[ratioKey.value],
      viewMode: 1,
      autoCropArea: 1,
      background: false,
      responsive: true,
      restore: true,
      checkOrientation: true,
      checkCrossOrigin: true,
      dragMode: "move",
      modal: true,
      guides: true,
      center: true,
      highlight: false,
      toggleDragModeOnDblclick: true,
      ready() {
        ready.value = true;
        loading.value = false;
      },
    });
  } catch (e) {
    loading.value = false;
    error.value = e?.message || "No se pudo iniciar el editor";
  }
}

function onImgLoad() {
  // El <img> ya cargó. Si aún no hay cropper, lo creamos.
  if (!cropper) initCropper();
}

function onImgError() {
  loading.value = false;
  error.value = "No se pudo cargar la imagen (¿CORS o URL inválida?)";
}

watch(
  () => props.modelValue,
  async (v) => {
    if (v) {
      ready.value = false;
      loading.value = true;
      error.value = "";
      ratioKey.value = props.defaultRatio || "1";
      await nextTick();
      // El <img>'s onload disparará initCropper.
      // Si la imagen está en cache puede ya haber cargado.
      if (imgEl.value?.complete && imgEl.value?.naturalWidth) {
        initCropper();
      }
    } else {
      destroyCropper();
    }
  }
);

watch(ratioKey, (k) => {
  if (!cropper) return;
  const r = RATIO_MAP[k];
  cropper.setAspectRatio(Number.isFinite(r) ? r : NaN);
});

function rotate(deg) {
  if (!cropper) return;
  cropper.rotate(deg);
}
function flipH() {
  if (!cropper) return;
  const d = cropper.getData();
  cropper.scaleX(-(d?.scaleX || 1));
}
function flipV() {
  if (!cropper) return;
  const d = cropper.getData();
  cropper.scaleY(-(d?.scaleY || 1));
}
function reset() {
  if (!cropper) return;
  cropper.reset();
}

function close() {
  emit("cancel");
  emit("update:modelValue", false);
}

function detectMimeFromUrl(url) {
  const u = String(url || "").toLowerCase().split(/[?#]/)[0];
  if (u.endsWith(".png")) return "image/png";
  if (u.endsWith(".webp")) return "image/webp";
  if (u.endsWith(".gif")) return "image/png"; // gif → png para preservar transparencia
  if (u.endsWith(".jpg") || u.endsWith(".jpeg")) return "image/jpeg";
  return "";
}

function detectMimeFromImg() {
  // 2do intento: leer naturalSize y deducir por extensión del src actual
  return detectMimeFromUrl(imgEl.value?.src || props.src);
}

function chooseOutputMime() {
  const forced = String(props.outputFormat || "auto").toLowerCase();
  if (forced === "image/png" || forced === "image/jpeg" || forced === "image/webp") {
    return forced;
  }
  // auto: matchear formato del input para preservar calidad
  const detected = detectMimeFromImg();
  // Si no podemos detectar, JPEG es el default seguro (más universal y comprimido)
  return detected || "image/jpeg";
}

function extFromMime(mime) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

function suggestName(mime) {
  const base = String(props.filename || "imagen").replace(/\.[^.]+$/, "");
  return `${base}-crop-${Date.now()}.${extFromMime(mime)}`;
}

async function apply() {
  if (!cropper || busy.value) return;
  busy.value = true;
  error.value = "";
  try {
    const mime = chooseOutputMime();
    const isLossless = mime === "image/png";

    // ✅ Solo limitar tamaño si el crop excede maxSide.
    // Si la foto es más chica que el cap, se mantiene tal cual (sin reescalar = sin pérdida).
    const cropData = cropper.getData(true) || {};
    const naturalW = Math.round(cropData.width || 0);
    const naturalH = Math.round(cropData.height || 0);
    const longest = Math.max(naturalW, naturalH);

    const canvasOpts = {
      imageSmoothingEnabled: true,
      imageSmoothingQuality: "high",
      // PNG conserva alpha. JPEG necesita fondo blanco para que el alpha
      // no se vea negro al exportar.
      ...(isLossless ? {} : { fillColor: "#ffffff" }),
    };
    if (longest > props.maxSide) {
      canvasOpts.maxWidth = props.maxSide;
      canvasOpts.maxHeight = props.maxSide;
    }

    const canvas = cropper.getCroppedCanvas(canvasOpts);
    if (!canvas) throw new Error("No se pudo generar el recorte");

    const blob = await new Promise((resolve, reject) => {
      // PNG ignora el segundo argumento (sin pérdida); JPEG/WEBP usan quality.
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Recorte vacío"))),
        mime,
        isLossless ? undefined : (Number(props.quality) || 0.95)
      );
    });

    const file = new File([blob], suggestName(mime), {
      type: mime,
      lastModified: Date.now(),
    });

    emit("applied", {
      file,
      blob,
      width: canvas.width,
      height: canvas.height,
      mime,
    });
    emit("update:modelValue", false);
  } catch (e) {
    error.value = e?.message || "Error al aplicar el recorte";
  } finally {
    busy.value = false;
  }
}

onBeforeUnmount(() => destroyCropper());
</script>

<style scoped>
.icd-card {
  overflow: hidden;
}

.icd-stage {
  position: relative;
  width: 100%;
  height: min(70vh, 560px);
  background: #0a0a0a;
  border-radius: 10px;
  overflow: hidden;
  display: grid;
  place-items: center;
}

.icd-img {
  display: block;
  max-width: 100%;
  max-height: 100%;
}

.icd-loading {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: rgba(255, 255, 255, 0.85);
  z-index: 2;
}

/* Asegurar que cropperjs respete el contenedor en mobile */
:deep(.cropper-container) {
  max-width: 100%;
}
</style>
