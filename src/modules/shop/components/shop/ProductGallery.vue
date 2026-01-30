<!-- ✅ COPY-PASTE FINAL COMPLETO (gallery ML-like + videos YouTube/File, estable) -->
<!-- src/modules/shop/components/ProductGallery.vue -->
<template>
  <v-card class="pg-card" variant="outlined">
    <v-card-text class="pg-pad">
      <div class="gallery">
        <!-- Thumbs desktop -->
        <div class="thumbs" aria-label="Miniaturas">
          <button
            v-for="(m, i) in media"
            :key="m.key"
            class="thumb"
            :class="{ active: i === activeIdx }"
            type="button"
            @click="activeIdx = i"
            :title="m.type === 'image' ? `Imagen ${i + 1}` : `Video ${i + 1}`"
          >
            <div class="thumb-inner">
              <img
                v-if="m.type === 'image'"
                :src="m.src"
                alt=""
                @error="onMediaError(m)"
              />

              <div v-else class="thumb-video">
                <img
                  v-if="m.thumb && !brokenThumb.has(m.thumb)"
                  :src="m.thumb"
                  alt=""
                  @error="onThumbError(m)"
                />
                <div v-else class="thumb-video-fallback">
                  <v-icon size="26">mdi-play-circle</v-icon>
                </div>

                <div class="thumb-play">
                  <v-icon size="20">mdi-play</v-icon>
                </div>
              </div>
            </div>
          </button>
        </div>

        <!-- Main -->
        <div class="main">
          <div
            class="main-frame"
            role="button"
            tabindex="0"
            @click="openViewer"
            @keydown.enter.prevent="openViewer"
            @keydown.space.prevent="openViewer"
            :title="media.length ? 'Ver media' : ''"
          >
            <!-- MAIN IMAGE -->
            <img
              v-if="activeItem && activeItem.type === 'image'"
              :key="'main-img-' + activeItem.src"
              class="main-img"
              :src="activeItem.src"
              alt=""
              @error="onMediaError(activeItem)"
              decoding="async"
              loading="eager"
            />

            <!-- MAIN VIDEO -->
            <div
              v-else-if="activeItem && activeItem.type === 'video'"
              class="main-video"
              @click.stop
              @keydown.stop
            >
              <!-- youtube -->
              <iframe
                v-if="activeItem.provider === 'youtube' && activeItem.embed"
                class="main-iframe"
                :src="activeItem.embed"
                title="Video"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
                referrerpolicy="strict-origin-when-cross-origin"
              />
              <!-- file -->
              <video
                v-else
                class="main-video-el"
                :src="activeItem.src"
                controls
                playsinline
                preload="metadata"
              />

              <div class="video-badge">
                <v-icon size="16">mdi-play-circle</v-icon>
                <span>Video</span>
              </div>
            </div>

            <div v-else class="main-empty">Sin media</div>

            <div v-if="media.length" class="open-hint">
              <v-icon size="18">mdi-magnify-plus-outline</v-icon>
              <span>Ver</span>
            </div>

            <div v-if="media.length > 1" class="count-pill">
              {{ activeIdx + 1 }} / {{ media.length }}
            </div>
          </div>

          <!-- Thumbs mobile -->
          <div v-if="media.length > 1" class="thumbs-mobile" aria-label="Miniaturas (mobile)">
            <div class="thumbs-scroll" role="list">
              <button
                v-for="(m, i) in media"
                :key="'m-' + m.key"
                class="thumb-m"
                :class="{ active: i === activeIdx }"
                type="button"
                @click="activeIdx = i"
                :title="m.type === 'image' ? `Imagen ${i + 1}` : `Video ${i + 1}`"
                role="listitem"
              >
                <div class="thumb-inner">
                  <img
                    v-if="m.type === 'image'"
                    :src="m.src"
                    alt=""
                    @error="onMediaError(m)"
                  />

                  <div v-else class="thumb-video">
                    <img
                      v-if="m.thumb && !brokenThumb.has(m.thumb)"
                      :src="m.thumb"
                      alt=""
                      @error="onThumbError(m)"
                    />
                    <div v-else class="thumb-video-fallback">
                      <v-icon size="22">mdi-play-circle</v-icon>
                    </div>
                    <div class="thumb-play">
                      <v-icon size="18">mdi-play</v-icon>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

        </div>
      </div>
    </v-card-text>
  </v-card>

  <!-- Visor overlay -->
  <teleport to="body">
    <div
      v-if="viewer"
      class="mlv-overlay"
      role="dialog"
      aria-modal="true"
      @click.self="closeViewer"
      @keydown.esc.prevent="closeViewer"
      @keydown.left.prevent="prev"
      @keydown.right.prevent="next"
      tabindex="0"
      ref="overlayEl"
    >
      <div class="mlv-topbar">
        <div class="mlv-title">Media</div>

        <div class="mlv-right">
          <div class="mlv-counter" v-if="media.length">
            {{ viewerIdx + 1 }} / {{ media.length }}
          </div>

          <button class="mlv-close" type="button" @click="closeViewer" aria-label="Cerrar">
            <v-icon size="22">mdi-close</v-icon>
          </button>
        </div>
      </div>

      <button
        v-if="media.length > 1"
        class="mlv-nav mlv-nav-left"
        type="button"
        @click.stop="prev"
        aria-label="Anterior"
      >
        <v-icon size="26">mdi-chevron-left</v-icon>
      </button>

      <button
        v-if="media.length > 1"
        class="mlv-nav mlv-nav-right"
        type="button"
        @click.stop="next"
        aria-label="Siguiente"
      >
        <v-icon size="26">mdi-chevron-right</v-icon>
      </button>

      <div class="mlv-stage" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
        <img
          v-if="viewerItem && viewerItem.type === 'image'"
          :key="'v-img-' + viewerItem.src"
          class="mlv-img"
          :src="viewerItem.src"
          alt=""
          @error="onMediaError(viewerItem)"
          draggable="false"
        />

        <div v-else-if="viewerItem && viewerItem.type === 'video'" class="mlv-video">
          <iframe
            v-if="viewerItem.provider === 'youtube' && viewerItem.embed"
            class="mlv-iframe"
            :src="viewerItem.embed"
            title="Video"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
            referrerpolicy="strict-origin-when-cross-origin"
          />
          <video
            v-else
            class="mlv-video-el"
            :src="viewerItem.src"
            controls
            playsinline
            preload="metadata"
          />
        </div>

        <div v-else class="mlv-empty">Sin media</div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";

const props = defineProps({
  product: { type: Object, default: null },
});

/* =========================
   STATE
========================= */
const activeIdx = ref(0);
const viewer = ref(false);
const viewerIdx = ref(0);
const overlayEl = ref(null);

const brokenSrc = ref(new Set());   // src fallidos (img/video/url)
const brokenThumb = ref(new Set()); // thumbs de video fallidos

function s(x) {
  return String(x || "").trim();
}

function uniqByKey(arr) {
  const out = [];
  const seen = new Set();
  for (const it of arr) {
    const k = s(it?.key);
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}

/* =========================
   YOUTUBE HELPERS (watch / shorts / youtu.be -> embed)
========================= */
function parseYoutube(url) {
  const u = s(url);
  if (!u) return null;

  let m = u.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/i);
  if (m?.[1]) return { id: m[1] };

  m = u.match(/[?&]v=([a-zA-Z0-9_-]{6,})/i);
  if (m?.[1]) return { id: m[1] };

  m = u.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/i);
  if (m?.[1]) return { id: m[1] };

  m = u.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/i);
  if (m?.[1]) return { id: m[1] };

  return null;
}

function youtubeEmbedFromAny(urlOrEmbed) {
  const u = s(urlOrEmbed);
  if (!u) return "";

  // ya viene embed
  if (/youtube\.com\/embed\//i.test(u)) {
    const base = u.split("?")[0];
    return `${base}?rel=0&modestbranding=1&playsinline=1`;
  }

  const p = parseYoutube(u);
  if (!p?.id) return "";
  return `https://www.youtube.com/embed/${p.id}?rel=0&modestbranding=1&playsinline=1`;
}

function youtubeThumbFromAny(urlOrEmbed) {
  const p = parseYoutube(urlOrEmbed);
  if (!p?.id) return "";
  return `https://img.youtube.com/vi/${p.id}/hqdefault.jpg`;
}

/* =========================
   EXTRACT MEDIA
========================= */
function extractImages(p) {
  if (!p) return [];
  const out = [];

  if (Array.isArray(p.images) && p.images.length) {
    for (const it of p.images) {
      const u = typeof it === "string" ? it : it?.url || it?.image_url || it?.src || it?.path;
      if (u) out.push(s(u));
    }
  }

  if (Array.isArray(p.image_urls) && p.image_urls.length) {
    for (const u of p.image_urls) if (u) out.push(s(u));
  }

  if (p.image_url) out.push(s(p.image_url));
  if (p.cover_url) out.push(s(p.cover_url));
  if (p.image_url_2) out.push(s(p.image_url_2));

  return out.filter(Boolean);
}

function extractVideos(p) {
  if (!p) return [];
  const out = [];

  // ✅ soporta: videos, product_videos, media.videos
  const list =
    (Array.isArray(p.videos) && p.videos) ||
    (Array.isArray(p.product_videos) && p.product_videos) ||
    (Array.isArray(p.media?.videos) && p.media.videos) ||
    [];

  for (const it of list) {
    if (!it) continue;

    const provider = s(it.provider || it.type || "");
    const rawUrl = s(it.url || it.video_url || it.src || it.path || "");
    const storage = s(it.storage_key || it.storageKey || "");
    const title = s(it.title || "");

    // ✅ youtube (acepta watch/shorts/youtu.be/ya embed)
    if (provider === "youtube" || /youtube|youtu\.be/i.test(rawUrl)) {
      const embed = youtubeEmbedFromAny(rawUrl);
      out.push({
        type: "video",
        provider: "youtube",
        src: embed || rawUrl,
        embed: embed,
        title,
        thumb: youtubeThumbFromAny(rawUrl) || youtubeThumbFromAny(embed),
        key: `yt:${embed || rawUrl}`,
      });
      continue;
    }

    // ✅ file
    const fileUrl = rawUrl || storage;
    if (fileUrl) {
      out.push({
        type: "video",
        provider: "file",
        src: fileUrl,
        embed: "",
        title,
        thumb: "",
        key: `vid:${fileUrl}`,
      });
    }
  }

  // ✅ soporta: video_urls / video_url
  if (Array.isArray(p.video_urls)) {
    for (const u of p.video_urls) {
      const url = s(u);
      if (!url) continue;
      const embed = youtubeEmbedFromAny(url);
      if (embed) {
        out.push({
          type: "video",
          provider: "youtube",
          src: embed,
          embed,
          title: "",
          thumb: youtubeThumbFromAny(url),
          key: `yt:${embed}`,
        });
      } else {
        out.push({
          type: "video",
          provider: "file",
          src: url,
          embed: "",
          title: "",
          thumb: "",
          key: `vid:${url}`,
        });
      }
    }
  }

  if (p.video_url) {
    const url = s(p.video_url);
    const embed = youtubeEmbedFromAny(url);
    if (embed) {
      out.push({
        type: "video",
        provider: "youtube",
        src: embed,
        embed,
        title: "",
        thumb: youtubeThumbFromAny(url),
        key: `yt:${embed}`,
      });
    } else if (url) {
      out.push({
        type: "video",
        provider: "file",
        src: url,
        embed: "",
        title: "",
        thumb: "",
        key: `vid:${url}`,
      });
    }
  }

  return out.filter((x) => s(x?.src));
}

const mediaRaw = computed(() => {
  const p = props.product || null;

  const imgs = extractImages(p).map((u) => ({
    type: "image",
    src: s(u),
    key: `img:${s(u)}`,
  }));

  const vids = extractVideos(p);

  const merged = uniqByKey([...imgs, ...vids]);

  // filtrar rotos
  const broken = brokenSrc.value;
  return merged.filter((m) => !broken.has(s(m.src)));
});

const media = computed(() => mediaRaw.value);

const activeItem = computed(() => {
  const list = media.value;
  if (!list.length) return null;
  const idx = Math.min(Math.max(0, Number(activeIdx.value || 0)), list.length - 1);
  return list[idx];
});

const viewerItem = computed(() => {
  const list = media.value;
  if (!list.length) return null;
  const idx = Math.min(Math.max(0, Number(viewerIdx.value || 0)), list.length - 1);
  return list[idx];
});

/* =========================
   ERROR HANDLING
========================= */
function onMediaError(m) {
  const src = s(m?.src);
  if (!src) return;
  if (brokenSrc.value.has(src)) return;

  const next = new Set(brokenSrc.value);
  next.add(src);
  brokenSrc.value = next;

  activeIdx.value = 0;
  viewerIdx.value = 0;
}

function onThumbError(m) {
  const t = s(m?.thumb);
  if (!t) return;
  if (brokenThumb.value.has(t)) return;

  const next = new Set(brokenThumb.value);
  next.add(t);
  brokenThumb.value = next;
}

/* =========================
   VIEWER
========================= */
function lockBodyScroll(lock) {
  const body = document?.body;
  if (!body) return;
  body.style.overflow = lock ? "hidden" : "";
}

function openViewer() {
  if (!media.value.length) return;
  viewerIdx.value = Math.min(activeIdx.value, media.value.length - 1);
  viewer.value = true;

  nextTick(() => {
    try {
      overlayEl.value?.focus?.();
    } catch {}
  });

  lockBodyScroll(true);
}

function closeViewer() {
  viewer.value = false;
  lockBodyScroll(false);
}

function prev() {
  if (media.value.length <= 1) return;
  viewerIdx.value = (viewerIdx.value - 1 + media.value.length) % media.value.length;
  activeIdx.value = viewerIdx.value;
}

function next() {
  if (media.value.length <= 1) return;
  viewerIdx.value = (viewerIdx.value + 1) % media.value.length;
  activeIdx.value = viewerIdx.value;
}

// Swipe mobile
const touchStartX = ref(null);
function onTouchStart(e) {
  const t = e?.changedTouches?.[0];
  if (!t) return;
  touchStartX.value = t.clientX;
}
function onTouchEnd(e) {
  const startX = touchStartX.value;
  touchStartX.value = null;
  if (startX == null) return;
  const t = e?.changedTouches?.[0];
  if (!t) return;
  const dx = t.clientX - startX;
  if (Math.abs(dx) < 45) return;
  if (dx > 0) prev();
  else next();
}

onBeforeUnmount(() => lockBodyScroll(false));

watch(
  () => props.product?.id,
  () => {
    activeIdx.value = 0;
    viewerIdx.value = 0;
    viewer.value = false;
    brokenSrc.value = new Set();
    brokenThumb.value = new Set();
    lockBodyScroll(false);
  }
);

watch(viewerIdx, (v) => {
  const n = Number(v || 0);
  if (Number.isFinite(n)) activeIdx.value = n;
});
</script>

<style scoped>
.pg-card {
  border-radius: 18px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.pg-pad { padding: 14px; }

.gallery {
  display: grid;
  grid-template-columns: 86px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.thumbs {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.thumb {
  width: 86px;
  height: 86px;
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,.12);
  background: #fff;
  overflow: hidden;
  padding: 0;
  cursor: pointer;
}
.thumb.active { border-color: rgba(25,118,210,.7); }

.thumb-inner {
  width: 100%;
  height: 100%;
}
.thumb-inner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.thumb-video {
  width: 100%;
  height: 100%;
  position: relative;
  background: rgba(0,0,0,.06);
}
.thumb-video-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: rgba(0,0,0,.55);
}

.thumb-play {
  position: absolute;
  inset: auto 8px 8px auto;
  width: 30px;
  height: 30px;
  border-radius: 999px;
  background: rgba(255,255,255,.92);
  border: 1px solid rgba(0,0,0,.08);
  display: grid;
  place-items: center;
  box-shadow: 0 6px 16px rgba(0,0,0,.10);
}

.main { min-width: 0; }

.main-frame {
  position: relative;
  width: 100%;
  height: 520px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(0,0,0,.06);
  box-shadow: 0 1px 2px rgba(0,0,0,.04);
  overflow: hidden;
  cursor: pointer;
}

.main-img {
  position: absolute;
  inset: 0;
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  object-position: center center !important;
  display: block !important;
}

.main-video {
  position: absolute;
  inset: 0;
  background: #000;
}

.main-iframe, .main-video-el {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.video-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,.92);
  border: 1px solid rgba(0,0,0,.08);
  font-size: 12px;
  font-weight: 900;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: rgba(0,0,0,.82);
}

.main-empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: rgba(0,0,0,.55);
}

.open-hint {
  position: absolute;
  bottom: 10px;
  right: 10px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,.9);
  border: 1px solid rgba(0,0,0,.08);
  font-size: 12px;
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

.count-pill {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,.92);
  border: 1px solid rgba(0,0,0,.08);
  font-size: 12px;
  font-weight: 900;
}

.thumbs-mobile { display: none; margin-top: 10px; }
.thumbs-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding: 6px 6px 12px;
  scroll-snap-type: x mandatory;
}
.thumbs-scroll::-webkit-scrollbar { height: 8px; }

.thumb-m {
  width: 72px;
  height: 72px;
  border-radius: 14px;
  border: 1px solid rgba(0,0,0,.12);
  background: #fff;
  overflow: hidden;
  flex: 0 0 auto;
  padding: 0;
  scroll-snap-align: start;
}
.thumb-m.active {
  border-color: rgba(25,118,210,.7);
  box-shadow: 0 0 0 2px rgba(25,118,210,.12);
}

/* overlay */
.mlv-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0,0,0,.72);
  display: grid;
  grid-template-rows: auto 1fr;
  outline: none;
}
.mlv-topbar {
  display: flex;
  justify-content: space-between;
  padding: 14px 16px;
  color: #fff;
}
.mlv-title { font-weight: 900; }
.mlv-right { display: inline-flex; align-items: center; gap: 10px; }
.mlv-counter { font-weight: 900; opacity: .95; }

.mlv-close {
  width: 40px; height: 40px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,.16);
  background: rgba(0,0,0,.22);
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.mlv-stage {
  display: grid;
  place-items: center;
  padding: 18px 16px 22px;
}

.mlv-img {
  max-width: min(980px, 92vw);
  max-height: 78vh;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 12px 30px rgba(0,0,0,.35);
  user-select: none;
  -webkit-user-drag: none;
}

.mlv-video {
  width: min(980px, 92vw);
  height: min(78vh, 560px);
  border-radius: 10px;
  overflow: hidden;
  background: #000;
  box-shadow: 0 12px 30px rgba(0,0,0,.35);
}
.mlv-iframe, .mlv-video-el {
  width: 100%;
  height: 100%;
  display: block;
}

.mlv-empty { color: #fff; opacity: .85; }

.mlv-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px; height: 44px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.18);
  background: rgba(0,0,0,.18);
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
}
.mlv-nav-left { left: 18px; }
.mlv-nav-right { right: 18px; }

@media (max-width: 980px) {
  .gallery { grid-template-columns: 1fr; }
  .thumbs { display: none; }
  .thumbs-mobile { display: block; }
  .main-frame { height: min(92vw, 520px); }
}
</style>
