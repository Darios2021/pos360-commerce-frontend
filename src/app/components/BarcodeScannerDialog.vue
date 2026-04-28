<!--
  BarcodeScannerDialog — Lector de códigos de barras tipo Mercado Pago.

  Funcionamiento:
   - Si el browser soporta la API nativa BarcodeDetector (Chrome / Edge /
     Android), usa la cámara trasera y detecta códigos en tiempo real.
   - Fallback universal: input manual donde se puede escribir o pegar el
     código (también compatible con lectores USB físicos que envían tecleo).
   - Al detectar/ingresar un código, busca el producto vía
     productsStore.fetchList({ q, limit: 1 }) y navega a `productView`.
   - Maneja "no encontrado" con mensaje + posibilidad de reintento.
-->
<template>
  <v-dialog
    v-model="open"
    fullscreen
    :scrim="true"
    transition="dialog-bottom-transition"
  >
    <div class="bsc">
      <!-- Header -->
      <header class="bsc__head">
        <button type="button" class="bsc__close" aria-label="Cerrar" @click="close">
          <v-icon size="24">mdi-close</v-icon>
        </button>
        <div class="bsc__title">Lector de código</div>
        <button
          v-if="hasNativeApi"
          type="button"
          class="bsc__torch"
          :class="{ 'is-on': torchOn }"
          aria-label="Linterna"
          :disabled="!torchSupported"
          @click="toggleTorch"
        >
          <v-icon size="22">{{ torchOn ? 'mdi-flashlight' : 'mdi-flashlight-off' }}</v-icon>
        </button>
      </header>

      <!-- Cámara + área de scan -->
      <div v-if="hasNativeApi" class="bsc__camera">
        <video ref="videoRef" class="bsc__video" autoplay muted playsinline />

        <!-- Frame de scan en el centro -->
        <div class="bsc__frame">
          <span class="bsc__corner bsc__corner--tl" />
          <span class="bsc__corner bsc__corner--tr" />
          <span class="bsc__corner bsc__corner--bl" />
          <span class="bsc__corner bsc__corner--br" />
          <span class="bsc__line" />
        </div>

        <div class="bsc__hint">
          <v-icon size="16" class="mr-1">mdi-information-outline</v-icon>
          Apuntá la cámara al código de barras del producto
        </div>
      </div>

      <!-- Fallback: cámara no soportada -->
      <div v-else class="bsc__no-cam">
        <div class="bsc__no-cam-icon">
          <v-icon size="44">mdi-barcode-scan</v-icon>
        </div>
        <div class="bsc__no-cam-title">Lector de código</div>
        <div class="bsc__no-cam-desc">
          Tu navegador no soporta cámara para escanear directamente.
          Escribí o pegá el código abajo (o usá un lector USB físico).
        </div>
      </div>

      <!-- Footer: input + acción manual -->
      <div class="bsc__footer">
        <div class="bsc__manual">
          <v-text-field
            ref="manualInputRef"
            v-model="manualCode"
            label="O escribí el código"
            placeholder="Ej: 7791234567890"
            variant="outlined"
            density="comfortable"
            hide-details
            prepend-inner-icon="mdi-keyboard-outline"
            @keyup.enter="onSubmitManual"
            :disabled="searching"
            autocomplete="off"
            inputmode="numeric"
          />
          <v-btn
            color="primary"
            variant="flat"
            rounded="lg"
            size="large"
            :loading="searching"
            :disabled="!manualCode.trim() || searching"
            @click="onSubmitManual"
          >
            Buscar
          </v-btn>
        </div>

        <!-- Resultado -->
        <Transition name="bsc-feedback">
          <div v-if="lastResult" class="bsc__result" :class="`bsc__result--${lastResult.kind}`">
            <v-icon size="18" class="mr-2">{{ lastResult.icon }}</v-icon>
            <span>{{ lastResult.text }}</span>
            <v-btn
              v-if="lastResult.kind === 'error'"
              variant="text"
              size="x-small"
              color="white"
              class="ml-auto"
              @click="lastResult = null"
            >Reintentar</v-btn>
          </div>
        </Transition>
      </div>
    </div>
  </v-dialog>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useProductsStore } from "@/app/store/products.store";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
});
const emit = defineEmits(["update:modelValue"]);

const open = computed({
  get: () => !!props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const router = useRouter();
const products = useProductsStore();

// ── Estado ───────────────────────────────────────────────────────────
const videoRef = ref(null);
const manualInputRef = ref(null);
const manualCode = ref("");
const searching = ref(false);
const lastResult = ref(null);
const torchOn = ref(false);
const torchSupported = ref(false);

const hasNativeApi = computed(
  () => typeof window !== "undefined" && "BarcodeDetector" in window
);

let stream = null;
let detector = null;
let scanInterval = null;
let lastDetected = "";
let lastDetectedAt = 0;

// ── Cámara ───────────────────────────────────────────────────────────
async function startCamera() {
  if (!hasNativeApi.value) return;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width:  { ideal: 1280 },
        height: { ideal: 720 },
      },
    });
    if (videoRef.value) {
      videoRef.value.srcObject = stream;
      await videoRef.value.play().catch(() => {});
    }
    // Soporte de torch (linterna)
    const track = stream.getVideoTracks()?.[0];
    const caps = track?.getCapabilities?.() || {};
    torchSupported.value = !!caps.torch;

    detector = new window.BarcodeDetector({
      formats: ["ean_13","ean_8","code_128","code_39","upc_a","upc_e","qr_code","itf","codabar"],
    });
    scanInterval = setInterval(scanFrame, 220);
  } catch (e) {
    setResult("error", "No se pudo acceder a la cámara. Usá el campo manual.");
  }
}

async function scanFrame() {
  if (!videoRef.value || !detector || searching.value) return;
  try {
    const codes = await detector.detect(videoRef.value);
    if (codes && codes.length) {
      const raw = String(codes[0].rawValue || "").trim();
      if (!raw) return;
      const now = Date.now();
      // Anti-rebote: no procesar el mismo código si vuelve en <1.5s
      if (raw === lastDetected && (now - lastDetectedAt) < 1500) return;
      lastDetected = raw;
      lastDetectedAt = now;
      handleCode(raw);
    }
  } catch {}
}

function stopCamera() {
  if (scanInterval) clearInterval(scanInterval);
  scanInterval = null;
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
  detector = null;
  torchOn.value = false;
}

async function toggleTorch() {
  if (!torchSupported.value || !stream) return;
  try {
    const track = stream.getVideoTracks()?.[0];
    await track.applyConstraints({ advanced: [{ torch: !torchOn.value }] });
    torchOn.value = !torchOn.value;
  } catch {}
}

// ── Lookup ───────────────────────────────────────────────────────────
async function handleCode(code) {
  if (searching.value) return;
  const q = String(code || "").trim();
  if (!q) return;
  searching.value = true;
  setResult("info", `Buscando ${q}…`);
  try {
    const r = await products.fetchList({ q, limit: 1 });
    const items = (r?.items || r?.data || (Array.isArray(r) ? r : [])) ?? [];
    const found = items[0];
    if (found?.id) {
      // Vibración suave para feedback (mobile)
      try { navigator.vibrate?.(80); } catch {}
      setResult("ok", `${found.name} — abriendo…`);
      setTimeout(() => {
        close();
        router.push({ name: "productView", params: { id: found.id } });
      }, 300);
    } else {
      setResult("error", `No se encontró producto con código “${q}”`);
    }
  } catch (e) {
    setResult("error", "Error de conexión. Probá de nuevo.");
  } finally {
    searching.value = false;
  }
}

function onSubmitManual() {
  if (!manualCode.value.trim()) return;
  handleCode(manualCode.value);
}

function setResult(kind, text) {
  const icons = { ok: "mdi-check-circle", error: "mdi-alert-circle", info: "mdi-magnify" };
  lastResult.value = { kind, text, icon: icons[kind] || "mdi-information" };
  if (kind === "info") {
    // Limpia el "buscando…" si no llegó respuesta
    setTimeout(() => {
      if (lastResult.value?.kind === "info") lastResult.value = null;
    }, 1500);
  }
}

// ── Lifecycle ────────────────────────────────────────────────────────
watch(open, async (v) => {
  if (v) {
    manualCode.value = "";
    lastResult.value = null;
    if (hasNativeApi.value) {
      await nextTick();
      await startCamera();
    } else {
      // Foco automático en el input manual para lectores USB
      await nextTick();
      manualInputRef.value?.focus?.();
    }
  } else {
    stopCamera();
  }
});

onBeforeUnmount(() => { stopCamera(); });

function close() {
  emit("update:modelValue", false);
}
</script>

<style scoped>
.bsc {
  position: fixed;
  inset: 0;
  background: #000;
  display: flex;
  flex-direction: column;
  color: #fff;
}

/* ── Header ── */
.bsc__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: calc(8px + env(safe-area-inset-top, 0px)) 12px 8px;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  z-index: 5;
}
.bsc__close,
.bsc__torch {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.10);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s;
}
.bsc__close:active,
.bsc__torch:active { background: rgba(255, 255, 255, 0.20); }
.bsc__torch.is-on { background: rgba(255, 220, 90, 0.25); color: #ffe27a; }
.bsc__torch:disabled { opacity: 0.35; cursor: not-allowed; }

.bsc__title {
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 0.01em;
}

/* ── Cámara ── */
.bsc__camera {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  background: #000;
  overflow: hidden;
}
.bsc__video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Frame con esquinas tipo MercadoPago */
.bsc__frame {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 78%;
  max-width: 320px;
  aspect-ratio: 4 / 3;
  pointer-events: none;
}
.bsc__corner {
  position: absolute;
  width: 32px;
  height: 32px;
  border-color: #1488d1;
  border-style: solid;
  border-width: 0;
}
.bsc__corner--tl { top: 0; left: 0; border-top-width: 4px; border-left-width: 4px; border-top-left-radius: 14px; }
.bsc__corner--tr { top: 0; right: 0; border-top-width: 4px; border-right-width: 4px; border-top-right-radius: 14px; }
.bsc__corner--bl { bottom: 0; left: 0; border-bottom-width: 4px; border-left-width: 4px; border-bottom-left-radius: 14px; }
.bsc__corner--br { bottom: 0; right: 0; border-bottom-width: 4px; border-right-width: 4px; border-bottom-right-radius: 14px; }

/* Línea animada */
.bsc__line {
  position: absolute;
  left: 6%;
  right: 6%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #1488d1, transparent);
  box-shadow: 0 0 16px rgba(20, 136, 209, 0.7);
  border-radius: 999px;
  animation: bsc-scan 2.4s ease-in-out infinite;
}
@keyframes bsc-scan {
  0%   { top: 8%; opacity: 0.4; }
  50%  { top: 90%; opacity: 1; }
  100% { top: 8%; opacity: 0.4; }
}

.bsc__hint {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.65);
  font-size: 12px;
  white-space: nowrap;
  backdrop-filter: blur(4px);
}

/* ── Sin cámara ── */
.bsc__no-cam {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  text-align: center;
}
.bsc__no-cam-icon {
  width: 84px;
  height: 84px;
  border-radius: 22px;
  background: rgba(20, 136, 209, 0.18);
  color: #1488d1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}
.bsc__no-cam-title {
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 8px;
}
.bsc__no-cam-desc {
  font-size: 13.5px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.72);
  max-width: 380px;
}

/* ── Footer ── */
.bsc__footer {
  flex-shrink: 0;
  padding: 14px 14px calc(14px + env(safe-area-inset-bottom, 0px));
  background: rgba(0, 0, 0, 0.92);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
.bsc__manual {
  display: flex;
  gap: 8px;
  align-items: stretch;
}
.bsc__manual :deep(.v-field) {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 12px;
}
.bsc__manual :deep(.v-field__outline) { --v-field-border-opacity: 0.18; }
.bsc__manual :deep(.v-field__input),
.bsc__manual :deep(.v-label) { color: #fff !important; }

/* ── Resultado ── */
.bsc__result {
  display: flex;
  align-items: center;
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
}
.bsc__result--ok    { background: rgba(16, 185, 129, 0.15); color: #34d399; }
.bsc__result--error { background: rgba(239, 68, 68, 0.15); color: #fca5a5; }
.bsc__result--info  { background: rgba(20, 136, 209, 0.15); color: #5eb9e3; }

.bsc-feedback-enter-active,
.bsc-feedback-leave-active { transition: all 0.2s ease; }
.bsc-feedback-enter-from,
.bsc-feedback-leave-to { opacity: 0; transform: translateY(6px); }
</style>
