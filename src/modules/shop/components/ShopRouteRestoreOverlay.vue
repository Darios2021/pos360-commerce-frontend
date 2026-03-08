<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/ShopRouteRestoreOverlay.vue -->
<template>
  <transition name="route-restore-fade">
    <div v-if="modelValue" class="route-restore-mask" aria-hidden="true">
      <div class="route-restore-shell">
        <div class="route-restore-topbar">
          <span class="route-restore-shimmer"></span>
        </div>

        <div class="route-restore-schema">
          <div class="schema-header">
            <span class="schema-pill w-18"></span>
            <span class="schema-pill w-28"></span>
            <span class="schema-pill w-14"></span>
          </div>

          <div class="schema-hero"></div>

          <div class="schema-grid">
            <div v-for="n in 8" :key="n" class="schema-card">
              <div class="schema-thumb"></div>
              <div class="schema-line w-80"></div>
              <div class="schema-line w-55"></div>
              <div class="schema-line w-35"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped>
.route-restore-mask {
  position: fixed;
  inset: 0;
  z-index: 4000;
  background: rgba(255, 255, 255, 0.94);
  pointer-events: all;
}

.route-restore-shell {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.route-restore-topbar {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: rgba(52, 131, 250, 0.1);
  overflow: hidden;
}

.route-restore-shimmer {
  display: block;
  width: 28%;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(52, 131, 250, 0) 0%,
    rgba(52, 131, 250, 0.65) 50%,
    rgba(52, 131, 250, 0) 100%
  );
  animation: routeRestoreSlide 0.95s ease-in-out infinite;
}

.route-restore-schema {
  width: min(1320px, calc(100% - 32px));
  margin: 18px auto 0;
  opacity: 0.92;
}

.schema-header {
  display: grid;
  grid-template-columns: 180px 1fr 120px;
  gap: 14px;
  align-items: center;
  margin-bottom: 18px;
}

.schema-pill,
.schema-hero,
.schema-thumb,
.schema-line {
  position: relative;
  overflow: hidden;
  background: #edf2f7;
}

.schema-pill::after,
.schema-hero::after,
.schema-thumb::after,
.schema-line::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.72) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  animation: schemaSweep 1.25s ease-in-out infinite;
}

.schema-pill {
  height: 16px;
  border-radius: 999px;
}

.schema-hero {
  height: 260px;
  border-radius: 24px;
  margin-bottom: 22px;
}

.schema-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.schema-card {
  border-radius: 22px;
  background: #f8fafc;
  padding: 12px;
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.03);
}

.schema-thumb {
  height: 170px;
  border-radius: 18px;
  margin-bottom: 12px;
}

.schema-line {
  height: 12px;
  border-radius: 999px;
  margin-top: 10px;
}

.w-80 { width: 80%; }
.w-55 { width: 55%; }
.w-35 { width: 35%; }
.w-18 { width: 18%; }
.w-28 { width: 28%; }
.w-14 { width: 14%; }

.route-restore-fade-enter-active,
.route-restore-fade-leave-active {
  transition: opacity 0.18s ease;
}

.route-restore-fade-enter-from,
.route-restore-fade-leave-to {
  opacity: 0;
}

@keyframes routeRestoreSlide {
  0% { transform: translateX(-120%); }
  100% { transform: translateX(430%); }
}

@keyframes schemaSweep {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(130%); }
}

@media (max-width: 1100px) {
  .schema-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .schema-hero {
    height: 220px;
  }
}

@media (max-width: 760px) {
  .route-restore-topbar {
    height: 2.5px;
  }

  .route-restore-shimmer {
    width: 36%;
  }

  .route-restore-schema {
    width: calc(100% - 20px);
    margin-top: 12px;
  }

  .schema-header {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 14px;
  }

  .schema-header .schema-pill:last-child {
    display: none;
  }

  .schema-hero {
    height: 148px;
    border-radius: 18px;
    margin-bottom: 16px;
  }

  .schema-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .schema-card {
    border-radius: 18px;
    padding: 10px;
  }

  .schema-thumb {
    height: 118px;
    border-radius: 14px;
    margin-bottom: 10px;
  }

  .schema-line {
    height: 10px;
    margin-top: 8px;
  }
}
</style>