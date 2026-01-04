<!-- src/modules/shop/components/PromoBannerParlantes.vue -->
<template>
  <v-card class="pb-card" variant="flat" rounded="xl" @click="go" role="button" tabindex="0"
    @keydown.enter.prevent="go" @keydown.space.prevent="go" :title="title">
    <div class="pb-grid">
      <!-- LEFT -->
      <div class="pb-left">
        <div class="pb-kicker">AUDIO</div>

        <div class="pb-title">
          PROMOCIÓN DE<br />
          PARLANTES
        </div>

        <div class="pb-sub">
          Descubrí parlantes y audio para tu setup.
        </div>

        <button class="pb-link" type="button" @click.stop="go">
          Ver ofertas
        </button>
      </div>

      <!-- RIGHT -->
      <div class="pb-right" aria-hidden="true">
        <img class="pb-img" :src="img" alt="" loading="lazy" />
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

const title = "Promoción de Parlantes";

const img =
  "https://images.unsplash.com/photo-1518441984357-749f0f4a53b1?auto=format&fit=crop&w=1200&q=80"; // parlante/audio

function go() {
  // ✅ Audio / Parlantes
  // Asume que tu ShopCategory usa query "sub" (como tu ShopHeader.vue)
  // y que:
  // - parentId = categoría Audio
  // - subId = subcategoría Parlantes
  //
  // Cambiá estos IDs por los reales de tu DB:
  const AUDIO_CATEGORY_ID = 1;
  const PARLANTES_SUBCATEGORY_ID = 1;

  router.push({
    name: "shopCategory",
    params: { id: AUDIO_CATEGORY_ID },
    query: { sub: String(PARLANTES_SUBCATEGORY_ID) },
  });
}
</script>

<style scoped>
.pb-card {
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, .06);
  background: #dceefe;
  box-shadow: 0 10px 26px rgba(0, 0, 0, .08);
  overflow: hidden;
}

.pb-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  align-items: center;
  gap: 10px;
  padding: 16px 16px;
  min-height: 150px;
}

.pb-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pb-kicker {
  font-size: 10px;
  letter-spacing: 2px;
  opacity: .65;
  text-transform: uppercase;
  font-weight: 900;
}

.pb-title {
  font-weight: 1000;
  font-size: 22px;
  line-height: 1.05;
  letter-spacing: -0.3px;
  color: #111;
}

.pb-sub {
  font-size: 12px;
  opacity: .75;
  max-width: 320px;
}

.pb-link {
  margin-top: 2px;
  align-self: flex-start;
  border: 0;
  background: transparent;
  padding: 0;
  color: #0b57d0;
  font-weight: 900;
  cursor: pointer;
}

.pb-right {
  display: flex;
  justify-content: flex-end;
}

.pb-img {
  width: 100%;
  max-width: 260px;
  height: 120px;
  object-fit: contain;
  filter: drop-shadow(0 12px 20px rgba(0, 0, 0, .12));
}

/* Mobile */
@media (max-width: 600px) {
  .pb-grid {
    grid-template-columns: 1fr;
    gap: 8px;
    min-height: 0;
    padding: 14px;
  }

  .pb-title {
    font-size: 18px;
  }

  .pb-right {
    justify-content: center;
  }

  .pb-img {
    max-width: 320px;
    height: 140px;
  }
}
</style>
