<!-- src/modules/shop/components/HomeCategoriesCarousel.vue -->
<template>
  <section v-if="pages.length" class="hc-shell">
    <div class="hc-card">
      <!-- Header -->
      <div class="hc-head">
        <div class="hc-title">Categorías</div>

        <button class="hc-link" type="button" @click="goAll">
          Mostrar todas
        </button>

        <div class="hc-dots" v-if="pages.length > 1">
          <span
            v-for="i in pages.length"
            :key="i"
            class="hc-dot"
            :class="{ active: i - 1 === idx }"
          />
        </div>
      </div>

      <!-- Body -->
      <div class="hc-body">
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

        <!-- ✅ grilla con altura estable (ghosts si faltan) -->
        <div class="hc-grid">
          <template v-for="c in currentPagePadded" :key="c.__empty ? c.__key : c.id">
            <div v-if="c.__empty" class="hc-item hc-ghost" aria-hidden="true"></div>

            <button
              v-else
              class="hc-item"
              type="button"
              @click="openCategory(c)"
              :title="c.name"
            >
              <div class="hc-img">
                <img class="hc-img-img" :src="imgOf(c)" alt="" />
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

const featuredExact = {
  accesorios: "https://storage-files.cingulado.org/pos360/products/155/1767484866792-95f1028d.jpeg",
  audio: "https://storage-files.cingulado.org/pos360/products/9/1766776617403-88e61e3c.jpeg",
  automovil: "https://storage-files.cingulado.org/pos360/products/26/1766785541747-b2be56a0.jpg",
  automóvil: "https://storage-files.cingulado.org/pos360/products/26/1766785541747-b2be56a0.jpg",
  automotor: "https://storage-files.cingulado.org/pos360/products/26/1766785541747-b2be56a0.jpg",
  cableado: "https://storage-files.cingulado.org/pos360/products/148/1767214103600-aa3aae94.jpeg",
  energia: "https://storage-files.cingulado.org/pos360/products/31/1766787357298-e544ac0c.jpg",
  energía: "https://storage-files.cingulado.org/pos360/products/31/1766787357298-e544ac0c.jpg",
  entretenimiento: "https://storage-files.cingulado.org/pos360/products/130/1767207058363-c86a52e6.jpeg",
  hogar: "https://storage-files.cingulado.org/pos360/products/68/1766793570645-acbcae20.jpg",
  telefonia: "https://storage-files.cingulado.org/pos360/products/18/1766781457528-1cdca3a8.jpg",
  telefonía: "https://storage-files.cingulado.org/pos360/products/18/1766781457528-1cdca3a8.jpg",
};

const tvImg = "https://storage-files.cingulado.org/pos360/products/27/1766786134590-eacfb231.jpeg";

const stockByKey = [
  {
    match: (k) => k.includes("tv") || k.includes("televisor") || k.includes("televis"),
    img: tvImg,
  },
  {
    match: (k) =>
      k.includes("salud") || k.includes("belleza") || k.includes("cuidado") || k.includes("personal"),
    img: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=256&q=70",
  },
  {
    match: (k) => k.includes("ilumin") || k.includes("lampara") || k.includes("led") || k.includes("luz"),
    img: "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=256&q=70",
  },
  {
    match: (k) =>
      k.includes("informat") ||
      k.includes("comput") ||
      k.includes("pc") ||
      k.includes("notebook") ||
      k.includes("laptop"),
    img: "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&w=256&q=70",
  },
  {
    match: (k) => k.includes("camara") || k.includes("camaras") || k.includes("cctv") || k.includes("seguridad"),
    img: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=256&q=70",
  },
  {
    match: (k) => k.includes("telefono") || k.includes("celular") || k.includes("smart"),
    img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=256&q=70",
  },
];

const genericStock = [
  "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=256&q=70",
  "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=256&q=70",
  "https://images.unsplash.com/photo-1518441902117-f0a6a0e0f6f5?auto=format&fit=crop&w=256&q=70",
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=256&q=70",
];

function imgOf(c) {
  const key = norm(c?.name);

  if (featuredExact[key]) return featuredExact[key];

  const raw = c?.image_url || c?.icon_url || c?.img || c?.image || c?.url || c?.src || "";
  if (raw) return raw;

  for (const rule of stockByKey) {
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
.hc-shell {
  width: 100%;
}
.hc-card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

/* Header compacto */
.hc-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 12px 6px;
  position: relative;
}
.hc-title {
  font-size: 14px;
  font-weight: 900;
  letter-spacing: -0.2px;
}
.hc-link {
  border: 0;
  background: transparent;
  cursor: pointer;
  color: #2d6cdf;
  font-weight: 900;
  font-size: 11px;
  padding: 0;
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
  background: rgba(0, 0, 0, 0.16);
}
.hc-dot.active {
  background: #2d6cdf;
}

.hc-body {
  position: relative;
  padding: 8px 12px 12px;
}

/* ✅ Grilla estable */
.hc-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;

  --hc-gap: 10px;
  --hc-item-h: 78px;
  --hc-rows: 3;
  min-height: calc((var(--hc-rows) * var(--hc-item-h)) + ((var(--hc-rows) - 1) * var(--hc-gap)));
}

.hc-item {
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #fff;
  border-radius: 12px;
  padding: 0;
  display: grid;

  /* ✅ más espacio para texto */
  grid-template-columns: 52px 1fr;

  align-items: center;
  gap: 8px;
  height: var(--hc-item-h);
  text-align: left;
  cursor: pointer;
  transition: box-shadow 0.12s ease, transform 0.12s ease, border-color 0.12s ease;
}

@media (hover: hover) and (pointer: fine) {
  .hc-item:hover {
    border-color: rgba(0, 0, 0, 0.12);
    box-shadow: 0 10px 22px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
  }
}

.hc-img {
  width: 52px;
  height: var(--hc-item-h);
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
  background: #fafafa;
}
.hc-img-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.hc-name {
  /* ✅ MUCHO más chico */
  font-size: 10px;
  font-weight: 1000;
  line-height: 1.06;

  padding-right: 8px;

  /* ✅ permitir hasta 3 líneas para que NO se “coma” */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;

  /* ✅ no cortar palabras raras */
  word-break: normal;
  overflow-wrap: anywhere;
  hyphens: auto;

  text-transform: uppercase;
  letter-spacing: 0.2px;
}

.hc-ghost {
  visibility: hidden;
  pointer-events: none;
}

/* Flechas */
.hc-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 42px;
  height: 42px;
  border-radius: 999px;
  border: 0;
  background: #fff;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  display: grid;
  place-items: center;
  z-index: 5;
}
.hc-arrow.left {
  left: -14px;
}
.hc-arrow.right {
  right: -14px;
}
.hc-arrow-ico {
  font-size: 26px;
  line-height: 1;
  color: #2d6cdf;
  font-weight: 900;
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

/* ✅ MOBILE */
@media (max-width: 960px) {
  .hc-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;

    --hc-gap: 10px;
    --hc-item-h: 64px;
    --hc-rows: 6;
  }

  .hc-item {
    grid-template-columns: 46px 1fr;
    gap: 8px;
    border-radius: 14px;
  }

  .hc-img {
    width: 46px;
  }

  .hc-name {
    font-size: 9.6px;
    line-height: 1.05;
    -webkit-line-clamp: 3;
    letter-spacing: 0.15px;
  }
}

/* ✅ CELUS CHICOS */
@media (max-width: 420px) {
  .hc-grid {
    gap: 9px;
    --hc-gap: 9px;
    --hc-item-h: 60px;
  }

  .hc-item {
    grid-template-columns: 44px 1fr;
    gap: 7px;
  }

  .hc-img {
    width: 44px;
  }

  .hc-name {
    font-size: 9.2px;
    -webkit-line-clamp: 3;
  }
}
</style>
