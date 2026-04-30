<!-- Bloque destacado de marcas: panel blanco con copy + panel azul con producto -->
<template>
  <section class="bhb" v-if="slides.length">
    <article
      v-for="(s, i) in slides"
      :key="i"
      class="bhb-card"
      @click="open(s)"
    >
      <!-- LADO IZQUIERDO: copy + CTA -->
      <div class="bhb-copy">
        <div v-if="s.kicker" class="bhb-kicker">{{ s.kicker }}</div>

        <h3 class="bhb-title">
          <template v-for="(line, idx) in titleLines(s.headline)" :key="idx">
            <span class="bhb-title-line">{{ line }}</span>
          </template>
        </h3>

        <p v-if="s.description" class="bhb-desc">{{ s.description }}</p>

        <button type="button" class="bhb-cta" @click.stop="open(s)">
          {{ s.cta || "Ver ofertas" }}
        </button>
      </div>

      <!-- LADO DERECHO: producto sobre fondo azul de marca -->
      <div class="bhb-media" :style="mediaStyle(s)">
        <div v-if="s.brandLogoUrl" class="bhb-logo-badge">
          <img :src="s.brandLogoUrl" :alt="s.brand || ''" loading="lazy" />
        </div>

        <img
          v-if="s.productImage"
          class="bhb-product"
          :src="s.productImage"
          :alt="s.productName || s.brand || ''"
          :style="productStyle(s)"
          loading="lazy"
        />
        <div v-else class="bhb-product-empty">{{ s.brand || "Producto" }}</div>
      </div>
    </article>
  </section>
</template>

<script setup>
import { useRouter } from "vue-router";

const props = defineProps({
  slides: { type: Array, default: () => [] },
});

const router = useRouter();

function titleLines(headline) {
  if (Array.isArray(headline)) return headline.filter(Boolean);
  const s = String(headline || "").trim();
  if (!s) return [];
  return s.split(/\n+/).filter(Boolean);
}

function mediaStyle(s) {
  return {
    background: s.mediaBg || "var(--bhb-blue, #0d47a1)",
  };
}

function productStyle(s) {
  const out = {};
  if (s.productMaxHeight) out.maxHeight = s.productMaxHeight;
  if (s.productMaxWidth) out.maxWidth = s.productMaxWidth;
  if (s.productScale) {
    out.transform = `translate(-50%, -50%) scale(${s.productScale})`;
  }
  return out;
}

function open(s) {
  if (!s) return;
  if (s.href) {
    if (typeof s.href === "string") {
      if (/^https?:/i.test(s.href)) {
        window.open(s.href, "_blank", "noopener");
        return;
      }
      router.push(s.href);
      return;
    }
    router.push(s.href);
    return;
  }
  if (s.brand) {
    router.push({
      name: "shopSearch",
      query: { brand: String(s.brand).trim() },
    });
  }
}
</script>

<style scoped>
.bhb {
  --bhb-blue: #0d47a1;
  --bhb-blue-deep: #08306b;
  --bhb-text: #1a2433;
  --bhb-muted: rgba(26, 36, 51, 0.62);
  --bhb-kicker: rgba(26, 36, 51, 0.5);

  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}

.bhb *,
.bhb :deep(*) {
  font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}

.bhb-card {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  isolation: isolate;
  min-height: 260px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}
.bhb-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 32px rgba(13, 71, 161, 0.18);
  border-color: rgba(13, 71, 161, 0.16);
}

/* lado izquierdo (copy) */
.bhb-copy {
  padding: 28px 28px 26px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  justify-content: center;
  min-width: 0;
}

.bhb-kicker {
  font-size: 11px;
  font-weight: 460;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--bhb-kicker);
}

.bhb-title {
  margin: 0;
  font-size: 26px;
  font-weight: 540;
  line-height: 1.12;
  letter-spacing: -0.01em;
  color: var(--bhb-text);
  display: flex;
  flex-direction: column;
  gap: 0;
}
.bhb-title-line {
  display: block;
}

.bhb-desc {
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  color: var(--bhb-muted);
  line-height: 1.45;
  max-width: 38ch;
}

.bhb-cta {
  align-self: flex-start;
  appearance: none;
  border: 0;
  background: var(--bhb-blue);
  color: #fff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 11px 22px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 480;
  letter-spacing: 0.005em;
  margin-top: 4px;
  transition: background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
}
.bhb-cta:hover {
  background: var(--bhb-blue-deep);
  box-shadow: 0 6px 14px rgba(13, 71, 161, 0.28);
  transform: translateY(-1px);
}

/* lado derecho (producto sobre fondo azul) */
.bhb-media {
  position: relative;
  padding: 22px;
  overflow: hidden;
  min-height: 260px;
}

.bhb-logo-badge {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 54px;
  height: 54px;
  background: #fff;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.16);
  z-index: 2;
}
.bhb-logo-badge img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
}

.bhb-product {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  max-width: 88%;
  max-height: 220px;
  object-fit: contain;
  display: block;
  filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.32));
  transition: transform 0.4s ease;
}
.bhb-card:hover .bhb-product {
  transform: translate(-50%, -50%) scale(1.04);
}

.bhb-product-empty {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
  font-weight: 460;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* responsive */
@media (max-width: 900px) {
  .bhb {
    grid-template-columns: 1fr;
    gap: 14px;
  }
}

@media (max-width: 600px) {
  .bhb-card {
    min-height: 220px;
  }
  .bhb-copy {
    padding: 18px 18px 16px;
    gap: 10px;
  }
  .bhb-title {
    font-size: 20px;
  }
  .bhb-desc {
    font-size: 13px;
  }
  .bhb-cta {
    padding: 10px 18px;
    font-size: 13.5px;
  }
  .bhb-product {
    max-height: 170px;
  }
  .bhb-logo-badge {
    width: 44px;
    height: 44px;
    top: 10px;
    right: 10px;
  }
}
</style>
