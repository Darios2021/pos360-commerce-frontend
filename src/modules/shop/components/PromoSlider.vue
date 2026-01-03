<!-- src/modules/shop/components/PromoSlider.vue -->
<template>
  <v-card class="rounded-xl promo-wrap" variant="outlined">
    <v-card-text class="pa-0">
      <div class="promo-head">
        <div>
          <div class="promo-title">Ofertas destacadas</div>
          <div class="promo-sub">Promos y productos recomendados</div>
        </div>

        <v-btn variant="text" class="promo-more" @click="$emit('seeAll')">
          Ver todo
          <v-icon end>mdi-chevron-right</v-icon>
        </v-btn>
      </div>

      <v-divider />

      <div class="promo-body">
        <v-slide-group
          v-model="model"
          show-arrows
          class="promo-slide"
        >
          <v-slide-group-item
            v-for="p in items"
            :key="p.product_id"
          >
            <v-card
              class="promo-card"
              variant="flat"
              @click="open(p)"
            >
              <div class="promo-img">
                <img :src="p.image_url" alt="" />
                <div v-if="badgeText(p)" class="promo-badge">
                  {{ badgeText(p) }}
                </div>
              </div>

              <div class="promo-info">
                <div class="promo-price">
                  $ {{ fmtMoney(finalPrice(p)) }}
                </div>

                <div v-if="showOldPrice(p)" class="promo-old">
                  $ {{ fmtMoney(oldPrice(p)) }}
                  <span class="promo-off" v-if="offPct(p)">
                    {{ offPct(p) }}% OFF
                  </span>
                </div>

                <div class="promo-name">
                  {{ p.name }}
                </div>

                <div class="promo-meta">
                  {{ p.category_name || "—" }}
                  <span v-if="p.subcategory_name"> · {{ p.subcategory_name }}</span>
                </div>
              </div>
            </v-card>
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
          />
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useRouter } from "vue-router";

const props = defineProps({
  items: { type: Array, default: () => [] },
  perPage: { type: Number, default: 5 }, // aprox desktop
});
defineEmits(["seeAll"]);

const router = useRouter();
const model = ref(null);

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

/** Puntitos:
 * En vuetify slide-group el model es index del item visible.
 * Lo convertimos a “página” para puntitos.
 */
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
  const target = pageIdx * props.perPage;
  model.value = target;
}

// si items cambia, resetea
watch(
  () => props.items,
  () => {
    model.value = 0;
  }
);
</script>

<style scoped>
.promo-wrap {
  overflow: hidden;
  background: #fff;
}

.promo-head {
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.promo-title {
  font-size: 18px;
  font-weight: 900;
}
.promo-sub {
  font-size: 12px;
  opacity: 0.75;
}
.promo-more {
  font-weight: 800;
}

.promo-body {
  padding: 12px 10px 10px;
}

.promo-slide :deep(.v-slide-group__content) {
  gap: 12px;
  padding: 6px 4px 10px;
}

.promo-card {
  width: 220px;
  border: 1px solid rgba(0,0,0,.08);
  border-radius: 16px;
  cursor: pointer;
  overflow: hidden;
  transition: transform .12s ease, box-shadow .12s ease;
}
.promo-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,.08);
}

.promo-img {
  position: relative;
  width: 100%;
  height: 150px;
  background: #f4f4f4;
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
  background: #00a650;
  color: #fff;
  font-weight: 900;
  font-size: 11px;
  padding: 6px 8px;
  border-radius: 999px;
}

.promo-info {
  padding: 10px 12px 12px;
}

.promo-price {
  font-size: 18px;
  font-weight: 900;
  line-height: 1.1;
}

.promo-old {
  margin-top: 2px;
  font-size: 12px;
  opacity: 0.75;
  text-decoration: line-through;
}
.promo-off {
  margin-left: 6px;
  text-decoration: none;
  color: #00a650;
  font-weight: 900;
}

.promo-name {
  margin-top: 8px;
  font-weight: 800;
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
}

/* puntitos */
.promo-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 6px 0 2px;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  border: 0;
  background: rgba(0,0,0,.18);
  cursor: pointer;
}
.dot.active {
  background: rgba(0,0,0,.6);
}

/* responsive */
@media (max-width: 960px) {
  .promo-card { width: 200px; }
  .promo-img { height: 140px; }
}
</style>
