<!-- src/modules/shop/components/HeroSlider.vue -->
<template>
  <div class="hero">
    <v-window v-model="idx" class="hero-window" :show-arrows="true" :touch="true">
      <v-window-item v-for="(s, i) in slidesSafe" :key="i">
        <div class="hero-slide" @click="emitClick(s)">
          <!-- background image -->
          <img class="hero-bg" :src="s.image" :alt="s.title || 'slide'" />

          <!-- overlay gradient -->
          <div class="hero-overlay" />

          <!-- content -->
          <div class="hero-content">
            <div class="hero-pill" v-if="s.pill">{{ s.pill }}</div>

            <h1 class="hero-title">
              {{ s.title || "" }}
            </h1>

            <p class="hero-subtitle" v-if="s.subtitle">
              {{ s.subtitle }}
            </p>

            <div class="hero-actions">
              <v-btn color="primary" class="hero-btn" @click.stop="goShop">
                Ver más
              </v-btn>

              <v-btn variant="tonal" class="hero-btn2" @click.stop="goShop">
                Ir al catálogo
              </v-btn>
            </div>
          </div>
        </div>
      </v-window-item>
    </v-window>

    <!-- dots -->
    <div class="hero-dots" v-if="slidesSafe.length > 1">
      <button
        v-for="(s, i) in slidesSafe"
        :key="i"
        class="dot"
        :class="{ active: idx === i }"
        @click="idx = i"
        aria-label="slide"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  slides: { type: Array, default: () => [] },
});

const emit = defineEmits(["goShop", "clickSlide"]);

const slidesSafe = computed(() => (Array.isArray(props.slides) ? props.slides : []).filter(Boolean));
const idx = ref(0);

watch(
  () => slidesSafe.value.length,
  (n) => {
    if (idx.value >= n) idx.value = 0;
  }
);

function goShop() {
  emit("goShop");
}

function emitClick(slide) {
  emit("clickSlide", slide);
}
</script>

<style scoped>
/* ✅ hero full width + más alto */
.hero {
  width: 100%;
  position: relative;
}

/* IMPORTANTE: el v-window debe dejar ver los bordes redondeados */
.hero-window {
  border-radius: 22px;
  overflow: hidden;
}

/* ✅ altura grande (desktop) y responsive (mobile) */
.hero-slide {
  position: relative;
  width: 100%;
  height: 520px;              /* ✅ MÁS ALTO */
  border-radius: 22px;
  cursor: pointer;
}

.hero-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;          /* ✅ cobertura total */
  object-position: center;    /* ✅ centrado */
  transform: scale(1.02);     /* ✅ micro-zoom para evitar bordes */
}

/* overlay para legibilidad */
.hero-overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(1200px 520px at 20% 55%, rgba(0,0,0,.65) 0%, rgba(0,0,0,.20) 55%, rgba(0,0,0,.10) 100%),
    linear-gradient(90deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,.20) 50%, rgba(0,0,0,.05) 100%);
}

/* contenido */
.hero-content {
  position: absolute;
  left: 56px;
  top: 50%;
  transform: translateY(-50%);
  max-width: 720px;
  color: #fff;
  padding-right: 18px;
}

.hero-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255,255,255,.14);
  border: 1px solid rgba(255,255,255,.20);
  font-weight: 900;
  letter-spacing: .6px;
  margin-bottom: 14px;
  text-transform: uppercase;
  font-size: 12px;
}

.hero-title {
  font-size: 56px;            /* ✅ más aire */
  line-height: 1.02;
  font-weight: 1000;
  margin: 0 0 10px 0;
  text-shadow: 0 10px 30px rgba(0,0,0,.35);
}

.hero-subtitle {
  margin: 0 0 18px 0;
  font-size: 16px;
  line-height: 1.4;
  opacity: 0.95;
  max-width: 620px;
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.hero-btn {
  font-weight: 1000;
  border-radius: 10px;
  padding-inline: 18px;
}
.hero-btn2 {
  font-weight: 1000;
  border-radius: 10px;
  padding-inline: 18px;
}

/* dots */
.hero-dots {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 10px;
  display: flex;
  justify-content: center;
  gap: 8px;
  z-index: 5;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  border: 0;
  cursor: pointer;
  background: rgba(255,255,255,.35);
}
.dot.active {
  background: rgba(255,255,255,.95);
  width: 18px;
}

/* ✅ responsive */
@media (max-width: 1260px) {
  .hero-slide { height: 480px; }
  .hero-title { font-size: 48px; }
  .hero-content { left: 28px; max-width: 640px; }
}

@media (max-width: 960px) {
  .hero-slide { height: 420px; }
  .hero-title { font-size: 38px; }
  .hero-content {
    left: 18px;
    right: 18px;
    max-width: none;
  }
}

@media (max-width: 600px) {
  .hero-slide { height: 360px; }
  .hero-title { font-size: 30px; }
  .hero-subtitle { font-size: 14px; }
}
</style>
