<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<template>
  <v-card class="ml-card" variant="flat" rounded="xl">
    <div
      class="ml-media"
      role="button"
      tabindex="0"
      @click="openProduct"
      @keydown.enter.prevent="openProduct"
    >
      <img v-if="activeImg" :src="activeImg" alt="" loading="lazy" @error="onImgErr" />
      <div v-else class="ml-media-empty">Sin imagen</div>

      <button
        v-if="imgs.length > 1 && !loadingMedia"
        class="ml-navpill ml-nav-left"
        type="button"
        @click.stop.prevent="prevImg"
      >
        ‹
      </button>

      <button
        v-if="imgs.length > 1 && !loadingMedia"
        class="ml-navpill ml-nav-right"
        type="button"
        @click.stop.prevent="nextImg"
      >
        ›
      </button>

      <div v-if="imgs.length > 1" class="ml-dots">
        <span
          v-for="(x, i) in dotsCount"
          :key="i"
          class="ml-dot"
          :class="{ active: i === dotActive }"
        />
      </div>

      <div v-if="offPct" class="ml-badge">DESCUENTO</div>
    </div>

    <div class="ml-body">
      <div class="ml-price-row">
        <div class="ml-price">$ {{ fmtMoney(finalPrice) }}</div>
        <div class="ml-off" v-if="offPct">{{ offPct }}% OFF</div>
      </div>

      <div v-if="showOldPrice" class="ml-old">$ {{ fmtMoney(oldPrice) }}</div>
      <div class="ml-title">{{ p?.name }}</div>
      <div class="ml-meta">{{ metaText }}</div>
    </div>
  </v-card>
</template>

<script setup>
import { computed, ref, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { getPublicProductMedia } from "@/modules/shop/service/shop.public.api";

const props = defineProps({ p: Object });

const router = useRouter();
const route = useRoute();

function toNum(v) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}
function fmtMoney(v) {
  return new Intl.NumberFormat("es-AR").format(Math.round(toNum(v)));
}

const finalPrice = computed(() =>
  toNum(props.p?.price_discount) || toNum(props.p?.price_list) || toNum(props.p?.price)
);
const oldPrice = computed(() => toNum(props.p?.price_list || props.p?.price));
const showOldPrice = computed(() => oldPrice.value > finalPrice.value);
const offPct = computed(() =>
  showOldPrice.value ? Math.round(((oldPrice.value - finalPrice.value) / oldPrice.value) * 100) : 0
);

const metaText = computed(() =>
  [props.p?.category_name, props.p?.subcategory_name].filter(Boolean).join(" · ")
);

/* galería */
const imgs = ref([]);
const idx = ref(0);
const loadingMedia = ref(false);

const activeImg = computed(() => imgs.value[idx.value] || "");
const dotsCount = computed(() => Math.min(6, imgs.value.length));
const dotActive = computed(() => idx.value);

function prevImg() {
  idx.value = (idx.value - 1 + imgs.value.length) % imgs.value.length;
}
function nextImg() {
  idx.value = (idx.value + 1) % imgs.value.length;
}

function onImgErr() {
  imgs.value.splice(idx.value, 1);
  idx.value = 0;
}

async function ensureMedia() {
  const local = [];
  if (props.p?.image_url) local.push(props.p.image_url);
  if (Array.isArray(props.p?.image_urls)) local.push(...props.p.image_urls);
  imgs.value = local.filter(Boolean);

  if (imgs.value.length > 1) return;

  loadingMedia.value = true;
  try {
    const r = await getPublicProductMedia(props.p.product_id);
    if (Array.isArray(r?.image_urls)) imgs.value = r.image_urls;
  } finally {
    loadingMedia.value = false;
  }
}

onMounted(ensureMedia);
watch(() => props.p?.product_id, ensureMedia);

function openProduct() {
  router.push({
    name: "shopProduct",
    params: { id: props.p.product_id },
    query: { branch_id: route.query.branch_id || "3" },
  });
}
</script>

<style scoped>
.ml-card {
  display: flex;
  flex-direction: column;
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  grid-column: span 1 !important;
  background: #fff;
  border: 1px solid rgba(0,0,0,.08);
  overflow: hidden;
}

.ml-media {
  height: 180px;
  background: #f4f4f4;
  position: relative;
  overflow: hidden;
}

.ml-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ml-body {
  padding: 12px 14px;
  min-width: 0;
}

.ml-price {
  font-size: 20px;
  font-weight: 900;
}

.ml-title {
  font-size: 13px;
  font-weight: 900;
  text-transform: uppercase;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.ml-meta {
  font-size: 11px;
  opacity: .6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
