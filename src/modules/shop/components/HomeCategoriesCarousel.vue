<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/HomeCategoriesCarousel.vue -->
<template>
  <section v-if="pages.length" class="hc-shell">
    <div class="hc-card">
      <!-- Header -->
      <div class="hc-head">
        <div class="hc-title">Buscá por categoría</div>

        <div
          class="hc-dots"
          v-if="pages.length > 1"
          aria-label="Paginación de categorías"
        >
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

        <!-- ✅ Grid (SIN ghosts) -->
        <div class="hc-grid" role="list">
          <button
            v-for="c in currentPage"
            :key="c.id"
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
  perPage: { type: Number, default: 12 }, // desktop default 4x3
});

const router = useRouter();
const idx = ref(0);

// ✅ cache-bust suave para refrescar PNGs
const ICON_VER = "2026-01-21-04";

function withVer(url) {
  if (!url) return url;
  return url.includes("?")
    ? `${url}&v=${encodeURIComponent(ICON_VER)}`
    : `${url}?v=${encodeURIComponent(ICON_VER)}`;
}

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

/**
 * ✅ ICONOS OFICIALES (SJT)
 */
const ICONS = [
  { match: (k) => k.includes("accesor"), img: withVer("https://storage-files.cingulado.org/pos360/media/1768968306314-b418ee86fec0.png") },
  { match: (k) => k.includes("audio"), img: withVer("https://storage-files.cingulado.org/pos360/media/1768968316038-54128c09d744.png") },
  { match: (k) => k.includes("automot") || k.includes("automo") || k.includes("auto"), img: withVer("https://storage-files.cingulado.org/pos360/media/1768968321444-f9feaf72b2a6.png") },
  { match: (k) => k.includes("cable"), img: withVer("https://storage-files.cingulado.org/pos360/media/1768968324835-48e6572f21ab.png") },
  { match: (k) => k.includes("computacion") || k.includes("computac") || k.includes("comput"), img: withVer("https://storage-files.cingulado.org/pos360/media/1768968328262-7f61417d370f.png") },
  { match: (k) => k.includes("energia") || k.includes("energ"), img: withVer("https://storage-files.cingulado.org/pos360/media/1768968334049-6affec6a83ca.png") },
  { match: (k) => k.includes("entreten"), img: withVer("https://storage-files.cingulado.org/pos360/media/1768968339902-02a488c66115.png") },
  { match: (k) => k.includes("electro") || k.includes("hogar") || k.includes("aire") || k.includes("aires"), img: withVer("https://storage-files.cingulado.org/pos360/media/1768968347659-a7a8fa9d2fd6.png") },
  { match: (k) => k.includes("ilumin") || k.includes("luz") || k.includes("lampara") || k.includes("led"), img: withVer("https://storage-files.cingulado.org/pos360/media/1768968352957-d12f2236aaff.png") },
  { match: (k) => k.includes("informat"), img: withVer("https://storage-files.cingulado.org/pos360/media/1768968357748-5045d55d6e3b.png") },
  { match: (k) => k.includes("salud") || k.includes("belleza") || k.includes("cuidado") || k.includes("personal"), img: withVer("https://storage-files.cingulado.org/pos360/media/1768968362467-59bc2286dbd2.png") },
  { match: (k) => k.includes("seguridad") || k.includes("cctv") || k.includes("camara"), img: withVer("https://storage-files.cingulado.org/pos360/media/1768968366335-4e3a5a9ffe58.png") },
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

  const raw = c?.image_url || c?.icon_url || c?.img || c?.image || c?.url || c?.src || "";
  if (raw) return withVer(raw);

  for (const rule of ICONS) {
    try {
      if (rule.match(key)) return rule.img;
    } catch {}
  }

  const id = Number(c?.id || 0);
  return genericStock[Math.abs(id) % genericStock.length];
}

const roots = computed(() => {
  const arr = Array.isArray(props.categories) ? props.categories : [];
  const onlyRoots = arr.filter(isRootCategory);
  return onlyRoots.length ? onlyRoots : arr;
});

// ✅ MOBILE: 3x3 (9 por página). Desktop: props.perPage (12 default).
const perPageEffective = computed(() => {
  if (typeof window !== "undefined") {
    const w = window.innerWidth || 1200;
    if (w <= 960) return 9;
  }
  return Math.max(1, Number(props.perPage || 12));
});

const pages = computed(() => {
  const out = [];
  const arr = roots.value || [];
  const n = perPageEffective.value;
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
});

const currentPage = computed(() => pages.value[idx.value] || []);

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
</script>

<style scoped>
/* =======================
   CONTENEDOR GENERAL
   ======================= */
.hc-shell {
  width: 100%;
  overflow: visible;
}
.hc-card {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: visible;
}

/* =======================
   HEADER (sin botón)
   ======================= */
.hc-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px 10px;
}
.hc-title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.2px;
}

/* dots a la derecha */
.hc-dots {
  margin-left: auto;
  display: inline-flex;
  gap: 6px;
  align-items: center;
  flex-shrink: 0;
}
.hc-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.22);
}
.hc-dot.active {
  background: #2d6cdf;
}

/* =======================
   BODY
   ======================= */
.hc-body {
  position: relative;
  padding: 10px 16px 16px;
}

/* =======================
   ✅ GRID: ALTURA FIJA PARA QUE NO "SALTE"
   - Desktop: 4 columnas x 3 filas = 3*82 + 2*14 = 274px
   - Mobile: 3 columnas x 3 filas = 3*104 + 2*10 = 332px
   ======================= */
.hc-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;

  /* ✅ evita el achique cuando la página tiene menos items */
  min-height: 274px;
  align-content: start;
}

/* =======================
   ITEM DESKTOP
   ======================= */
.hc-item {
  border: 1px solid rgba(0, 0, 0, 0.10);
  background: #ffffff;
  border-radius: 12px;
  padding: 0;

  display: grid;
  grid-template-columns: 92px 1fr;
  align-items: center;

  height: 82px;
  cursor: pointer;
  overflow: hidden;

  transition: box-shadow 0.12s ease, transform 0.12s ease;
}
@media (hover: hover) and (pointer: fine) {
  .hc-item:hover {
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
  }
}

.hc-img {
  width: 92px;
  height: 82px;
  background: #f3f4f6;
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}
.hc-img-img {
  width: 70px;
  height: 70px;
  object-fit: contain;
}
.hc-name {
  padding: 0 12px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.15;
  color: rgba(0, 0, 0, 0.85);

  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* =======================
   FLECHAS
   ======================= */
.hc-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 999px;

  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.10);

  display: grid;
  place-items: center;
  cursor: pointer;
  z-index: 10;
}
.hc-arrow.left {
  left: -12px;
}
.hc-arrow.right {
  right: -12px;
}
.hc-arrow-ico {
  font-size: 20px;
  font-weight: 500;
  color: rgba(45, 108, 223, 0.9);
}

/* =======================
   BREAKPOINT TABLET
   ======================= */
@media (max-width: 1200px) {
  .hc-grid {
    grid-template-columns: repeat(3, 1fr);
    /* 3 col x 4 filas -> altura estable */
    min-height: calc((4 * 82px) + (3 * 14px));
  }
}

/* =======================
   ✅ MOBILE 3x3 (altura fija)
   ======================= */
@media (max-width: 960px) {
  .hc-head {
    padding: 10px 12px 8px;
    gap: 6px;
  }
  .hc-title {
    font-size: 14px;
    font-weight: 600;
  }

  .hc-dots {
    gap: 4px;
  }
  .hc-dot {
    width: 5px;
    height: 5px;
  }

  .hc-body {
    padding: 10px 12px 12px;
  }

  .hc-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;

    /* ✅ fija: 3 filas * 104 + 2 gaps * 10 = 332 */
    min-height: 332px;
    align-content: start;
  }

  .hc-item {
    grid-template-columns: 1fr;
    grid-template-rows: 68px 1fr;
    height: 104px;
    text-align: center;
  }

  .hc-img {
    width: 100%;
    height: 68px;
    border-right: 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }
  .hc-img-img {
    width: 50px;
    height: 50px;
  }

  .hc-name {
    padding: 5px 6px 6px;
    font-size: 10px;
    font-weight: 500;
    line-height: 1.05;
    color: rgba(0, 0, 0, 0.72);

    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;

    word-break: break-word;
    overflow-wrap: anywhere;
    hyphens: auto;
  }

  .hc-arrow {
    width: 36px;
    height: 36px;
  }
  .hc-arrow.left {
    left: -8px;
  }
  .hc-arrow.right {
    right: -8px;
  }
  .hc-arrow-ico {
    font-size: 18px;
  }
}

@media (max-width: 420px) {
  .hc-name {
    font-size: 9.5px;
  }
  .hc-img-img {
    width: 46px;
    height: 46px;
  }
  .hc-arrow {
    width: 34px;
    height: 34px;
  }
}
</style>
