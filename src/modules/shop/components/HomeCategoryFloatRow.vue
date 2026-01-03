<!-- src/modules/shop/components/HomeCategoryFloatRow.vue -->
<template>
  <div class="float-row">
    <div class="float-inner">
      <div class="cards-grid">
        <v-card
          v-for="c in cats"
          :key="c.id"
          class="ml-card"
          elevation="6"
          @click="go(c.id)"
        >
          <div class="ml-card-head">
            <div class="ml-card-title">{{ c.name }}</div>
          </div>

          <div class="ml-card-media">
            <img
              :src="imgFor(c)"
              :alt="c.name"
              @error="onImgError"
              loading="lazy"
            />
          </div>

          <div class="ml-card-body">
            <div class="ml-card-desc">
              Explorá subrubros y productos de {{ c.name }}.
            </div>

            <v-btn
              variant="tonal"
              color="primary"
              class="ml-card-btn"
              @click.stop="go(c.id)"
            >
              Ver productos
            </v-btn>
          </div>
        </v-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";

const props = defineProps({
  categories: { type: Array, default: () => [] }, // padres reales
  max: { type: Number, default: 6 }, // como ML
});

const router = useRouter();

const cats = computed(() => {
  const arr = Array.isArray(props.categories) ? props.categories : [];
  const parents = arr
    .filter((x) => x && (x.parent_id == null || x.parent_id === 0 || x.parent_id === "0"))
    .filter((x) => Number(x.is_active ?? 1) === 1)
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "es"));
  return parents.slice(0, Math.max(1, Number(props.max || 6)));
});

function go(id) {
  router.push({ name: "shopCategory", params: { id } });
}

const FALLBACK =
  "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1400&q=80";

const STOCK = {
  audio:
    "https://images.unsplash.com/photo-1518441984357-749f0f4a53b1?auto=format&fit=crop&w=1400&q=80",
  celulares:
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1400&q=80",
  cables:
    "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1400&q=80",
  gaming:
    "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=1400&q=80",
  hogar:
    "https://images.unsplash.com/photo-1582582429415-bc0c8b5bb85a?auto=format&fit=crop&w=1400&q=80",
  seguridad:
    "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1400&q=80",
  notebooks:
    "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1400&q=80",
  tv:
    "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=1400&q=80",
  wearables:
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1400&q=80",
  auto:
    "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=1400&q=80",
  energia:
    "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1400&q=80",
};

function imgFor(c) {
  const name = String(c?.name || "").toLowerCase();

  if (name.includes("audio") || name.includes("parl") || name.includes("auric")) return STOCK.audio;
  if (name.includes("cel") || name.includes("tel") || name.includes("smart")) return STOCK.celulares;
  if (name.includes("cable") || name.includes("carg") || name.includes("usb")) return STOCK.cables;
  if (name.includes("gaming") || name.includes("juego") || name.includes("consol")) return STOCK.gaming;
  if (name.includes("hogar") || name.includes("cocina") || name.includes("mueble")) return STOCK.hogar;
  if (name.includes("seg") || name.includes("cámara") || name.includes("camara") || name.includes("cctv")) return STOCK.seguridad;
  if (name.includes("notebook") || name.includes("laptop") || name.includes("pc")) return STOCK.notebooks;
  if (name.includes("tv") || name.includes("tele")) return STOCK.tv;
  if (name.includes("reloj") || name.includes("smartwatch") || name.includes("wear")) return STOCK.wearables;
  if (name.includes("auto") || name.includes("moto") || name.includes("autom")) return STOCK.auto;
  if (name.includes("energ") || name.includes("solar") || name.includes("bater")) return STOCK.energia;

  return FALLBACK;
}

function onImgError(e) {
  const el = e?.target;
  if (el && el.tagName === "IMG") el.src = FALLBACK;
}
</script>


<style scoped>
.float-row {
  width: 100%;
  display: flex;
  justify-content: center;
  pointer-events: none;
}
.float-inner {
  width: min(var(--shop-max, 1200px), calc(100% - 24px));
  margin: 0 auto;
  pointer-events: auto;
}

/* ✅ grid fijo, no slider */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
  align-items: stretch;
}

.ml-card {
  width: 100%;
  height: 320px;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid rgba(0,0,0,.08);
  background: #fff;
  display: flex;
  flex-direction: column;
}

/* ✅ header con altura fija y titulo que NO rompe */
.ml-card-head {
  padding: 12px 14px 10px;
  height: 48px;                 /* ✅ fijo */
  display: flex;
  align-items: center;
  font-weight: 1000;
  font-size: 18px;
}

.ml-card-title {
  width: 100%;
  text-transform: uppercase;

  /* ✅ NO romper layout */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* imagen */
.ml-card-media {
  height: 150px;
  background: #f2f2f2;
  border-top: 1px solid rgba(0,0,0,.06);
  border-bottom: 1px solid rgba(0,0,0,.06);
}
.ml-card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* body */
.ml-card-body {
  padding: 12px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  justify-content: space-between;
}

.ml-card-desc {
  font-size: 13px;
  color: rgba(0,0,0,.72);
  line-height: 1.25;

  /* ✅ clamp 2 líneas para no estirar */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ml-card-btn {
  font-weight: 1000;
  border-radius: 8px;
}

/* responsive */
@media (max-width: 1400px) {
  .cards-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }
}

@media (max-width: 1200px) {
  .cards-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}

@media (max-width: 960px) {
  .cards-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ml-card { height: 300px; }
  .ml-card-head { height: 46px; font-size: 17px; }
}

@media (max-width: 600px) {
  .ml-card-head { font-size: 16px; }
}
</style>

