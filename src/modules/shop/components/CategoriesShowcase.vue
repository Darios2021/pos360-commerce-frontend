<!-- src/modules/shop/components/CategoriesShowcase.vue -->
<template>
  <section class="cat-shell">
    <div class="cat-inner">
      <!-- Header -->
      <div class="cat-head">
        <div class="cat-left">
          <div class="cat-title">Categorías</div>

          <button class="cat-link" type="button" @click="$emit('seeAll')">
            Mostrar todas las categorías
          </button>
        </div>

        <div class="cat-dots" v-if="dotsCount > 1">
          <button
            v-for="i in dotsCount"
            :key="i"
            class="dot"
            :class="{ active: i - 1 === dotIndex }"
            type="button"
            @click="jumpTo(i - 1)"
            aria-label="Ir a página"
          />
        </div>
      </div>

      <v-divider class="cat-divider" />

      <!-- Slider -->
      <div class="cat-body">
        <v-slide-group v-model="model" show-arrows class="cat-slide">
          <v-slide-group-item v-for="c in items" :key="c.id">
            <button class="tile" type="button" @click="open(c)" :title="c.name">
              <v-avatar class="tile-ava" size="44" rounded="lg">
                <v-icon size="22">{{ iconFor(c) }}</v-icon>
              </v-avatar>

              <div class="tile-name">
                {{ c.name }}
              </div>

              <v-spacer />

              <v-icon class="tile-arrow" size="18">mdi-chevron-right</v-icon>
            </button>
          </v-slide-group-item>
        </v-slide-group>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useRouter } from "vue-router";

const props = defineProps({
  items: { type: Array, default: () => [] }, // padres
  perPage: { type: Number, default: 6 }, // aprox desktop
});
defineEmits(["seeAll"]);

const router = useRouter();
const model = ref(0);

function open(c) {
  router.push({ name: "shopCategory", params: { id: c.id } });
}

// ✅ iconos por “tipo” (sin depender de imágenes externas)
function iconFor(c) {
  const name = String(c?.name || "").toLowerCase();

  if (/(audio|auricul|parlant)/.test(name)) return "mdi-headphones";
  if (/(celu|tel[eé]fono|smartphone)/.test(name)) return "mdi-cellphone";
  if (/(comput|pc|notebook|laptop)/.test(name)) return "mdi-laptop";
  if (/(cable|cargad|usb)/.test(name)) return "mdi-usb";
  if (/(auto|moto|autom)/.test(name)) return "mdi-car";
  if (/(energ|solar)/.test(name)) return "mdi-solar-power";
  if (/(electro|electr[oó]n)/.test(name)) return "mdi-chip";
  if (/(hogar|casa|mueble)/.test(name)) return "mdi-sofa";
  if (/(herra|tool)/.test(name)) return "mdi-tools";

  return "mdi-storefront-outline";
}

/** Puntitos => páginas */
const dotIndex = computed(() => {
  const idx = Number(model.value ?? 0);
  return Math.max(0, Math.floor(idx / props.perPage));
});

const dotsCount = computed(() => {
  const n = (props.items || []).length;
  if (!n) return 0;
  return Math.max(1, Math.ceil(n / props.perPage));
});

function jumpTo(pageIdx) {
  model.value = pageIdx * props.perPage;
}

watch(
  () => props.items,
  () => {
    model.value = 0;
  }
);
</script>

<style scoped>
.cat-shell {
  width: 100%;
}

.cat-inner {
  background: #fff;
  border-radius: 18px;
  border: 1px solid rgba(0,0,0,.06);
  box-shadow: 0 10px 28px rgba(0,0,0,.06);
  overflow: hidden;
}

.cat-head {
  padding: 16px 18px 14px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.cat-left {
  display: flex;
  align-items: baseline;
  gap: 14px;
  flex-wrap: wrap;
}

.cat-title {
  font-size: 16px;
  font-weight: 950;
  letter-spacing: -0.2px;
}

.cat-link {
  border: 0;
  background: transparent;
  color: #1a73e8;
  font-weight: 900;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
}
.cat-link:hover { text-decoration: underline; }

.cat-divider { opacity: 0.65; }

.cat-body { padding: 10px 10px 12px; }

.cat-slide :deep(.v-slide-group__content) {
  gap: 12px;
  padding: 10px 6px 12px;
}

.cat-slide :deep(.v-slide-group__prev .v-btn),
.cat-slide :deep(.v-slide-group__next .v-btn) {
  background: rgba(255,255,255,.92);
  border: 1px solid rgba(0,0,0,.10);
  box-shadow: 0 10px 26px rgba(0,0,0,.10);
}

.tile {
  width: 240px;
  height: 72px;
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
  border: 1px solid rgba(0,0,0,.06);
  box-shadow: 0 6px 16px rgba(0,0,0,.05);
  cursor: pointer;
  text-align: left;
  padding: 12px 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: transform .14s ease, box-shadow .14s ease, border-color .14s ease;
}

.tile:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 34px rgba(0,0,0,.10);
  border-color: rgba(0,0,0,.10);
}

.tile-ava {
  background: rgba(0,0,0,.04);
  border: 1px solid rgba(0,0,0,.06);
}

.tile-name {
  font-weight: 900;
  font-size: 13px;
  line-height: 1.15;
  max-width: 150px;

  /* ✅ NO rompe por títulos largos */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.tile-arrow { opacity: 0.55; }

.cat-dots {
  display: flex;
  gap: 8px;
  align-items: center;
  padding-top: 2px;
}
.dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  border: 0;
  background: rgba(0,0,0,.16);
  cursor: pointer;
  transition: transform .12s ease, background .12s ease;
}
.dot:hover { transform: scale(1.15); }
.dot.active { background: rgba(0,0,0,.55); }

@media (max-width: 960px) {
  .cat-head { padding: 14px 14px 12px; }
  .tile { width: 210px; height: 70px; }
  .tile-name { max-width: 130px; }
}
</style>
