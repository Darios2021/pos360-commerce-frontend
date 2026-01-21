<!-- src/modules/admin/components/media/ImageCropperEditor.vue -->
<!-- ✅ COPY-PASTE FINAL COMPLETO (canvas GRANDE + resize/calc pro) -->

<template>
  <div class="ice-root">
    <v-alert type="info" variant="tonal" class="mb-3">
      Recortá y exportá en <b>WEBP</b>. Esto <b>REEMPLAZA</b> la imagen original.
    </v-alert>

    <v-alert v-if="err" type="error" variant="tonal" class="mb-3">
      {{ err }}
    </v-alert>

    <div class="ice-grid">
      <!-- CANVAS -->
      <div ref="canvasEl" class="ice-canvas">
        <div class="ice-stage">
          <img ref="imgEl" :src="src" :alt="filename" class="ice-img" crossorigin="anonymous" />
        </div>

        <!-- overlay loading -->
        <div v-if="!ready" class="ice-loading">
          <v-progress-circular indeterminate class="mb-3" />
          <div class="text-caption text-medium-emphasis">Cargando editor…</div>
        </div>
      </div>

      <!-- TOOLS -->
      <div class="ice-tools">
        <div class="d-flex flex-wrap ga-2">
          <v-btn variant="tonal" size="small" :disabled="!ready" @click="setAspect(1)">1:1</v-btn>
          <v-btn variant="tonal" size="small" :disabled="!ready" @click="setAspect(4 / 3)">4:3</v-btn>
          <v-btn variant="tonal" size="small" :disabled="!ready" @click="setAspect(16 / 9)">16:9</v-btn>
          <v-btn variant="tonal" size="small" :disabled="!ready" @click="setAspect(NaN)">Libre</v-btn>
        </div>

        <v-divider class="my-3" />

        <div class="d-flex flex-wrap ga-2">
          <v-btn variant="tonal" size="small" :disabled="!ready" @click="zoom(0.1)">Zoom +</v-btn>
          <v-btn variant="tonal" size="small" :disabled="!ready" @click="zoom(-0.1)">Zoom -</v-btn>
          <v-btn variant="tonal" size="small" :disabled="!ready" @click="rotate(90)">Rotar</v-btn>
          <v-btn variant="tonal" size="small" :disabled="!ready" @click="reset()">Reset</v-btn>
        </div>

        <v-divider class="my-3" />

        <div class="d-flex flex-wrap ga-2 align-center">
          <v-text-field
            v-model="webpQuality"
            type="number"
            min="50"
            max="100"
            step="1"
            label="Calidad WEBP (50-100)"
            variant="outlined"
            density="comfortable"
            style="max-width: 240px"
            :disabled="!ready"
          />
          <v-spacer />
          <v-btn
            color="primary"
            prepend-icon="mdi-content-save"
            :loading="saving"
            :disabled="!ready"
            @click="save()"
          >
            Guardar (reemplazar)
          </v-btn>
        </div>

        <div class="text-caption text-medium-emphasis mt-2">
          Tip: para ecommerce normalmente 80–90 va joya.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps({
  src: { type: String, required: true },
  filename: { type: String, required: true },
});

const emit = defineEmits(["overwrite"]);

const imgEl = ref(null);
const canvasEl = ref(null);

const ready = ref(false);
const err = ref("");
const saving = ref(false);
const webpQuality = ref(88);

let cropper = null;
let CropperCtor = null;
let cssLoaded = false;

let ro = null; // ResizeObserver

async function ensureCropper() {
  if (CropperCtor) return true;

  try {
    const mod = await import("cropperjs");
    CropperCtor = mod?.default || mod;
  } catch {
    err.value = "No se encontró 'cropperjs'. Instalalo con: npm i cropperjs@1.5.13";
    return false;
  }

  if (!cssLoaded) {
    try {
      await import("cropperjs/dist/cropper.css");
      cssLoaded = true;
    } catch {
      cssLoaded = true;
      err.value = "Cropper cargó sin CSS (no se encontró cropper.css).";
    }
  }

  return true;
}

function destroy() {
  try {
    ro?.disconnect?.();
  } catch {}
  ro = null;

  try {
    cropper?.destroy?.();
  } catch {}
  cropper = null;
  ready.value = false;
}

function waitForImageLoad(el) {
  return new Promise((resolve, reject) => {
    if (!el) return reject(new Error("No se pudo montar el editor (img ref vacío)."));
    if (el.complete && el.naturalWidth > 0) return resolve(true);

    const onLoad = () => {
      cleanup();
      resolve(true);
    };
    const onErr = () => {
      cleanup();
      reject(new Error("No se pudo cargar la imagen (img error)."));
    };
    const cleanup = () => {
      el.removeEventListener("load", onLoad);
      el.removeEventListener("error", onErr);
    };

    el.addEventListener("load", onLoad, { once: true });
    el.addEventListener("error", onErr, { once: true });
  });
}

function forceLayoutRecalc() {
  if (!cropper) return;
  // ✅ Cropper recalcula medidas en contenedor
  try {
    cropper.resize();
  } catch {}
  try {
    cropper.reset();
    cropper.crop();
  } catch {}
}

async function init() {
  err.value = "";
  ready.value = false;

  const ok = await ensureCropper();
  if (!ok) return;

  // ✅ esperar 2 ticks por v-window/tab fullscreen
  await nextTick();
  await nextTick();

  const el = imgEl.value;
  if (!el) {
    err.value = "No se pudo montar el editor (img ref vacío).";
    return;
  }

  destroy();

  try {
    await waitForImageLoad(el);

    cropper = new CropperCtor(el, {
      viewMode: 1,
      dragMode: "move",
      autoCropArea: 1,
      background: false,
      responsive: true,
      checkOrientation: true,
      aspectRatio: 1,

      // ✅ importante para que “llene” el área sin límites raros
      restore: false,
      guides: true,
      center: true,
      highlight: true,
    });

    // ✅ Recalc post-mount (ya con contenedor alto)
    setTimeout(() => forceLayoutRecalc(), 0);
    setTimeout(() => forceLayoutRecalc(), 80);

    // ✅ Si el contenedor cambia de tamaño (sidebar/scroll), recalcula
    if (canvasEl.value && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        // throttle suave
        requestAnimationFrame(() => forceLayoutRecalc());
      });
      ro.observe(canvasEl.value);
    }

    ready.value = true;
  } catch (e) {
    err.value = e?.message || "No se pudo iniciar el editor.";
    ready.value = false;
  }
}

function setAspect(r) {
  if (!cropper) return;
  cropper.setAspectRatio(r);
  setTimeout(() => forceLayoutRecalc(), 0);
}
function zoom(delta) {
  if (!cropper) return;
  cropper.zoom(delta);
}
function rotate(deg) {
  if (!cropper) return;
  cropper.rotate(deg);
  setTimeout(() => forceLayoutRecalc(), 0);
}
function reset() {
  if (!cropper) return;
  cropper.reset();
  cropper.crop();
  setTimeout(() => forceLayoutRecalc(), 0);
}

function safeQuality() {
  const qv = Number(webpQuality.value);
  if (!Number.isFinite(qv)) return 0.88;
  const clamped = Math.max(50, Math.min(100, qv));
  return clamped / 100;
}

async function save() {
  err.value = "";
  if (!cropper) {
    err.value = "Editor no inicializado.";
    return;
  }

  saving.value = true;
  try {
    const canvas = cropper.getCroppedCanvas({
      imageSmoothingEnabled: true,
      imageSmoothingQuality: "high",
    });
    if (!canvas) throw new Error("No se pudo generar el recorte.");

    const blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/webp", safeQuality());
    });
    if (!blob) throw new Error("No se pudo exportar WEBP (blob vacío).");

    const file = new File([blob], props.filename, { type: "image/webp" });
    emit("overwrite", { filename: props.filename, file });
  } catch (e) {
    err.value = e?.message || "Error guardando recorte";
  } finally {
    saving.value = false;
  }
}

watch(
  () => props.src,
  async (v) => {
    if (!v) return;
    await init();
  }
);

onMounted(() => init());
onBeforeUnmount(() => destroy());
</script>

<style scoped>
.ice-root {
  width: 100%;
}

/* ✅ Más ancho a la izquierda (canvas) */
.ice-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 14px;
  align-items: stretch;

  /* ✅ el editor usa el viewport real (fullscreen) */
  min-height: calc(100vh - 210px);
}

/* CANVAS */
.ice-canvas {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  height: 100%;
  min-height: calc(100vh - 210px);
  background: rgba(0, 0, 0, 0.04);
}

/* ✅ el stage ocupa TODO el canvas */
.ice-stage {
  position: absolute;
  inset: 0;
}

/* ✅ IMPORTANTE: dejar que cropper maneje el tamaño
   (no max-height ni display flex que lo achican) */
.ice-img {
  display: block;
  max-width: 100%;
}

/* overlay loading */
.ice-loading {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(1px);
}

/* TOOLS */
.ice-tools {
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 14px;
  padding: 12px;
  height: fit-content;
}

/* Mobile */
@media (max-width: 960px) {
  .ice-grid {
    grid-template-columns: 1fr;
    min-height: auto;
  }
  .ice-canvas {
    min-height: 60vh;
  }
}
</style>
