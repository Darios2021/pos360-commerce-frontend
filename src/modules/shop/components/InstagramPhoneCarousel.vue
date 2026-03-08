<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/InstagramPhoneCarousel.vue -->
<template>
  <v-card class="igs-card" variant="flat" rounded="xl">
    <div class="igs-head">
      <div class="igs-head-text">
        <div class="igs-head-kicker">Instagram</div>
        <div class="igs-head-title">Seguinos en nuestras redes sociales</div>
        <div class="igs-head-sub">Participá en nuestros sorteos y ganá premios</div>
      </div>
    </div>

    <div class="igs-body">
      <v-alert v-if="error" type="error" variant="tonal" density="comfortable" class="mb-3">
        {{ error }}
      </v-alert>

      <div v-if="loading" class="py-6 d-flex align-center justify-center ga-3">
        <v-progress-circular indeterminate />
        <div class="text-caption" style="opacity: 0.75">Cargando publicaciones…</div>
      </div>

      <div v-else-if="normalized.length === 0" class="py-6 text-center text-caption" style="opacity: 0.75">
        No hay publicaciones configuradas todavía.
      </div>

      <div v-else class="igs-wrap">
        <v-btn
          class="igs-nav igs-nav-left"
          icon="mdi-chevron-left"
          variant="elevated"
          size="small"
          :disabled="normalized.length <= 1"
          @click="goPrev"
        />
        <v-btn
          class="igs-nav igs-nav-right"
          icon="mdi-chevron-right"
          variant="elevated"
          size="small"
          :disabled="normalized.length <= 1"
          @click="goNext"
        />

        <div ref="stripEl" class="igs-strip" role="region" aria-label="Publicaciones de Instagram">
          <div v-for="(u, i) in normalized" :key="u.key" class="igs-item">
            <div
              class="igs-frame"
              :style="{
                '--igs-cardw': cardW + 'px',
                '--igs-scale': String(scale),
              }"
            >
              <div class="igs-loader" v-if="!loaded[i]">
                <v-progress-circular indeterminate size="24" />
                <div class="igs-loaderText">Cargando…</div>
              </div>

              <div class="igs-fit">
                <iframe
                  class="igs-iframe"
                  :src="u.embedUrl"
                  loading="lazy"
                  frameborder="0"
                  scrolling="no"
                  allowtransparency="true"
                  allow="encrypted-media; clipboard-write; fullscreen; picture-in-picture"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
                  @load="onLoad(i)"
                ></iframe>

                <!-- ✅ BLOQUEO SIEMPRE LA SALIDA DEL SITE -->
                <!-- Header / perfil -->
                <button
                  class="igs-shield igs-shield-top"
                  type="button"
                  @click.stop.prevent="askOpen(profileUrl)"
                  aria-label="Abrir perfil de Instagram"
                />

                <!-- Cuerpo del post / reel -->
                <button
                  class="igs-shield igs-shield-body"
                  type="button"
                  @click.stop.prevent="askOpen(u.externalUrl)"
                  aria-label="Abrir publicación de Instagram"
                />

                <!-- Footer / ver más -->
                <button
                  class="igs-shield igs-shield-bottom"
                  type="button"
                  @click.stop.prevent="askOpen(u.externalUrl)"
                  aria-label="Abrir publicación de Instagram"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="igs-hint">Usá las flechas para cambiar de publicación.</div>
      </div>
    </div>

    <!-- ✅ MODAL MÁS SUTIL Y CLÁSICO -->
    <v-dialog v-model="confirmDlg" max-width="320" width="90vw">
      <v-card class="igs-confirm" rounded="lg">
        <div class="igs-confirm-simple">
          <v-icon size="18" class="igs-confirm-simple-icon">mdi-open-in-new</v-icon>
          <span>¿Abrir Instagram?</span>
        </div>

        <v-divider />

        <div class="igs-confirm-actions-simple">
          <v-btn variant="text" class="igs-confirm-no" @click="confirmDlg = false">
            No
          </v-btn>

          <v-btn class="igs-confirm-yes" variant="flat" @click="confirmOpen">
            Sí
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { publicListLinks } from "@/app/services/public.links.api.js";

const props = defineProps({
  kind: { type: String, default: "INSTAGRAM_POST" },
  limit: { type: Number, default: 20 },
  profileUsername: { type: String, default: "sanjuan.tecnologia" },
});

const loading = ref(false);
const error = ref("");
const loaded = ref({});

const fetchedUrls = ref([]);
const stripEl = ref(null);

const IFRAME_W = 320;
const cardW = ref(300);
const scale = ref(0.8);

let ro = null;

const confirmDlg = ref(false);
const pendingUrl = ref("");

const profileUrl = computed(
  () => `https://www.instagram.com/${String(props.profileUsername || "").trim()}/`
);

function askOpen(url) {
  pendingUrl.value = String(url || "").trim();
  if (!pendingUrl.value) return;
  confirmDlg.value = true;
}

function confirmOpen() {
  if (pendingUrl.value) {
    window.open(pendingUrl.value, "_blank", "noopener,noreferrer");
  }
  confirmDlg.value = false;
  pendingUrl.value = "";
}

function stripIgParams(u) {
  let s = String(u || "").trim();
  try {
    const url = new URL(s);
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return s;
  }
}

function parseInstagramUrl(u) {
  const raw = stripIgParams(u);
  const m = raw.match(/instagram\.com\/(p|reel)\/([A-Za-z0-9_-]+)/i);
  if (!m) return null;

  const type = m[1].toLowerCase();
  const code = m[2];

  return {
    key: `${type}_${code}`,
    embedUrl:
      type === "reel"
        ? `https://www.instagram.com/reel/${code}/embed/`
        : `https://www.instagram.com/p/${code}/embed/`,
    externalUrl:
      type === "reel"
        ? `https://www.instagram.com/reel/${code}/`
        : `https://www.instagram.com/p/${code}/`,
  };
}

const normalized = computed(() => fetchedUrls.value.map(parseInstagramUrl).filter(Boolean));

function onLoad(i) {
  loaded.value = { ...loaded.value, [i]: true };
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function updateSizing() {
  const w = stripEl.value?.clientWidth || 0;

  if (w >= 1200) cardW.value = 310;
  else if (w >= 900) cardW.value = 300;
  else if (w >= 700) cardW.value = 282;
  else cardW.value = Math.max(264, w - 28);

  scale.value = clamp((cardW.value / IFRAME_W) * 0.995, 0.6, 1);
}

function stepPx() {
  return cardW.value + 12;
}

function currentIndex() {
  return Math.round((stripEl.value?.scrollLeft || 0) / stepPx());
}

function goNext() {
  stripEl.value?.scrollTo({
    left: (currentIndex() + 1) * stepPx(),
    behavior: "smooth",
  });
}

function goPrev() {
  stripEl.value?.scrollTo({
    left: (currentIndex() - 1) * stepPx(),
    behavior: "smooth",
  });
}

async function fetchFromDb() {
  loading.value = true;
  error.value = "";
  try {
    const r = await publicListLinks({ kind: props.kind, limit: props.limit });
    const items = Array.isArray(r?.items) ? r.items : Array.isArray(r?.data) ? r.data : [];
    fetchedUrls.value = items.map((x) => x?.url).filter(Boolean);
  } catch (e) {
    error.value = e?.message || "No se pudieron cargar las publicaciones";
    fetchedUrls.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await fetchFromDb();
  await nextTick();
  updateSizing();

  ro = new ResizeObserver(updateSizing);
  if (stripEl.value) ro.observe(stripEl.value);
});

onBeforeUnmount(() => {
  try {
    if (ro && stripEl.value) ro.unobserve(stripEl.value);
  } catch {}
  ro = null;
});

watch(
  () => [props.kind, props.limit],
  async () => {
    loaded.value = {};
    await fetchFromDb();
    await nextTick();
    updateSizing();
  }
);
</script>

<style scoped>
:root {
  --igs-brand: #02498b;
  --igs-brand-2: #0359ab;
  --igs-brand-3: #013a6e;
  --igs-brand-soft: rgba(2, 73, 139, 0.08);
  --igs-brand-soft-2: rgba(2, 73, 139, 0.14);
  --igs-text: #132f49;
  --igs-text-soft: rgba(19, 47, 73, 0.68);
  --igs-border: rgba(2, 73, 139, 0.08);
  --igs-shadow-card: 0 12px 28px rgba(2, 73, 139, 0.08);
  --igs-shadow-post: 0 20px 42px rgba(2, 73, 139, 0.14);
  --igs-shadow-post-hover: 0 28px 56px rgba(2, 73, 139, 0.20);
  --igs-shadow-nav: 0 14px 28px rgba(2, 73, 139, 0.18);
}

/* CARD GENERAL */
.igs-card {
  border-radius: 22px;
  background: linear-gradient(180deg, #fbfdff 0%, #f4f8fc 100%);
  border: 1px solid var(--igs-border);
  overflow: visible;
  box-shadow: var(--igs-shadow-card);
}

/* HEADER */
.igs-head {
  padding: 16px 16px 14px;
  background:
    radial-gradient(circle at top left, rgba(2, 73, 139, 0.09), transparent 42%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(247, 251, 255, 0.94));
  border-bottom: 1px solid rgba(2, 73, 139, 0.08);
  border-top-left-radius: 22px;
  border-top-right-radius: 22px;
}

.igs-head-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.igs-head-kicker {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--igs-brand-soft);
  color: var(--igs-brand);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.igs-head-title {
  font-size: 16px;
  font-weight: 900;
  letter-spacing: -0.25px;
  color: var(--igs-text);
  line-height: 1.15;
}

.igs-head-sub {
  font-size: 13px;
  font-weight: 500;
  color: var(--igs-text-soft);
  line-height: 1.3;
}

/* BODY */
.igs-body {
  padding: 10px 10px 12px;
}

.igs-wrap {
  position: relative;
  overflow: visible;
}

/* STRIP */
.igs-strip {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  padding: 14px 50px 8px;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.igs-strip::-webkit-scrollbar {
  display: none;
}

.igs-item {
  flex: 0 0 auto;
  scroll-snap-align: center;
}

/* FRAME DEL POST */
.igs-frame {
  position: relative;
  width: var(--igs-cardw, 300px);
  height: 520px;
  border-radius: 22px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  border: 1px solid rgba(2, 73, 139, 0.10);
  overflow: hidden;
  box-shadow: var(--igs-shadow-post);
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}

.igs-frame:hover {
  transform: translateY(-4px);
  box-shadow: var(--igs-shadow-post-hover);
  border-color: rgba(2, 73, 139, 0.16);
}

/* LOADER */
.igs-loader {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  gap: 6px;
  background: rgba(248, 251, 255, 0.96);
  backdrop-filter: blur(4px);
  z-index: 3;
}

.igs-loaderText {
  font-size: 12px;
  font-weight: 700;
  color: var(--igs-text-soft);
}

/* FIT */
.igs-fit {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(2, 73, 139, 0.02), rgba(2, 73, 139, 0.045));
}

/* IFRAME */
.igs-iframe {
  width: 320px;
  height: 780px;
  transform-origin: top center;
  transform: scale(var(--igs-scale, 0.8));
  border: 0;
  display: block;
  background: #fff;
}

/* SHIELDS */
.igs-shield {
  position: absolute;
  left: 0;
  width: 100%;
  border: 0;
  background: transparent;
  cursor: pointer;
  z-index: 4;
}

.igs-shield-top {
  top: 0;
  height: 78px;
}

.igs-shield-body {
  top: 78px;
  bottom: 136px;
}

.igs-shield-bottom {
  bottom: 0;
  height: 136px;
}

/* FLECHAS */
.igs-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: #ffffff !important;
  color: var(--igs-brand) !important;
  border-radius: 999px;
  box-shadow: var(--igs-shadow-nav);
  border: 1px solid rgba(2, 73, 139, 0.10);
  z-index: 10;
  opacity: 0.98;
  backdrop-filter: blur(8px);
}

.igs-nav:hover {
  background: var(--igs-brand) !important;
  color: #ffffff !important;
  box-shadow: 0 18px 34px rgba(2, 73, 139, 0.26);
  border-color: rgba(2, 73, 139, 0.18);
}

.igs-nav-left {
  left: -4px;
}

.igs-nav-right {
  right: -4px;
}

/* HINT */
.igs-hint {
  margin-top: 8px;
  font-size: 12px;
  font-weight: 700;
  color: rgba(2, 73, 139, 0.66);
  text-align: center;
}

/* MODAL: SOLO AJUSTADO A MÁS SUTIL */
.igs-confirm {
  border: 1px solid rgba(2, 73, 139, 0.08);
  background: #ffffff;
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.igs-confirm-simple {
  padding: 16px 18px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.igs-confirm-simple-icon {
  color: var(--igs-brand);
  flex: 0 0 auto;
}

.igs-confirm-actions-simple {
  padding: 10px 12px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}

.igs-confirm-no {
  color: #5b6470 !important;
  font-weight: 700 !important;
  min-width: 72px !important;
}

.igs-confirm-yes {
  background: #02498b !important;
  color: #ffffff !important;
  font-weight: 700 !important;
  min-width: 72px !important;
  box-shadow: 0 6px 14px rgba(2, 73, 139, 0.18);
}

.igs-confirm-yes:hover {
  background: #0359ab !important;
}

/* MOBILE */
@media (max-width: 600px) {
  .igs-head {
    padding: 14px 14px 12px;
  }

  .igs-head-kicker {
    font-size: 10px;
    padding: 4px 9px;
  }

  .igs-head-title {
    font-size: 15px;
  }

  .igs-head-sub {
    font-size: 12px;
  }

  .igs-body {
    padding: 8px 8px 10px;
  }

  .igs-strip {
    padding: 12px 38px 6px;
    gap: 10px;
  }

  .igs-frame {
    height: 460px;
    border-radius: 20px;
    box-shadow:
      0 16px 32px rgba(2, 73, 139, 0.14),
      0 4px 12px rgba(2, 73, 139, 0.08);
  }

  .igs-nav {
    top: 58%;
    width: 38px !important;
    height: 38px !important;
    min-width: 38px !important;
    opacity: 0.96;
  }

  .igs-nav-left {
    left: -10px;
  }

  .igs-nav-right {
    right: -10px;
  }

  .igs-hint {
    margin-top: 7px;
    font-size: 11.5px;
  }

  .igs-shield-top {
    height: 68px;
  }

  .igs-shield-body {
    top: 68px;
    bottom: 124px;
  }

  .igs-shield-bottom {
    height: 124px;
  }

  .igs-confirm-simple {
    padding: 15px 16px;
    font-size: 13.5px;
  }

  .igs-confirm-actions-simple {
    padding: 10px 10px;
    gap: 6px;
  }

  .igs-confirm-no,
  .igs-confirm-yes {
    min-width: 68px !important;
  }
}
</style>