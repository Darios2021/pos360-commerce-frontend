<!-- src/modules/shop/components/CategoryGrid.vue -->
<template>
  <v-card class="cat-wrap" variant="flat">
    <div class="cat-head">
      <div class="cat-title-row">
        <div class="cat-title">Categorías</div>

        <button class="cat-link" type="button" @click="goAll">
          Mostrar todas las categorías
        </button>
      </div>

      <div class="cat-right">
        <div class="cat-dots" v-if="pages > 1">
          <button
            v-for="i in pages"
            :key="i"
            class="dot"
            :class="{ active: i - 1 === page }"
            @click="page = i - 1"
            type="button"
            aria-label="Ir a página"
          />
        </div>
      </div>
    </div>

    <div class="cat-body">
      <!-- Grid -->
      <div class="cat-grid">
        <button
          v-for="c in pageItems"
          :key="c.id"
          class="cat-item"
          type="button"
          @click="openCategory(c)"
          :title="c.name"
        >
          <div class="cat-ico">
            <v-icon size="26">{{ iconFor(c) }}</v-icon>
          </div>

          <div class="cat-name">
            {{ c.name }}
          </div>
        </button>
      </div>

      <!-- Flecha a la derecha (como ML) -->
      <button
        v-if="pages > 1"
        class="cat-next"
        type="button"
        @click="next"
        aria-label="Siguiente"
        title="Siguiente"
      >
        <v-icon>mdi-chevron-right</v-icon>
      </button>

      <button
        v-if="pages > 1"
        class="cat-prev"
        type="button"
        @click="prev"
        aria-label="Anterior"
        title="Anterior"
      >
        <v-icon>mdi-chevron-left</v-icon>
      </button>
    </div>
  </v-card>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";

const props = defineProps({
  items: { type: Array, default: () => [] }, // categorías padre
  perPage: { type: Number, default: 12 }, // 4x3
  toAll: { type: [String, Object], default: () => ({ name: "shopHome" }) }, // o tu ruta /shop/categorias
});

const router = useRouter();
const page = ref(0);

const safeItems = computed(() => (Array.isArray(props.items) ? props.items : []));
const pages = computed(() => Math.max(1, Math.ceil(safeItems.value.length / props.perPage)));

const pageItems = computed(() => {
  const start = page.value * props.perPage;
  return safeItems.value.slice(start, start + props.perPage);
});

function next() {
  page.value = page.value + 1 >= pages.value ? 0 : page.value + 1;
}
function prev() {
  page.value = page.value - 1 < 0 ? pages.value - 1 : page.value - 1;
}

function openCategory(c) {
  router.push({ name: "shopCategory", params: { id: c.id } });
}

function goAll() {
  router.push(props.toAll);
}

/** Iconos “de stock” por nombre */
function iconFor(c) {
  const n = String(c?.name || "").toLowerCase();

  if (n.includes("auto") || n.includes("moto") || n.includes("veh")) return "mdi-car";
  if (n.includes("cel") || n.includes("tel")) return "mdi-cellphone";
  if (n.includes("herra")) return "mdi-tools";
  if (n.includes("electro") || n.includes("aire") || n.includes("clima")) return "mdi-air-conditioner";
  if (n.includes("hogar") || n.includes("mueble") || n.includes("jardin")) return "mdi-sofa";
  if (n.includes("compu") || n.includes("informat")) return "mdi-laptop";
  if (n.includes("audio") || n.includes("video") || n.includes("electr")) return "mdi-headphones";
  if (n.includes("deporte") || n.includes("fitness")) return "mdi-dumbbell";
  if (n.includes("belleza") || n.includes("cuidado")) return "mdi-spray-bottle";
  if (n.includes("ropa") || n.includes("indument")) return "mdi-tshirt-crew";
  if (n.includes("energia") || n.includes("solar")) return "mdi-solar-power";
  return "mdi-shape-outline";
}

watch(
  () => props.items,
  () => {
    page.value = 0;
  }
);
</script>

<style scoped>
.cat-wrap {
  border-radius: 18px;
  background: #fff;
  border: 1px solid rgba(0,0,0,.06);
  box-shadow: 0 10px 28px rgba(0,0,0,.06);
  overflow: hidden;
}

.cat-head {
  padding: 14px 16px 12px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.cat-title-row {
  display: flex;
  align-items: baseline;
  gap: 14px;
}

.cat-title {
  font-size: 16px;
  font-weight: 950;
  letter-spacing: -0.2px;
}

.cat-link {
  border: 0;
  background: transparent;
  cursor: pointer;
  color: #1a73e8;
  font-weight: 800;
  font-size: 12px;
  padding: 0;
}

.cat-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* dots arriba a la derecha (como ML) */
.cat-dots {
  display: flex;
  gap: 6px;
  align-items: center;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  border: 0;
  background: rgba(0,0,0,.16);
  cursor: pointer;
}
.dot.active {
  background: rgba(0,0,0,.55);
}

.cat-body {
  position: relative;
  padding: 10px 12px 14px;
}

.cat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

/* tile suave */
.cat-item {
  width: 100%;
  display: grid;
  grid-template-columns: 58px 1fr;
  align-items: center;
  gap: 10px;

  border-radius: 12px;
  border: 1px solid rgba(0,0,0,.06);
  background: #fff;

  padding: 10px 12px;
  cursor: pointer;

  box-shadow: 0 6px 16px rgba(0,0,0,.04);
  transition: transform .12s ease, box-shadow .12s ease, border-color .12s ease;
  text-align: left;
}

.cat-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 26px rgba(0,0,0,.08);
  border-color: rgba(0,0,0,.10);
}

.cat-ico {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: rgba(0,0,0,.03);
}

.cat-name {
  font-weight: 850;
  font-size: 13px;
  line-height: 1.15;

  /* evita que se “rompa” feo */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* flechas flotantes */
.cat-next,
.cat-prev {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  border: 0;
  cursor: pointer;

  width: 44px;
  height: 44px;
  border-radius: 999px;

  background: rgba(255,255,255,.92);
  border: 1px solid rgba(0,0,0,.10);
  box-shadow: 0 10px 26px rgba(0,0,0,.12);

  display: grid;
  place-items: center;
}

.cat-next { right: 10px; }
.cat-prev { left: 10px; }

@media (max-width: 1200px) {
  .cat-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 900px) {
  .cat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .cat-next, .cat-prev { display: none; }
}
</style>
