<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/HomeCategoriesCarousel.vue -->
<template>
  <section v-if="pages.length" class="hc-shell">
    <div class="hc-card">
      <!-- Header -->
      <div class="hc-head">
        <div class="hc-title">Categorías</div>

        <button class="hc-link" type="button" @click="goAll">
          Mostrar todas las categorías
        </button>

        <div class="hc-dots" v-if="pages.length > 1" aria-label="Paginación de categorías">
          <span
            v-for="i in pages.length"
            :key="i"
            class="hc-dot"
            :class="{ active: i - 1 === idx }"
          />
        </div>
      </div>

      <!-- Body -->
      <div class="hc-body" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
        <!-- Arrows -->
        <button
          v-if="pages.length > 1"
          class="hc-arrow left"
          type="button"
          aria-label="Anterior"
          @click="prev"
        >
          <span class="hc-arrow-ico">‹</span>
        </button>

        <button
          v-if="pages.length > 1"
          class="hc-arrow right"
          type="button"
          aria-label="Siguiente"
          @click="next"
        >
          <span class="hc-arrow-ico">›</span>
        </button>

        <!-- Grid -->
        <div class="hc-grid" role="list">
          <template v-for="c in currentPagePadded" :key="c.__empty ? c.__key : c.id">
            <div v-if="c.__empty" class="hc-item hc-ghost" aria-hidden="true" />

            <button
              v-else
              class="hc-item"
              type="button"
              role="listitem"
              @click="openCategory(c)"
              :title="c.name"
            >
              <div class="hc-img">
                <img class="hc-img-img" :src="imgOf(c)" :alt="c.name" loading="lazy" />
              </div>

              <div class="hc-name">
                {{ c.name }}
              </div>
            </button>
          </template>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";

const props = defineProps({
  categories: { type: Array, default: () => [] },
  perPage: { type: Number, default: 12 }, // 4x3
});

const router = useRouter();
const idx = ref(0);

// ✅ cache-bust suave para que se actualicen iconos sin pegarle fuerte al CDN
// Cambialo si subís nuevos PNGs (o dejalo, y se refresca por deploy)
const ICON_VER = "2026-01-21-01";

// --- swipe (mobile) ---
const touch = ref({ x: 0, y: 0, t: 0 });
function onTouchStart(e) {
  const p = e?.changedTouches?.[0];
  if (!p) return;
  touch.value = { x: p.clientX, y: p.clientY, t: Date.now() };
}
function onTouchEnd(e) {
  if (pages.value.length <= 1) return;

  const p = e?.changedTouches?.[0];
  if (!p) return;

  const dx = p.clientX - touch.value.x;
  const dy = p.clientY - touch.value.y;
  const dt = Date.now() - touch.value.t;

  // swipe horizontal claro, ignorar scroll vertical
  if (dt > 650) return;
  if (Math.abs(dx) < 45) return;
  if (Math.abs(dy) > 70) return;

  if (dx < 0) next();
  else prev();
}

function norm(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function isRootCategory(c) {
  const p = c?.parent_id;
  return p === null || p === undefined || Number(p) === 0;
}

function withVer(url) {
  if (!url) return url;
  return url.includes("?") ? `${url}&v=${encodeURIComponent(ICON_VER)}` : `${url}?v=${encodeURIComponent(ICON_VER)}`;
}

/**
 * ✅ ICONOS OFICIALES (SJT)
 * - Matcheo por "contains" para cubrir variantes:
 *   "SEGURIDAD ELECTRONICA", "SALUD / BELLEZA", "TV / IMAGEN", etc.
 */
const ICONS = [
  { match: (k) => k.includes("accesor"), img: withVer("https://storage-files.cingulado.org/pos360/media/1768968306314-b418ee86fec0.png") },
  { match: (k) => k.includes("audio"), img: withVer("https://storage-files.cingulado.org/pos360/media/1768968316038-54128c09d744.png") },
  { match: (k) => k.includes("automot") || k.includes("automo") || k.includes("auto"), img: withVer("https://storage-files.cingulado.org/pos360/media/1768968321444-f9feaf72b2a6.png") },
  { match: (k) => k.includes("cable"), img: withVer("https://storage-files.cingulado.org/pos360/media/1768968324835-48e6572f21ab.png") }, // ✅ sin espacios
  { match: (k) => k.includes("computacion") || k.includes("computac") || k.includes("comput"), img: withVer("https://storage-files.cingulado.org/pos360/media/1768968328262-7f61417d370f.png") },
  { match: (k) => k.includes("energia") || k.includes("energ"), img: withVer("https://storage-files.cingulado.org/pos360/media/1768968334049-6affec6a83ca.png") },
  { match: (k) => k.includes("entreten"), img: withVer("https://storage-files.cingulado.org/pos360/media/1768968339902-02a488c66115.png") },
  { match: (k) => k.includes("electro") || k.includes("hogar") || k.includes("aire") || k.includes("aires"), img: withVer("https://storage-files.cingulado.org/pos360/media/1768968347659-a7a8fa9d2fd6.png") },
  { match: (k) => k.includes("ilumin") || k.includes("luz") || k.includes("lampara") || k.includes("led"), img: withVer("https://storage-files.cingulado.org/pos360/media/1768968352957-d12f2236aaff.png") },
  { match: (k) => k.includes("informat"), img: withVer("https://storage-files.cingulado.org/pos360/media/1768968357748-5045d55d6e3b.png") },
  {
    match: (k) => k.includes("salud") || k.includes("belleza") || k.includes("cuidado") || k.includes("personal"),
    img: withVer("https://storage-files.cingulado.org/pos360/media/1768968362467-59bc2286dbd2.png"),
  },
  { match: (k) => k.includes("seguridad") || k.includes("cctv") || k.includes("camara"), img: withVer("https://storage-files.cingulado.org/pos360/media/1768968366335-4e3a5a9ffe58.png") },

  // ✅ faltaban (ya incluidos)
  { match: (k) => k.includes("tecnolog") || k === "tecnologia", img: withVer("https://storage-files.cingulado.org/pos360/media/1768968885729-02373cf4ab39.png") },
  { match: (k) => k.includes("telefon") || k.includes("celular"), img: withVer("https://storage-files.cingulado.org/pos360/media/1768968882310-1c678bd0ccc5.png") },
  { match: (k) => k.includes("tv") || k.includes("imagen") || k.includes("televisor") || k.includes("televis"), img: withVer("https://storage-files.cingulado.org/pos360/media/1768968878573-ddeb76768fb1.png") },
];

const genericStock = [
  "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=256&q=70",
  "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=256&q=70",
  "https://images.unsplash.com/photo-1518441902117-f0a6a0e0f6f5?auto=format&fit=crop&w=256&q=70",
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=256&q=70",
];

function imgOf(c) {
  const key = norm(c?.name);

  // 1) si la categoría ya trae imagen desde API, respetarla (también cache-bust)
  const raw = c?.image_url || c?.icon_url || c?.img || c?.image || c?.url || c?.src || "";
  if (raw) return withVer(raw);

  // 2) map oficial por nombre
  for (const rule of ICONS) {
    try {
      if (rule.match(key)) return rule.img;
    } catch {}
  }

  // 3) fallback estable
  const id = Number(c?.id || 0);
  return genericStock[Math.abs(id) % genericStock.length];
}

const roots = computed(() => {
  const arr = Array.isArray(props.categories) ? props.categories : [];
  const onlyRoots = arr.filter(isRootCategory);
  return onlyRoots.length ? onlyRoots : arr;
});

const pages = computed(() => {
  const out = [];
  const arr = roots.value || [];
  const n = Math.max(1, Number(props.perPage || 12));
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
});

const currentPage = computed(() => pages.value[idx.value] || []);

const currentPagePadded = computed(() => {
  const base = Array.isArray(currentPage.value) ? currentPage.value : [];
  const n = Math.max(1, Number(props.perPage || 12));
  if (base.length >= n) return base;

  const missing = n - base.length;
  const ghosts = Array.from({ length: missing }).map((_, i) => ({
    __empty: true,
    __key: `ghost-${idx.value}-${i}`,
  }));

  return [...base, ...ghosts];
});

function clampIndex() {
  const max = Math.max(0, pages.value.length - 1);
  if (idx.value > max) idx.value = max;
  if (idx.value < 0) idx.value = 0;
}
watch(pages, clampIndex, { immediate: true });

function prev() {
  if (pages.value.length <= 1) return;
  idx.value = (idx.value - 1 + pages.value.length) % pages.value.length;
}
function next() {
  if (pages.value.length <= 1) return;
  idx.value = (idx.value + 1) % pages.value.length;
}

function openCategory(c) {
  const id = c?.id;
  if (!id) return;
  router.push({ name: "shopCategory", params: { id: String(id) } });
}

function goAll() {
  router.push({ path: "/shop" });
}
</script>

<style scoped>
/* =======================
   Contenedor general
   ======================= */
.hc-shell {
  width: 100%;
  overflow: visible;
}

.hc-card {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  overflow: visible;
  position: relative;
}

/* =======================
   Header
   ======================= */
.hc-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px 10px;
}

.hc-title {
  font-size: 16px;
  font-weight: 900;
  letter-spacing: -0.2px;
}

.hc-link {
  border: 0;
  background: transparent;
  cursor: pointer;
  color: #2d6cdf;
  font-weight: 800;
  font-size: 13px;
  padding: 0;
  white-space: nowrap;
}

.hc-dots {
  margin-left: auto;
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

.hc-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.18);
}
.hc-dot.active {
  background: #2d6cdf;
}

/* =======================
   Body
   ======================= */
.hc-body {
  position: relative;
  padding: 10px 16px 16px;
  overflow: visible;
}

/* =======================
   Grid desktop
   ======================= */
.hc-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;

  --hc-gap: 14px;
  --hc-item-h: 82px; /* ✅ más alto para icon grande + texto */
  --hc-rows: 3;

  min-height: calc(
    (var(--hc-rows) * var(--hc-item-h)) +
    ((var(--hc-rows) - 1) * var(--hc-gap))
  );
}

/* =======================
   Item categoría
   ======================= */
.hc-item {
  appearance: none;
  border: 1px solid rgba(0, 0, 0, 0.10);
  background: #ffffff;
  border-radius: 12px;
  padding: 0;

  display: grid;
  grid-template-columns: 92px 1fr; /* ✅ más ancho para icon */
  align-items: center;

  height: var(--hc-item-h);
  text-align: left;
  cursor: pointer;

  overflow: hidden;

  transition: box-shadow 0.12s ease, transform 0.12s ease, border-color 0.12s ease;
}

@media (hover: hover) and (pointer: fine) {
  .hc-item:hover {
    border-color: rgba(0, 0, 0, 0.14);
    box-shadow: 0 10px 22px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
  }
}

/* =======================
   Imagen (MUCHO más grande)
   ======================= */
.hc-img {
  width: 92px;
  height: var(--hc-item-h);
  background: #f3f4f6;
  border-right: 1px solid rgba(0, 0, 0, 0.06);

  display: flex;
  align-items: center;
  justify-content: center;
}

.hc-img-img {
  width: 70px; /* ✅ GRANDE (antes 56/62) */
  height: 70px;
  object-fit: contain;
  display: block;
}

/* =======================
   Texto (no se come letras)
   ======================= */
.hc-name {
  padding: 0 12px;
  font-size: 14px;
  font-weight: 900;
  line-height: 1.12;
  color: rgba(0, 0, 0, 0.86);

  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  /* desktop: preferimos no partir palabras feo */
  word-break: keep-all;
  overflow-wrap: anywhere;
}

/* Ghosts */
.hc-ghost {
  visibility: hidden;
  pointer-events: none;
}

/* =======================
   Flechas (más agradables)
   ======================= */
.hc-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);

  width: 44px;
  height: 44px;
  border-radius: 999px;

  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.14);

  cursor: pointer;
  display: grid;
  place-items: center;
  z-index: 15;

  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.hc-arrow.left {
  left: -16px;
}
.hc-arrow.right {
  right: -16px;
}

.hc-arrow-ico {
  font-size: 24px;
  line-height: 1;
  color: #2d6cdf;
  font-weight: 900;
  transform: translateY(-1px);
}

@media (hover: hover) and (pointer: fine) {
  .hc-arrow:hover {
    transform: translateY(-50%) scale(1.05);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
    background: #ffffff;
  }
}

/* =======================
   Breakpoints
   ======================= */
@media (max-width: 1200px) {
  .hc-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    --hc-rows: 4;
  }
}

/* =======================
   Mobile (2 columnas, texto NO se corta, icons grandes)
   ======================= */
@media (max-width: 960px) {
  .hc-head {
    padding: 12px 12px 8px;
    gap: 8px;
  }

  .hc-title {
    font-size: 15px;
  }

  .hc-link {
    font-size: 12px;
  }

  .hc-body {
    padding: 10px 12px 12px;
  }

  .hc-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;

    --hc-gap: 12px;
    --hc-item-h: 84px; /* ✅ más alto en mobile */
    --hc-rows: 6;

    min-height: calc(
      (var(--hc-rows) * var(--hc-item-h)) +
      ((var(--hc-rows) - 1) * var(--hc-gap))
    );
  }

  .hc-item {
    grid-template-columns: 88px 1fr; /* ✅ más ancho para icon */
    border-radius: 14px;
  }

  .hc-img {
    width: 88px;
  }

  .hc-img-img {
    width: 68px; /* ✅ GRANDE en mobile también */
    height: 68px;
  }

  .hc-name {
    font-size: 13px;
    font-weight: 900;
    line-height: 1.10;

    /* ✅ mobile: permitir partir si hace falta (no comerse letras) */
    word-break: break-word;
    overflow-wrap: anywhere;

    -webkit-line-clamp: 2;
  }

  /* ✅ flechas visibles en mobile (más chicas para no molestar) */
  .hc-arrow {
    width: 40px;
    height: 40px;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.14);
  }

  .hc-arrow.left {
    left: -12px;
  }
  .hc-arrow.right {
    right: -12px;
  }

  .hc-arrow-ico {
    font-size: 22px;
  }
}

/* =======================
   Celus chicos: 1 columna (evita que se “coman”)
   ======================= */
@media (max-width: 420px) {
  .hc-grid {
    grid-template-columns: 1fr;
    gap: 10px;
    --hc-gap: 10px;
    --hc-item-h: 86px;
    min-height: auto;
  }

  .hc-item {
    grid-template-columns: 92px 1fr;
  }

  .hc-img {
    width: 92px;
  }

  .hc-img-img {
    width: 70px;
    height: 70px;
  }

  .hc-arrow {
    width: 38px;
    height: 38px;
  }

  .hc-arrow.left {
    left: -10px;
  }
  .hc-arrow.right {
    right: -10px;
  }

  .hc-arrow-ico {
    font-size: 21px;
  }
}
</style>
