<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/PromoBannerParlantes.vue -->
<template>
  <v-card
    class="pb-card"
    variant="flat"
    rounded="xl"
    role="button"
    tabindex="0"
    :title="title"
    @click="go"
    @keydown.enter.prevent="go"
    @keydown.space.prevent="go"
  >
    <div class="pb-grid">
      <!-- LEFT -->
      <div class="pb-left">
        <div class="pb-kicker">AUDIO</div>

        <div class="pb-title">
          PROMOCIÓN DE<br />
          PARLANTES
        </div>

        <div class="pb-sub">Descubrí parlantes y audio para tu setup.</div>

        <button class="pb-link" type="button" @click.stop="go">
          Ver ofertas
          <v-icon size="18" class="pb-link-ic">mdi-chevron-right</v-icon>
        </button>

        <!-- ✅ ya no dependemos de taxonomy -->
        <div class="pb-note">Ver ofertas</div>
      </div>

      <!-- RIGHT -->
      <div class="pb-right" aria-hidden="true">
        <img class="pb-img" :src="imgSrc" alt="Promoción Parlantes" loading="lazy" @error="onImgError" />
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const title = "Promoción de Parlantes";

/** ✅ Tu imagen (principal) */
const PRIMARY_IMG = "https://storage-files.cingulado.org/pos360/products/14/1766778670423-5fba6ded.jpeg";

/** ✅ Fallback */
const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1518441984357-749f0f4a53b1?auto=format&fit=crop&w=1200&q=80";

const imgSrc = ref(PRIMARY_IMG);
function onImgError() {
  if (imgSrc.value !== FALLBACK_IMG) imgSrc.value = FALLBACK_IMG;
}

/**
 * ✅ Ultra-robusto: NO depende de IDs ni taxonomy
 * Te lleva a Home con búsqueda
 */
function go() {
  router.push({ name: "shopHome", query: { q: "parlantes" } });
}
</script>

<style scoped>
.pb-card {
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: #dceefe;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  user-select: none;
}

.pb-grid {
  display: grid;
  grid-template-columns: 1.25fr 0.95fr;
  align-items: center;
  gap: 10px;
  padding: 16px;
  min-height: 160px;
}

.pb-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pb-kicker {
  font-size: 10px;
  letter-spacing: 2px;
  opacity: 0.65;
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
  opacity: 0.75;
  max-width: 360px;
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
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.pb-link-ic {
  opacity: 0.9;
}

.pb-note {
  margin-top: 2px;
  font-size: 11px;
  opacity: 0.6;
}

.pb-right {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  min-width: 220px;
}

.pb-img {
  width: 100%;
  max-width: 320px;
  height: 130px;
  object-fit: cover;
  border-radius: 12px;
  display: block;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.08);
}

/* Desktop grande */
@media (min-width: 1200px) {
  .pb-grid {
    padding: 18px;
    min-height: 170px;
  }
  .pb-title {
    font-size: 24px;
  }
  .pb-img {
    max-width: 360px;
    height: 140px;
  }
}

/* Mobile */
@media (max-width: 600px) {
  .pb-grid {
    grid-template-columns: 1fr;
    gap: 10px;
    min-height: 0;
    padding: 14px;
  }

  .pb-title {
    font-size: 18px;
  }

  .pb-right {
    justify-content: center;
    min-width: 0;
  }

  .pb-img {
    max-width: 520px;
    width: 100%;
    height: 160px;
  }
}
</style>
