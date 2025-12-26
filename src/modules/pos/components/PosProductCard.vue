<template>
  <v-card class="pos-card" rounded="xl" variant="tonal" @click="emit('details', item)">
    <!-- Imagen -->
    <div class="pos-img-wrap">
      <v-img
        v-if="imgSrc"
        :src="imgSrc"
        cover
        height="150"
        class="pos-img"
      >
        <template #placeholder>
          <div class="pos-img-skeleton"></div>
        </template>
      </v-img>

      <div v-else class="pos-img-empty">
        <v-icon size="42" color="grey-lighten-2">mdi-image-off-outline</v-icon>
      </div>

      <!-- Badges -->
      <div class="pos-badges">
        <v-chip size="x-small" variant="tonal" class="mr-1">
          SKU: <b class="ml-1">{{ item?.sku || item?.code || "—" }}</b>
        </v-chip>
        <v-chip size="x-small" variant="tonal">
          Stock: <b class="ml-1">{{ stockLabel }}</b>
        </v-chip>
      </div>
    </div>

    <v-card-text class="pt-3">
      <div class="text-subtitle-1 font-weight-bold clamp-2">
        {{ item?.name || "—" }}
      </div>

      <div class="text-caption text-medium-emphasis mt-2">
        <div>Marca: <b>{{ item?.brand || "—" }}</b></div>
        <div>Modelo: <b>{{ item?.model || "—" }}</b></div>
        <div>Rubro: <b>{{ rubro || "—" }}</b></div>
        <div>Subrubro: <b>{{ subrubro || "—" }}</b></div>
      </div>

      <div class="d-flex align-center justify-space-between mt-3">
        <div class="text-h6 font-weight-bold">
          {{ priceLabel }}
        </div>

        <div class="d-flex ga-1">
          <!-- VER -->
          <v-btn
            icon
            size="small"
            variant="text"
            @click.stop="emit('details', item)"
            :title="'Ver'"
          >
            <v-icon>mdi-eye-outline</v-icon>
          </v-btn>

          <!-- EDITAR -->
          <v-btn
            icon
            size="small"
            variant="text"
            @click.stop="emit('edit', item)"
            :title="'Editar'"
          >
            <v-icon>mdi-pencil-outline</v-icon>
          </v-btn>
        </div>
      </div>
    </v-card-text>

    <v-card-actions class="pt-0">
      <v-btn
        block
        color="primary"
        variant="flat"
        prepend-icon="mdi-plus"
        @click.stop="emit('add', item)"
        :disabled="disableAdd"
      >
        AGREGAR
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useProductsStore } from "../../../app/store/products.store";

const props = defineProps({
  item: { type: Object, required: true },
  // si querés bloquear "Agregar" por stock 0, dejalo true.
  blockWhenNoStock: { type: Boolean, default: true },
});

const emit = defineEmits(["add", "details", "edit"]);

const products = useProductsStore();
const fetchedImages = ref([]);

/* =========================
   Helpers
========================= */
function toNum(v, d = 0) {
  if (v === null || v === undefined || v === "") return d;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : d;
}

// intenta sacar URL de diferentes formatos de backend
function pickImageUrl(x) {
  if (!x) return "";
  return (
    x.url ||
    x.public_url ||
    x.publicUrl ||
    x.thumb_url ||
    x.thumbUrl ||
    x.path ||
    x.key ||
    x.location ||
    ""
  );
}

// si viene "key" o "path" sin http, lo dejamos tal cual (muchos setups ya devuelven URL completa)
function normalizeUrl(u) {
  if (!u) return "";
  return String(u);
}

/* =========================
   Stock / Price / Rubro
========================= */
const stockNum = computed(() => {
  const v =
    props.item?.stock_qty ??
    props.item?.stock ??
    props.item?.qty ??
    props.item?.quantity ??
    props.item?.sheet_stock_label ??
    null;

  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
});

const stockLabel = computed(() => {
  if (stockNum.value === null) return "—";
  return stockNum.value.toFixed(3);
});

const disableAdd = computed(() => {
  if (!props.blockWhenNoStock) return false;
  if (stockNum.value === null) return false; // si no sabemos, dejá agregar
  return !(stockNum.value > 0);
});

function moneyARS(v) {
  const n = toNum(v, 0);
  try {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);
  } catch {
    return `$ ${n.toFixed(2)}`;
  }
}

const priceLabel = computed(() => {
  // elegí el que uses en POS; acá prioridad: discount > list
  const d = toNum(props.item?.price_discount, 0);
  const l = toNum(props.item?.price_list, 0);
  const v = d > 0 ? d : l;
  return moneyARS(v);
});

const rubro = computed(() => props.item?.category?.parent?.name || props.item?.rubro || "");
const subrubro = computed(() => props.item?.category?.name || props.item?.subrubro || "");

/* =========================
   IMAGEN
   - Si la lista ya trae images[], la usamos
   - Si no trae, pero images_count > 0 => fetch /products/:id/images
========================= */
const imgSrc = computed(() => {
  // 1) si backend ya trae images (array)
  const listImages = Array.isArray(props.item?.images) ? props.item.images : null;
  if (listImages?.length) {
    const u = normalizeUrl(pickImageUrl(listImages[0]));
    if (u) return u;
  }

  // 2) si backend trae algo tipo image_url directo
  const direct =
    props.item?.image_url ||
    props.item?.imageUrl ||
    props.item?.thumb_url ||
    props.item?.thumbUrl ||
    "";
  if (direct) return normalizeUrl(direct);

  // 3) fallback a lo fetcheado
  if (fetchedImages.value?.length) {
    const u = normalizeUrl(pickImageUrl(fetchedImages.value[0]));
    if (u) return u;
  }

  return "";
});

async function ensureImages() {
  const id = Number(props.item?.id || 0);
  if (!id) return;

  const hasCount = Number(props.item?.images_count ?? props.item?.image_count ?? 0);
  const already = Array.isArray(props.item?.images) && props.item.images.length > 0;

  if (already) return;
  if (!(hasCount > 0)) return;
  if (fetchedImages.value.length) return;

  const imgs = await products.fetchImages(id);
  fetchedImages.value = Array.isArray(imgs) ? imgs : [];
}

onMounted(ensureImages);

watch(
  () => [props.item?.id, props.item?.images_count, props.item?.image_count],
  () => {
    fetchedImages.value = [];
    ensureImages();
  }
);
</script>

<style scoped>
.pos-card {
  width: 260px;
  overflow: hidden;
  cursor: pointer;
}

.pos-img-wrap {
  position: relative;
}

.pos-img {
  border-bottom: 1px solid rgba(255,255,255,.06);
}

.pos-img-empty {
  height: 150px;
  display: grid;
  place-items: center;
  border-bottom: 1px solid rgba(255,255,255,.06);
  background: rgba(255,255,255,.03);
}

.pos-img-skeleton {
  height: 150px;
  width: 100%;
  background: rgba(255,255,255,.06);
}

.pos-badges {
  position: absolute;
  left: 10px;
  top: 10px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
