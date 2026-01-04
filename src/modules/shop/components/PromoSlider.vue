<!-- src/modules/shop/components/PromoSlider.vue -->
<template>
  <section class="promo-shell">
    <div class="promo-inner">
      <!-- Header -->
      <div class="promo-head">
        <div class="promo-head-left">
          <div class="promo-title">Productos en promoción</div>
          <div class="promo-sub">Recomendados y ofertas destacadas</div>
        </div>

        <v-btn variant="text" class="promo-more" @click="$emit('seeAll')">
          Ver todo
          <v-icon end>mdi-chevron-right</v-icon>
        </v-btn>
      </div>

      <v-divider class="promo-divider" />

      <!-- Slider -->
      <div class="promo-body">
        <v-slide-group v-model="model" show-arrows class="promo-slide">
          <v-slide-group-item v-for="p in items" :key="p.product_id">
            <button class="promo-card" type="button" @click="open(p)">
              <div class="promo-img">
                <img :src="p.image_url" alt="" />
                <div v-if="badgeText(p)" class="promo-badge">
                  {{ badgeText(p) }}
                </div>
              </div>

              <div class="promo-info">
                <div class="promo-price-row">
                  <div class="promo-price">$ {{ fmtMoney(finalPrice(p)) }}</div>

                  <div class="promo-off" v-if="offPct(p)">
                    {{ offPct(p) }}% OFF
                  </div>
                </div>

                <div v-if="showOldPrice(p)" class="promo-old">
                  $ {{ fmtMoney(oldPrice(p)) }}
                </div>

                <div class="promo-name">
                  {{ p.name }}
                </div>

                <div class="promo-meta">
                  {{ p.category_name || "—" }}
                  <span v-if="p.subcategory_name"> · {{ p.subcategory_name }}</span>
                </div>

                <div class="promo-free" v-if="freeShip(p)">
                  Envío gratis
                </div>
              </div>
            </button>
          </v-slide-group-item>
        </v-slide-group>

        <!-- Puntitos -->
        <div class="promo-dots" v-if="dotsCount > 1">
          <button
            v-for="i in dotsCount"
            :key="i"
            class="dot"
            :class="{ active: i - 1 === dotIndex }"
            @click="jumpTo(i - 1)"
            type="button"
            aria-label="Ir a página"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useRouter } from "vue-router";

const props = defineProps({
  items: { type: Array, default: () => [] },
  perPage: { type: Number, default: 5 },
});
defineEmits(["seeAll"]);

const router = useRouter();
const model = ref(0);

function open(p) {
  router.push({ name: "shopProduct", params: { id: p.product_id } });
}

function toNum(v) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function fmtMoney(v) {
  return new Intl.NumberFormat("es-AR").format(Math.round(toNum(v)));
}

function finalPrice(p) {
  const d = toNum(p.price_discount);
  if (d > 0) return d;
  const l = toNum(p.price_list);
  if (l > 0) return l;
  return toNum(p.price);
}

function oldPrice(p) {
  const l = toNum(p.price_list);
  const base = l > 0 ? l : toNum(p.price);
  return base;
}

function showOldPrice(p) {
  const d = toNum(p.price_discount);
  const o = oldPrice(p);
  return d > 0 && o > d;
}

function offPct(p) {
  if (!showOldPrice(p)) return 0;
  const o = oldPrice(p);
  const d = toNum(p.price_discount);
  const pct = Math.round(((o - d) / o) * 100);
  return pct > 0 ? pct : 0;
}

function badgeText(p) {
  if (p.is_promo) return "OFERTA";
  if (toNum(p.price_discount) > 0) return "DESCUENTO";
  if (p.is_new) return "NUEVO";
  return "";
}

function freeShip(p) {
  return Boolean(p.free_shipping) || Boolean(p.is_free_shipping);
}

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
.promo-shell {
  width: 100%;
}

.promo-inner {
  background: #fff;
  border-radius: 18px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.promo-head {
  padding: 16px 18px 14px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.promo-head-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.promo-title {
  font-size: 16px;
  font-weight: 950;
  letter-spacing: -0.2px;
}

.promo-sub {
  font-size: 12px;
  opacity: 0.72;
}

.promo-more {
  font-weight: 900;
  opacity: 0.9;
}

.promo-divider {
  opacity: 0.65;
}

.promo-body {
  padding: 10px 10px 10px;
}

.promo-slide :deep(.v-slide-group__content) {
  gap: 14px;
  padding: 10px 6px 12px;
}

.promo-slide :deep(.v-slide-group__prev .v-btn),
.promo-slide :deep(.v-slide-group__next .v-btn) {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.1);
}

.promo-card {
  width: 210px;
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  text-align: left;
  padding: 0;
  transition: transform 0.14s ease, box-shadow 0.14s ease, border-color 0.14s ease;
}

.promo-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.1);
  border-color: rgba(0, 0, 0, 0.1);
}

.promo-img {
  position: relative;
  width: 100%;
  height: 150px;
  background: #f5f5f5;
}

.promo-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.promo-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 166, 80, 0.95);
  color: #fff;
  font-weight: 950;
  font-size: 11px;
  padding: 6px 10px;
  border-radius: 999px;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.12);
}

.promo-info {
  padding: 10px 12px 12px;
}

.promo-price-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap; /* ✅ no corta precio/off en mobile */
}

.promo-price {
  font-size: 18px;
  font-weight: 950;
  letter-spacing: -0.2px;
  line-height: 1.1;
  white-space: nowrap;
}

.promo-off {
  font-size: 12px;
  font-weight: 950;
  color: #00a650;
  white-space: nowrap;
  margin-left: auto;
}

.promo-old {
  margin-top: 2px;
  font-size: 12px;
  opacity: 0.6;
  text-decoration: line-through;
}

.promo-name {
  margin-top: 8px;
  font-weight: 850;
  font-size: 12px;
  line-height: 1.15;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.promo-meta {
  margin-top: 6px;
  font-size: 11px;
  opacity: 0.7;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.promo-free {
  margin-top: 6px;
  font-size: 12px;
  font-weight: 900;
  color: #00a650;
}

.promo-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 8px 0 6px;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  border: 0;
  background: rgba(0, 0, 0, 0.16);
  cursor: pointer;
  transition: transform 0.12s ease, background 0.12s ease;
}

.dot:hover {
  transform: scale(1.15);
}

.dot.active {
  background: rgba(0, 0, 0, 0.55);
}

/* ✅ mobile: un toque más ancho y OFF más chico */
@media (max-width: 960px) {
  .promo-card {
    width: 220px;
  }
  .promo-img {
    height: 140px;
  }
  .promo-head {
    padding: 14px 14px 12px;
  }
}

@media (max-width: 600px) {
  .promo-card {
    width: 240px; /* ✅ evita que se “aplane” y corte el row */
  }
  .promo-off {
    font-size: 10px;
  }
}
</style>
