<!-- src/modules/shop/components/CategoryCardsRow.vue -->
<template>
  <v-card class="rounded-xl row-wrap" variant="outlined">
    <v-card-text class="pa-0">
      <div class="row-head">
        <div>
          <div class="row-title">Explorá por categorías</div>
          <div class="row-sub">Elegí un rubro para ver subrubros y productos</div>
        </div>

        <v-btn variant="text" class="row-more" @click="$emit('seeAll')">
          Ver todas
          <v-icon end>mdi-chevron-right</v-icon>
        </v-btn>
      </div>

      <v-divider />

      <div class="row-body">
        <v-slide-group show-arrows class="cards-slide">
          <v-slide-group-item
            v-for="c in parents"
            :key="c.id"
          >
            <v-card class="cat-card" variant="flat" @click="go(c.id)">
              <div class="cat-top">
                <div class="cat-title">{{ c.name }}</div>
                <div class="cat-pill">Ver productos</div>
              </div>

              <div class="cat-img">
                <img :src="imgFor(c)" :alt="c.name" />
              </div>

              <div class="cat-footer">
                <v-icon size="18">mdi-chevron-right</v-icon>
              </div>
            </v-card>
          </v-slide-group-item>
        </v-slide-group>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";

const props = defineProps({
  categories: { type: Array, default: () => [] }, // viene de getPublicCategories()
});
defineEmits(["seeAll"]);

const router = useRouter();

const parents = computed(() => {
  const arr = Array.isArray(props.categories) ? props.categories : [];
  return arr
    .filter((x) => x && (x.parent_id == null || x.parent_id === 0 || x.parent_id === "0"))
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "es"));
});

function go(id) {
  router.push({ name: "shopCategory", params: { id } });
}

/**
 * ✅ Imágenes stock por keyword (Unsplash)
 * No dependemos del backend. Si después querés imágenes propias,
 * cambiamos este mapper para apuntar a tus assets/CDN.
 */
const STOCK = {
  default: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80",
  audio: "https://images.unsplash.com/photo-1518441984357-749f0f4a53b1?auto=format&fit=crop&w=1200&q=80",
  celulares: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80",
  cables: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1200&q=80",
  gaming: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=1200&q=80",
  hogar: "https://images.unsplash.com/photo-1582582429415-bc0c8b5bb85a?auto=format&fit=crop&w=1200&q=80",
  seguridad: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1200&q=80",
  notebooks: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
  tv: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=1200&q=80",
  wearables: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
};

function imgFor(c) {
  const name = String(c?.name || "").toLowerCase();

  // heurísticas simples por nombre
  if (name.includes("audio") || name.includes("parl") || name.includes("auric")) return STOCK.audio;
  if (name.includes("cel") || name.includes("tel") || name.includes("smart")) return STOCK.celulares;
  if (name.includes("cable") || name.includes("carg") || name.includes("usb")) return STOCK.cables;
  if (name.includes("gaming") || name.includes("juego") || name.includes("consol")) return STOCK.gaming;
  if (name.includes("hogar") || name.includes("cocina") || name.includes("mueble")) return STOCK.hogar;
  if (name.includes("seg") || name.includes("cámara") || name.includes("camara") || name.includes("cctv")) return STOCK.seguridad;
  if (name.includes("notebook") || name.includes("laptop") || name.includes("pc")) return STOCK.notebooks;
  if (name.includes("tv") || name.includes("tele")) return STOCK.tv;
  if (name.includes("reloj") || name.includes("smartwatch") || name.includes("wear")) return STOCK.wearables;

  return STOCK.default;
}
</script>

<style scoped>
.row-wrap {
  overflow: hidden;
  background: #fff;
  border: 1px solid rgba(0,0,0,.08);
}

.row-head {
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.row-title {
  font-size: 18px;
  font-weight: 1000;
}
.row-sub {
  font-size: 12px;
  opacity: .75;
}
.row-more { font-weight: 900; }

.row-body {
  padding: 12px 10px 10px;
}

.cards-slide :deep(.v-slide-group__content) {
  gap: 14px;
  padding: 6px 4px 10px;
}

/* Card estilo ML */
.cat-card {
  width: 260px;
  height: 210px;
  border-radius: 16px;
  border: 1px solid rgba(0,0,0,.08);
  overflow: hidden;
  cursor: pointer;
  transition: transform .12s ease, box-shadow .12s ease;
  background: #fff;
  display: flex;
  flex-direction: column;
}
.cat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(0,0,0,.08);
}

.cat-top {
  padding: 12px 12px 8px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.cat-title {
  font-weight: 1000;
  font-size: 15px;
  line-height: 1.1;
  max-width: 170px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.cat-pill {
  font-size: 11px;
  font-weight: 900;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(25,118,210,.10);
  color: rgba(25,118,210,1);
  white-space: nowrap;
}

.cat-img {
  flex: 1;
  background: #f4f4f4;
  position: relative;
}
.cat-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cat-footer {
  padding: 10px 12px;
  display: flex;
  justify-content: flex-end;
  opacity: .8;
}

/* responsive */
@media (max-width: 960px) {
  .cat-card { width: 230px; height: 200px; }
}
</style>
